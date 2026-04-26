/**
 * Predelix — Data Controller
 * Handles BigQuery data querying endpoints
 */
const bigqueryService = require('../services/bigquery.service');
const dataflowService = require('../services/dataflow.service');
const { logger } = require('../utils/logger');

const dataController = {
    /**
     * GET /api/data/sales
     * Query sales data from BigQuery
     */
    getSalesData: async (req, res) => {
        try {
            const { store_id, start_date, end_date } = req.query;

            if (!store_id) {
                return res.status(400).json({ error: 'store_id is required' });
            }

            const data = await bigqueryService.getSalesData(
                store_id,
                start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end_date || new Date().toISOString().split('T')[0]
            );

            res.json(data);
        } catch (error) {
            logger.error('Get sales data error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * GET /api/data/predictions
     * Query prediction results from BigQuery
     */
    getPredictions: async (req, res) => {
        try {
            const storeId = req.query.store_id || null;
            const predictions = await bigqueryService.getLatestPredictions(storeId);
            res.json(predictions);
        } catch (error) {
            logger.error('Get predictions error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * GET /api/data/call-logs
     * Query call logs from BigQuery
     */
    getCallLogs: async (req, res) => {
        try {
            const batchId = req.query.batch_id || null;
            const logs = await bigqueryService.getCallLogs(batchId);
            res.json(logs);
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
            const summary = await bigqueryService.getSalesSummary();
            res.json(summary);
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
            const limit = parseInt(req.query.limit, 10) || 20;
            const insights = await bigqueryService.getInsights(limit);
            res.json(insights);
        } catch (error) {
            logger.error('Get insights error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * POST /api/data/dataflow/sales
     * Trigger a Dataflow job for sales data processing
     */
    triggerSalesDataflow: async (req, res) => {
        try {
            const { gcsPath, batchId } = req.body;
            const job = await dataflowService.submitSalesIngestionJob(gcsPath, batchId);
            res.json(job);
        } catch (error) {
            logger.error('Trigger sales dataflow error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * GET /api/data/dataflow/status/:jobId
     * Check Dataflow job status
     */
    getDataflowStatus: async (req, res) => {
        try {
            const { jobId } = req.params;
            const status = await dataflowService.getJobStatus(jobId);
            res.json(status);
        } catch (error) {
            logger.error('Get dataflow status error:', error);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = dataController;
