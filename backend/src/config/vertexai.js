/**
 * Predelix — Vertex AI Client Setup
 * Manages Vertex AI endpoint connections for demand prediction
 */
const { PredictionServiceClient, helpers } = require('@google-cloud/aiplatform');
const gcpConfig = require('./gcp');
const { logger } = require('../utils/logger');

let predictionClient = null;

function getPredictionClient() {
    if (!predictionClient) {
        const clientOptions = {
            apiEndpoint: `${gcpConfig.vertexAI.location}-aiplatform.googleapis.com`
        };
        predictionClient = new PredictionServiceClient(clientOptions);
        logger.info('Vertex AI prediction client initialized', {
            location: gcpConfig.vertexAI.location,
            endpointId: gcpConfig.vertexAI.endpointId
        });
    }
    return predictionClient;
}

/**
 * Get the full endpoint resource name
 */
function getEndpointName() {
    return `projects/${gcpConfig.projectId}/locations/${gcpConfig.vertexAI.location}/endpoints/${gcpConfig.vertexAI.endpointId}`;
}

/**
 * Make a prediction using the deployed Vertex AI model
 * @param {Array<Object>} instances - Array of feature objects for prediction
 * @returns {Array} Prediction results
 */
async function predict(instances) {
    const client = getPredictionClient();
    const endpoint = getEndpointName();

    // Convert instances to Vertex AI format
    const formattedInstances = instances.map(instance => {
        return helpers.toValue(instance);
    });

    try {
        const [response] = await client.predict({
            endpoint,
            instances: formattedInstances
        });

        logger.info('Vertex AI prediction completed', {
            instanceCount: instances.length,
            predictionCount: response.predictions?.length
        });

        return response.predictions.map(pred => helpers.fromValue(pred));
    } catch (error) {
        logger.error('Vertex AI prediction failed:', error);
        throw error;
    }
}

module.exports = {
    getPredictionClient,
    getEndpointName,
    predict
};
