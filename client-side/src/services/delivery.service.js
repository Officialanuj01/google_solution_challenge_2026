/**
 * Predelix — Delivery Service (Frontend)
 * Calls Dialogflow CX delivery bot endpoints via Cloud Run backend
 * Replaces: direct calls to delivery_call.py endpoints
 */
import config from '../config';

const API_URL = `${config.apiUrl}/delivery`;

export const deliveryService = {
    /**
     * Upload customer CSV for delivery calls
     */
    async uploadCustomers(file) {
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Upload failed');
        }

        return response.json();
    },

    /**
     * Trigger delivery calls for a batch
     */
    async triggerCalls(batchId) {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_URL}/trigger`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ batchId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to trigger calls');
        }

        return response.json();
    },

    /**
     * Get call results and transcripts
     */
    async getResults(batchId = null) {
        const params = batchId ? `?batch_id=${batchId}` : '';
        const response = await fetch(`${API_URL}/results${params}`);

        if (!response.ok) throw new Error('Failed to fetch results');
        return response.json();
    },

    /**
     * Retry failed calls for a batch
     */
    async retryCalls(batchId) {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_URL}/retry`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ batchId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Retry failed');
        }

        return response.json();
    }
};
