/**
 * Predelix — BigQuery Service
 * Business logic for BigQuery data operations
 */
const { v4: uuidv4 } = require('uuid');
const bigqueryConfig = require('../config/bigquery');
const gcpConfig = require('../config/gcp');
const { logger } = require('../utils/logger');

const bigqueryService = {
    /**
     * Store sales data rows in BigQuery
     */
    async insertSalesData(rows) {
        const formattedRows = rows.map(row => ({
            id: uuidv4(),
            store_id: String(row.store_id),
            product_id: String(row.product_id),
            date: row.date,
            sales: parseInt(row.sales, 10),
            stock: parseInt(row.stock, 10),
            day_of_week: new Date(row.date).getDay(),
            month: new Date(row.date).getMonth() + 1,
            rolling_avg_7d: row.rolling_avg_7d || null,
            lag_1d: row.lag_1d || null,
            lag_7d: row.lag_7d || null,
            ingested_at: new Date().toISOString()
        }));

        await bigqueryConfig.insertRows(
            gcpConfig.bigquery.tables.salesData,
            formattedRows
        );
        return formattedRows.length;
    },

    /**
     * Store delivery customer data in BigQuery
     */
    async insertDeliveryCustomers(rows, batchId) {
        const formattedRows = rows.map(row => ({
            id: uuidv4(),
            name: row.name,
            mobile_number: String(row.mobile_number),
            address: row.address || null,
            status: 'pending',
            preferred_time: null,
            delivery_instructions: null,
            uploaded_at: new Date().toISOString(),
            batch_id: batchId
        }));

        await bigqueryConfig.insertRows(
            gcpConfig.bigquery.tables.deliveryCustomers,
            formattedRows
        );
        return formattedRows;
    },

    /**
     * Store prediction results in BigQuery
     */
    async insertPredictions(predictions, modelVersion = 'v2.0') {
        const formattedRows = predictions.map(pred => ({
            id: uuidv4(),
            store_id: String(pred.store_id),
            product_id: String(pred.product_id),
            prediction_date: pred.date,
            predicted_stock: parseInt(pred.predicted_stock, 10),
            confidence: pred.confidence || null,
            model_version: modelVersion,
            created_at: new Date().toISOString()
        }));

        await bigqueryConfig.insertRows(
            gcpConfig.bigquery.tables.predictions,
            formattedRows
        );
        return formattedRows.length;
    },

    /**
     * Store call log in BigQuery
     */
    async insertCallLog(callData) {
        const row = {
            id: uuidv4(),
            customer_id: callData.customerId || null,
            customer_name: callData.customerName,
            phone_number: callData.phoneNumber,
            call_status: callData.status,
            duration_seconds: callData.duration || null,
            transcription: callData.transcription || null,
            preferred_time: callData.preferredTime || null,
            delivery_instructions: callData.deliveryInstructions || null,
            session_id: callData.sessionId || null,
            batch_id: callData.batchId || null,
            called_at: new Date().toISOString()
        };

        await bigqueryConfig.insertRows(
            gcpConfig.bigquery.tables.callLogs,
            [row]
        );
        return row;
    },

    /**
     * Store Gemini-generated insight in BigQuery
     */
    async insertInsight(insight) {
        const row = {
            id: uuidv4(),
            type: insight.type,
            category: insight.category,
            title: insight.title,
            summary: insight.summary,
            details: JSON.stringify(insight.details),
            severity: insight.severity || 'info',
            store_id: insight.storeId || null,
            product_id: insight.productId || null,
            generated_at: new Date().toISOString()
        };

        await bigqueryConfig.insertRows(
            gcpConfig.bigquery.tables.insights,
            [row]
        );
        return row;
    },

    /**
     * Query sales data for a specific store and date range
     */
    async getSalesData(storeId, startDate, endDate) {
        const sql = `
            SELECT * FROM \`${gcpConfig.projectId}.${gcpConfig.bigquery.dataset}.${gcpConfig.bigquery.tables.salesData}\`
            WHERE store_id = @storeId
            AND date BETWEEN @startDate AND @endDate
            ORDER BY date DESC
        `;
        return bigqueryConfig.query(sql, { storeId, startDate, endDate });
    },

    /**
     * Get latest predictions
     */
    async getLatestPredictions(storeId = null) {
        let sql = `
            SELECT * FROM \`${gcpConfig.projectId}.${gcpConfig.bigquery.dataset}.${gcpConfig.bigquery.tables.predictions}\`
        `;
        const params = {};

        if (storeId) {
            sql += ` WHERE store_id = @storeId`;
            params.storeId = storeId;
        }

        sql += ` ORDER BY created_at DESC LIMIT 100`;
        return bigqueryConfig.query(sql, params);
    },

    /**
     * Get call logs for a batch
     */
    async getCallLogs(batchId = null) {
        let sql = `
            SELECT * FROM \`${gcpConfig.projectId}.${gcpConfig.bigquery.dataset}.${gcpConfig.bigquery.tables.callLogs}\`
        `;
        const params = {};

        if (batchId) {
            sql += ` WHERE batch_id = @batchId`;
            params.batchId = batchId;
        }

        sql += ` ORDER BY called_at DESC LIMIT 200`;
        return bigqueryConfig.query(sql, params);
    },

    /**
     * Get delivery customers by batch
     */
    async getDeliveryCustomers(batchId) {
        const sql = `
            SELECT * FROM \`${gcpConfig.projectId}.${gcpConfig.bigquery.dataset}.${gcpConfig.bigquery.tables.deliveryCustomers}\`
            WHERE batch_id = @batchId
            ORDER BY uploaded_at DESC
        `;
        return bigqueryConfig.query(sql, { batchId });
    },

    /**
     * Get recent insights
     */
    async getInsights(limit = 20) {
        const sql = `
            SELECT * FROM \`${gcpConfig.projectId}.${gcpConfig.bigquery.dataset}.${gcpConfig.bigquery.tables.insights}\`
            ORDER BY generated_at DESC
            LIMIT @limit
        `;
        return bigqueryConfig.query(sql, { limit });
    },

    /**
     * Get aggregate sales summary for dashboards
     */
    async getSalesSummary() {
        const sql = `
            SELECT
                store_id,
                COUNT(DISTINCT product_id) AS product_count,
                SUM(sales) AS total_sales,
                AVG(stock) AS avg_stock,
                MIN(date) AS first_date,
                MAX(date) AS last_date,
                COUNT(*) AS record_count
            FROM \`${gcpConfig.projectId}.${gcpConfig.bigquery.dataset}.${gcpConfig.bigquery.tables.salesData}\`
            GROUP BY store_id
            ORDER BY total_sales DESC
        `;
        return bigqueryConfig.query(sql);
    }
};

module.exports = bigqueryService;
