/**
 * Predelix — Delivery Service (Frontend)
 * Calls Dialogflow CX delivery bot endpoints via Cloud Run backend
 * Uses the centralised api.js wrapper for auth + error handling
 */
import api from './api';

const BASE = '/delivery';

export const deliveryService = {
    /**
     * Upload customer CSV for delivery calls
     */
    async uploadCustomers(file) {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`${BASE}/upload`, formData);
    },

    /**
     * Trigger delivery calls for a batch
     */
    async triggerCalls(batchId, webhookBaseUrl = null) {
        return api.post(`${BASE}/trigger`, { batchId, webhook_base_url: webhookBaseUrl });
    },

    /**
     * Get call results and transcripts for a batch
     */
    async getResults(batchId = null) {
        const params = batchId ? `?batch_id=${batchId}` : '';
        return api.get(`${BASE}/results${params}`);
    },

    /**
     * Get delivery customers for a batch (from BigQuery)
     */
    async getCustomers(batchId) {
        return api.get(`${BASE}/customers?batch_id=${batchId}`);
    },

    /**
     * Retry failed calls for a batch
     */
    async retryCalls(batchId, webhookBaseUrl = null) {
        return api.post(`${BASE}/retry`, { batchId, webhook_base_url: webhookBaseUrl });
    }
};
