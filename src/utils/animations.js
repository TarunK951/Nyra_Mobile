// ─── NyraAI Animation Utilities ─────────────────────────────────────
// All animations using react-native Animated (Expo Go compatible)
import { useRef, useEffect, useCallback } from 'react';
import { Animated, Easing, Platform } from 'react-native';

const USE_NATIVE = Platform.OS !== 'web';

// ── Spring config presets ──────────────────────────────────────────
export const SPRING = {
    snappy: { tension: 300, friction: 22, useNativeDriver: USE_NATIVE },
    gentle: { tension: 180, friction: 18, useNativeDriver: USE_NATIVE },
    bouncy: { tension: 240, friction: 12, useNativeDriver: USE_NATIVE },
    modal: { tension: 200, friction: 20, useNativeDriver: USE_NATIVE },
};

// ── useFadeIn — entrance opacity animation ──────────────────────────
export const useFadeIn = (delay = 0, duration = 380) => {
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const timer = setTimeout(() => {
            Animated.timing(opacity, {
                toValue: 1,
                duration,
                delay: 0,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: USE_NATIVE,
            }).start();
        }, delay);
        return () => clearTimeout(timer);
    }, []);

    return opacity;
};

// ── useSlideUp — entrance translateY animation ─────────────────────
export const useSlideUp = (delay = 0, distance = 28) => {
    const translateY = useRef(new Animated.Value(distance)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const timer = setTimeout(() => {
            Animated.parallel([
                Animated.spring(translateY, { toValue: 0, ...SPRING.gentle }),
                Animated.timing(opacity, {
                    toValue: 1, duration: 320,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: USE_NATIVE,
                }),
            ]).start();
        }, delay);
        return () => clearTimeout(timer);
    }, []);

    return { translateY, opacity };
};

// ── useStagger — staggered list entrance ───────────────────────────
export const useStagger = (count = 5, baseDelay = 60) => {
    const anims = useRef(
        Array.from({ length: count }, () => ({
            opacity: new Animated.Value(0),
            translateY: new Animated.Value(20),
        }))
    ).current;

    useEffect(() => {
        const group = anims.slice(0, count).map((a, i) =>
            Animated.parallel([
                Animated.timing(a.opacity, {
                    toValue: 1, duration: 350, delay: i * baseDelay,
                    easing: Easing.out(Easing.cubic), useNativeDriver: USE_NATIVE,
                }),
                Animated.spring(a.translateY, {
                    toValue: 0, delay: i * baseDelay, ...SPRING.gentle
                }),
            ])
        );
        Animated.parallel(group).start();
    }, [count]);

    return anims;
};

// ── useScalePressAnim — spring scale on press ─────────────────────
export const useScalePressAnim = () => {
    const scale = useRef(new Animated.Value(1)).current;

    const pressIn = useCallback(() => {
        Animated.spring(scale, { toValue: 0.96, ...SPRING.snappy }).start();
    }, []);

    const pressOut = useCallback(() => {
        Animated.spring(scale, { toValue: 1, ...SPRING.bouncy }).start();
    }, []);

    return { scale, pressIn, pressOut };
};

// ── usePulse — looping scale pulse ───────────────────────────────────
export const usePulse = (min = 0.85, max = 1) => {
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scale, { toValue: max, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: USE_NATIVE }),
                Animated.timing(scale, { toValue: min, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: USE_NATIVE }),
            ])
        ).start();
    }, []);

    return scale;
};

// ── useRotate — looping rotation ──────────────────────────────────
export const useRotate = (duration = 12000) => {
    const rotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(rotate, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: USE_NATIVE })
        ).start();
    }, []);

    const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    return spin;
};

// ── useTabIndicator — smooth tab indicator slide ───────────────────
export const useTabIndicator = (activeIndex, tabWidth) => {
    const x = useRef(new Animated.Value(activeIndex * tabWidth)).current;

    useEffect(() => {
        Animated.spring(x, {
            toValue: activeIndex * tabWidth,
            ...SPRING.snappy,
        }).start();
    }, [activeIndex, tabWidth]);

    return x;
};

// ── useShimmer — subtle shimmer loop ──────────────────────────────
export const useShimmer = () => {
    const opacity = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 0.9, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: USE_NATIVE }),
                Animated.timing(opacity, { toValue: 0.4, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: USE_NATIVE }),
            ])
        ).start();
    }, []);

    return opacity;
};
