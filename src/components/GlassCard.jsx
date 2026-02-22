// ─── GlassCard — Core iOS 26 Liquid Glass Surface ─────────────────
import React, { useRef, useEffect } from 'react';
import { View, Animated, Platform, StyleSheet } from 'react-native';
import { USE_NATIVE } from '../utils/animations';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeContext';

const GlassCard = ({
    children,
    style,
    intensity,
    animated = false,
    animDelay = 0,
    noPadding = false,
    radius = 22,
    shimmer = true,
}) => {
    const { colors, themeMode } = useTheme();
    const g = colors.glass;

    const opacity = useRef(new Animated.Value(animated ? 0 : 1)).current;
    const translateY = useRef(new Animated.Value(animated ? 16 : 0)).current;

    useEffect(() => {
        if (!animated) return;
        const t = setTimeout(() => {
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1, duration: 380, useNativeDriver: USE_NATIVE,
                }),
                Animated.spring(translateY, {
                    toValue: 0, tension: 180, friction: 18, useNativeDriver: USE_NATIVE,
                }),
            ]).start();
        }, animDelay);
        return () => clearTimeout(t);
    }, []);

    const blurIntensity = intensity ?? g.blur;

    const content = (
        <View style={[
            styles.outer,
            { borderRadius: radius },
            Platform.OS === 'ios' && {
                boxShadow: [{
                    offsetX: 0,
                    offsetY: 8,
                    blur: 24,
                    color: g.shadow || 'rgba(0,0,0,0.1)',
                }]
            },
            style
        ]}>
            <BlurView
                intensity={blurIntensity}
                tint={g.tint}
                experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                style={[styles.blur, { borderRadius: radius }]}
            >
                {/* Top shimmer edge */}
                {shimmer && (
                    <View style={[styles.shimmer, {
                        backgroundColor: g.shimmer,
                        borderTopLeftRadius: radius,
                        borderTopRightRadius: radius,
                    }]} />
                )}

                {/* Glass border overlay */}
                <View style={[styles.border, {
                    borderColor: g.border,
                    borderRadius: radius,
                }]} />

                {/* Content */}
                <View style={[!noPadding && styles.content]}>
                    {children}
                </View>
            </BlurView>
        </View>
    );

    if (!animated) return content;

    return (
        <Animated.View style={{ opacity, transform: [{ translateY }] }}>
            {content}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    outer: {
        overflow: 'hidden',
        ...Platform.select({
            android: { elevation: 8 },
        }),
    },
    blur: {
        overflow: 'hidden',
    },
    shimmer: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 1.5,
        zIndex: 10,
    },
    border: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        borderWidth: 1,
        zIndex: 5,
        pointerEvents: 'none',
    },
    content: {
        padding: 20,
    },
});

export default GlassCard;
