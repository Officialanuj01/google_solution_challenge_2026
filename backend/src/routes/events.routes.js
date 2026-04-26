/**
 * Predelix — Events Routes
 * WebSocket + Pub/Sub real-time event endpoints
 */
const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/events.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Health check
router.get('/', (req, res) => {
    res.json({ message: 'Events service is running (Pub/Sub + WebSocket)' });
});

// WebSocket endpoint — GET /api/events/ws
router.ws('/ws', eventsController.handleWebSocket);

// POST /api/events/publish — Manual event publish (admin/testing)
router.post('/publish', authMiddleware, eventsController.publishEvent);

// GET /api/events/status — Events system status
router.get('/status', eventsController.getStatus);

module.exports = router;
