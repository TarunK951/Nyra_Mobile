/**
 * NetworkGate — wraps the app and shows error screens when offline or server is down.
 * Uses our custom useNetworkStatus hook (no native modules needed).
 *
 * The gate is PASSIVE by default: it doesn't block the app on initial load to
 * avoid UI flash. It only shows error screens once a check has definitively failed.
 */
import React, { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import OfflineScreen from '../screens/OfflineScreen';
import ServerDownScreen from '../screens/ServerDownScreen';

const NetworkGate = ({ children }) => {
    const { isServerReachable, recheck } = useNetworkStatus();
    const [retryKey, setRetryKey] = useState(0);

    const retry = useCallback(() => {
        setRetryKey(k => k + 1);
        recheck();
    }, [recheck]);

    // Server is definitively down (not just "still checking")
    if (isServerReachable === false) {
        return <ServerDownScreen key={`sd-${retryKey}`} onRetry={retry} />;
    }

    return <View style={styles.fill}>{children}</View>;
};

const styles = StyleSheet.create({ fill: { flex: 1 } });

export default NetworkGate;
