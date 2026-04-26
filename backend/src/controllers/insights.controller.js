/**
 * Predelix — Insights Controller
 * Handles AI-powered insights endpoints using Gemini API
 * NEW capability — not present in original codebase
 */
const geminiService = require('../services/gemini.service');
const bigqueryService = require('../services/bigquery.service');
const { logger } = require('../utils/logger');


const insightsController = {
    /**
     * POST /api/insights/sales
     * Generate AI insights from sales data
     */
    generateSalesInsights: async (req, res) => {
        try {
            const { storeId, startDate, endDate } = req.body;

            // Fetch data from BigQuery
            let salesData, predictions;
            try {
                salesData = await bigqueryService.getSalesData(
                    storeId,
                    startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    endDate || new Date().toISOString().split('T')[0]
                );
                predictions = await bigqueryService.getLatestPredictions(storeId);
            } catch (bqErr) {
                logger.warn('BigQuery query failed, using sample data:', bqErr.message);
                salesData = req.body.salesData || [];
                predictions = req.body.predictions || [];
            }

            if (salesData.length === 0 && predictions.length === 0) {
                return res.status(400).json({
                    message: 'No data available for insight generation. Upload sales data first.'
                });
            }

            const insights = await geminiService.generateSalesInsights(salesData, predictions);

            res.json(insights);

        } catch (error) {
            logger.error('Generate sales insights error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * POST /api/insights/delivery
     * Generate AI insights from delivery call data
     */
    generateDeliveryInsights: async (req, res) => {
        try {
            const { batchId } = req.body;

            let callLogs;
            try {
                callLogs = await bigqueryService.getCallLogs(batchId);
            } catch (bqErr) {
                logger.warn('BigQuery query failed:', bqErr.message);
                callLogs = req.body.callLogs || [];
            }

            if (callLogs.length === 0) {
                return res.status(400).json({
                    message: 'No call data available for insight generation.'
                });
            }

            const insights = await geminiService.generateDeliveryInsights(callLogs);
            res.json(insights);
        } catch (error) {
            logger.error('Generate delivery insights error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * GET /api/insights/store/:storeId
     * Get AI-generated store performance summary
     */
    getStoreSummary: async (req, res) => {
        try {
            const { storeId } = req.params;
            const summary = await geminiService.generateStoreSummary(storeId);
            res.json(summary);
        } catch (error) {
            logger.error('Store summary error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * POST /api/insights/chat
     * Conversational AI for supply chain insights
     */
    chat: async (req, res) => {
        try {
            const { query, context } = req.body;

            if (!query) {
                return res.status(400).json({ error: 'Query is required' });
            }

            const result = await geminiService.chatInsight(query, {
                ...context,
                role: req.user?.role || context?.role
            });

            res.json(result);
        } catch (error) {
            logger.error('Chat insight error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * GET /api/insights/recent
     * Get recent insights from BigQuery
     */
    getRecent: async (req, res) => {
        try {
            const limit = parseInt(req.query.limit, 10) || 20;
            const insights = await bigqueryService.getInsights(limit);
            res.json(insights);
        } catch (error) {
            logger.error('Get recent insights error:', error);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = insightsController;
