"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socket = void 0;
const Kontororu_js_1 = require("src/Kontororu.js");
const hostname = process.env.NEXT_PUBLIC_WS_HOST;
const port = process.env.NEXT_PUBLIC_WS_PORT;
const path = process.env.NEXT_PUBLIC_WS_PATH;
const debug = false;
class Socket extends Kontororu_js_1.Kontororu {
    constructor() {
        super();
        this.connection_state = 'connected';
        this.protocol = (typeof window !== 'undefined' && window.location && window.location.protocol && window.location.protocol === 'https:' ? 'wss:' : 'ws:');
        this.url = `${this.protocol}//${hostname}${port ? `:${port}` : ''}/${path}`;
        this.message_queue = [];
        // Reconnection logic
        this.reconnect_attempts = 0;
        this.should_reconnect = true;
        // Heartbeat / Sleep Detection Logic
        this.last_heartbeat_timestamp = Date.now();
        // How often the server pings THIS specific client (5 seconds)
        this.HEARTBEAT_INTERVAL_MS = 5000;
        // Calculate threshold: 2 missed beats + 1 second of network jitter buffer
        this.SUSPENSION_THRESHOLD_MS = (this.HEARTBEAT_INTERVAL_MS * 2) + 1000;
        // 3 Heartbeats + 1s buffer = 16 seconds
        this.DISCONNECT_THRESHOLD_MS = (this.HEARTBEAT_INTERVAL_MS * 3) + 1000;
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', (event) => {
                if (document.visibilityState === 'visible') {
                    this.check_staleness('tab_switch');
                }
            });
        }
        if (typeof window !== 'undefined') {
            const offlineChecker = () => {
                const check = 3;
                let checked = 1;
                const checker = () => {
                    if (checked > check) {
                        return;
                    }
                    setTimeout(() => {
                        this.check_staleness('offline');
                        checked++;
                        checker();
                    }, (this.HEARTBEAT_INTERVAL_MS) + 500);
                };
                checker();
            };
            window.addEventListener('online', () => {
                window.removeEventListener('offline', offlineChecker);
            });
            window.addEventListener('offline', offlineChecker);
        }
    }
    connect(session_id) {
        if (!session_id) {
            console.warn('session_id required to open ws');
            return;
        }
        if (this.ws &&
            (this.ws.readyState === WebSocket.OPEN ||
                this.ws.readyState === WebSocket.CONNECTING)) {
            return;
        }
        this.ws = new WebSocket(this.url);
        if (debug)
            console.log('new websocket');
        this.session_id = session_id;
        // Reset heartbeat timer on new connection
        this.last_heartbeat_timestamp = Date.now();
        this.ws.addEventListener('open', (event) => this.handle_open(event));
        this.ws.addEventListener('message', (event) => this.handle_message(event));
        this.ws.addEventListener('close', (event) => this.handle_close(event));
        this.ws.addEventListener('error', (event) => this.handle_error(event));
    }
    /**
     * Send message if the websocket is open,
     * otherwise add it to the message queue
     */
    message({ type, table, id }) {
        const payload = { type, table, id };
        if (this.ws &&
            this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(payload));
        }
        else {
            this.message_queue.push(payload);
        }
    }
    disconnect() {
        if (debug)
            console.log('websocket disconnect()');
        this.update_connection_state('disconnected');
        // if we are manually disconnecting we do not want an auto reconnect
        this.should_reconnect = false;
        this.ws?.close();
        this.ws = undefined;
        if (this.reconnect_timeout) {
            clearTimeout(this.reconnect_timeout);
        }
    }
    /**
     * Update the connection state, dispatch an event if it actually changed.
     */
    update_connection_state(new_connection_state) {
        const old_connection_state = this.connection_state;
        if (this.connection_state !== new_connection_state) {
            if (debug)
                console.log('update_connection_state', new_connection_state);
            this.connection_state = new_connection_state;
            if (debug)
                console.warn(`[Socket] State changed to: ${this.connection_state}`);
            this.dispatchEvent(new CustomEvent('connection_state', { detail: this.connection_state }));
            if ((new_connection_state === 'connected' || new_connection_state === 'reconnected') &&
                (old_connection_state === 'stale' || old_connection_state === 'disconnected')) {
                this.dispatchEvent(new CustomEvent('refresh', { bubbles: true }));
            }
        }
    }
    /**
     * Helper to determine if we need to fetch missing data
     */
    check_staleness(source) {
        const now = Date.now();
        const time_since_last = now - this.last_heartbeat_timestamp;
        if (debug)
            console.log('websocket check_staleness()', source, time_since_last);
        if (!this.ws ||
            this.ws.readyState === this.ws.CLOSED ||
            time_since_last > this.DISCONNECT_THRESHOLD_MS) {
            this.update_connection_state('disconnected');
            return;
        }
        // If gap is larger than threshold, we missed messages
        if (time_since_last > this.SUSPENSION_THRESHOLD_MS) {
            this.update_connection_state('stale');
        }
        else {
            this.update_connection_state('connected');
        }
    }
    handle_open(event) {
        if (debug)
            console.log('websocket handle open()');
        if (this.ws &&
            this.ws.readyState === this.ws.OPEN) {
            this.update_connection_state('connected');
        }
        // clear reconnect timeout if we connected
        if (this.reconnect_timeout) {
            clearTimeout(this.reconnect_timeout);
        }
        // If we are reconnecting (attempts > 0), we definitely missed data.
        if (this.reconnect_attempts > 0) {
            if (debug)
                console.log('[Socket] Reconnected. Triggering refresh.');
            this.dispatchEvent(new CustomEvent('refresh', { bubbles: true }));
        }
        // reset the reconnect attempts
        this.reconnect_attempts = 0;
        this.ws?.send(JSON.stringify({ type: 'session', table: 'session', id: this.session_id }));
        while (this.message_queue.length > 0) {
            const queuedMsg = this.message_queue.shift();
            this.ws?.send(JSON.stringify(queuedMsg));
        }
    }
    handle_message(event) {
        if (debug)
            console.log('websocket handle message()');
        try {
            const data = JSON.parse(event.data);
            if (debug)
                console.log('data', data);
            // HEARTBEAT CHECK: Intercept heartbeat messages
            if (data.type === 'heartbeat') {
                this.check_staleness('heartbeat');
                this.last_heartbeat_timestamp = Date.now();
                return; // Do not bubble 'heartbeat' to the UI
            }
            // todo not sure I like this
            const messageEvent = new CustomEvent('message', {
                detail: JSON.parse(event.data),
                bubbles: true,
            });
            this.dispatchEvent(messageEvent);
        }
        catch (e) {
            const messageEvent = new CustomEvent('message', {
                detail: event.data,
                bubbles: true,
            });
            this.dispatchEvent(messageEvent);
        }
    }
    handle_close(event) {
        if (debug)
            console.log('websocket handle close()');
        this.update_connection_state('disconnected');
        if (this.should_reconnect) {
            const delay = Math.min(1000 * Math.pow(2, this.reconnect_attempts), 30000);
            if (debug)
                console.log(`Connection lost. Retrying in ${delay}ms... (Attempt ${this.reconnect_attempts + 1})`);
            this.reconnect_timeout = setTimeout(() => {
                this.reconnect_attempts++;
                if (this.session_id) {
                    this.connect(this.session_id);
                }
            }, delay);
        }
        this.ws = undefined;
    }
    handle_error(event) {
        if (debug)
            console.log('websocket handle error()');
        this.update_connection_state('disconnected');
        console.error('WebSocket Error:', event);
        this.ws?.close();
    }
}
exports.socket = new Socket();
