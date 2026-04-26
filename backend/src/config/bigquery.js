/**
 * Predelix — BigQuery Client Setup
 * Manages connection to BigQuery for data storage and analytics
 */
const { BigQuery } = require('@google-cloud/bigquery');
const gcpConfig = require('./gcp');
const { logger } = require('../utils/logger');

let bigqueryClient = null;

function getBigQueryClient() {
    if (!bigqueryClient) {
        bigqueryClient = new BigQuery({
            projectId: gcpConfig.projectId
        });
        logger.info('BigQuery client initialized', { projectId: gcpConfig.projectId });
    }
    return bigqueryClient;
}

/**
 * Get a reference to a BigQuery table
 */
function getTable(tableName) {
    const client = getBigQueryClient();
    return client.dataset(gcpConfig.bigquery.dataset).table(tableName);
}

/**
 * Run a parameterized query against BigQuery
 */
async function query(sql, params = {}) {
    const client = getBigQueryClient();
    const options = {
        query: sql,
        params,
        location: gcpConfig.region
    };
    const [rows] = await client.query(options);
    return rows;
}

/**
 * Insert rows into a BigQuery table
 */
async function insertRows(tableName, rows) {
    const table = getTable(tableName);
    try {
        await table.insert(rows);
        logger.info(`Inserted ${rows.length} rows into ${tableName}`);
    } catch (error) {
        if (error.name === 'PartialFailureError') {
            logger.error('Partial insert failure:', {
                table: tableName,
                errors: error.errors
            });
        }
        throw error;
    }
}

/**
 * Ensure dataset and tables exist (used during startup)
 */
async function ensureSchema() {
    const client = getBigQueryClient();
    const dataset = client.dataset(gcpConfig.bigquery.dataset);

    // Create dataset if not exists
    try {
        const [exists] = await dataset.exists();
        if (!exists) {
            await dataset.create({ location: gcpConfig.region });
            logger.info(`Created BigQuery dataset: ${gcpConfig.bigquery.dataset}`);
        }
    } catch (err) {
        logger.warn('Dataset check skipped (may require permissions):', err.message);
    }

    // Table schemas
    const schemas = {
        [gcpConfig.bigquery.tables.salesData]: [
            { name: 'id', type: 'STRING', mode: 'REQUIRED' },
            { name: 'store_id', type: 'STRING', mode: 'REQUIRED' },
            { name: 'product_id', type: 'STRING', mode: 'REQUIRED' },
            { name: 'date', type: 'DATE', mode: 'REQUIRED' },
            { name: 'sales', type: 'INT64', mode: 'REQUIRED' },
            { name: 'stock', type: 'INT64', mode: 'REQUIRED' },
            { name: 'day_of_week', type: 'INT64' },
            { name: 'month', type: 'INT64' },
            { name: 'rolling_avg_7d', type: 'FLOAT64' },
            { name: 'lag_1d', type: 'INT64' },
            { name: 'lag_7d', type: 'INT64' },
            { name: 'ingested_at', type: 'TIMESTAMP' }
        ],
        [gcpConfig.bigquery.tables.deliveryCustomers]: [
            { name: 'id', type: 'STRING', mode: 'REQUIRED' },
            { name: 'name', type: 'STRING', mode: 'REQUIRED' },
            { name: 'mobile_number', type: 'STRING', mode: 'REQUIRED' },
            { name: 'address', type: 'STRING' },
            { name: 'status', type: 'STRING' },
            { name: 'preferred_time', type: 'STRING' },
            { name: 'delivery_instructions', type: 'STRING' },
            { name: 'uploaded_at', type: 'TIMESTAMP' },
            { name: 'batch_id', type: 'STRING' }
        ],
        [gcpConfig.bigquery.tables.predictions]: [
            { name: 'id', type: 'STRING', mode: 'REQUIRED' },
            { name: 'store_id', type: 'STRING', mode: 'REQUIRED' },
            { name: 'product_id', type: 'STRING', mode: 'REQUIRED' },
            { name: 'prediction_date', type: 'DATE', mode: 'REQUIRED' },
            { name: 'predicted_stock', type: 'INT64', mode: 'REQUIRED' },
            { name: 'confidence', type: 'FLOAT64' },
            { name: 'model_version', type: 'STRING' },
            { name: 'created_at', type: 'TIMESTAMP' }
        ],
        [gcpConfig.bigquery.tables.callLogs]: [
            { name: 'id', type: 'STRING', mode: 'REQUIRED' },
            { name: 'customer_id', type: 'STRING' },
            { name: 'customer_name', type: 'STRING' },
            { name: 'phone_number', type: 'STRING', mode: 'REQUIRED' },
            { name: 'call_status', type: 'STRING' },
            { name: 'duration_seconds', type: 'INT64' },
            { name: 'transcription', type: 'STRING' },
            { name: 'preferred_time', type: 'STRING' },
            { name: 'delivery_instructions', type: 'STRING' },
            { name: 'session_id', type: 'STRING' },
            { name: 'batch_id', type: 'STRING' },
            { name: 'called_at', type: 'TIMESTAMP' }
        ],
        [gcpConfig.bigquery.tables.mlFeatures]: [
            { name: 'store_id', type: 'STRING', mode: 'REQUIRED' },
            { name: 'product_id', type: 'STRING', mode: 'REQUIRED' },
            { name: 'date', type: 'DATE', mode: 'REQUIRED' },
            { name: 'store_id_encoded', type: 'INT64' },
            { name: 'product_id_encoded', type: 'INT64' },
            { name: 'date_ordinal', type: 'INT64' },
            { name: 'sales', type: 'INT64' },
            { name: 'stock', type: 'INT64' },
            { name: 'day_of_week', type: 'INT64' },
            { name: 'month', type: 'INT64' },
            { name: 'rolling_avg_7d', type: 'FLOAT64' },
            { name: 'lag_1d', type: 'INT64' },
            { name: 'lag_7d', type: 'INT64' },
            { name: 'computed_at', type: 'TIMESTAMP' }
        ],
        [gcpConfig.bigquery.tables.insights]: [
            { name: 'id', type: 'STRING', mode: 'REQUIRED' },
            { name: 'type', type: 'STRING' },
            { name: 'category', type: 'STRING' },
            { name: 'title', type: 'STRING' },
            { name: 'summary', type: 'STRING' },
            { name: 'details', type: 'JSON' },
            { name: 'severity', type: 'STRING' },
            { name: 'store_id', type: 'STRING' },
            { name: 'product_id', type: 'STRING' },
            { name: 'generated_at', type: 'TIMESTAMP' }
        ]
    };

    for (const [tableName, schema] of Object.entries(schemas)) {
        try {
            const table = dataset.table(tableName);
            const [exists] = await table.exists();
            if (!exists) {
                await dataset.createTable(tableName, { schema: { fields: schema } });
                logger.info(`Created BigQuery table: ${tableName}`);
            }
        } catch (err) {
            logger.warn(`Table creation skipped for ${tableName}:`, err.message);
        }
    }
}

module.exports = {
    getBigQueryClient,
    getTable,
    query,
    insertRows,
    ensureSchema
};
