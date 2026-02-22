// ─── GlassButton — iOS 26 Liquid Glass Button ────────────────────
import React, { useRef, useCallback } from 'react';
import { Animated, TouchableOpacity, Text, View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { USE_NATIVE } from '../utils/animations';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeContext';

const GlassButton = ({
    children,
    label,
    onPress,
    variant = 'primary', // 'primary' | 'ghost' | 'glass' | 'destructive'
    size = 'md',          // 'sm' | 'md' | 'lg'
    loading = false,
    disabled = false,
    icon: Icon,
    iconRight = false,
    style,
}) => {
    const { colors, themeMode } = useTheme();
    const scale = useRef(new Animated.Value(1)).current;

    const pressIn = useCallback(() => {
        Animated.spring(scale, { toValue: 0.96, tension: 300, friction: 22, useNativeDriver: true }).start();
    }, []);

    const pressOut = useCallback(() => {
        Animated.spring(scale, { toValue: 1, tension: 240, friction: 12, useNativeDriver: true }).start();
    }, []);

    const padding = { sm: { px: 14, py: 9 }, md: { px: 20, py: 14 }, lg: { px: 28, py: 17 } }[size];
    const fontSize = { sm: 13, md: 15, lg: 16 }[size];

    const inner = (
        <View style={[styles.inner, { paddingHorizontal: padding.px, paddingVertical: padding.py }]}>
            {loading ? (
                <ActivityIndicator color={variant === 'primary' ? '#fff' : colors.primary} size="small" />
            ) : (
                <>
                    {Icon && !iconRight && <Icon size={fontSize + 1} color={variant === 'primary' ? '#fff' : colors.primary} style={{ marginRight: 8 }} />}
                    <Text style={[
                        styles.label,
                        { fontSize, color: variant === 'primary' ? '#fff' : variant === 'destructive' ? colors.destructive : colors.foreground }
                    ]}>
                        {label || children}
                    </Text>
                    {Icon && iconRight && <Icon size={fontSize + 1} color={variant === 'primary' ? '#fff' : colors.primary} style={{ marginLeft: 8 }} />}
                </>
            )}
        </View>
    );

    return (
        <Animated.View style={[{ transform: [{ scale }] }, style]}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={pressIn}
                onPressOut={pressOut}
                disabled={disabled || loading}
                activeOpacity={1}
            >
                {variant === 'primary' ? (
                    <View style={[styles.primary, { backgroundColor: colors.primary }, disabled && styles.disabled]}>
                        {inner}
                    </View>
                ) : variant === 'destructive' ? (
                    <View style={[styles.primary, { backgroundColor: colors.destructive }]}>
                        {inner}
                    </View>
                ) : (
                    <BlurView
                        intensity={colors.glass.blur}
                        tint={colors.glass.tint}
                        experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                        style={[
                            styles.glass,
                            { borderColor: variant === 'destructive' ? colors.destructive + '50' : colors.glass.border },
                        ]}
                    >
                        {inner}
                    </BlurView>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    label: { fontWeight: '700', letterSpacing: -0.2 },
    primary: {
        borderRadius: 16, overflow: 'hidden',
        ...Platform.select({
            ios: { boxShadow: [{ offsetX: 0, offsetY: 4, blur: 8, color: 'rgba(0,0,0,0.2)' }] },
            android: { elevation: 4 },
        }),
    },
    glass: { borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
    disabled: { opacity: 0.5 },
});

export default GlassButton;
