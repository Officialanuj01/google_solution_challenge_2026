/**
 * Predelix — Pub/Sub Service
 * Business logic for event publishing and subscription management
 */
const pubsubConfig = require('../config/pubsub');
const gcpConfig = require('../config/gcp');
const { logger } = require('../utils/logger');

// WebSocket clients for real-time push to frontend
const wsClients = new Map();

const pubsubService = {
    /**
     * Register a WebSocket client for real-time updates
     */
    registerClient(userId, ws) {
        wsClients.set(userId, ws);
        logger.info(`WebSocket client registered: ${userId}`);
        
        ws.on('close', () => {
            wsClients.delete(userId);
            logger.info(`WebSocket client disconnected: ${userId}`);
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
     * Publish sales data uploaded event
     */
    async publishSalesUploaded(data) {
        const messageId = await pubsubConfig.publishMessage(
            gcpConfig.pubsub.topics.salesUploaded,
            {
                batchId: data.batchId,
                rowCount: data.rowCount,
                fileName: data.fileName,
                uploadedBy: data.userId,
                uploadedAt: new Date().toISOString()
            },
            { eventType: 'sales-uploaded' }
        );
        
        // Also notify WebSocket clients
        this.broadcastToClients('SALES_UPLOADED', {
            batchId: data.batchId,
            rowCount: data.rowCount,
            status: 'processing'
        });

        return messageId;
    },

    /**
     * Publish delivery data uploaded event
     */
    async publishDeliveryUploaded(data) {
        const messageId = await pubsubConfig.publishMessage(
            gcpConfig.pubsub.topics.deliveryUploaded,
            {
                batchId: data.batchId,
                customerCount: data.customerCount,
                fileName: data.fileName,
                uploadedBy: data.userId,
                uploadedAt: new Date().toISOString()
            },
            { eventType: 'delivery-uploaded' }
        );

        this.broadcastToClients('DELIVERY_UPLOADED', {
            batchId: data.batchId,
            customerCount: data.customerCount,
            status: 'queued'
        });

        return messageId;
    },

    /**
     * Publish prediction complete event
     */
    async publishPredictionComplete(data) {
        const messageId = await pubsubConfig.publishMessage(
            gcpConfig.pubsub.topics.predictionComplete,
            {
                batchId: data.batchId,
                predictionCount: data.predictionCount,
                modelVersion: data.modelVersion,
                completedAt: new Date().toISOString()
            },
            { eventType: 'prediction-complete' }
        );

        this.broadcastToClients('PREDICTION_COMPLETE', {
            batchId: data.batchId,
            predictionCount: data.predictionCount,
            predictions: data.predictions
        });

        return messageId;
    },

    /**
     * Publish call status update event
     */
    async publishCallStatusUpdate(data) {
        const messageId = await pubsubConfig.publishMessage(
            gcpConfig.pubsub.topics.callStatusUpdate,
            {
                callId: data.callId,
                customerName: data.customerName,
                phoneNumber: data.phoneNumber,
                status: data.status,
                transcription: data.transcription,
                batchId: data.batchId,
                updatedAt: new Date().toISOString()
            },
            { eventType: 'call-status-update' }
        );

        this.broadcastToClients('CALL_STATUS_UPDATE', data);
        return messageId;
    },

    /**
     * Publish insights generated event
     */
    async publishInsightsGenerated(data) {
        const messageId = await pubsubConfig.publishMessage(
            gcpConfig.pubsub.topics.insightsGenerated,
            {
                insightCount: data.insights?.length || 0,
                categories: data.categories,
                generatedAt: new Date().toISOString()
            },
            { eventType: 'insights-generated' }
        );

        this.broadcastToClients('INSIGHTS_GENERATED', {
            insights: data.insights
        });

        return messageId;
    },

    /**
     * Initialize Pub/Sub subscriptions for processing events
     */
    initializeSubscriptions() {
        // Subscribe to prediction complete events for real-time dashboard updates
        try {
            pubsubConfig.subscribe('prediction-complete-sub', async (data) => {
                logger.info('Prediction complete event received', data);
                this.broadcastToClients('PREDICTION_COMPLETE', data);
            });

            pubsubConfig.subscribe('call-status-update-sub', async (data) => {
                logger.info('Call status update received', data);
                this.broadcastToClients('CALL_STATUS_UPDATE', data);
            });

            logger.info('Pub/Sub subscriptions initialized');
        } catch (err) {
            logger.warn('Pub/Sub subscriptions initialization skipped:', err.message);
        }
    }
};

module.exports = pubsubService;
