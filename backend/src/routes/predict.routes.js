/**
 * Pulse — Prediction Routes
 * Endpoints for Hugging Face stock demand prediction
 * Replaces: /api/predict and /api/train from predictor/app.py
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const predictController = require('../controllers/predict.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Configure multer for file uploads (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'), false);
        }
    }
});

// Health check
router.get('/', (req, res) => {
    res.json({ message: 'Prediction service is running (Hugging Face)' });
});

// POST /api/predict — Upload CSV and get predictions
router.post('/', upload.single('file'), predictController.predict);

// POST /api/predict/train — Upload CSV and submit training job
router.post('/train', authMiddleware, upload.single('file'), predictController.train);

// GET /api/predict/results — Get latest predictions
router.get('/results', predictController.getResults);

// GET /api/predict/summary — Get dashboard summary
router.get('/summary', predictController.getSummary);

module.exports = router;
