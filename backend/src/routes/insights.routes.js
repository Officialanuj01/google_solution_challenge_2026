/**
 * Predelix — Insights Routes
 * Endpoints for Gemini API-powered AI insights
 */
const express = require('express');
const router = express.Router();
const insightsController = require('../controllers/insights.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Health check
router.get('/', (req, res) => {
    res.json({ message: 'Insights service is running (Gemini API)' });
});

// POST /api/insights/sales — Generate sales insights
router.post('/sales', authMiddleware, insightsController.generateSalesInsights);

// POST /api/insights/delivery — Generate delivery insights
router.post('/delivery', authMiddleware, insightsController.generateDeliveryInsights);

// GET /api/insights/store/:storeId — Get store performance summary
router.get('/store/:storeId', authMiddleware, insightsController.getStoreSummary);

// POST /api/insights/chat — Conversational AI insights
router.post('/chat', authMiddleware, insightsController.chat);

module.exports = router;
