// ─── iOS 26 Liquid Glass Login Screen ───────────────────────────
import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity,
    ActivityIndicator, KeyboardAvoidingView, Platform,
    StatusBar, Animated, Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import LiquidButton from '../components/LiquidButton';
import LiquidGlass from '../components/LiquidGlass';
import { Mail, Lock, ArrowRight, Sparkles, UserCheck } from 'lucide-react-native';
import { useFadeIn, useSlideUp, useStagger, useScalePressAnim, SPRING } from '../utils/animations';

const { width: W, height: H } = Dimensions.get('window');

// ── Floating glass orb decoration ────────────────────────────────
const Orb = ({ x, y, size, color, delay, duration = 6000 }) => {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        const t = setTimeout(() => {
            Animated.loop(Animated.sequence([
                Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
                Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }),
            ])).start();
        }, delay);
        return () => clearTimeout(t);
    }, []);
    const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -30] });
    const scale = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.1, 1] });
    return (
        <Animated.View style={[styles.orb, {
            left: x, top: y, width: size, height: size, borderRadius: size / 2,
            backgroundColor: color, transform: [{ translateY }, { scale }],
            opacity: 0.15,
        }]} />
    );
};

// ── Animated glass input ─────────────────────────────────────────
const GlassInput = ({ icon: Icon, value, onChangeText, placeholder, secureTextEntry, keyboardType, colors, anim }) => {
    const [focused, setFocused] = useState(false);
    const borderAnim = useRef(new Animated.Value(0)).current;

    const onFocus = () => {
        setFocused(true);
        Animated.spring(borderAnim, { toValue: 1, ...SPRING.snappy }).start();
    };
    const onBlur = () => {
        setFocused(false);
        Animated.spring(borderAnim, { toValue: 0, ...SPRING.gentle }).start();
    };

    const borderColor = borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.glass.border, colors.primary],
    });

    return (
        <Animated.View style={anim ? { borderColor, borderWidth: 1.5, borderRadius: 20, marginBottom: 14, opacity: anim.opacity, transform: [{ translateY: anim.translateY }] } : { borderColor, borderWidth: 1.5, borderRadius: 20, marginBottom: 14 }}>
            <LiquidGlass
                intensity={colors.glass.blurStrong}
                tint={colors.glass.tint}
                padding={0}
                style={styles.inputBlur}
                containerStyle={{ borderRadius: 20 }}
            >
                <View style={[styles.inputIcon, { backgroundColor: focused ? colors.primary + '15' : 'transparent' }]}>
                    <Icon size={18} color={focused ? colors.primary : colors.mutedForeground} strokeWidth={2.5} />
                </View>
                <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={colors.mutedForeground}
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    autoCapitalize="none"
                    onFocus={onFocus}
                    onBlur={onBlur}
                />
            </LiquidGlass>
        </Animated.View>
    );
};

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const { colors, themeMode } = useTheme();

    const headerOpacity = useFadeIn(0);
    const staggerAnims = useStagger(5, 100);
    const { scale: btnScale, pressIn, pressOut } = useScalePressAnim();

    const logoRotate = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(
            Animated.timing(logoRotate, { toValue: 1, duration: 30000, useNativeDriver: true })
        ).start();
    }, []);
    const spin = logoRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

    const handleLogin = async () => {
        if (!email || !password) { setError('Please fill in all fields'); return; }
        setLoading(true); setError('');
        const result = await login({ email, password });
        if (!result.success) setError(result.error || 'Login failed');
        setLoading(false);
    };

    // Background gradient orbs — More liquid glass feel
    const orbs = [
        { x: -100, y: -100, size: 300, color: colors.primary, delay: 0 },
        { x: W - 150, y: 150, size: 250, color: '#a855f7', delay: 1000 },
        { x: W / 2 - 150, y: H - 350, size: 300, color: colors.primary, delay: 500 },
        { x: -50, y: H - 150, size: 200, color: '#3b82f6', delay: 2000 },
    ];

    return (
        <View style={[styles.screen, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Floating orb decorations */}
            {orbs.map((o, i) => <Orb key={i} {...o} />)}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.kav}
            >
                {/* Logo / Header */}
                <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
                    <BlurView
                        intensity={40}
                        tint={colors.glass.tint}
                        experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                        style={[styles.logoBox, { borderColor: colors.glass.border }]}
                    >
                        <View style={styles.logoGlow} />
                        <Animated.View style={{ transform: [{ rotate: spin }] }}>
                            <Sparkles size={38} color={colors.primary} strokeWidth={2.5} />
                        </Animated.View>
                    </BlurView>
                    <Text style={[styles.title, { color: colors.foreground }]}>NyraAI</Text>
                    <View style={styles.badgeRow}>
                        <View style={[styles.statusBadge, { backgroundColor: colors.primary + '15' }]}>
                            <UserCheck size={10} color={colors.primary} strokeWidth={3} />
                            <Text style={[styles.statusText, { color: colors.primary }]}>SECURE ACCESS</Text>
                        </View>
                    </View>
                    <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                        Clinical workflow, reimagined for modern doctors.
                    </Text>
                </Animated.View>

                {/* Glass login card */}
                <LiquidGlass
                    intensity={colors.glass.blurStrong}
                    tint={colors.glass.tint}
                    style={{ padding: 30 }}
                    containerStyle={styles.card}
                >
                    <View style={styles.cardGlow} />

                    {error ? (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    <GlassInput
                        icon={Mail}
                        value={email}
                        onChangeText={(v) => { setEmail(v); setError(''); }}
                        placeholder="doctor@clinic.com"
                        colors={colors}
                        anim={staggerAnims[0]}
                    />

                    <GlassInput
                        icon={Lock}
                        value={password}
                        onChangeText={(v) => { setPassword(v); setError(''); }}
                        placeholder="••••••••"
                        secureTextEntry
                        colors={colors}
                        anim={staggerAnims[1]}
                    />

                    {/* Login button */}
                    <LiquidButton
                        variant="primary"
                        onPress={handleLogin}
                        disabled={loading}
                        style={{ marginTop: 10 }}
                    >
                        {loading
                            ? <ActivityIndicator color={colors.background} />
                            : <>
                                <Text style={[styles.loginBtnText, { color: colors.background }]}>Sign Into Nyra</Text>
                                <ArrowRight size={20} color={colors.background} strokeWidth={3} style={{ marginLeft: 10 }} />
                            </>
                        }
                    </LiquidButton>

                    <Animated.View style={staggerAnims[3] ? { opacity: staggerAnims[3].opacity, transform: [{ translateY: staggerAnims[3].translateY }] } : {}}>
                        <TouchableOpacity style={styles.forgotBtn}>
                            <Text style={[styles.forgotText, { color: colors.primary }]}>
                                Need help? Contact your Admin
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </LiquidGlass>

                {/* Footer */}
                <Animated.View style={[styles.footer, { opacity: headerOpacity }]}>
                    <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
                        Enterprise-grade security for healthcare data
                    </Text>
                </Animated.View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, overflow: 'hidden' },
    kav: { flex: 1, paddingHorizontal: 28, justifyContent: 'center', gap: 32 },
    orb: { position: 'absolute', opacity: 0.4 },
    header: { alignItems: 'center', gap: 12, marginBottom: 4 },
    logoBox: {
        width: 84, height: 84, borderRadius: 30,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1.5, overflow: 'hidden',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 24 },
            android: { elevation: 12 },
        }),
    },
    logoGlow: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.15)', blurRadius: 20 },
    title: { fontSize: 44, fontWeight: '900', letterSpacing: -2, marginBottom: -4 },
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
    statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    subtitle: { fontSize: 15, fontWeight: '600', textAlign: 'center', maxWidth: '80%', lineHeight: 22 },
    card: {
        borderRadius: 36, borderWidth: 1.5, overflow: 'hidden',
        padding: 30,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.18, shadowRadius: 36 },
            android: { elevation: 12 },
        }),
    },
    cardShimmer: { position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, zIndex: 10, opacity: 0.8 },
    cardGlow: { position: 'absolute', top: -100, left: -100, width: 200, height: 200, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 100 },
    inputBlur: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 60, gap: 14 },
    inputIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    input: { flex: 1, fontSize: 17, fontWeight: '700' },
    errorBox: { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderRadius: 16, padding: 14, marginBottom: 18, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
    errorText: { color: '#ef4444', fontSize: 13, fontWeight: '700' },
    loginBtn: {
        borderRadius: 20, height: 60,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16 },
            android: { elevation: 8 },
        }),
    },
    loginBtnText: { fontSize: 17, fontWeight: '900', letterSpacing: -0.2 },
    forgotBtn: { alignItems: 'center', marginTop: 20 },
    forgotText: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.6 },
    footer: { alignItems: 'center', marginTop: 12 },
    footerText: { fontSize: 12, fontWeight: '700', textAlign: 'center', opacity: 0.4, letterSpacing: 0.5 },
});

export default LoginScreen;
