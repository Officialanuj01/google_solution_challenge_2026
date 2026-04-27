/**
 * Pulse — AI Configuration
 * Centralized configuration for Gemini API access
 */
const config = {
    gemini: {
        apiKey: process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL || 'gemini-1.5-flash-001'
    }
};

module.exports = config;
