/**
 * Pulse — Data Controller
 * Handles data querying endpoints
 */
const { logger } = require('../utils/logger');

const dataController = {
    /**
     * GET /api/data/sales
     * Query sales data
     */
    getSalesData: async (req, res) => {
        try {
            const { store_id } = req.query;

            if (!store_id) {
                return res.status(400).json({ error: 'store_id is required' });
            }

            res.json({ message: 'Sales data endpoint available. Upload CSV via /api/predict to process data.' });
        } catch (error) {
            logger.error('Get sales data error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * GET /api/data/predictions
     * Query prediction results
     */
    getPredictions: async (req, res) => {
        try {
            res.json({ message: 'Predictions endpoint available. Use /api/predict to generate predictions.' });
        } catch (error) {
            logger.error('Get predictions error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * GET /api/data/call-logs
     * Query call logs
     */
    getCallLogs: async (req, res) => {
        try {
            const batchId = req.query.batch_id || null;
            res.json({ message: 'Call logs endpoint available. Use /api/delivery/results to get call data.' });
        } catch (error) {
            logger.error('Get call logs error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * GET /api/data/summary
     * Get aggregate dashboard summary
     */
    getSummary: async (req, res) => {
        try {
            res.json({ message: 'Summary endpoint available.' });
        } catch (error) {
            logger.error('Get summary error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * GET /api/data/insights
     * Get stored insights
     */
    getInsights: async (req, res) => {
        try {
            res.json({ message: 'Insights endpoint available. Use /api/insights to generate insights.' });
        } catch (error) {
            logger.error('Get insights error:', error);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = dataController;
