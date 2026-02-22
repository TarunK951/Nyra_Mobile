import React, { useState } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity,
    ActivityIndicator, KeyboardAvoidingView, Platform,
    Image, StatusBar, Dimensions
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { Mail, Lock, ChevronRight, Sparkles, ArrowRight } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const { colors, themeMode } = useTheme();

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please enter your credentials');
            return;
        }

        setLoading(true);
        setError('');

        const result = await login({ email, password });

        if (!result.success) {
            setError(result.error);
        }
        setLoading(false);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.inner}
            >
                {/* Branding Section */}
                <View style={styles.header}>
                    <View style={[styles.logoBox, { backgroundColor: colors.primary }]}>
                        <Sparkles size={32} color="#fff" strokeWidth={2.5} />
                    </View>
                    <Text style={[styles.title, { color: colors.foreground }]}>NyraAI</Text>
                    <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                        Smart Clinic Management
                    </Text>
                </View>

                {/* Form Section */}
                <View style={styles.form}>
                    {error ? (
                        <View style={[styles.errorBox, { backgroundColor: '#fee2e2' }]}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.mutedForeground }]}>Email or Phone</Text>
                        <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                            <Mail size={18} color={colors.primary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.foreground }]}
                                placeholder="name@clinic.com"
                                placeholderTextColor={colors.mutedForeground}
                                value={email}
                                onChangeText={(val) => { setEmail(val); setError(''); }}
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.mutedForeground }]}>Password</Text>
                        <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                            <Lock size={18} color={colors.primary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.foreground }]}
                                placeholder="••••••••"
                                placeholderTextColor={colors.mutedForeground}
                                value={password}
                                onChangeText={(val) => { setPassword(val); setError(''); }}
                                secureTextEntry
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.loginBtn, { backgroundColor: colors.primary }]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <View style={styles.btnContent}>
                                <Text style={styles.loginBtnText}>Sign In to Dashboard</Text>
                                <ArrowRight size={20} color="#fff" />
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.forgotBtn}>
                        <Text style={[styles.forgotText, { color: colors.primary }]}>Difficulty signing in? Contact Admin</Text>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
                        Protecting your healthcare data with enterprise grade security.
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    inner: { flex: 1, paddingHorizontal: 32, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 48 },
    logoBox: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 16, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
    title: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
    subtitle: { fontSize: 15, fontWeight: '500', marginTop: 4 },
    form: { width: '100%' },
    errorBox: { padding: 12, borderRadius: 12, marginBottom: 20, alignItems: 'center' },
    errorText: { color: '#b91c1c', fontSize: 13, fontWeight: '600' },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 16, height: 56 },
    inputIcon: { marginRight: 12, opacity: 0.8 },
    input: { flex: 1, fontSize: 16, fontWeight: '500' },
    loginBtn: { borderRadius: 16, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: 12, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
    btnContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    forgotBtn: { marginTop: 24, alignItems: 'center' },
    forgotText: { fontSize: 14, fontWeight: '600' },
    footer: { position: 'absolute', bottom: 40, left: 32, right: 32, alignItems: 'center' },
    footerText: { fontSize: 12, textAlign: 'center', opacity: 0.7, lineHeight: 18 },
});

export default LoginScreen;
