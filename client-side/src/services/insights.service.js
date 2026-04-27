/**
 * Pulse — Insights Service (Frontend)
 * Calls Gemini API-powered insights endpoints via backend API
 * Uses the centralised api.js wrapper for auth + error handling
 */
import api from './api';

const BASE = '/insights';

export const insightsService = {
    /**
     * Generate AI insights from sales data
     */
    async generateSalesInsights(storeId = null, dateRange = {}) {
        return api.post(`${BASE}/sales`, {
            storeId,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
        });
    },

    /**
     * Generate AI insights from delivery call data
     */
    async generateDeliveryInsights(batchId) {
        return api.post(`${BASE}/delivery`, { batchId });
    },

    /**
     * Get AI-generated store performance summary
     */
    async getStoreSummary(storeId) {
        return api.get(`${BASE}/store/${storeId}`);
    },

    /**
     * Chat with Pulse AI Assistant (Gemini-powered)
     * @param {string} query - User's question
     * @param {Object} context - { storeId, role, salesData?, predictions? }
     */
    async chat(query, context = {}) {
        return api.post(`${BASE}/chat`, { query, context });
    },

    /**
    * Get recent stored insights
     */
    async getRecent(limit = 20) {
        return api.get(`${BASE}/recent?limit=${limit}`);
    }
};
