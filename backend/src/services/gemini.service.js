/**
 * Pulse — Gemini AI Service
 * Business logic for AI-powered retail insights
 * NEW capability — generates natural language insights from sales data
 */
const geminiConfig = require('../config/gemini');
const { logger } = require('../utils/logger');

const geminiService = {
    /**
     * Generate comprehensive insights from sales data and predictions
     */
    async generateSalesInsights(salesData, predictions) {
        const prompt = `You are an expert AI retail supply chain analyst for Pulse, a platform that helps vendors optimize inventory and delivery.

Analyze the following data and provide actionable insights:

## Sales Data (recent records):
${JSON.stringify(salesData.slice(0, 50), null, 2)}

## Demand Predictions (next 7 days):
${JSON.stringify(predictions.slice(0, 30), null, 2)}

Provide your analysis in the following JSON structure:
{
    "trends": [
        {
            "title": "Trend title",
            "description": "Detailed description of the trend",
            "metric": "percentage or number",
            "direction": "up|down|stable",
            "affectedStores": ["store_ids"],
            "affectedProducts": ["product_ids"]
        }
    ],
    "anomalies": [
        {
            "title": "Anomaly title",
            "description": "What's unusual and why",
            "severity": "high|medium|low",
            "storeId": "affected store",
            "productId": "affected product",
            "recommendation": "What to do about it"
        }
    ],
    "recommendations": [
        {
            "title": "Recommendation title",
            "description": "Detailed actionable recommendation",
            "priority": "critical|important|nice_to_have",
            "expectedImpact": "Description of expected outcome",
            "category": "inventory|pricing|logistics|general"
        }
    ],
    "risks": [
        {
            "title": "Risk title",
            "description": "What could go wrong",
            "likelihood": "high|medium|low",
            "impact": "high|medium|low",
            "mitigation": "How to mitigate this risk"
        }
    ],
    "summary": "A 2-3 sentence executive summary of the overall analysis"
}`;

        try {
            const insights = await geminiConfig.generateJSON(prompt);

            logger.info('Sales insights generated', {
                trends: insights.trends?.length || 0,
                anomalies: insights.anomalies?.length || 0,
                recommendations: insights.recommendations?.length || 0,
                risks: insights.risks?.length || 0
            });

            return insights;
        } catch (error) {
            logger.error('Failed to generate sales insights:', error);
            throw error;
        }
    },

    /**
     * Generate delivery optimization insights
     */
    async generateDeliveryInsights(callLogs) {
        const prompt = `You are an AI delivery logistics analyst for Pulse.

Analyze the following delivery call logs and provide optimization insights:

## Call Logs:
${JSON.stringify(callLogs.slice(0, 50), null, 2)}

Provide your analysis in the following JSON structure:
{
    "deliveryPatterns": [
        {
            "title": "Pattern title",
            "description": "Description of the delivery pattern",
            "percentage": "number",
            "suggestion": "Actionable suggestion"
        }
    ],
    "failureAnalysis": {
        "totalCalls": 0,
        "successRate": "percentage",
        "commonFailureReasons": ["reason1", "reason2"],
        "peakFailureTimes": ["time slots"],
        "recommendation": "Overall recommendation to improve success rate"
    },
    "timeSlotOptimization": [
        {
            "timeSlot": "e.g., 9AM-12PM",
            "successRate": "percentage",
            "customerPreference": "percentage",
            "recommendation": "Should increase or decrease deliveries in this slot"
        }
    ],
    "summary": "Executive summary of delivery analysis"
}`;

        try {
            const insights = await geminiConfig.generateJSON(prompt);
            logger.info('Delivery insights generated');
            return insights;
        } catch (error) {
            logger.error('Failed to generate delivery insights:', error);
            throw error;
        }
    },

    /**
     * Generate a natural language summary of store performance
     */
    async generateStoreSummary(storeId, salesData = [], predictions = []) {
        try {
            const prompt = `Generate a brief, natural language performance summary for Store ${storeId} based on this data:

Sales Data (last 30 days): ${JSON.stringify(salesData.slice(0, 30))}
Predictions (next 7 days): ${JSON.stringify(predictions.slice(0, 10))}

Provide a JSON response with:
{
    "headline": "One sentence headline about store performance",
    "summary": "2-3 paragraph detailed summary",
    "keyMetrics": {
        "totalSales": 0,
        "avgDailySales": 0,
        "topProduct": "product_id",
        "growthRate": "percentage"
    },
    "alerts": ["Any urgent issues or opportunities"]
}`;

            return geminiConfig.generateJSON(prompt);
        } catch (error) {
            logger.error('Failed to generate store summary:', error);
            throw error;
        }
    },

    /**
     * Chat with Gemini about inventory/delivery data (conversational insights)
     */
    async chatInsight(userQuery, context = {}) {
        const prompt = `You are Pulse AI Assistant, helping retail store owners and delivery partners optimize their supply chain.

Context about the user:
- Role: ${context.role || 'store owner'}
- Store: ${context.storeId || 'all stores'}

User's question: "${userQuery}"

${context.salesData ? `Recent sales data: ${JSON.stringify(context.salesData.slice(0, 20))}` : ''}
${context.predictions ? `Recent predictions: ${JSON.stringify(context.predictions.slice(0, 10))}` : ''}

Provide a helpful, concise, and actionable response. If you reference specific numbers, be precise. If you don't have enough data to answer accurately, say so.`;

        try {
            const response = await geminiConfig.generateContent(prompt);
            return { response, timestamp: new Date().toISOString() };
        } catch (error) {
            logger.error('Chat insight failed:', error);
            throw error;
        }
    }
};

module.exports = geminiService;
