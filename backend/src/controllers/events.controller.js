/**
 * Predelix — Events Controller
 * Handles real-time events via Pub/Sub + WebSocket
 */
const pubsubService = require('../services/pubsub.service');
const { logger } = require('../utils/logger');

const eventsController = {
    /**
     * WebSocket handler — GET /api/events/ws
     * Clients connect here for real-time updates
     */
    handleWebSocket: (ws, req) => {
        const userId = req.query.userId || `anon-${Date.now()}`;
        logger.info('WebSocket connection established', { userId });

        // Register this client for broadcasts
        pubsubService.registerClient(userId, ws);

        // Send initial connection confirmation
        ws.send(JSON.stringify({
            type: 'CONNECTION_ESTABLISHED',
            data: {
                userId,
                message: 'Connected to Predelix real-time events',
                timestamp: new Date().toISOString()
            }
        }));

        // Handle incoming messages from client
        ws.on('message', (msg) => {
            try {
                const message = JSON.parse(msg);
                logger.info('WebSocket message received', { userId, type: message.type });

                // Handle client-side events
                switch (message.type) {
                    case 'SUBSCRIBE':
                        ws.send(JSON.stringify({
                            type: 'SUBSCRIBED',
                            data: { topic: message.topic }
                        }));
                        break;

                    case 'PING':
                        ws.send(JSON.stringify({ type: 'PONG' }));
                        break;

                    default:
                        logger.warn('Unknown WebSocket message type:', message.type);
                }
            } catch (err) {
                logger.error('Invalid WebSocket message:', err);
            }
        });

        ws.on('error', (err) => {
            logger.error('WebSocket error:', { userId, error: err.message });
        });
    },

    /**
     * POST /api/events/publish
     * Manually publish an event (for testing)
     */
    publishEvent: async (req, res) => {
        try {
            const { topic, data } = req.body;

            if (!topic || !data) {
                return res.status(400).json({ error: 'topic and data are required' });
            }

            // Broadcast to WebSocket clients
            pubsubService.broadcastToClients(topic, data);

            res.json({
                status: 'published',
                topic,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('Publish event error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * GET /api/events/status
     * Get real-time events system status
     */
    getStatus: (req, res) => {
        res.json({
            status: 'active',
            connectedClients: pubsubService.wsClients?.size || 0,
            topics: [
                'sales-data-uploaded',
                'delivery-data-uploaded',
                'prediction-complete',
                'call-status-update',
                'insights-generated'
            ],
            timestamp: new Date().toISOString()
        });
    }
};

module.exports = eventsController;
