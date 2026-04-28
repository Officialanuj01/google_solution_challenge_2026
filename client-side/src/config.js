const renderApiUrl = 'https://google-solution-challenge-2026-d9f5.onrender.com/api';

const config = {
    // Backend API URL (falls back to Render when env is not set)
    apiUrl: import.meta.env.VITE_API_URL || renderApiUrl,
    // WebSocket URL for real-time events
    wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:5000',
    // Google OAuth Client ID
    googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
};

export default config;
