/**
 * Predelix — Predict Controller
 * Handles stock prediction endpoints using Vertex AI
 * Replaces: server_side/predictor/app.py
 */
const vertexaiService = require('../services/vertexai.service');
const { parseCSV, validateSalesCSV } = require('../utils/csv-parser');

const { logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

const predictController = {
    /**
     * POST /api/predict/train
     * Upload sales CSV and train model
     * Replaces: POST /api/train in predictor/app.py
     */
    train: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            // Parse CSV
            const { data, fields } = await parseCSV(req.file.buffer);
            validateSalesCSV(fields);

            // Submit training job to Vertex AI
            const jobResult = await vertexaiService.trainModel(data);

            res.json({
                message: 'Training data uploaded and job submitted',
                rowCount: data.length,
                job: jobResult
            });
        } catch (error) {
            logger.error('Training endpoint error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * POST /api/predict
     * Upload sales CSV and get stock predictions
     * Replaces: POST /api/predict in predictor/app.py
     */
    predict: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            // Parse CSV
            const { data, fields } = await parseCSV(req.file.buffer);
            validateSalesCSV(fields);

            // Generate predictions using Vertex AI
            const predictions = await vertexaiService.predictDemand(data);

            // Return as CSV if requested
            if (req.query.format === 'csv') {
                const csvHeader = 'store_id,product_id,date,predicted_stock\n';
                const csvRows = predictions.map(p =>
                    `${p.store_id},${p.product_id},${p.date},${p.predicted_stock}`
                ).join('\n');

                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename=predicted_stock.csv');
                return res.send(csvHeader + csvRows);
            }

            res.json(predictions);
        } catch (error) {
            logger.error('Prediction endpoint error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * GET /api/predict/results
     * Get latest prediction results
     */
    getResults: async (req, res) => {
        try {
            // Return cached predictions from Vertex AI service
            res.json({ message: 'Prediction results - use POST /api/predict to generate predictions' });
        } catch (error) {
            logger.error('Get predictions error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * GET /api/predict/summary
     * Get aggregate sales summary for dashboard
     */
    getSummary: async (req, res) => {
        try {
            res.json({ message: 'Summary endpoint - upload sales data to get predictions' });
        } catch (error) {
            logger.error('Get summary error:', error);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = predictController;
