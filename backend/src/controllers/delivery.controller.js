/**
 * Pulse — Delivery Controller
 * Handles delivery calling bot endpoints using Twilio + MongoDB
 */
const { v4: uuidv4 } = require('uuid');
const twilioService = require('../services/twilio.service');
const { parseCSV, validateDeliveryCSV } = require('../utils/csv-parser');
const { logger } = require('../utils/logger');

const deliveryController = {
    /**
     * POST /api/delivery/upload
     * Upload customer CSV — stores records in MongoDB, returns batchId.
     */
    uploadCustomers: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ status: 'error', message: 'No file part in the request.' });
            }

            if (!req.file.originalname.toLowerCase().endsWith('.csv')) {
                return res.status(400).json({ status: 'error', message: 'Only CSV files are allowed.' });
            }

            const { data, fields } = await parseCSV(req.file.buffer);
            validateDeliveryCSV(fields);

            const normalized = data.map(row => ({
                name: row.name || row.Name || '',
                mobile_number: String(row.mobile_number || row.Mobile_Number || row.phone || '')
            }));

            // Each upload gets a unique batchId
            const batchId = uuidv4();
            await twilioService.saveInput(batchId, normalized);

            logger.info(`[UPLOAD] 🎉 Upload complete — batchId=${batchId}, customers=${data.length}`);

            res.json({
                status: 'success',
                message: 'CSV uploaded and stored in database.',
                batchId,
                customerCount: data.length,
                customers: normalized.map(c => ({ name: c.name, mobile_number: c.mobile_number }))
            });
        } catch (error) {
            logger.error('Upload customers error:', error);
            res.status(500).json({ status: 'error', message: error.message });
        }
    },

    /**
     * POST /api/delivery/trigger
     * Trigger calls for all pending records in a batch.
     * Body: { batchId, webhook_base_url }
     */
    triggerCalls: async (req, res) => {
        try {
            const { batchId, webhook_base_url } = req.body;

            if (!batchId) {
                return res.status(400).json({ status: 'error', message: 'batchId is required.' });
            }

            const webhookBaseUrl = process.env.PUBLIC_BASE_URL || webhook_base_url;
            if (!webhookBaseUrl) {
                return res.status(400).json({
                    status: 'error',
                    message: 'webhook_base_url required (set PUBLIC_BASE_URL or provide in request)'
                });
            }

            const results = await twilioService.initiateDeliveryCalls(batchId, webhookBaseUrl);
            res.json({ status: 'completed', batchId, ...results });
        } catch (error) {
            logger.error('Trigger calls error:', error);
            res.status(500).json({ status: 'error', message: error.message });
        }
    },

    /**
     * GET /api/delivery/results?batch_id=xxx
     * Fetch all call records for a batch from MongoDB.
     */
    getResults: async (req, res) => {
        try {
            const batchId = req.query.batch_id;
            if (!batchId) {
                return res.status(400).json({ status: 'error', message: 'batch_id query param is required.' });
            }
            const results = await twilioService.getResults(batchId);
            res.json(results);
        } catch (error) {
            logger.error('Get results error:', error);
            res.status(500).json({ status: 'error', message: error.message });
        }
    },

    /**
     * GET /api/delivery/status?batch_id=xxx
     * Get pending/success/failed counts for a batch.
     */
    getBatchStatus: async (req, res) => {
        try {
            const batchId = req.query.batch_id;
            if (!batchId) {
                return res.status(400).json({ status: 'error', message: 'batch_id query param is required.' });
            }
            const status = await twilioService.getBatchStatus(batchId);
            res.json(status);
        } catch (error) {
            logger.error('Get batch status error:', error);
            res.status(500).json({ status: 'error', message: error.message });
        }
    },

    /**
     * POST /api/delivery/retry
     * Retry all failed calls in a batch.
     * Body: { batchId, webhook_base_url }
     */
    retryCalls: async (req, res) => {
        try {
            const { batchId, webhook_base_url } = req.body;

            if (!batchId) {
                return res.status(400).json({ status: 'error', message: 'batchId is required.' });
            }

            const webhookBaseUrl = process.env.PUBLIC_BASE_URL || webhook_base_url;
            if (!webhookBaseUrl) {
                return res.status(400).json({ status: 'error', message: 'webhook_base_url required' });
            }

            const results = await twilioService.retryFailedCalls(batchId, webhookBaseUrl);
            res.json({ batchId, ...results });
        } catch (error) {
            logger.error('Retry calls error:', error);
            res.status(500).json({ status: 'error', message: error.message });
        }
    },

    /**
     * POST/GET /api/delivery/voice/:recordId
     * Twilio voice webhook — generates TwiML.
     * :recordId is the MongoDB _id of the CallRecord.
     */
    voice: async (req, res) => {
        try {
            const { recordId } = req.params;
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const gatherCallbackUrl = `${baseUrl}/api/delivery/recording/${recordId}`;

            const twiml = twilioService.generateVoiceTwiml(recordId, gatherCallbackUrl);
            res.type('text/xml').send(twiml);
        } catch (error) {
            logger.error('Voice webhook error:', error);
            res.type('text/xml').send('<Response><Say>Sorry, an error occurred. Goodbye.</Say></Response>');
        }
    },

    /**
     * POST/GET /api/delivery/recording/:recordId
     * Twilio recording/gather callback — saves speech response to MongoDB.
     */
    recording: async (req, res) => {
        try {
            const { recordId } = req.params;

            const recordingData = {
                SpeechResult:      req.body.SpeechResult      || req.query.SpeechResult      || '',
                Confidence:        req.body.Confidence         || req.query.Confidence         || '',
                RecordingUrl:      req.body.RecordingUrl       || req.query.RecordingUrl       || '',
                RecordingDuration: req.body.RecordingDuration  || req.query.RecordingDuration  || '',
                RecordingSid:      req.body.RecordingSid       || req.query.RecordingSid       || ''
            };

            const twiml = await twilioService.handleRecording(recordId, recordingData);
            res.type('text/xml').send(twiml);
        } catch (error) {
            logger.error('Recording webhook error:', error);
            res.type('text/xml').send('<Response><Say>Thank you. Goodbye.</Say></Response>');
        }
    }
};

module.exports = deliveryController;
