/**
 * Real-Time WebSocket and SSE Streaming Service
 * Connects to Spring Boot STOMP endpoint with automatic fallback to Server-Sent Events (SSE)
 */
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

class WebSocketService {
    constructor() {
        this.stompClient = null;
        this.eventSource = null;
        this.callbacks = new Set();
        this.isConnected = false;
        this.reconnectTimer = null;
    }

    connect(apiBase = 'http://localhost:8080') {
        this.apiBase = apiBase;
        this.tryStompConnection();
    }

    tryStompConnection() {
        try {
            const socket = new SockJS(`${this.apiBase}/ws`);
            this.stompClient = Stomp.over(socket);
            
            // Disable noisy debug logs in console
            this.stompClient.debug = () => {};

            this.stompClient.connect({}, () => {
                this.isConnected = true;
                console.log('[WebSocket] Connected via STOMP /ws');

                this.stompClient.subscribe('/topic/reports', (message) => {
                    try {
                        const payload = JSON.parse(message.body);
                        this.notify(payload);
                    } catch (e) {
                        console.warn('[WebSocket] Malformed STOMP message:', e);
                    }
                });
            }, (error) => {
                console.warn('[WebSocket] STOMP connection failed, switching to SSE fallback:', error);
                this.isConnected = false;
                this.startSseFallback();
            });
        } catch (e) {
            console.warn('[WebSocket] Exception initializing STOMP, using SSE fallback:', e);
            this.startSseFallback();
        }
    }

    startSseFallback() {
        if (this.eventSource) return;

        try {
            const sseUrl = `${this.apiBase}/api/reports/stream`;
            this.eventSource = new EventSource(sseUrl);

            this.eventSource.onopen = () => {
                this.isConnected = true;
                console.log('[WebSocket] Connected via SSE /api/reports/stream');
            };

            this.eventSource.addEventListener('report', (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.notify(data);
                } catch (e) {
                    console.warn('[WebSocket] SSE Parse error:', e);
                }
            });

            this.eventSource.onerror = (err) => {
                console.warn('[WebSocket] SSE error:', err);
                this.isConnected = false;
            };
        } catch (e) {
            console.warn('[WebSocket] SSE not supported or blocked:', e);
        }
    }

    subscribe(callback) {
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    }

    notify(payload) {
        this.callbacks.forEach(cb => {
            try {
                cb(payload);
            } catch (err) {
                console.error('[WebSocket] Callback execution error:', err);
            }
        });
    }

    disconnect() {
        if (this.stompClient && this.stompClient.connected) {
            this.stompClient.disconnect();
        }
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        this.isConnected = false;
    }
}

export const websocketService = new WebSocketService();
