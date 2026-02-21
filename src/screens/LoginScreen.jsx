import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Image,
    SafeAreaView,
    StatusBar
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { Mail, Lock, Phone, ChevronRight } from 'lucide-react-native';

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const { colors, themeMode } = useTheme();

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please fill in all fields');
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
                <View style={styles.logoContainer}>
                    <View style={[styles.logoWrapper, { backgroundColor: colors.accentSoft }]}>
                        <Image
                            source={{ uri: 'https://nyraai-main-website.vercel.app/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.c1949d52.png&w=64&q=75' }}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={[styles.title, { color: colors.foreground }]}>NYRAAI</Text>
                    <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Clinic Management System</Text>
                </View>

                <View style={styles.form}>
                    {error ? (
                        <View style={[styles.errorBox, { backgroundColor: colors.destructive + '15' }]}>
                            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
                        </View>
                    ) : null}

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.foreground }]}>Email or Phone</Text>
                        <View style={[styles.inputWrapper, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                            <Mail size={18} color={colors.mutedForeground} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.foreground }]}
                                placeholder="Enter your email"
                                placeholderTextColor={colors.mutedForeground}
                                value={email}
                                onChangeText={(val) => { setEmail(val); setError(''); }}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
                        <View style={[styles.inputWrapper, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                            <Lock size={18} color={colors.mutedForeground} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.foreground }]}
                                placeholder="Enter your password"
                                placeholderTextColor={colors.mutedForeground}
                                value={password}
                                onChangeText={(val) => { setPassword(val); setError(''); }}
                                secureTextEntry
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.loginButton, { backgroundColor: colors.primary }]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <View style={styles.buttonContent}>
                                <Text style={styles.loginButtonText}>Login to Dashboard</Text>
                                <ChevronRight size={18} color="#fff" />
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.forgotPassword}>
                        <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>Forgot Password?</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
                        By logging in, you agree to our Terms and Privacy Policy.
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    inner: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoWrapper: {
        width: 64,
        height: 64,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
            },
            android: {
                elevation: 4,
            },
            web: {
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            }
        }),
    },
    logo: {
        width: 40,
        height: 40,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 14,
        marginTop: 6,
    },
    form: {
        width: '100%',
    },
    errorBox: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        alignItems: 'center',
    },
    errorText: {
        fontSize: 14,
        fontWeight: '500',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 52,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    loginButton: {
        borderRadius: 12,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
            },
            android: {
                elevation: 5,
            },
            web: {
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            }
        }),
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginRight: 8,
    },
    forgotPassword: {
        marginTop: 20,
        alignItems: 'center',
    },
    forgotPasswordText: {
        fontSize: 14,
        fontWeight: '600',
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        left: 30,
        right: 30,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        textAlign: 'center',
    },
});

export default LoginScreen;
