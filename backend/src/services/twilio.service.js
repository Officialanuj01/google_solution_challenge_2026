/**
 * Pulse — Twilio Delivery Service
 * Business logic for delivery calling bot using Twilio
 * Ported from: server_side/delivery_helper/delivery_call.py
 */
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { logger } = require('../utils/logger');

const INPUT_CSV = process.env.INPUT_CSV || path.join(process.cwd(), 'input.csv');
const OUTPUT_CSV = process.env.OUTPUT_CSV || path.join(process.cwd(), 'output.csv');
const MISSED_CSV = process.env.MISSED_CSV || path.join(process.cwd(), 'missed_calls.csv');
const TWILIO_DEMO_WEBHOOK = 'https://demo.twilio.com/welcome/voice/';
const REQUIRED_COLUMNS = ['name', 'mobile_number'];
const TRACKING_COLUMNS = ['response', 'recording_duration', 'recording_sid', 'transcription'];

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

function fileExists(filePath) {
    try {
        fs.accessSync(filePath, fs.constants.F_OK);
        return true;
    } catch (error) {
        return false;
    }
}

function parseCsvString(csvString) {
    const results = Papa.parse(csvString, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true
    });
    if (results.errors && results.errors.length > 0) {
        logger.warn('CSV parsing warnings:', { errors: results.errors });
    }
    return {
        data: results.data || [],
        fields: results.meta && results.meta.fields ? results.meta.fields : []
    };
}

function normalizeRow(row) {
    return {
        name: row.name || row.Name || '',
        mobile_number: String(row.mobile_number || row.Mobile_Number || row.phone || ''),
        response: row.response || '',
        recording_duration: row.recording_duration || '',
        recording_sid: row.recording_sid || '',
        transcription: row.transcription || ''
    };
}

function ensureColumns(rows) {
    return rows.map(row => {
        const normalized = normalizeRow(row);
        return {
            ...normalized
        };
    });
}

function writeCsv(filePath, rows) {
    const csvString = Papa.unparse(rows, { header: true });
    fs.writeFileSync(filePath, csvString, 'utf-8');
}

function readCsv(filePath) {
    if (!fileExists(filePath)) {
        return [];
    }
    const csvString = fs.readFileSync(filePath, 'utf-8');
    const { data } = parseCsvString(csvString);
    return ensureColumns(data);
}

const twilioService = {
    loadData() {
        const rows = readCsv(INPUT_CSV);
        const columnsOk = REQUIRED_COLUMNS.every(col => rows.length === 0 || Object.prototype.hasOwnProperty.call(rows[0], col));
        if (!columnsOk && rows.length > 0) {
            throw new Error(`Missing required columns: ${REQUIRED_COLUMNS.join(', ')}`);
        }
        return rows;
    },

    saveData(rows) {
        writeCsv(OUTPUT_CSV, rows);
    },

    saveInput(rows) {
        writeCsv(INPUT_CSV, rows);
    },

    saveMissed(rows) {
        if (!rows || rows.length === 0) {
            return;
        }
        writeCsv(MISSED_CSV, rows);
    },

    clearMissed() {
        if (fileExists(MISSED_CSV)) {
            fs.unlinkSync(MISSED_CSV);
        }
    },

    /**
     * Initiate delivery calls for a single CSV dataset
     * Mirrors: /api/trigger_calls in delivery_call.py
     */
    async initiateDeliveryCalls(webhookBaseUrl) {
        const customers = this.loadData();
        if (!customers || customers.length === 0) {
            throw new Error('No customers found in input CSV');
        }

        const client = getTwilioClient();
        const fromNumber = process.env.TWILIO_PHONE_NUMBER;
        if (!fromNumber) {
            throw new Error(
                'TWILIO_PHONE_NUMBER not configured. ' +
                'Get your free trial number from https://console.twilio.com → Phone Numbers → Active Numbers, ' +
                'then add TWILIO_PHONE_NUMBER=+1xxxx to your .env file.'
            );
        }

        // Use demo webhook if no custom URL provided
        if (!webhookBaseUrl) {
            webhookBaseUrl = process.env.PUBLIC_BASE_URL || TWILIO_DEMO_WEBHOOK;
        }

        // Ensure webhook URL has protocol
        if (webhookBaseUrl !== TWILIO_DEMO_WEBHOOK && !webhookBaseUrl.startsWith('http')) {
            webhookBaseUrl = `https://${webhookBaseUrl}`;
        }

        const results = {
            totalCustomers: customers.length,
            successful_calls: 0,
            failed_calls: 0,
            missed: [],
            errors: []
        };

        for (let index = 0; index < customers.length; index += 1) {
            const customer = customers[index];
            if (customer.response && customer.response.trim() !== '') {
                continue;
            }

            const toNumber = customer.mobile_number;
            const useCustomWebhook = webhookBaseUrl && webhookBaseUrl !== TWILIO_DEMO_WEBHOOK;
            const webhookUrl = useCustomWebhook
                ? `${webhookBaseUrl}/api/delivery/voice/${index}`
                : TWILIO_DEMO_WEBHOOK;

            try {
                const call = await client.calls.create({
                    to: toNumber,
                    from: fromNumber,
                    url: webhookUrl
                });

                logger.info(`✅ Calling ${customer.name} at ${toNumber} (SID: ${call.sid})`);
                results.successful_calls += 1;
                await new Promise(r => setTimeout(r, 2000));
            } catch (error) {
                const errMsg = error.message || String(error);
                if (errMsg.toLowerCase().includes('unverified')) {
                    logger.warn(`⚠️ ${customer.name} (${toNumber}) — Twilio trial can only call verified numbers. Verify at https://console.twilio.com → Verified Caller IDs`);
                    results.errors.push({ row: index, number: toNumber, error: 'Number not verified for Twilio trial. Add it at console.twilio.com → Verified Caller IDs' });
                } else {
                    logger.error(`❌ Call failed for ${customer.name}: ${errMsg}`);
                }
                results.failed_calls += 1;
                results.missed.push({ name: customer.name, mobile_number: toNumber });
                results.errors.push({ row: index, number: toNumber, error: errMsg });
            }
        }

        if (results.failed_calls > 0) {
            this.saveMissed(results.missed);
        } else {
            this.clearMissed();
        }

        logger.info('Delivery call run completed', {
            successful: results.successful_calls,
            failed: results.failed_calls
        });

        return results;
    },

    /**
     * Generate TwiML for the voice webhook
     * Mirrors: /voice/<row_index> in delivery_call.py
     */
    generateVoiceTwiml(rowIndex, gatherCallbackUrl) {
        const customers = this.loadData();
        const customer = customers[rowIndex];
        const name = customer ? customer.name : 'Customer';

        return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">Hello ${name}, this is Pulse delivery service. We are trying to deliver your courier today. Do you have any preference for time or place? Please tell me after the beep.</Say>
    <Gather input="speech" action="${gatherCallbackUrl}" speechTimeout="auto" language="en-IN">
        <Say voice="Polly.Joanna">Please speak your delivery preference now.</Say>
    </Gather>
    <Say voice="Polly.Joanna">We did not receive your response. We will try again later. Goodbye!</Say>
</Response>`;
    },

    /**
     * Handle recording callback from Twilio
     * Mirrors: /recording/<row_index> in delivery_call.py
     */
    async handleRecording(rowIndex, recordingData) {
        const customers = this.loadData();
        if (!customers || !customers[rowIndex]) {
            logger.error(`No customer found for row ${rowIndex}`);
            return `<?xml version="1.0" encoding="UTF-8"?>
<Response><Say>Thank you. Goodbye.</Say></Response>`;
        }

        const { SpeechResult, Confidence, RecordingUrl, RecordingDuration, RecordingSid } = recordingData;

        // SpeechResult comes from <Gather input="speech">
        const transcription = SpeechResult || '';
        const confidence = Confidence || '';

        logger.info(`🎙️ Response from ${customers[rowIndex].name}`, {
            transcription,
            confidence,
            recordingUrl: RecordingUrl
        });

        customers[rowIndex].response = transcription || RecordingUrl || 'No response';
        customers[rowIndex].recording_duration = RecordingDuration || '';
        customers[rowIndex].recording_sid = RecordingSid || '';
        customers[rowIndex].transcription = transcription || '[No speech detected]';
        customers[rowIndex].confidence = confidence;

        this.saveData(customers);

        return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">Thank you ${customers[rowIndex].name}. Your preference has been noted: ${transcription || 'no response received'}. Have a great day! Goodbye.</Say>
</Response>`;
    },

    /**
     * Get call results for a batch
     * Mirrors: /api/results in delivery_call.py
     */
    getResults() {
        return readCsv(OUTPUT_CSV);
    },

    /**
     * Retry failed/missed calls for a batch
     */
    async retryFailedCalls(webhookBaseUrl) {
        if (!fileExists(MISSED_CSV)) {
            return { message: 'No missed_calls.csv found', retried: 0 };
        }

        const missed = readCsv(MISSED_CSV);
        if (missed.length === 0) {
            return { message: 'No failed calls to retry', retried: 0 };
        }

        const customers = this.loadData();
        let successful = 0;
        let failed = 0;
        const newMissed = [];

        for (const row of missed) {
            const index = customers.findIndex(c => c.mobile_number === row.mobile_number);
            if (index === -1) {
                logger.warn(`Number ${row.mobile_number} not found in input CSV, skipping.`);
                continue;
            }

            const toNumber = row.mobile_number;
            const webhookUrl = `${webhookBaseUrl}/api/delivery/voice/${index}`;
            try {
                const call = await getTwilioClient().calls.create({
                    to: toNumber,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    url: webhookUrl
                });
                logger.info(`✅ Retrying ${row.name} at ${toNumber} (SID: ${call.sid})`);
                successful += 1;
                await new Promise(r => setTimeout(r, 2000));
            } catch (error) {
                failed += 1;
                newMissed.push({ name: row.name, mobile_number: row.mobile_number });
                logger.error(`❌ Retry failed for ${row.name}: ${error.message || error}`);
            }
        }

        if (newMissed.length > 0) {
            this.saveMissed(newMissed);
        } else {
            this.clearMissed();
        }

        return { message: 'Retry completed', successful, failed };
    }
};

module.exports = twilioService;
