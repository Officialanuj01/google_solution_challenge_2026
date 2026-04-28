/**
 * Pulse — Delivery Routes
 * Twilio-based delivery calling bot endpoints (MongoDB-backed)
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const deliveryController = require('../controllers/delivery.controller');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'), false);
        }
    }
});

// ── Customer & Call Endpoints ─────────────────
router.post('/upload',  upload.single('file'), deliveryController.uploadCustomers);
router.post('/trigger', deliveryController.triggerCalls);
router.get('/results',  deliveryController.getResults);
router.get('/status',   deliveryController.getBatchStatus);
router.post('/retry',   deliveryController.retryCalls);

// ── Twilio Webhook Endpoints (called by Twilio, public) ──
router.all('/voice/:recordId',     deliveryController.voice);
router.all('/recording/:recordId', deliveryController.recording);

module.exports = router;
