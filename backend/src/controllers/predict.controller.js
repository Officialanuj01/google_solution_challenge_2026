/**
 * Pulse — Predict Controller
 * Handles stock prediction endpoints using PULSE (HuggingFace Gradio)
 * Replaces: Vertex AI endpoint
 */
const predictionService = require('../services/vertexai.service');
const { parseCSV, validateSalesCSV } = require('../utils/csv-parser');
const { logger } = require('../utils/logger');

const predictController = {
    /**
     * POST /api/predict/train
     * Upload sales CSV and train model on PULSE
     */
    train: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const { data, fields } = await parseCSV(req.file.buffer);
            validateSalesCSV(fields);

            const jobResult = await predictionService.trainModel(data);

            res.json({
                message: 'Training submitted to PULSE model',
                rowCount: data.length,
                result: jobResult
            });
        } catch (error) {
            logger.error('Training endpoint error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * POST /api/predict
     * Upload sales CSV and get stock predictions from PULSE
     */
    predict: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const { data, fields } = await parseCSV(req.file.buffer);
            validateSalesCSV(fields);

            const predictions = await predictionService.predictDemand(data);

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
     */
    getResults: async (req, res) => {
        res.json({ message: 'Use POST /api/predict to generate predictions via PULSE model' });
    },

    /**
     * GET /api/predict/summary
     */
    getSummary: async (req, res) => {
        res.json({ message: 'Upload sales data to get predictions from PULSE' });
    }
};

module.exports = predictController;
