/**
 * Pulse — Delivery Routes
 * Twilio-based delivery calling bot endpoints
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const deliveryController = require('../controllers/delivery.controller');

// Multer config for CSV upload (memory buffer)
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

// ── Public Endpoints ─────────
router.post('/upload', upload.single('file'), deliveryController.uploadCustomers);
router.post('/trigger', deliveryController.triggerCalls);
router.get('/results', deliveryController.getResults);
router.post('/retry', deliveryController.retryCalls);

// ── Twilio Webhook Endpoints (public, called by Twilio) ──
router.all('/voice/:rowIndex', deliveryController.voice);
router.all('/recording/:rowIndex', deliveryController.recording);

module.exports = router;
