/**
 * Predelix — GCP Core Configuration
 * Central configuration for all Google Cloud services
 */
const config = {
    projectId: process.env.GCP_PROJECT_ID || 'predelix-prod',
    region: process.env.GCP_REGION || 'us-central1',
    
    bigquery: {
        dataset: process.env.BIGQUERY_DATASET || 'predelix',
        tables: {
            salesData: 'sales_data',
            deliveryCustomers: 'delivery_customers',
            predictions: 'predictions',
            callLogs: 'call_logs',
            mlFeatures: 'ml_features',
            insights: 'insights'
        }
    },
    
    vertexAI: {
        endpointId: process.env.VERTEX_ENDPOINT_ID,
        modelId: process.env.VERTEX_MODEL_ID,
        location: process.env.GCP_REGION || 'us-central1'
    },
    
    gemini: {
        apiKey: process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL || 'gemini-1.5-flash-001'
    },
    
    storage: {
        uploadBucket: process.env.GCS_UPLOAD_BUCKET || 'predelix-uploads'
    }
};

module.exports = config;
