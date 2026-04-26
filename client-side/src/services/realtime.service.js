/**
 * Predelix — Realtime Service (Frontend)
 * WebSocket client for Pub/Sub real-time events
 * NEW — enables live dashboard updates via Pub/Sub → WebSocket bridge
 */
import config from '../config';

class RealtimeService {
    constructor() {
        this.ws = null;
        this.listeners = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.isConnecting = false;
    }

    /**
     * Connect to the WebSocket endpoint
     */
    connect(userId = null) {
        if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
            return;
        }

        this.isConnecting = true;
        const wsUrl = config.wsUrl || config.apiUrl.replace('https://', 'wss://').replace('http://', 'ws://');
        const url = `${wsUrl}/events/ws?userId=${userId || 'anonymous'}`;

        try {
            this.ws = new WebSocket(url);

            this.ws.onopen = () => {
                console.log('🔌 WebSocket connected to Predelix events');
                this.reconnectAttempts = 0;
                this.isConnecting = false;
                this._notifyListeners('CONNECTION_ESTABLISHED', { connected: true });
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this._notifyListeners(message.type, message.data);
                } catch (err) {
                    console.warn('Invalid WebSocket message:', event.data);
                }
            };

            this.ws.onclose = (event) => {
                console.log('🔌 WebSocket disconnected', event.code, event.reason);
                this.isConnecting = false;
                this._notifyListeners('CONNECTION_CLOSED', { code: event.code });
                this._attemptReconnect(userId);
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.isConnecting = false;
            };
        } catch (err) {
            console.error('WebSocket connection failed:', err);
            this.isConnecting = false;
        }
    }

    /**
     * Subscribe to a specific event type
     */
    on(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        this.listeners.get(eventType).add(callback);

        // Return unsubscribe function
        return () => {
            this.listeners.get(eventType)?.delete(callback);
        };
    }

    /**
     * Unsubscribe from an event type
     */
    off(eventType, callback) {
        this.listeners.get(eventType)?.delete(callback);
    }

    /**
     * Send a message to the server
     */
    send(type, data = {}) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, data }));
        }
    }

    /**
     * Disconnect WebSocket
     */
    disconnect() {
        this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.listeners.clear();
    }

    /**
     * Check if connected
     */
    get isConnected() {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    // ── Private Methods ─────────────────────

    _notifyListeners(eventType, data) {
        // Notify specific event listeners
        this.listeners.get(eventType)?.forEach(callback => {
            try {
                callback(data);
            } catch (err) {
                console.error(`Error in listener for ${eventType}:`, err);
            }
        });

        // Notify wildcard listeners
        this.listeners.get('*')?.forEach(callback => {
            try {
                callback({ type: eventType, data });
            } catch (err) {
                console.error('Error in wildcard listener:', err);
            }
        });
    }

    _attemptReconnect(userId) {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.warn('Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
            this.connect(userId);
        }, delay);
    }
}

// Singleton instance
export const realtimeService = new RealtimeService();
export default realtimeService;
