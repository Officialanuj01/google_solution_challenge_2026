/**
 * Predelix — Events Controller
 * Handles real-time events via WebSocket
 */
const { logger } = require('../utils/logger');

// WebSocket clients for real-time push to frontend
const wsClients = new Map();

const eventsController = {
    /**
     * WebSocket handler — GET /api/events/ws
     * Clients connect here for real-time updates
     */
    handleWebSocket: (ws, req) => {
        const userId = req.query.userId || `anon-${Date.now()}`;
        logger.info('WebSocket connection established', { userId });

        // Register this client for broadcasts
        wsClients.set(userId, ws);

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

        ws.on('close', () => {
            wsClients.delete(userId);
            logger.info(`WebSocket client disconnected: ${userId}`);
        });

        ws.on('error', (err) => {
            logger.error('WebSocket error:', { userId, error: err.message });
        });
    },

    /**
     * Broadcast event to connected WebSocket clients
     */
    broadcastToClients(eventType, data) {
        const message = JSON.stringify({ type: eventType, data, timestamp: new Date().toISOString() });
        let sentCount = 0;
        
        wsClients.forEach((ws, userId) => {
            try {
                if (ws.readyState === 1) { // WebSocket.OPEN
                    ws.send(message);
                    sentCount++;
                }
            } catch (err) {
                logger.warn(`Failed to send to client ${userId}:`, err.message);
                wsClients.delete(userId);
            }
        });

        logger.info(`Broadcast ${eventType} to ${sentCount} clients`);
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
            eventsController.broadcastToClients(topic, data);

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
            connectedClients: wsClients.size,
            timestamp: new Date().toISOString()
        });
    }
};

module.exports = eventsController;
