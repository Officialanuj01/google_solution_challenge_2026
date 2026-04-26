const config = {
    // Cloud Run backend API URL (falls back to /api which Vite proxies to localhost:5000)
    apiUrl: import.meta.env.VITE_API_URL || '/api',
    // WebSocket URL for Pub/Sub real-time events
    wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:5000',
    // Google OAuth Client ID
    googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    // GCP Project ID
    gcpProjectId: import.meta.env.VITE_GCP_PROJECT_ID || '',
    // Environment flags
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
};

export default config;
