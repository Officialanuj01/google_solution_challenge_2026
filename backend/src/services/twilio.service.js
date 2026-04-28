/**
 * Pulse — Twilio Delivery Service
 * ALL state in MongoDB (CallRecord). Zero CSV files.
 *
 * Flow:
 *   upload  → insert pending docs into MongoDB
 *   trigger → call every pending doc, mark success/failed in DB
 *   webhook → Twilio posts speech result → saved to DB
 *   retry   → call every failed doc again, loop until none left
 */
const { logger } = require('../utils/logger');
const CallRecord = require('../models/callRecord.model');

const TWILIO_DEMO_WEBHOOK = 'https://demo.twilio.com/welcome/voice/';

// ── Twilio client (lazy init) ─────────────────────────────────────────────────
let twilioClient = null;
function getTwilioClient() {
    if (!twilioClient) {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken  = process.env.TWILIO_AUTH_TOKEN;
        if (!accountSid || !authToken) {
            throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.');
        }
        const twilio = require('twilio');
        twilioClient = twilio(accountSid, authToken);
    }
    return twilioClient;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function resolveWebhookUrl(provided) {
    const url = process.env.PUBLIC_BASE_URL || provided;
    if (!url) return null;
    if (url === TWILIO_DEMO_WEBHOOK) return url;
    return url.startsWith('http') ? url : `https://${url}`;
}

// ── Service ───────────────────────────────────────────────────────────────────
const twilioService = {

    /**
     * STEP 1 — UPLOAD
     * Persist uploaded CSV rows to MongoDB as 'pending' CallRecords.
     * Previous records for the same batchId are removed (re-upload).
     */
    async saveInput(batchId, rows) {
        logger.info(`[UPLOAD] ▶ Starting upload for batch ${batchId} — ${rows.length} rows`);

        const deleted = await CallRecord.deleteMany({ batchId });
        if (deleted.deletedCount > 0) {
            logger.info(`[UPLOAD] 🗑  Cleared ${deleted.deletedCount} old records for batch ${batchId}`);
        }

        const docs = rows.map(r => ({
            batchId,
            name: r.name || '',
            mobile_number: String(r.mobile_number || ''),
            status: 'pending'
        }));

        await CallRecord.insertMany(docs);
        logger.info(`[UPLOAD] ✅ Inserted ${docs.length} pending records into MongoDB`);
        logger.info(`[UPLOAD] 📦 DB → database: ${process.env.MONGODB_URI?.split('/').pop()}, collection: callrecords`);
        docs.forEach((d, i) => logger.info(`[UPLOAD]   [${i + 1}] ${d.name} | ${d.mobile_number} | status: pending`));
    },

    /**
     * STEP 2 — TRIGGER CALLS
     * Fetch all 'pending' docs for this batch → call each → mark success/failed.
     * Successful = call initiated (actual speech saved later via webhook).
     * Failed     = Twilio API threw error → stays in DB for retry.
     */
    async initiateDeliveryCalls(batchId, webhookBaseUrl) {
        logger.info(`[TRIGGER] ▶ Fetching pending records for batch ${batchId}`);

        const pending = await CallRecord.find({ batchId, status: 'pending' });
        logger.info(`[TRIGGER] 📋 Found ${pending.length} pending record(s)`);

        if (!pending || pending.length === 0) {
            const [successCount, failedCount] = await Promise.all([
                CallRecord.countDocuments({ batchId, status: 'success' }),
                CallRecord.countDocuments({ batchId, status: 'failed' })
            ]);
            const total = await CallRecord.countDocuments({ batchId });

            if (total === 0) {
                throw new Error('No customers found. Please upload a CSV first.');
            }

            logger.info(`[TRIGGER] ℹ️  No pending records — batch summary: success=${successCount} failed=${failedCount}`);
            return {
                message: failedCount > 0
                    ? `No pending calls. ${failedCount} failed call(s) — use /retry to retry them.`
                    : 'All numbers have already been successfully called. Upload a new CSV to start again.',
                totalCustomers: total,
                successful_calls: 0,
                failed_calls: 0,
                pending: 0
            };
        }

        const fromNumber = process.env.TWILIO_PHONE_NUMBER;
        if (!fromNumber) {
            throw new Error('TWILIO_PHONE_NUMBER not configured.');
        }

        const resolvedUrl = resolveWebhookUrl(webhookBaseUrl);
        logger.info(`[TRIGGER] 🌐 Webhook base URL: ${resolvedUrl}`);

        const results = { totalCustomers: pending.length, successful_calls: 0, failed_calls: 0, errors: [] };

        for (const record of pending) {
            const toNumber = record.mobile_number;
            const useCustom = resolvedUrl && resolvedUrl !== TWILIO_DEMO_WEBHOOK;
            const webhookUrl = useCustom
                ? `${resolvedUrl}/api/delivery/voice/${record._id}`
                : TWILIO_DEMO_WEBHOOK;

            logger.info(`[TRIGGER] 📞 Calling ${record.name} (${toNumber}) → webhook: ${webhookUrl}`);

            try {
                const call = await getTwilioClient().calls.create({ to: toNumber, from: fromNumber, url: webhookUrl });

                logger.info(`[TRIGGER] ✅ Call initiated — SID: ${call.sid} | marking status=success in DB`);
                record.status   = 'success';
                record.calledAt = new Date();
                await record.save();

                results.successful_calls += 1;
                await new Promise(r => setTimeout(r, 2000));
            } catch (error) {
                const errMsg = error.message || String(error);
                logger.error(`[TRIGGER] ❌ Call FAILED for ${record.name} (${toNumber}): ${errMsg}`);
                logger.info(`[TRIGGER]    ↳ marking status=failed in DB — will appear in /retry`);

                record.status = 'failed';
                await record.save();

                results.failed_calls += 1;
                results.errors.push({ name: record.name, number: toNumber, error: errMsg });
            }
        }

        // Summary log
        logger.info(`[TRIGGER] ✔ Run complete for batch ${batchId}`);
        logger.info(`[TRIGGER]   successful_calls : ${results.successful_calls}`);
        logger.info(`[TRIGGER]   failed_calls     : ${results.failed_calls}`);
        if (results.failed_calls > 0) {
            logger.info(`[TRIGGER]   ↳ ${results.failed_calls} failed record(s) kept in MongoDB with status=failed`);
            logger.info(`[TRIGGER]   ↳ Call POST /api/delivery/retry to retry them`);
        } else {
            logger.info(`[TRIGGER]   ↳ All calls successful — no retry needed`);
        }

        return results;
    },

    /**
     * STEP 3 — VOICE WEBHOOK (called by Twilio when customer picks up)
     * Returns TwiML that asks for delivery preference.
     */
    generateVoiceTwiml(recordId, gatherCallbackUrl) {
        logger.info(`[VOICE] 🎙  Twilio hit voice webhook for recordId=${recordId}`);
        logger.info(`[VOICE]     Gather callback → ${gatherCallbackUrl}`);

        return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">Hello, this is Pulse delivery service. We are trying to deliver your courier today. Do you have any preference for time or place? Please tell me after the beep.</Say>
    <Gather input="speech" action="${gatherCallbackUrl}" speechTimeout="auto" language="en-IN">
        <Say voice="Polly.Joanna">Please speak your delivery preference now.</Say>
    </Gather>
    <Say voice="Polly.Joanna">We did not receive your response. We will try again later. Goodbye!</Say>
</Response>`;
    },

    /**
     * STEP 4 — RECORDING WEBHOOK (Twilio posts speech result here)
     * Saves transcription + marks status=success in MongoDB.
     */
    async handleRecording(recordId, recordingData) {
        logger.info(`[RECORDING] ▶ Twilio posted speech result for recordId=${recordId}`);

        const record = await CallRecord.findById(recordId);
        if (!record) {
            logger.error(`[RECORDING] ❌ No CallRecord found in MongoDB for _id=${recordId}`);
            return `<?xml version="1.0" encoding="UTF-8"?>\n<Response><Say>Thank you. Goodbye.</Say></Response>`;
        }

        const { SpeechResult, Confidence, RecordingUrl, RecordingDuration, RecordingSid } = recordingData;
        const transcription = SpeechResult || '';

        logger.info(`[RECORDING] 🗣  Customer   : ${record.name}`);
        logger.info(`[RECORDING] 📝 Speech     : "${transcription || '(none)'}"`);
        logger.info(`[RECORDING] 📊 Confidence : ${Confidence || 'N/A'}`);
        logger.info(`[RECORDING] 🔗 RecordingURL: ${RecordingUrl || 'N/A'}`);

        // Persist response to MongoDB — NO CSV
        record.response           = transcription || RecordingUrl || 'No response';
        record.recording_duration = RecordingDuration || '';
        record.recording_sid      = RecordingSid || '';
        record.transcription      = transcription || '[No speech detected]';
        record.confidence         = Confidence || '';
        record.status             = 'success';

        await record.save();
        logger.info(`[RECORDING] ✅ Saved to MongoDB — batchId=${record.batchId} | status=success`);

        return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">Thank you ${record.name}. Your preference has been noted: ${transcription || 'no response received'}. Have a great day! Goodbye.</Say>
</Response>`;
    },

    /**
     * STEP 5 — RESULTS
     * Fetch all records for a batch from MongoDB.
     */
    async getResults(batchId) {
        logger.info(`[RESULTS] 🔍 Fetching all records for batch ${batchId} from MongoDB`);
        const records = await CallRecord.find({ batchId }).lean();
        logger.info(`[RESULTS] 📦 Returned ${records.length} record(s)`);
        return records;
    },

    /**
     * STEP 6 — BATCH STATUS
     * Count pending/success/failed for a batch.
     */
    async getBatchStatus(batchId) {
        const [total, pending, success, failed] = await Promise.all([
            CallRecord.countDocuments({ batchId }),
            CallRecord.countDocuments({ batchId, status: 'pending' }),
            CallRecord.countDocuments({ batchId, status: 'success' }),
            CallRecord.countDocuments({ batchId, status: 'failed' })
        ]);
        logger.info(`[STATUS] batch=${batchId} total=${total} pending=${pending} success=${success} failed=${failed}`);
        return { batchId, total, pending, success, failed };
    },

    /**
     * STEP 7 — RETRY
     * Fetch all 'failed' docs → call again → update status in DB.
     * Loop: still-failed ones keep status=failed → user calls /retry again.
     * Empty case: no failed docs → tell user all done or to upload new CSV.
     */
    async retryFailedCalls(batchId, webhookBaseUrl) {
        logger.info(`[RETRY] ▶ Starting retry for batch ${batchId}`);

        const failed = await CallRecord.find({ batchId, status: 'failed' });
        logger.info(`[RETRY] 📋 Found ${failed.length} failed record(s) in MongoDB`);

        if (!failed || failed.length === 0) {
            const pending = await CallRecord.countDocuments({ batchId, status: 'pending' });
            const success = await CallRecord.countDocuments({ batchId, status: 'success' });

            if (pending > 0) {
                logger.info(`[RETRY] ℹ️  No failed calls — but ${pending} pending. Use /trigger first.`);
                return { message: `No failed calls to retry. ${pending} pending call(s) — trigger them first.`, retried: 0 };
            }

            logger.info(`[RETRY] 🎉 No failed calls — all ${success} customer(s) successfully called!`);
            logger.info(`[RETRY]    ↳ Upload a new CSV to start a fresh delivery batch.`);
            return {
                message: `All ${success} customer(s) have been successfully called. Upload a new CSV to start again.`,
                retried: 0,
                allDone: true
            };
        }

        const resolvedUrl = resolveWebhookUrl(webhookBaseUrl);
        logger.info(`[RETRY] 🌐 Webhook base URL: ${resolvedUrl}`);

        let successful = 0;
        let stillFailed = 0;

        for (const record of failed) {
            const toNumber = record.mobile_number;
            const webhookUrl = `${resolvedUrl}/api/delivery/voice/${record._id}`;

            logger.info(`[RETRY] 📞 Retrying ${record.name} (${toNumber}) → ${webhookUrl}`);

            try {
                const call = await getTwilioClient().calls.create({
                    to: toNumber,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    url: webhookUrl
                });

                logger.info(`[RETRY] ✅ Retry call initiated — SID: ${call.sid} | marking status=success`);
                record.status   = 'success';
                record.calledAt = new Date();
                await record.save();
                successful += 1;
                await new Promise(r => setTimeout(r, 2000));
            } catch (error) {
                const errMsg = error.message || String(error);
                logger.error(`[RETRY] ❌ Retry FAILED for ${record.name}: ${errMsg}`);
                logger.info(`[RETRY]    ↳ status stays=failed — will appear in next /retry`);
                stillFailed += 1;
                // status stays 'failed' — already saved
            }
        }

        logger.info(`[RETRY] ✔ Retry complete — successful=${successful} stillFailed=${stillFailed}`);
        if (stillFailed > 0) {
            logger.info(`[RETRY]   ↳ ${stillFailed} still failed — call /retry again to loop`);
        } else {
            logger.info(`[RETRY]   ↳ All retried numbers succeeded 🎉`);
        }

        return { message: 'Retry completed', successful, failed: stillFailed, remainingFailed: stillFailed };
    }
};

module.exports = twilioService;
