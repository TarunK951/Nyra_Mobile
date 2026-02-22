import React, { useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Animated, Platform, StatusBar,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { WifiOff, RefreshCw } from 'lucide-react-native';
import { USE_NATIVE } from '../utils/animations';

const OfflineScreen = ({ onRetry }) => {
    const { colors } = useTheme();
    const pulse = useRef(new Animated.Value(0.85)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: USE_NATIVE }),
                Animated.timing(pulse, { toValue: 0.85, duration: 1200, useNativeDriver: USE_NATIVE }),
            ])
        ).start();
    }, []);

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />

            {/* Ripple rings */}
            <View style={styles.rippleWrap}>
                <View style={[styles.ring, styles.ring3, { borderColor: '#6366f120' }]} />
                <View style={[styles.ring, styles.ring2, { borderColor: '#6366f130' }]} />
                <View style={[styles.ring, styles.ring1, { borderColor: '#6366f140' }]} />

                {/* Centre icon */}
                <Animated.View style={[styles.iconCircle, { backgroundColor: '#6366f115', transform: [{ scale: pulse }] }]}>
                    <WifiOff size={48} color="#6366f1" strokeWidth={1.5} />
                </Animated.View>
            </View>

            <Text style={[styles.title, { color: colors.foreground }]}>No Internet Connection</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                You're offline. Check your Wi-Fi or mobile data and try again.
            </Text>

            <TouchableOpacity
                onPress={onRetry}
                activeOpacity={0.8}
                style={[styles.btn, { backgroundColor: '#6366f1' }]}
            >
                <RefreshCw size={18} color="#fff" />
                <Text style={styles.btnTxt}>Try Again</Text>
            </TouchableOpacity>

            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                Some features may be available once you reconnect.
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingTop: Platform.OS === 'ios' ? 44 : 0,
    },
    rippleWrap: {
        width: 240, height: 240,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 32,
    },
    ring: {
        position: 'absolute', borderRadius: 999, borderWidth: 1.5,
    },
    ring1: { width: 140, height: 140 },
    ring2: { width: 180, height: 180 },
    ring3: { width: 220, height: 220 },
    iconCircle: {
        width: 100, height: 100, borderRadius: 50,
        justifyContent: 'center', alignItems: 'center',
    },
    title: {
        fontSize: 24, fontWeight: '800',
        textAlign: 'center', marginBottom: 12,
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: 15, textAlign: 'center',
        lineHeight: 22, marginBottom: 32,
    },
    btn: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 32, paddingVertical: 14,
        borderRadius: 16, marginBottom: 20,
        shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
    },
    btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
    hint: { fontSize: 13, textAlign: 'center' },
});

export default OfflineScreen;
