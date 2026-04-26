/**
 * Predelix — Insights Controller
 * Handles AI-powered insights endpoints using Gemini API
 */
const geminiService = require('../services/gemini.service');
const { logger } = require('../utils/logger');

const insightsController = {
    /**
     * POST /api/insights/sales
     * Generate AI insights from sales data
     */
    generateSalesInsights: async (req, res) => {
        try {
            const { storeId, startDate, endDate, salesData, predictions } = req.body;

            if ((!salesData || salesData.length === 0) && (!predictions || predictions.length === 0)) {
                return res.status(400).json({
                    message: 'No data available for insight generation. Provide salesData or predictions in the request body.'
                });
            }

            const insights = await geminiService.generateSalesInsights(salesData || [], predictions || []);

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
            const { callLogs } = req.body;

            if (!callLogs || callLogs.length === 0) {
                return res.status(400).json({
                    message: 'No call data available for insight generation. Provide callLogs in the request body.'
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
    }
};

module.exports = insightsController;
