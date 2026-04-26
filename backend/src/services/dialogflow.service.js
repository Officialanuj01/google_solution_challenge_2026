/**
 * Predelix — Dialogflow CX Service
 * Business logic for delivery calling bot
 * Replaces: server_side/delivery_helper/delivery_call.py (Twilio + SpeechRecognition)
 */
const dialogflowConfig = require('../config/dialogflow');
const speechConfig = require('../config/speech');
const bigqueryService = require('./bigquery.service');
const pubsubService = require('./pubsub.service');
const { logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

const dialogflowService = {
    /**
     * Initiate delivery confirmation calls for a batch of customers
     * Replaces: /api/trigger_calls in delivery_call.py
     * 
     * @param {Array} customers - Array of customer objects from CSV
     * @param {string} batchId - Unique batch identifier
     * @returns {Object} Call initiation results
     */
    async initiateDeliveryCalls(customers, batchId) {
        const results = {
            batchId,
            totalCustomers: customers.length,
            successfulCalls: 0,
            failedCalls: 0,
            queuedCalls: [],
            errors: []
        };

        for (const customer of customers) {
            const sessionId = `delivery-${batchId}-${uuidv4().slice(0, 8)}`;
            
            try {
                // Create a Dialogflow CX session for this call
                const callResult = await this.makeDeliveryCall(customer, sessionId, batchId);
                
                if (callResult.success) {
                    results.successfulCalls++;
                } else {
                    results.failedCalls++;
                    results.queuedCalls.push({
                        name: customer.name,
                        phone: customer.mobile_number,
                        reason: callResult.error
                    });
                }

                // Publish call status update via Pub/Sub
                await pubsubService.publishCallStatusUpdate({
                    callId: sessionId,
                    customerName: customer.name,
                    phoneNumber: customer.mobile_number,
                    status: callResult.success ? 'connected' : 'failed',
                    transcription: callResult.transcription || null,
                    batchId
                });

            } catch (error) {
                results.failedCalls++;
                results.errors.push({
                    customer: customer.name,
                    phone: customer.mobile_number,
                    error: error.message
                });
                logger.error(`Call failed for ${customer.name}:`, error);
            }
        }

        logger.info('Delivery call batch completed', {
            batchId,
            successful: results.successfulCalls,
            failed: results.failedCalls
        });

        return results;
    },

    /**
     * Make a single delivery call using Dialogflow CX telephony
     * Replaces: make_call() in delivery_call.py
     */
    async makeDeliveryCall(customer, sessionId, batchId) {
        try {
            const phoneNumber = String(customer.mobile_number);
            
            // Validate phone number format
            if (!phoneNumber.startsWith('+')) {
                logger.warn(`Phone number ${phoneNumber} not in E.164 format`);
            }

            // Use Dialogflow CX to manage the conversation
            // In production, this integrates with Dialogflow CX Telephony Gateway
            // or a CCAI (Contact Center AI) integration
            const queryResult = await dialogflowConfig.detectIntent(
                sessionId,
                `Initiate delivery call to ${customer.name} at ${phoneNumber}`,
                'en'
            );

            // Log the call in BigQuery
            const callLog = await bigqueryService.insertCallLog({
                customerId: customer.id || null,
                customerName: customer.name,
                phoneNumber: phoneNumber,
                status: 'initiated',
                sessionId,
                batchId
            });

            logger.info(`✅ Call initiated for ${customer.name} at ${phoneNumber}`, {
                sessionId,
                intent: queryResult?.intent?.displayName
            });

            return {
                success: true,
                sessionId,
                callLogId: callLog.id
            };
        } catch (error) {
            logger.error(`❌ Call failed for ${customer.name}:`, error);
            
            // Log failed call
            await bigqueryService.insertCallLog({
                customerName: customer.name,
                phoneNumber: String(customer.mobile_number),
                status: 'failed',
                sessionId,
                batchId
            });

            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Process a Dialogflow CX webhook fulfillment request
     * Replaces: /voice/<row_index> and /recording/<row_index> routes in delivery_call.py
     */
    async handleWebhook(webhookRequest) {
        const sessionId = webhookRequest.sessionInfo?.session;
        const tag = webhookRequest.fulfillmentInfo?.tag;
        const parameters = webhookRequest.sessionInfo?.parameters || {};

        logger.info('Dialogflow webhook received', { sessionId, tag, parameters });

        let responseText = '';
        let sessionParams = {};

        switch (tag) {
            case 'greeting':
                responseText = 'Hello, I am calling on behalf of Predelix. We are delivering your courier today. At what time will you be available? Please state your preferred time or any delivery instructions.';
                break;

            case 'capture_time':
                const preferredTime = parameters.time_slot || parameters.time;
                sessionParams.preferred_time = preferredTime;
                responseText = `Thank you. I've noted your preferred time as ${preferredTime}. Do you have any specific delivery instructions?`;
                break;

            case 'capture_instructions':
                const instructions = parameters.delivery_instructions || parameters.instructions;
                sessionParams.delivery_instructions = instructions;
                
                // Update call log in BigQuery
                if (sessionId) {
                    await bigqueryService.insertCallLog({
                        customerName: parameters.customer_name || 'Unknown',
                        phoneNumber: parameters.phone_number || '',
                        status: 'completed',
                        preferredTime: sessionParams.preferred_time || parameters.preferred_time,
                        deliveryInstructions: instructions,
                        sessionId
                    });
                }
                
                responseText = 'Thank you. Your response has been recorded. Goodbye!';
                break;

            case 'fallback':
                responseText = 'I\'m sorry, I didn\'t quite catch that. Could you please repeat your preferred delivery time?';
                break;

            default:
                responseText = 'Thank you for your response. Goodbye!';
        }

        return {
            fulfillmentResponse: {
                messages: [{
                    text: { text: [responseText] }
                }]
            },
            sessionInfo: {
                parameters: sessionParams
            }
        };
    },

    /**
     * Transcribe a call recording using Speech-to-Text
     * Replaces: SpeechRecognition in delivery_call.py
     */
    async transcribeRecording(audioUri) {
        try {
            const result = await speechConfig.transcribeFromGCS(audioUri, {
                encoding: 'LINEAR16',
                sampleRate: 8000,
                languageCode: 'en-US'
            });

            logger.info('Recording transcribed', {
                audioUri,
                transcriptionLength: result.transcription.length,
                confidence: result.confidence
            });

            return result;
        } catch (error) {
            logger.error('Transcription failed:', { audioUri, error: error.message });
            return {
                transcription: '[Transcription failed]',
                confidence: 0,
                error: error.message
            };
        }
    },

    /**
     * Retry failed calls from a batch
     * Replaces: retry_missed_calls.py
     */
    async retryFailedCalls(batchId) {
        // Query BigQuery for failed calls in this batch
        const failedCalls = await bigqueryService.getCallLogs(batchId);
        const toRetry = failedCalls.filter(call => 
            call.call_status === 'failed' || call.call_status === 'no_answer'
        );

        if (toRetry.length === 0) {
            return { message: 'No failed calls to retry', retried: 0 };
        }

        const customers = toRetry.map(call => ({
            name: call.customer_name,
            mobile_number: call.phone_number
        }));

        const results = await this.initiateDeliveryCalls(customers, `${batchId}-retry`);
        return results;
    },

    /**
     * Get call results for dashboard display
     * Replaces: /api/results in delivery_call.py
     */
    async getCallResults(batchId = null) {
        return bigqueryService.getCallLogs(batchId);
    }
};

module.exports = dialogflowService;
