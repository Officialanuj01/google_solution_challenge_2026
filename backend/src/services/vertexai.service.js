/**
 * Predelix — Vertex AI Service
 * Business logic for demand prediction using Vertex AI
 * Migrated from: server_side/predictor/app.py (Random Forest model)
 */
const vertexaiConfig = require('../config/vertexai');
const { JobServiceClient } = require('@google-cloud/aiplatform');
const bigqueryService = require('./bigquery.service');
const gcpConfig = require('../config/gcp');
const { logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

const vertexaiService = {
    /**
     * Generate demand predictions using Vertex AI endpoint
     * Replaces: Flask /api/predict endpoint with Scikit-learn model
     * 
     * @param {Array} salesData - Parsed sales CSV data
     * @returns {Array} Prediction results
     */
    async predictDemand(salesData) {
        try {
            // Group data by store and product
            const groups = {};
            for (const row of salesData) {
                const key = `${row.store_id}|${row.product_id}`;
                if (!groups[key]) {
                    groups[key] = [];
                }
                groups[key].push(row);
            }

            // Find the last date in the dataset
            const allDates = salesData.map(r => new Date(r.date));
            const lastDate = new Date(Math.max(...allDates));

            const predictions = [];
            const instances = [];

            // Prepare prediction instances for each store-product combination
            for (const [key, group] of Object.entries(groups)) {
                const [storeId, productId] = key.split('|');
                
                // Calculate average sales (last 7 days or all available)
                const recentSales = group.slice(-7);
                const avgSales = recentSales.reduce((sum, r) => sum + (r.sales || 0), 0) / recentSales.length;

                // Generate predictions for next 7 days
                for (let i = 1; i <= 7; i++) {
                    const predDate = new Date(lastDate);
                    predDate.setDate(predDate.getDate() + i);

                    instances.push({
                        store_id: storeId,
                        product_id: productId,
                        date: predDate.toISOString().split('T')[0],
                        day_of_week: predDate.getDay(),
                        month: predDate.getMonth() + 1,
                        avg_sales: avgSales,
                        date_ordinal: Math.floor(predDate.getTime() / 86400000)
                    });
                }
            }

            // Call Vertex AI endpoint for predictions
            let vertexPredictions;
            try {
                vertexPredictions = await vertexaiConfig.predict(instances);
                logger.info('Vertex AI predictions received', {
                    instanceCount: instances.length,
                    predictionCount: vertexPredictions.length
                });
            } catch (vertexError) {
                // Fallback: use simple average-based prediction if Vertex AI unavailable
                logger.warn('Vertex AI unavailable, using fallback prediction', {
                    error: vertexError.message
                });
                vertexPredictions = instances.map(inst => ({
                    predicted_stock: Math.max(0, Math.round(inst.avg_sales * 1.15))
                }));
            }

            // Map predictions to results
            for (let i = 0; i < instances.length; i++) {
                const inst = instances[i];
                const pred = vertexPredictions[i];

                predictions.push({
                    store_id: inst.store_id,
                    product_id: inst.product_id,
                    date: inst.date,
                    predicted_stock: Math.max(0, Math.round(
                        pred.predicted_stock || pred.value || pred
                    )),
                    confidence: pred.confidence || null
                });
            }

            // Store predictions in BigQuery
            try {
                await bigqueryService.insertPredictions(predictions);
            } catch (bqError) {
                logger.warn('Failed to store predictions in BigQuery:', bqError.message);
            }

            return predictions;
        } catch (error) {
            logger.error('Demand prediction failed:', error);
            throw error;
        }
    },

    /**
     * Submit a Custom Training Job to Vertex AI
     * Triggers training of RandomForestRegressor on BigQuery ml_features data
     * Uses the training image from vertex-ai/training/
     */
    async trainModel(trainingData) {
        const jobId = uuidv4();
        const projectId = gcpConfig.projectId;
        const location = gcpConfig.vertexAI.location;
        const trainingImageUri = process.env.VERTEX_TRAINING_IMAGE_URI ||
            `gcr.io/${projectId}/predelix-trainer:latest`;

        const jobDisplayName = `predelix-demand-train-${Date.now()}`;

        logger.info('Submitting Vertex AI Custom Training Job', {
            rowCount: trainingData.length,
            jobDisplayName
        });

        try {
            const jobClient = new JobServiceClient({
                apiEndpoint: `${location}-aiplatform.googleapis.com`
            });

            const parent = `projects/${projectId}/locations/${location}`;

            const customJob = {
                displayName: jobDisplayName,
                jobSpec: {
                    workerPoolSpecs: [{
                        machineSpec: {
                            machineType: 'n1-standard-4'
                        },
                        replicaCount: 1,
                        containerSpec: {
                            imageUri: trainingImageUri,
                            env: [
                                { name: 'GCP_PROJECT_ID', value: projectId },
                                { name: 'BIGQUERY_DATASET', value: gcpConfig.bigquery.dataset },
                                { name: 'AIP_MODEL_DIR', value: `gs://${process.env.GCS_UPLOAD_BUCKET || 'predelix-uploads'}/models/${jobId}/` }
                            ]
                        }
                    }]
                }
            };

            const [job] = await jobClient.createCustomJob({ parent, customJob });

            logger.info('\u2705 Vertex AI training job submitted', {
                jobName: job.name,
                state: job.state
            });

            return {
                status: 'submitted',
                jobId: job.name,
                displayName: job.displayName,
                state: job.state,
                rowCount: trainingData.length,
                estimatedTime: '15–30 minutes',
                modelOutputUri: `gs://${process.env.GCS_UPLOAD_BUCKET || 'predelix-uploads'}/models/${jobId}/`
            };
        } catch (jobError) {
            logger.warn('Vertex AI job submission failed, returning metadata:', jobError.message);
            return {
                status: 'fallback',
                message: 'Training job could not be submitted to Vertex AI. Configure VERTEX_TRAINING_IMAGE_URI and ensure Vertex AI API is enabled.',
                jobId,
                rowCount: trainingData.length,
                estimatedTime: 'N/A',
                error: jobError.message
            };
        }
    },

    /**
     * Fallback prediction using simple averaging
     * Same logic as the original predictor/app.py fallback
     */
    fallbackPrediction(salesData) {
        const groups = {};
        for (const row of salesData) {
            const key = `${row.store_id}|${row.product_id}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(row);
        }

        const allDates = salesData.map(r => new Date(r.date));
        const lastDate = new Date(Math.max(...allDates));

        const predictions = [];
        for (const [key, group] of Object.entries(groups)) {
            const [storeId, productId] = key.split('|');
            const recent = group.slice(-7);
            const avgSales = recent.reduce((sum, r) => sum + (r.sales || 0), 0) / recent.length;

            for (let i = 1; i <= 7; i++) {
                const predDate = new Date(lastDate);
                predDate.setDate(predDate.getDate() + i);
                predictions.push({
                    store_id: storeId,
                    product_id: productId,
                    date: predDate.toISOString().split('T')[0],
                    predicted_stock: Math.max(0, Math.round(avgSales))
                });
            }
        }
        return predictions;
    }
};

module.exports = vertexaiService;
