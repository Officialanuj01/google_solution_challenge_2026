/**
 * Predelix — Delivery Routes
 * Twilio-based delivery calling bot endpoints
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const deliveryController = require('../controllers/delivery.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Multer config for CSV upload (memory buffer for Cloud Run)
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

// ── Protected Endpoints (require auth) ─────────
router.post('/upload', authMiddleware, upload.single('file'), deliveryController.uploadCustomers);
router.post('/trigger', authMiddleware, deliveryController.triggerCalls);
router.get('/results', authMiddleware, deliveryController.getResults);
router.post('/retry', authMiddleware, deliveryController.retryCalls);

// ── Twilio Webhook Endpoints (public, called by Twilio) ──
router.all('/voice/:batchId/:rowIndex', deliveryController.voice);
router.all('/recording/:batchId/:rowIndex', deliveryController.recording);

module.exports = router;
