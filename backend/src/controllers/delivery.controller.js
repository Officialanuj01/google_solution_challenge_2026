/**
 * Predelix — Delivery Controller
 * Handles delivery calling bot endpoints using Twilio
 * Ported from: server_side/delivery_helper/delivery_call.py
 */
const twilioService = require('../services/twilio.service');
const { parseCSV, validateDeliveryCSV } = require('../utils/csv-parser');
const { logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

const deliveryController = {
    /**
     * POST /api/delivery/upload
     * Upload customer CSV for delivery calls
     * Mirrors: POST /api/upload_customers in delivery_call.py
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

            const batchId = uuidv4();

            // Store customers in memory for this batch
            twilioService.storeCustomers(data, batchId);

            logger.info(`CSV uploaded: ${data.length} customers, batch ${batchId}`);

            res.json({
                status: 'success',
                message: 'CSV uploaded and validated.',
                batchId,
                customerCount: data.length,
                customers: data.map(c => ({
                    name: c.name || c.Name,
                    mobile_number: c.mobile_number || c.Mobile_Number || c.phone
                }))
            });
        } catch (error) {
            logger.error('Upload customers error:', error);
            res.status(500).json({ status: 'error', message: error.message });
        }
    },

    /**
     * POST /api/delivery/trigger
     * Trigger delivery calls to all customers in a batch
     * Mirrors: POST /api/trigger_calls in delivery_call.py
     */
    triggerCalls: async (req, res) => {
        try {
            const { batchId, webhook_base_url } = req.body;

            if (!batchId) {
                return res.status(400).json({
                    status: 'error',
                    message: 'batchId is required'
                });
            }

            // Use PUBLIC_BASE_URL env var if set, otherwise use request value
            const webhookBaseUrl = process.env.PUBLIC_BASE_URL || webhook_base_url;
            if (!webhookBaseUrl) {
                return res.status(400).json({
                    status: 'error',
                    message: 'webhook_base_url required (set PUBLIC_BASE_URL or provide in request)'
                });
            }

            const results = await twilioService.initiateDeliveryCalls(batchId, webhookBaseUrl);

            res.json({
                status: 'completed',
                ...results
            });
        } catch (error) {
            logger.error('Trigger calls error:', error);
            res.status(500).json({ status: 'error', message: error.message });
        }
    },

    /**
     * GET /api/delivery/results
     * Fetch call results and transcripts
     * Mirrors: GET /api/results in delivery_call.py
     */
    getResults: async (req, res) => {
        try {
            const batchId = req.query.batch_id || null;
            const results = twilioService.getResults(batchId);
            res.json(results);
        } catch (error) {
            logger.error('Get results error:', error);
            res.status(500).json({ status: 'error', message: error.message });
        }
    },

    /**
     * POST /api/delivery/retry
     * Retry failed/disconnected calls
     * Mirrors: retry_missed_calls.py
     */
    retryCalls: async (req, res) => {
        try {
            const { batchId, webhook_base_url } = req.body;

            if (!batchId) {
                return res.status(400).json({
                    status: 'error',
                    message: 'batchId is required'
                });
            }

            const webhookBaseUrl = process.env.PUBLIC_BASE_URL || webhook_base_url;
            if (!webhookBaseUrl) {
                return res.status(400).json({
                    status: 'error',
                    message: 'webhook_base_url required'
                });
            }

            const results = await twilioService.retryFailedCalls(batchId, webhookBaseUrl);
            res.json(results);
        } catch (error) {
            logger.error('Retry calls error:', error);
            res.status(500).json({ status: 'error', message: error.message });
        }
    },

    /**
     * POST/GET /api/delivery/voice/:batchId/:rowIndex
     * Twilio voice webhook — generates TwiML for the call
     * Mirrors: /voice/<row_index> in delivery_call.py
     */
    voice: async (req, res) => {
        try {
            const { batchId, rowIndex } = req.params;
            const idx = parseInt(rowIndex, 10);

            // Build the recording callback URL
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const recordingUrl = `${baseUrl}/api/delivery/recording/${batchId}/${idx}`;

            const twiml = twilioService.generateVoiceTwiml(batchId, idx, recordingUrl);
            res.type('text/xml').send(twiml);
        } catch (error) {
            logger.error('Voice webhook error:', error);
            res.type('text/xml').send(
                '<Response><Say>Sorry, an error occurred. Goodbye.</Say></Response>'
            );
        }
    },

    /**
     * POST/GET /api/delivery/recording/:batchId/:rowIndex
     * Twilio recording callback — saves recording data
     * Mirrors: /recording/<row_index> in delivery_call.py
     */
    recording: async (req, res) => {
        try {
            const { batchId, rowIndex } = req.params;
            const idx = parseInt(rowIndex, 10);

            // Twilio sends data in either query params or form body
            const recordingData = {
                RecordingUrl: req.body.RecordingUrl || req.query.RecordingUrl || '',
                RecordingDuration: req.body.RecordingDuration || req.query.RecordingDuration || '',
                RecordingSid: req.body.RecordingSid || req.query.RecordingSid || ''
            };

            const twiml = await twilioService.handleRecording(batchId, idx, recordingData);
            res.type('text/xml').send(twiml);
        } catch (error) {
            logger.error('Recording webhook error:', error);
            res.type('text/xml').send(
                '<Response><Say>Thank you. Goodbye.</Say></Response>'
            );
        }
    }
};

module.exports = deliveryController;
