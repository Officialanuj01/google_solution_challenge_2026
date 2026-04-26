/**
 * Predelix — Data Routes
 * Endpoints for BigQuery data queries and Dataflow job management
 */
const express = require('express');
const router = express.Router();
const dataController = require('../controllers/data.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Health check
router.get('/', (req, res) => {
    res.json({ message: 'Data service is running (BigQuery + Dataflow)' });
});

// GET /api/data/sales — Query sales data
router.get('/sales', authMiddleware, dataController.getSalesData);

// GET /api/data/predictions — Query prediction results
router.get('/predictions', authMiddleware, dataController.getPredictions);

// GET /api/data/call-logs — Query call logs
router.get('/call-logs', authMiddleware, dataController.getCallLogs);

// GET /api/data/summary — Dashboard summary
router.get('/summary', authMiddleware, dataController.getSummary);

// GET /api/data/insights — Stored insights
router.get('/insights', authMiddleware, dataController.getInsights);

// POST /api/data/dataflow/sales — Trigger Dataflow job
router.post('/dataflow/sales', authMiddleware, dataController.triggerSalesDataflow);

// GET /api/data/dataflow/status/:jobId — Check Dataflow job status
router.get('/dataflow/status/:jobId', authMiddleware, dataController.getDataflowStatus);

module.exports = router;
