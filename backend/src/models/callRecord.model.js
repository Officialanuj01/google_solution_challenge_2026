/**
 * Pulse — CallRecord Model
 * Stores delivery call data in MongoDB (replaces input/output/missed CSV files)
 */
const mongoose = require('mongoose');

const callRecordSchema = new mongoose.Schema({
    // Groups all records from a single CSV upload
    batchId: { type: String, required: true, index: true },

    name: { type: String, default: '' },
    mobile_number: { type: String, required: true },

    // Filled in after Twilio recording webhook fires
    response: { type: String, default: '' },
    recording_duration: { type: String, default: '' },
    recording_sid: { type: String, default: '' },
    transcription: { type: String, default: '' },
    confidence: { type: String, default: '' },

    // 'pending' → call not attempted yet
    // 'success' → call initiated / speech received
    // 'failed'  → Twilio API error → eligible for retry
    status: { type: String, default: 'pending', index: true },

    calledAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CallRecord', callRecordSchema);
