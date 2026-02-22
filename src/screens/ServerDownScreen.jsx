import React, { useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Animated, Platform, StatusBar,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { ServerCrash, RefreshCw, Clock } from 'lucide-react-native';

const ServerDownScreen = ({ onRetry }) => {
    const { colors } = useTheme();
    const spin = useRef(new Animated.Value(0)).current;
    const shake = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        // Slow spin of the icon
        Animated.loop(
            Animated.timing(spin, {
                toValue: 1, duration: 8000,
                useNativeDriver: true,
            })
        ).start();

        // Shake every 4 seconds
        const doShake = () => {
            Animated.sequence([
                Animated.timing(shake, { toValue: 8, duration: 60, useNativeDriver: true }),
                Animated.timing(shake, { toValue: -8, duration: 60, useNativeDriver: true }),
                Animated.timing(shake, { toValue: 6, duration: 60, useNativeDriver: true }),
                Animated.timing(shake, { toValue: -6, duration: 60, useNativeDriver: true }),
                Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
            ]).start(() => setTimeout(doShake, 4000));
        };
        doShake();
    }, []);

    const spinInterp = spin.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />

            {/* Decorative grid */}
            <View style={[styles.grid, { pointerEvents: 'none' }]}>
                {Array.from({ length: 6 }).map((_, i) => (
                    <View key={i} style={[styles.gridLine, { backgroundColor: colors.cardBorder + '60' }]} />
                ))}
            </View>

            {/* Icon */}
            <Animated.View style={[styles.iconWrap, { transform: [{ translateX: shake }] }]}>
                <View style={[styles.glowCircle, { backgroundColor: '#ef444415' }]}>
                    <ServerCrash size={56} color="#ef4444" strokeWidth={1.5} />
                </View>
            </Animated.View>

            {/* Badge */}
            <View style={[styles.badge, { backgroundColor: '#ef444418', borderColor: '#ef444430' }]}>
                <View style={styles.badgeDot} />
                <Text style={styles.badgeTxt}>Service Unavailable</Text>
            </View>

            <Text style={[styles.title, { color: colors.foreground }]}>
                Server Unreachable
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                The NyraAI backend is currently unavailable.{'\n'}
                Our team has been notified. Please try again shortly.
            </Text>

            {/* Status items */}
            <View style={[styles.statusBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                {[
                    { label: 'Nyra Backend', ok: false },
                    { label: 'Internet', ok: true },
                    { label: 'App', ok: true },
                ].map((row) => (
                    <View key={row.label} style={styles.statusRow}>
                        <View style={[styles.indicator, { backgroundColor: row.ok ? '#10b981' : '#ef4444' }]} />
                        <Text style={[styles.statusLbl, { color: colors.foreground }]}>{row.label}</Text>
                        <Text style={[styles.statusVal, { color: row.ok ? '#10b981' : '#ef4444' }]}>
                            {row.ok ? 'Operational' : 'Down'}
                        </Text>
                    </View>
                ))}
            </View>

            <TouchableOpacity
                onPress={onRetry}
                activeOpacity={0.8}
                style={[styles.btn, { backgroundColor: colors.primary }]}
            >
                <RefreshCw size={18} color="#fff" />
                <Text style={styles.btnTxt}>Retry Connection</Text>
            </TouchableOpacity>

            <View style={styles.timerHint}>
                <Clock size={13} color={colors.mutedForeground} />
                <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                    Auto-retrying every 30 seconds
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 28,
        paddingTop: Platform.OS === 'ios' ? 44 : 0,
        overflow: 'hidden',
    },
    grid: {
        position: 'absolute', top: 0, left: 0, right: 0, height: 200,
        flexDirection: 'row', justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    gridLine: { width: 1, height: '100%' },

    iconWrap: { marginBottom: 16 },
    glowCircle: {
        width: 120, height: 120, borderRadius: 60,
        justifyContent: 'center', alignItems: 'center',
    },

    badge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        borderWidth: 1, borderRadius: 20,
        paddingHorizontal: 12, paddingVertical: 4,
        marginBottom: 16,
    },
    badgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#ef4444' },
    badgeTxt: { color: '#ef4444', fontSize: 12, fontWeight: '700' },

    title: { fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 10, letterSpacing: -0.3 },
    subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 23, marginBottom: 24 },

    statusBox: {
        width: '100%', borderRadius: 16, borderWidth: 1,
        padding: 16, marginBottom: 28, gap: 12,
    },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    indicator: { width: 8, height: 8, borderRadius: 4 },
    statusLbl: { flex: 1, fontSize: 14, fontWeight: '500' },
    statusVal: { fontSize: 13, fontWeight: '600' },

    btn: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 32, paddingVertical: 14,
        borderRadius: 16, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
    },
    btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },

    timerHint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    hint: { fontSize: 13 },
});

export default ServerDownScreen;
