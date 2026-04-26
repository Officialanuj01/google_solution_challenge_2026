/**
 * Predelix — Twilio Delivery Service
 * Business logic for delivery calling bot using Twilio
 * Ported from: server_side/delivery_helper/delivery_call.py
 */
const { logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// In-memory store for customer data (per batch)
const batchStore = {};

/**
 * Get Twilio client — lazy init so server starts without creds
 */
let twilioClient = null;
function getTwilioClient() {
    if (!twilioClient) {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        if (!accountSid || !authToken) {
            throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.');
        }
        const twilio = require('twilio');
        twilioClient = twilio(accountSid, authToken);
    }
    return twilioClient;
}

const twilioService = {
    /**
     * Store uploaded customer data for a batch
     */
    storeCustomers(customers, batchId) {
        // Ensure each customer row has the required columns
        const processed = customers.map((c, idx) => ({
            index: idx,
            name: c.name || c.Name || '',
            mobile_number: String(c.mobile_number || c.Mobile_Number || c.phone || ''),
            response: '',
            recording_duration: '',
            recording_sid: '',
            transcription: ''
        }));
        batchStore[batchId] = processed;
        return processed;
    },

    /**
     * Get customers for a batch
     */
    getCustomers(batchId) {
        return batchStore[batchId] || [];
    },

    /**
     * Initiate delivery calls for a batch of customers
     * Mirrors: /api/trigger_calls in delivery_call.py
     */
    async initiateDeliveryCalls(batchId, webhookBaseUrl) {
        const customers = batchStore[batchId];
        if (!customers || customers.length === 0) {
            throw new Error('No customers found for this batch');
        }

        const client = getTwilioClient();
        const fromNumber = process.env.TWILIO_PHONE_NUMBER;
        if (!fromNumber) {
            throw new Error('TWILIO_PHONE_NUMBER not configured');
        }

        // Ensure webhook URL has protocol
        if (!webhookBaseUrl.startsWith('http')) {
            webhookBaseUrl = `https://${webhookBaseUrl}`;
        }

        const results = {
            batchId,
            totalCustomers: customers.length,
            successful_calls: 0,
            failed_calls: 0,
            missed: [],
            errors: []
        };

        for (const customer of customers) {
            // Skip already called customers (have a response)
            if (customer.response && customer.response.trim() !== '') {
                continue;
            }

            const toNumber = customer.mobile_number;
            const webhookUrl = `${webhookBaseUrl}/api/delivery/voice/${batchId}/${customer.index}`;

            try {
                const call = await client.calls.create({
                    to: toNumber,
                    from: fromNumber,
                    url: webhookUrl
                });

                logger.info(`✅ Calling ${customer.name} at ${toNumber} (SID: ${call.sid})`);
                results.successful_calls++;

                // Small delay between calls
                await new Promise(r => setTimeout(r, 2000));

            } catch (error) {
                const errMsg = error.message || String(error);
                if (errMsg.toLowerCase().includes('unverified')) {
                    logger.warn(`❌ ${customer.name} (${toNumber}) is not verified for Twilio trial`);
                } else {
                    logger.error(`❌ Call failed for ${customer.name}: ${errMsg}`);
                }
                results.failed_calls++;
                results.missed.push({ name: customer.name, mobile_number: toNumber });
                results.errors.push({ row: customer.index, number: toNumber, error: errMsg });
            }
        }

        logger.info('Delivery call batch completed', {
            batchId,
            successful: results.successful_calls,
            failed: results.failed_calls
        });

        return results;
    },

    /**
     * Generate TwiML for the voice webhook
     * Mirrors: /voice/<row_index> in delivery_call.py
     */
    generateVoiceTwiml(batchId, rowIndex, recordingCallbackUrl) {
        const customers = batchStore[batchId];
        const customer = customers ? customers[rowIndex] : null;
        const name = customer ? customer.name : 'Customer';

        return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hello, I am calling on behalf of Predelix. We are delivering your courier today. At what time will you be available? Please state your preferred time or any delivery instructions after the beep.</Say>
    <Record maxLength="30" action="${recordingCallbackUrl}" />
</Response>`;
    },

    /**
     * Handle recording callback from Twilio
     * Mirrors: /recording/<row_index> in delivery_call.py
     */
    async handleRecording(batchId, rowIndex, recordingData) {
        const customers = batchStore[batchId];
        if (!customers || !customers[rowIndex]) {
            logger.error(`No customer found for batch ${batchId} row ${rowIndex}`);
            return;
        }

        const { RecordingUrl, RecordingDuration, RecordingSid } = recordingData;

        logger.info(`🎙️ Recording received for ${customers[rowIndex].name}`, {
            url: RecordingUrl,
            duration: RecordingDuration,
            sid: RecordingSid
        });

        customers[rowIndex].response = RecordingUrl || '';
        customers[rowIndex].recording_duration = RecordingDuration || '';
        customers[rowIndex].recording_sid = RecordingSid || '';

        // Transcription — attempt using Twilio's built-in or skip
        if (RecordingUrl) {
            try {
                // Twilio recordings need time to process
                await new Promise(r => setTimeout(r, 5000));

                const client = getTwilioClient();
                const accountSid = process.env.TWILIO_ACCOUNT_SID;
                const authToken = process.env.TWILIO_AUTH_TOKEN;

                // Download and transcribe via Google Speech-to-Text if available
                // For now, mark as pending (the recording URL is stored for manual review)
                customers[rowIndex].transcription = '[Recording saved - pending transcription]';

                logger.info(`✅ Recording saved for ${customers[rowIndex].name}`);
            } catch (error) {
                logger.error(`Transcription failed for row ${rowIndex}:`, error);
                customers[rowIndex].transcription = '[Transcription failed]';
            }
        } else {
            customers[rowIndex].transcription = '[No recording URL]';
        }

        return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>Thank you. Your response has been recorded. Goodbye!</Say>
</Response>`;
    },

    /**
     * Get call results for a batch
     * Mirrors: /api/results in delivery_call.py
     */
    getResults(batchId) {
        if (batchId && batchStore[batchId]) {
            return batchStore[batchId];
        }
        // Return all batches' results
        const allResults = [];
        for (const [id, customers] of Object.entries(batchStore)) {
            customers.forEach(c => allResults.push({ ...c, batchId: id }));
        }
        return allResults;
    },

    /**
     * Retry failed/missed calls for a batch
     */
    async retryFailedCalls(batchId, webhookBaseUrl) {
        const customers = batchStore[batchId];
        if (!customers) {
            throw new Error(`Batch ${batchId} not found`);
        }

        // Find customers without responses
        const missed = customers.filter(c => !c.response || c.response.trim() === '');
        if (missed.length === 0) {
            return { message: 'No failed calls to retry', retried: 0 };
        }

        // Re-trigger calls for missed customers
        return this.initiateDeliveryCalls(batchId, webhookBaseUrl);
    }
};

module.exports = twilioService;
