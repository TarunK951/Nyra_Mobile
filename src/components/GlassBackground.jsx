import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Platform, Dimensions, Easing } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { USE_NATIVE } from '../utils/animations';

const { width, height } = Dimensions.get('window');

const Orb = ({ color, size, delay, duration, startPos, amplitude = 40 }) => {
    const moveX = useRef(new Animated.Value(0)).current;
    const moveY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const createAnim = (val, to) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.timing(val, {
                        toValue: to,
                        duration: duration,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: USE_NATIVE,
                    }),
                    Animated.timing(val, {
                        toValue: 0,
                        duration: duration,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: USE_NATIVE,
                    }),
                ])
            );
        };

        const animX = createAnim(moveX, startPos.x);
        const animY = createAnim(moveY, startPos.y);

        const timeout = setTimeout(() => {
            animX.start();
            animY.start();
        }, delay);

        return () => {
            clearTimeout(timeout);
            animX.stop();
            animY.stop();
        };
    }, []);

    return (
        <Animated.View
            style={[
                styles.orb,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: color,
                    transform: [
                        { translateX: moveX },
                        { translateY: moveY },
                    ],
                    opacity: 0.2, // slightly higher for depth
                }
            ]}
        />
    );
};

const GlassBackground = ({ children }) => {
    const { colors, themeMode } = useTheme();

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            {/* Background Orbs — Liquid & Morphing patterns */}
            <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
                {/* Large primary bloobs */}
                <Orb
                    color={colors.primary}
                    size={width * 1.1}
                    duration={12000}
                    delay={0}
                    startPos={{ x: width * 0.3, y: height * 0.15 }}
                />
                <Orb
                    color={themeMode === 'dark' ? '#7c3aed' : '#a78bfa'}
                    size={width * 0.9}
                    duration={15000}
                    delay={1500}
                    startPos={{ x: -width * 0.4, y: height * 0.45 }}
                />

                {/* Secondary accent bloobs */}
                <Orb
                    color={themeMode === 'dark' ? '#059669' : '#34d399'}
                    size={width * 0.7}
                    duration={18000}
                    delay={3000}
                    startPos={{ x: width * 0.25, y: -height * 0.2 }}
                />
                <Orb
                    color={themeMode === 'dark' ? '#f59e0b' : '#fbbf24'}
                    size={width * 0.4}
                    duration={10000}
                    delay={500}
                    startPos={{ x: -width * 0.1, y: -height * 0.4 }}
                />
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        overflow: 'hidden',
    },
    orb: {
        position: 'absolute',
        // Heavy blur creates the "liquid" blend
        filter: Platform.OS === 'web' ? 'blur(100px)' : undefined,
    },
    content: {
        flex: 1,
    }
});

export default GlassBackground;
