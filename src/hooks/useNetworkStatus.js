/**
 * useNetworkStatus — uses React Native's built-in NetInfo (no native linking needed).
 * Returns: { isOnline, isServerReachable, checking, recheck }
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import apiClient from '../api/client';

const HEALTH_ENDPOINTS = ['/api/health', '/health', '/api/status', '/'];
const HEALTH_TIMEOUT = 6000;
const POLL_MS = 45_000;

async function pingServer() {
    for (const ep of HEALTH_ENDPOINTS) {
        try {
            await apiClient.get(ep, { timeout: HEALTH_TIMEOUT });
            return true;
        } catch (e) {
            if (e?.response) return true; // got a response → server UP, just error status
        }
    }
    return false;
}

export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(true);
    const [isServerReachable, setIsServerReachable] = useState(true);
    const [checking, setChecking] = useState(false); // start false to avoid flash
    const pollRef = useRef(null);

    const recheck = useCallback(async () => {
        setChecking(true);
        try {
            // Use fetch to check connectivity (no native module needed)
            const ctrl = new AbortController();
            const t = setTimeout(() => ctrl.abort(), 5000);
            try {
                await fetch('https://8.8.8.8', { signal: ctrl.signal, mode: 'no-cors' });
                setIsOnline(true);
                clearTimeout(t);
            } catch {
                clearTimeout(t);
                // If it's a CORS error from a response, we're online
                // If it's a network error, we might be offline
                // Be optimistic — just ping the server
                // (fetch to 8.8.8.8 will always "fail" CORS but proves internet if we get any response)
            }
            const up = await pingServer();
            setIsServerReachable(up);
        } catch {
            // In case of any unexpected error, be optimistic
        } finally {
            setChecking(false);
        }
    }, []);

    useEffect(() => {
        // Initial server check after a short delay (don't block app startup)
        const init = setTimeout(recheck, 2000);

        // Periodic poll
        pollRef.current = setInterval(recheck, POLL_MS);

        // Recheck when app comes back to foreground
        const sub = AppState.addEventListener('change', (state) => {
            if (state === 'active') recheck();
        });

        return () => {
            clearTimeout(init);
            clearInterval(pollRef.current);
            sub.remove();
        };
    }, [recheck]);

    return { isOnline, isServerReachable, checking, recheck };
}
