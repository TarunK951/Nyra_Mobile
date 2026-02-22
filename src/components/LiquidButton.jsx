import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeContext';
import { useScalePressAnim } from '../utils/animations';

const LiquidButton = ({
    onPress,
    children,
    text,
    icon: Icon,
    style,
    textStyle,
    colors: propColors,
    variant = 'primary' // primary | glass | secondary
}) => {
    const { colors } = useTheme();
    const activeColors = propColors || colors;
    const g = activeColors.glass;
    const { scale, pressIn, pressOut } = useScalePressAnim();

    const isGlass = variant === 'glass';

    return (
        <Animated.View style={[{ transform: [{ scale }] }, style]}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={pressIn}
                onPressOut={pressOut}
                activeOpacity={1}
                style={styles.touchable}
            >
                {/* Double Layer Shadow (Liquid Effect) */}
                <View style={[
                    styles.shadowLayer,
                    { shadowColor: variant === 'primary' ? activeColors.primary : g.shadowDeep }
                ]} />

                <BlurView
                    intensity={isGlass ? g.blurStrong : 10}
                    tint={g.tint}
                    experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                    style={[
                        styles.btn,
                        {
                            backgroundColor: variant === 'primary' ? activeColors.foreground : g.bg,
                            borderColor: isGlass ? g.border : 'transparent',
                        }
                    ]}
                >
                    {/* Top Edge Highlight */}
                    <View style={[styles.highlight, { backgroundColor: g.highlight }]} />

                    <View style={styles.content}>
                        {Icon && <Icon size={18} color={variant === 'primary' ? activeColors.background : activeColors.primary} style={styles.icon} strokeWidth={2.5} />}
                        {text && (
                            <Text style={[
                                styles.text,
                                { color: variant === 'primary' ? activeColors.background : activeColors.foreground },
                                textStyle
                            ]}>
                                {text}
                            </Text>
                        )}
                        {children}
                    </View>
                </BlurView>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    touchable: {
        borderRadius: 20,
    },
    shadowLayer: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 20,
        ...Platform.select({
            ios: {
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.15,
                shadowRadius: 20,
            },
            android: { elevation: 6 },
        }),
    },
    btn: {
        height: 60,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        borderWidth: 1.5,
        overflow: 'hidden',
    },
    highlight: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1.5,
        opacity: 0.6,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        marginRight: 10,
    },
    text: {
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: -0.2,
    }
});

export default LiquidButton;
