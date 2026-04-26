/**
 * Predelix — Prediction Service (Frontend)
 * Calls Vertex AI prediction endpoints via Cloud Run backend
 * Replaces: direct Flask API calls in Predict.jsx
 */
import config from '../config';

const API_URL = `${config.apiUrl}/predict`;

export const predictionService = {
    /**
     * Upload sales CSV and get demand predictions
     */
    async predict(file) {
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('accessToken');
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData
        });

        if (!response.ok) {
            let message = 'Prediction failed';
            const contentType = response.headers.get('content-type') || '';
            try {
                if (contentType.includes('application/json')) {
                    const error = await response.json();
                    message = error.error || error.message || message;
                } else {
                    const text = await response.text();
                    if (text) message = text;
                }
            } catch {
                message = `${message} (HTTP ${response.status})`;
            }
            throw new Error(message);
        }

        return response.json();
    },

    /**
     * Upload sales CSV for model training
     */
    async train(file) {
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_URL}/train`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Training failed');
        }

        return response.json();
    },

    /**
     * Get latest prediction results from BigQuery
     */
    async getResults(storeId = null) {
        const params = storeId ? `?store_id=${storeId}` : '';
        const response = await fetch(`${API_URL}/results${params}`);

        if (!response.ok) throw new Error('Failed to fetch results');
        return response.json();
    },

    /**
     * Get dashboard summary
     */
    async getSummary() {
        const response = await fetch(`${API_URL}/summary`);
        if (!response.ok) throw new Error('Failed to fetch summary');
        return response.json();
    },

    /**
     * Download predictions as CSV
     */
    async downloadCSV(file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_URL}?format=csv`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Failed to download CSV');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'predicted_stock.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    }
};
