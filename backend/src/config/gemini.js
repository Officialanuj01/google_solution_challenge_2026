/**
 * Predelix — Gemini API Client Setup
 * Manages connection to Google Gemini for AI-powered insights
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');
const gcpConfig = require('./gcp');
const { logger } = require('../utils/logger');

let genAIClient = null;
let model = null;

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

function getModel() {
    if (!model) {
        const client = getGenAIClient();
        if (!client) return null;
        model = client.getGenerativeModel({
            model: gcpConfig.gemini.model,
            generationConfig: {
                temperature: 0.4,
                topK: 32,
                topP: 0.95,
                maxOutputTokens: 4096
            }
        });
    }
    return model;
}

/**
 * Generate content using Gemini
 */
async function generateContent(prompt) {
    const genModel = getModel();
    if (!genModel) {
        throw new Error('Gemini API not configured');
    }

    try {
        const result = await genModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        logger.info('Gemini content generated', {
            promptLength: prompt.length,
            responseLength: text.length
        });

        return text;
    } catch (error) {
        logger.error('Gemini generation failed:', error);
        throw error;
    }
}

/**
 * Generate structured JSON content using Gemini
 */
async function generateJSON(prompt) {
    const text = await generateContent(prompt + '\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown formatting, no code blocks, just raw JSON.');

    try {
        // Strip markdown code blocks if present
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
    } catch (error) {
        logger.warn('Failed to parse Gemini response as JSON, returning raw text');
        return { raw: text };
    }
}

module.exports = {
    getGenAIClient,
    getModel,
    generateContent,
    generateJSON
};
