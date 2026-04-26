/**
 * Predelix — Insights Service (Frontend)
 * Calls Gemini API-powered insights endpoints via Cloud Run backend
 * NEW — not present in original codebase
 */
import config from '../config';

const API_URL = `${config.apiUrl}/insights`;

export const insightsService = {
    /**
     * Generate AI insights from sales data
     */
    async generateSalesInsights(storeId = null, dateRange = {}) {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_URL}/sales`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                storeId,
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate insights');
        }

        return response.json();
    },

    /**
     * Generate AI insights from delivery data
     */
    async generateDeliveryInsights(batchId) {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_URL}/delivery`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ batchId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate insights');
        }

        return response.json();
    },

    /**
     * Get AI-generated store performance summary
     */
    async getStoreSummary(storeId) {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_URL}/store/${storeId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch store summary');
        return response.json();
    },

    /**
     * Chat with Predelix AI Assistant
     */
    async chat(query, context = {}) {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ query, context })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Chat request failed');
        }

        return response.json();
    },

    /**
     * Get recent stored insights
     */
    async getRecent(limit = 20) {
        const response = await fetch(`${API_URL}/recent?limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch insights');
        return response.json();
    }
};
