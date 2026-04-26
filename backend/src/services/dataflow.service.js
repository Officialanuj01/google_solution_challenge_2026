/**
 * Predelix — Dataflow Service
 * Manages Cloud Dataflow job submission and monitoring via REST API
 */
const { logger } = require('../utils/logger');
const gcpConfig = require('../config/gcp');
const { GoogleAuth } = require('google-auth-library');

const DATAFLOW_API = 'https://dataflow.googleapis.com/v1b3';

async function getAuthClient() {
    const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    return auth.getClient();
}

async function dataflowRequest(method, path, body = null) {
    const authClient = await getAuthClient();
    const url = `${DATAFLOW_API}/projects/${gcpConfig.projectId}/locations/${gcpConfig.region}/${path}`;
    const headers = await authClient.getRequestHeaders();

    const options = {
        method,
        headers: { ...headers, 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);

    const { default: fetch } = await import('node-fetch').catch(() => ({ default: globalThis.fetch }));
    const res = await (fetch || globalThis.fetch)(url, options);

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Dataflow API error ${res.status}: ${text}`);
    }
    return res.json();
}

const TEMP_BUCKET = () => `gs://${process.env.GCS_UPLOAD_BUCKET || 'predelix-uploads'}/dataflow-temp`;
const STAGING_BUCKET = () => `gs://${process.env.GCS_UPLOAD_BUCKET || 'predelix-uploads'}/dataflow-staging`;
const TEMPLATE_BASE = () => `gs://${process.env.GCS_UPLOAD_BUCKET || 'predelix-uploads'}/templates`;

const dataflowService = {
    /**
     * Submit a Dataflow Flex Template job for sales data processing
     * Template: gs://<bucket>/templates/sales_ingestion
     */
    async submitSalesIngestionJob(gcsPath, batchId) {
        const jobName = `predelix-sales-ingest-${batchId.slice(0, 8)}-${Date.now()}`;
        const outputTable = `${gcpConfig.projectId}:${gcpConfig.bigquery.dataset}.${gcpConfig.bigquery.tables.salesData}`;

        logger.info('Submitting Dataflow sales ingestion job', { gcsPath, batchId });

        try {
            const payload = {
                launchParameter: {
                    jobName,
                    containerSpecGcsPath: `${TEMPLATE_BASE()}/sales_ingestion`,
                    parameters: {
                        input: gcsPath,
                        output_table: outputTable,
                        temp_location: TEMP_BUCKET()
                    },
                    environment: {
                        tempLocation: TEMP_BUCKET(),
                        stagingLocation: STAGING_BUCKET(),
                        machineType: 'n1-standard-2',
                        maxWorkers: 5,
                        region: gcpConfig.region
                    }
                }
            };

            const result = await dataflowRequest('POST', 'flexTemplates:launch', payload);

            logger.info('✅ Dataflow sales ingestion job submitted', {
                jobId: result.job?.id,
                jobName: result.job?.name
            });

            return {
                jobId: result.job?.id || jobName,
                jobName: result.job?.name || jobName,
                pipeline: 'sales_ingestion',
                inputPath: gcsPath,
                outputTable,
                status: result.job?.currentState || 'JOB_STATE_PENDING',
                dashboardUrl: `https://console.cloud.google.com/dataflow/jobs/${gcpConfig.region}/${result.job?.id}?project=${gcpConfig.projectId}`
            };
        } catch (err) {
            logger.warn('Dataflow submit failed (template may not be deployed yet):', err.message);
            return {
                jobId: jobName,
                pipeline: 'sales_ingestion',
                inputPath: gcsPath,
                outputTable,
                status: 'SUBMIT_FAILED',
                error: err.message,
                note: 'Run dataflow/submit_pipeline.sh to build and deploy Flex Templates first'
            };
        }
    },

    /**
     * Submit Dataflow job for delivery customer data processing
     */
    async submitDeliveryProcessingJob(gcsPath, batchId) {
        const jobName = `predelix-delivery-proc-${batchId.slice(0, 8)}-${Date.now()}`;
        const outputTable = `${gcpConfig.projectId}:${gcpConfig.bigquery.dataset}.${gcpConfig.bigquery.tables.deliveryCustomers}`;

        logger.info('Submitting Dataflow delivery processing job', { gcsPath, batchId });

        try {
            const payload = {
                launchParameter: {
                    jobName,
                    containerSpecGcsPath: `${TEMPLATE_BASE()}/delivery_processing`,
                    parameters: {
                        input: gcsPath,
                        output_table: outputTable,
                        temp_location: TEMP_BUCKET()
                    },
                    environment: {
                        tempLocation: TEMP_BUCKET(),
                        stagingLocation: STAGING_BUCKET(),
                        machineType: 'n1-standard-2',
                        maxWorkers: 3,
                        region: gcpConfig.region
                    }
                }
            };

            const result = await dataflowRequest('POST', 'flexTemplates:launch', payload);

            return {
                jobId: result.job?.id || jobName,
                jobName: result.job?.name || jobName,
                pipeline: 'delivery_processing',
                status: result.job?.currentState || 'JOB_STATE_PENDING'
            };
        } catch (err) {
            logger.warn('Dataflow delivery job submit failed:', err.message);
            return {
                jobId: jobName,
                pipeline: 'delivery_processing',
                status: 'SUBMIT_FAILED',
                error: err.message
            };
        }
    },

    /**
     * Submit Dataflow job for ML feature engineering
     * Reads from sales_data BQ table → writes to ml_features
     */
    async submitFeatureEngineeringJob() {
        const jobName = `predelix-feature-eng-${Date.now()}`;
        const inputTable = `${gcpConfig.projectId}:${gcpConfig.bigquery.dataset}.${gcpConfig.bigquery.tables.salesData}`;
        const outputTable = `${gcpConfig.projectId}:${gcpConfig.bigquery.dataset}.${gcpConfig.bigquery.tables.mlFeatures}`;

        logger.info('Submitting Dataflow feature engineering job');

        try {
            const payload = {
                launchParameter: {
                    jobName,
                    containerSpecGcsPath: `${TEMPLATE_BASE()}/feature_engineering`,
                    parameters: {
                        input_table: inputTable,
                        output_table: outputTable,
                        temp_location: TEMP_BUCKET()
                    },
                    environment: {
                        tempLocation: TEMP_BUCKET(),
                        stagingLocation: STAGING_BUCKET(),
                        machineType: 'n1-standard-4',
                        maxWorkers: 10,
                        region: gcpConfig.region
                    }
                }
            };

            const result = await dataflowRequest('POST', 'flexTemplates:launch', payload);

            logger.info('✅ Feature engineering job submitted', { jobId: result.job?.id });

            return {
                jobId: result.job?.id || jobName,
                pipeline: 'feature_engineering',
                inputTable,
                outputTable,
                status: result.job?.currentState || 'JOB_STATE_PENDING'
            };
        } catch (err) {
            logger.warn('Feature engineering job submit failed:', err.message);
            return {
                jobId: jobName,
                pipeline: 'feature_engineering',
                status: 'SUBMIT_FAILED',
                error: err.message
            };
        }
    },

    /**
     * Get the status of a running Dataflow job
     */
    async getJobStatus(jobId) {
        try {
            const result = await dataflowRequest('GET', `jobs/${jobId}`);
            return {
                jobId,
                status: result.currentState,
                name: result.name,
                createTime: result.createTime,
                currentStateTime: result.currentStateTime,
                type: result.type,
                dashboardUrl: `https://console.cloud.google.com/dataflow/jobs/${gcpConfig.region}/${jobId}?project=${gcpConfig.projectId}`
            };
        } catch (err) {
            logger.warn('Failed to get Dataflow job status:', err.message);
            return { jobId, status: 'UNKNOWN', error: err.message };
        }
    }
};

module.exports = dataflowService;
