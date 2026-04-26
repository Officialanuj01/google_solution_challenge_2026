/**
 * Predelix — Dialogflow CX Client Setup
 * Manages Dialogflow CX sessions for the delivery calling bot
 */
const { SessionsClient, AgentsClient } = require('@google-cloud/dialogflow-cx');
const gcpConfig = require('./gcp');
const { logger } = require('../utils/logger');

let sessionsClient = null;
let agentsClient = null;

function getSessionsClient() {
    if (!sessionsClient) {
        const clientOptions = {
            apiEndpoint: `${gcpConfig.dialogflow.location}-dialogflow.googleapis.com`
        };
        sessionsClient = new SessionsClient(clientOptions);
        logger.info('Dialogflow CX sessions client initialized', {
            location: gcpConfig.dialogflow.location,
            agentId: gcpConfig.dialogflow.agentId
        });
    }
    return sessionsClient;
}

function getAgentsClient() {
    if (!agentsClient) {
        const clientOptions = {
            apiEndpoint: `${gcpConfig.dialogflow.location}-dialogflow.googleapis.com`
        };
        agentsClient = new AgentsClient(clientOptions);
    }
    return agentsClient;
}

/**
 * Get the session path for a Dialogflow CX conversation
 */
function getSessionPath(sessionId) {
    const client = getSessionsClient();
    return client.projectLocationAgentSessionPath(
        gcpConfig.projectId,
        gcpConfig.dialogflow.location,
        gcpConfig.dialogflow.agentId,
        sessionId
    );
}

/**
 * Detect intent from text input (for testing/webhook processing)
 */
async function detectIntent(sessionId, text, languageCode = 'en') {
    const client = getSessionsClient();
    const sessionPath = getSessionPath(sessionId);

    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: text
            },
            languageCode
        }
    };

    const [response] = await client.detectIntent(request);
    logger.info('Dialogflow intent detected', {
        sessionId,
        intent: response.queryResult?.intent?.displayName,
        confidence: response.queryResult?.intentDetectionConfidence
    });

    return response.queryResult;
}

module.exports = {
    getSessionsClient,
    getAgentsClient,
    getSessionPath,
    detectIntent
};
