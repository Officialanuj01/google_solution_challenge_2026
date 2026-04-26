/**
 * Predelix — Google Cloud Speech-to-Text Client Setup
 * Manages speech transcription for delivery call recordings
 */
const speech = require('@google-cloud/speech');
const gcpConfig = require('./gcp');
const { logger } = require('../utils/logger');

let speechClient = null;

function getSpeechClient() {
    if (!speechClient) {
        speechClient = new speech.SpeechClient({
            projectId: gcpConfig.projectId
        });
        logger.info('Speech-to-Text client initialized');
    }
    return speechClient;
}

/**
 * Transcribe audio from a Cloud Storage URI
 * @param {string} gcsUri - gs:// URI of the audio file
 * @param {Object} options - Transcription options
 */
async function transcribeFromGCS(gcsUri, options = {}) {
    const client = getSpeechClient();

    const request = {
        config: {
            encoding: options.encoding || 'LINEAR16',
            sampleRateHertz: options.sampleRate || 8000,
            languageCode: options.languageCode || 'en-US',
            model: 'phone_call',
            useEnhanced: true,
            enableAutomaticPunctuation: true,
            enableWordTimeOffsets: options.wordTimestamps || false,
            ...options.config
        },
        audio: {
            uri: gcsUri
        }
    };

    try {
        const [response] = await client.recognize(request);
        const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join(' ');

        logger.info('Transcription completed', {
            gcsUri,
            resultCount: response.results.length,
            transcriptionLength: transcription.length
        });

        return {
            transcription,
            confidence: response.results[0]?.alternatives[0]?.confidence || 0,
            results: response.results
        };
    } catch (error) {
        logger.error('Transcription failed:', { gcsUri, error: error.message });
        throw error;
    }
}

/**
 * Transcribe audio from a buffer (for short recordings)
 */
async function transcribeFromBuffer(audioBuffer, options = {}) {
    const client = getSpeechClient();

    const request = {
        config: {
            encoding: options.encoding || 'LINEAR16',
            sampleRateHertz: options.sampleRate || 8000,
            languageCode: options.languageCode || 'en-US',
            model: 'phone_call',
            useEnhanced: true,
            enableAutomaticPunctuation: true
        },
        audio: {
            content: audioBuffer.toString('base64')
        }
    };

    const [response] = await client.recognize(request);
    const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join(' ');

    return { transcription, results: response.results };
}

module.exports = {
    getSpeechClient,
    transcribeFromGCS,
    transcribeFromBuffer
};
