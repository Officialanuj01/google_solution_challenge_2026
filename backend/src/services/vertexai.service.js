/**
 * Pulse — Prediction Service (Hugging Face Gradio)
 * Calls the PULSE Gradio Space for stock demand prediction
 * Uses Gradio 6.x SSE v3 protocol
 */
const { logger } = require('../utils/logger');

const GRADIO_SPACE_URL = process.env.GRADIO_SPACE_URL || 'https://anujdev-pulse.hf.space';

/**
 * Call a Gradio endpoint using the SSE v3 protocol (Gradio 4+/6+)
 * Step 1: POST /gradio_api/call/<api_name> → get event_id
 * Step 2: GET  /gradio_api/call/<api_name>/<event_id> → SSE stream with result
 */
async function callGradioApi(apiName, data) {
    // Step 1: Submit the call
    const submitUrl = `${GRADIO_SPACE_URL}/gradio_api/call/${apiName}`;
    logger.info(`Calling Gradio: ${submitUrl}`);

    const submitResponse = await fetch(submitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
    });

    if (!submitResponse.ok) {
        const errText = await submitResponse.text();
        throw new Error(`Gradio submit failed (${submitResponse.status}): ${errText}`);
    }

    const { event_id } = await submitResponse.json();
    if (!event_id) {
        throw new Error('No event_id returned from Gradio');
    }

    // Step 2: Read the SSE stream to get the result
    const resultUrl = `${GRADIO_SPACE_URL}/gradio_api/call/${apiName}/${event_id}`;
    const resultResponse = await fetch(resultUrl);

    if (!resultResponse.ok) {
        const errText = await resultResponse.text();
        throw new Error(`Gradio result failed (${resultResponse.status}): ${errText}`);
    }

    const sseText = await resultResponse.text();

    // Parse SSE: look for "event: complete" followed by "data: ..."
    const lines = sseText.split('\n');
    let resultData = null;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === 'event: complete' && i + 1 < lines.length) {
            const dataLine = lines[i + 1];
            if (dataLine.startsWith('data: ')) {
                resultData = JSON.parse(dataLine.slice(6));
                break;
            }
        }
    }

    if (!resultData) {
        // Check for error events
        for (const line of lines) {
            if (line.startsWith('data: ') && line.includes('error')) {
                throw new Error(`Gradio error: ${line.slice(6)}`);
            }
        }
        throw new Error('No complete event in Gradio SSE response');
    }

    // resultData is [output_value] array
    return resultData;
}

const predictionService = {
    /**
     * Generate demand predictions by calling the PULSE Gradio Space
     */
    async predictDemand(salesData) {
        try {
            if (!salesData || salesData.length === 0) {
                throw new Error('No sales data provided');
            }

            // Convert salesData array to CSV string
            const headers = Object.keys(salesData[0]);
            const csvString = headers.join(',') + '\n' +
                salesData.map(row => headers.map(h => row[h] ?? '').join(',')).join('\n');

            logger.info('Calling PULSE for predictions', { rowCount: salesData.length });

            const result = await callGradioApi('predict_from_csv', [csvString]);

            // result is [json_string]
            const outputStr = result[0];
            if (!outputStr) throw new Error('Empty response from PULSE');

            const predictions = JSON.parse(outputStr);
            if (predictions.error) throw new Error(`PULSE error: ${predictions.error}`);
            if (!Array.isArray(predictions) || predictions.length === 0) {
                throw new Error('No predictions returned');
            }

            logger.info('PULSE predictions received', { count: predictions.length });
            return predictions;

        } catch (error) {
            logger.warn('Gradio Space unavailable, using fallback', { error: error.message });
            return this.fallbackPrediction(salesData);
        }
    },

    /**
     * Train the model via Gradio Space
     */
    async trainModel(trainingData) {
        try {
            const headers = Object.keys(trainingData[0]);
            const csvString = headers.join(',') + '\n' +
                trainingData.map(row => headers.map(h => row[h] ?? '').join(',')).join('\n');

            const result = await callGradioApi('train_model_from_csv', [csvString]);
            const output = JSON.parse(result[0] || '{}');

            logger.info('PULSE training complete', output);
            return output;

        } catch (error) {
            logger.error('Training failed:', error);
            return { status: 'error', message: error.message };
        }
    },

    /**
     * Fallback prediction when Gradio Space is unavailable
     */
    fallbackPrediction(salesData) {
        const groups = {};
        for (const row of salesData) {
            const key = `${row.store_id}|${row.product_id}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(row);
        }

        const allDates = salesData.map(r => new Date(r.date));
        const lastDate = new Date(Math.max(...allDates));

        const predictions = [];
        for (const [key, group] of Object.entries(groups)) {
            const [storeId, productId] = key.split('|');
            const recent = group.slice(-7);
            const avgSales = recent.reduce((sum, r) => sum + (Number(r.sales) || 0), 0) / recent.length;

            for (let i = 1; i <= 7; i++) {
                const predDate = new Date(lastDate);
                predDate.setDate(predDate.getDate() + i);
                predictions.push({
                    store_id: storeId,
                    product_id: productId,
                    date: predDate.toISOString().split('T')[0],
                    predicted_stock: Math.max(0, Math.round(avgSales * 1.15))
                });
            }
        }

        logger.info('Using fallback predictions', { count: predictions.length });
        return predictions;
    }
};

module.exports = predictionService;
