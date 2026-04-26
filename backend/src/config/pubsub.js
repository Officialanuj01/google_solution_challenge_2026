/**
 * Predelix — Pub/Sub Client Setup
 * Manages Google Cloud Pub/Sub topics and subscriptions for real-time events
 */
const { PubSub } = require('@google-cloud/pubsub');
const gcpConfig = require('./gcp');
const { logger } = require('../utils/logger');

let pubsubClient = null;

function getPubSubClient() {
    if (!pubsubClient) {
        pubsubClient = new PubSub({ projectId: gcpConfig.projectId });
        logger.info('Pub/Sub client initialized', { projectId: gcpConfig.projectId });
    }
    return pubsubClient;
}

/**
 * Publish a message to a Pub/Sub topic
 */
async function publishMessage(topicName, data, attributes = {}) {
    const client = getPubSubClient();
    const topic = client.topic(topicName);

    const messageBuffer = Buffer.from(JSON.stringify(data));
    const messageId = await topic.publishMessage({
        data: messageBuffer,
        attributes
    });

    logger.info(`Published message to ${topicName}`, { messageId, attributes });
    return messageId;
}

/**
 * Create a subscription and listen for messages
 */
function subscribe(subscriptionName, messageHandler) {
    const client = getPubSubClient();
    const subscription = client.subscription(subscriptionName);

    subscription.on('message', async (message) => {
        try {
            const data = JSON.parse(message.data.toString());
            logger.info(`Received message from ${subscriptionName}`, {
                messageId: message.id,
                attributes: message.attributes
            });
            await messageHandler(data, message.attributes);
            message.ack();
        } catch (error) {
            logger.error(`Error processing message from ${subscriptionName}:`, error);
            message.nack();
        }
    });

    subscription.on('error', (error) => {
        logger.error(`Subscription error (${subscriptionName}):`, error);
    });

    logger.info(`Subscribed to ${subscriptionName}`);
    return subscription;
}

/**
 * Ensure all topics exist (used during startup)
 */
async function ensureTopics() {
    const client = getPubSubClient();
    const topicNames = Object.values(gcpConfig.pubsub.topics);

    for (const topicName of topicNames) {
        try {
            const topic = client.topic(topicName);
            const [exists] = await topic.exists();
            if (!exists) {
                await client.createTopic(topicName);
                logger.info(`Created Pub/Sub topic: ${topicName}`);
            }
        } catch (err) {
            logger.warn(`Topic creation skipped for ${topicName}:`, err.message);
        }
    }
}

module.exports = {
    getPubSubClient,
    publishMessage,
    subscribe,
    ensureTopics
};
