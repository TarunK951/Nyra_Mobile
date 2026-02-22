import React from 'react';
import { StyleSheet, View, Platform, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeContext';

const LiquidGlass = ({
    children,
    style,
    intensity,
    tint,
    containerStyle,
    borderVisible = true,
    shadowVisible = true,
    padding = 16,
    borderRadius = 24
}) => {
    const { colors } = useTheme();
    const g = colors.glass;

    return (
        <View style={[
            styles.outer,
            { borderRadius },
            shadowVisible && {
                shadowColor: g.shadowDeep,
                backgroundColor: 'transparent',
            },
            containerStyle
        ]}>
            <BlurView
                intensity={intensity || g.blur}
                tint={tint || g.tint}
                experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                style={[
                    styles.blur,
                    {
                        backgroundColor: g.bg,
                        borderColor: borderVisible ? g.border : 'transparent',
                        padding: padding,
                        borderRadius: borderRadius,
                    },
                    style
                ]}
            >
                {/* Thin inner border / highlight (Liquid specific) */}
                <View style={[styles.innerBorder, { borderColor: 'rgba(255,255,255,0.08)', borderRadius: borderRadius, pointerEvents: 'none' }]} />

                {/* Top refraction line */}
                <View style={[styles.highlight, { backgroundColor: g.highlight, pointerEvents: 'none' }]} />

                {children}
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    outer: {
        ...Platform.select({
            ios: {
                boxShadow: [{
                    offsetX: 0,
                    offsetY: 8,
                    blur: 16,
                    color: 'rgba(0,0,0,0.1)',
                }],
            },
            android: { elevation: 6 },
        }),
    },
    blur: {
        borderWidth: 1,
        overflow: 'hidden',
    },
    innerBorder: {
        ...StyleSheet.absoluteFillObject,
        borderWidth: 0.5,
    },
    highlight: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        opacity: 0.8,
    }
});

export default LiquidGlass;
