/**
 * Predelix — BigQuery Data Service (Frontend)
 * Calls BigQuery data endpoints via Cloud Run backend
 */
import config from '../config';

const API_URL = `${config.apiUrl}/data`;

export const bigqueryDataService = {
    /**
     * Get sales data for a store
     */
    async getSalesData(storeId, startDate, endDate) {
        const token = localStorage.getItem('accessToken');
        const params = new URLSearchParams({ store_id: storeId });
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);

        const response = await fetch(`${API_URL}/sales?${params}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch sales data');
        return response.json();
    },

    /**
     * Get prediction results
     */
    async getPredictions(storeId = null) {
        const token = localStorage.getItem('accessToken');
        const params = storeId ? `?store_id=${storeId}` : '';

        const response = await fetch(`${API_URL}/predictions${params}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch predictions');
        return response.json();
    },

    /**
     * Get call logs
     */
    async getCallLogs(batchId = null) {
        const token = localStorage.getItem('accessToken');
        const params = batchId ? `?batch_id=${batchId}` : '';

        const response = await fetch(`${API_URL}/call-logs${params}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch call logs');
        return response.json();
    },

    /**
     * Get dashboard summary
     */
    async getSummary() {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_URL}/summary`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch summary');
        return response.json();
    },

    /**
     * Trigger a Dataflow job
     */
    async triggerDataflowJob(gcsPath, batchId) {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_URL}/dataflow/sales`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ gcsPath, batchId })
        });

        if (!response.ok) throw new Error('Failed to trigger Dataflow job');
        return response.json();
    },

    /**
     * Check Dataflow job status
     */
    async getDataflowStatus(jobId) {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_URL}/dataflow/status/${jobId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to get job status');
        return response.json();
    }
};
