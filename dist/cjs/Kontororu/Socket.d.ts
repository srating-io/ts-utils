import { Kontororu } from '@/Kontororu.js';
type SocketMessage = {
    type: 'subscribe' | 'unsubscribe' | 'data' | 'heartbeat';
    table: string;
    id: string;
};
declare class Socket extends Kontororu {
    private ws?;
    private connection_state;
    private protocol;
    private url;
    private session_id?;
    private message_queue;
    private reconnect_attempts;
    private should_reconnect;
    private reconnect_timeout?;
    private last_heartbeat_timestamp;
    private readonly HEARTBEAT_INTERVAL_MS;
    private readonly SUSPENSION_THRESHOLD_MS;
    private readonly DISCONNECT_THRESHOLD_MS;
    constructor();
    connect(session_id: string): void;
    /**
     * Send message if the websocket is open,
     * otherwise add it to the message queue
     */
    message({ type, table, id }: SocketMessage): void;
    disconnect(): void;
    /**
     * Update the connection state, dispatch an event if it actually changed.
     */
    private update_connection_state;
    /**
     * Helper to determine if we need to fetch missing data
     */
    private check_staleness;
    private handle_open;
    private handle_message;
    private handle_close;
    private handle_error;
}
export declare const socket: Socket;
export {};
//# sourceMappingURL=Socket.d.ts.map