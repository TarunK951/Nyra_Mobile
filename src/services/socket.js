/**
 * Socket.IO singleton — connects to wss://server.nyraai.io
 * Tries /socket.io path first (default), falls back gracefully.
 *
 * Usage:
 *   import socketService from '../services/socket';
 *   socketService.connect(token);
 *   socketService.on('transcript:line', cb);
 */
import { io } from 'socket.io-client';

const BASE_URL = 'https://server.nyraai.io';

let socket = null;
let connectingToken = null;

const socketService = {

    connect(token) {
        // Don't reconnect if already connected with same token
        if (socket?.connected && connectingToken === token) return socket;

        // Clean up old socket if token changed
        if (socket && connectingToken !== token) {
            socket.disconnect();
            socket = null;
        }

        // Already in progress
        if (socket && !socket.connected) return socket;

        connectingToken = token;

        socket = io(BASE_URL, {
            // Omitting 'path' uses the default /socket.io path
            // which is what most Socket.IO servers expect
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 10000,
            reconnectionAttempts: 5,
            timeout: 20000,
            forceNew: false,
        });

        socket.on('connect', () =>
            console.log('[Socket] ✓ connected id=', socket.id)
        );
        socket.on('connect_error', (e) =>
            console.warn('[Socket] connect_error:', e.message)
        );
        socket.on('disconnect', (reason) =>
            console.log('[Socket] disconnected:', reason)
        );
        socket.on('error', (e) =>
            console.warn('[Socket] error:', e)
        );

        return socket;
    },

    disconnect() {
        if (socket) {
            socket.disconnect();
            socket = null;
            connectingToken = null;
        }
    },

    get instance() { return socket; },
    get isConnected() { return socket?.connected ?? false; },

    on(event, cb) { socket?.on(event, cb); },
    off(event, cb) { socket?.off(event, cb); },
    emit(event, d) { if (socket?.connected) socket.emit(event, d); },

    // ── Convenience helpers ─────────────────────────────────────────────────
    subscribeTranscript(sessionId) {
        if (socket?.connected) socket.emit('subscribe:transcript', { sessionId });
    },
    unsubscribeTranscript(sessionId) {
        if (socket?.connected) socket.emit('unsubscribe:transcript', { sessionId });
    },
    subscribeHospital(hospitalId) {
        if (socket?.connected) socket.emit('subscribe:hospital', { hospitalId });
    },
    unsubscribeHospital(hospitalId) {
        if (socket?.connected) socket.emit('unsubscribe:hospital', { hospitalId });
    },
};

export default socketService;
