/**
 * Predelix — Gemini API Client Setup
 * Manages connection to Google Gemini for AI-powered insights
 * Model: gemini-1.5-flash-001 (fast, cost-efficient, JSON-native)
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');
const gcpConfig = require('./gcp');
const { logger } = require('../utils/logger');

let genAIClient = null;
let textModel = null;
let jsonModel = null;

function getGenAIClient() {
    if (!genAIClient) {
        if (!gcpConfig.gemini.apiKey) {
            logger.warn('Gemini API key not configured — insights will be unavailable');
            return null;
        }
        genAIClient = new GoogleGenerativeAI(gcpConfig.gemini.apiKey);
        logger.info('Gemini AI client initialized', { model: gcpConfig.gemini.model });
    }
    return genAIClient;
}

function getTextModel() {
    if (!textModel) {
        const client = getGenAIClient();
        if (!client) return null;
        textModel = client.getGenerativeModel({
            model: gcpConfig.gemini.model,
            generationConfig: {
                temperature: 0.4,
                topK: 32,
                topP: 0.95,
                maxOutputTokens: 4096
            }
        });
    }
    return textModel;
}

function getJsonModel() {
    if (!jsonModel) {
        const client = getGenAIClient();
        if (!client) return null;
        jsonModel = client.getGenerativeModel({
            model: gcpConfig.gemini.model,
            generationConfig: {
                temperature: 0.2,
                topK: 32,
                topP: 0.9,
                maxOutputTokens: 8192,
                responseMimeType: 'application/json'
            }
        });
    }
    return jsonModel;
}

/**
 * Retry wrapper with exponential backoff for rate limit errors
 */
async function withRetry(fn, maxRetries = 3) {
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const isRateLimit = error.status === 429 || error.message?.includes('RESOURCE_EXHAUSTED');
            if (!isRateLimit || attempt === maxRetries - 1) throw error;
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
            logger.warn(`Gemini rate limited, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise(r => setTimeout(r, delay));
        }
    }
    throw lastError;
}

/**
 * Generate content using Gemini (text response)
 */
async function generateContent(prompt) {
    const model = getTextModel();
    if (!model) throw new Error('Gemini API not configured');

    return withRetry(async () => {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        logger.info('Gemini content generated', {
            promptLength: prompt.length,
            responseLength: text.length
        });
        return text;
    });
}

/**
 * Generate structured JSON content using Gemini
 * Uses dedicated JSON model with responseMimeType for reliable output
 */
async function generateJSON(prompt) {
    const model = getJsonModel();
    if (!model) throw new Error('Gemini API not configured');

    return withRetry(async () => {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        try {
            // Strip markdown code blocks if present (fallback safety)
            const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleaned);
        } catch (error) {
            logger.warn('Failed to parse Gemini JSON response, returning raw text');
            return { raw: text };
        }
    });
}

module.exports = {
    getGenAIClient,
    getTextModel,
    getJsonModel,
    generateContent,
    generateJSON
};
