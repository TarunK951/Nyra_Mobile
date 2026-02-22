// ─── Glass Tab Navigator — iOS 26 — with More screen ─────────────
import React, { useRef, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Platform, Animated, Text, TouchableOpacity
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Video, ResizeMode } from 'expo-av';
import {
    LayoutDashboard, Users, Zap, Calendar, MoreHorizontal,
} from 'lucide-react-native';
import LiquidGlass from '../components/LiquidGlass';
import DashboardScreen from '../screens/DashboardScreen';
import PatientsNavigator from './PatientsNavigator';
import AppointmentsNavigator from './AppointmentsNavigator';
import MoreScreen from '../screens/MoreScreen';
import { useTheme } from '../theme/ThemeContext';
import { useChat } from '../components/Chat/ChatContext';
import { layout } from '../utils/layout';
import { SPRING, useRotate } from '../utils/animations';

const Tab = createBottomTabNavigator();

// ── Centre Nyra FAB ───────────────────────────────────────────────
const NyraFab = ({ colors }) => {
    const spin = useRotate(18000);
    const pulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1.10, duration: 2200, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1, duration: 2200, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={[styles.fabOuter, { transform: [{ scale: pulse }] }]}>
            <View style={[styles.fabRing, { borderColor: colors.primary + '30' }]}>
                <LiquidGlass
                    intensity={colors.glass.blurStrong}
                    tint={colors.glass.tint}
                    containerStyle={styles.fabGlass}
                    padding={0}
                >
                    <View style={[styles.fabCore, { backgroundColor: '#000' }]}>
                        <Video
                            source={{ uri: 'https://res.cloudinary.com/duh3toy4g/video/upload/v1770877221/grok-video-3d077b4f-a502-4a2f-83bb-6519bed21f5f_esrhms.mp4' }}
                            style={styles.fabVideo}
                            resizeMode={ResizeMode.COVER}
                            shouldPlay
                            isLooping
                            isMuted
                        />
                        <View style={styles.fabGlowInner} />
                    </View>
                </LiquidGlass>
            </View>
        </Animated.View>
    );
};

// ── Animated tab icon ─────────────────────────────────────────────
const TabIcon = ({ Icon, focused, color }) => {
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.spring(scale, {
            toValue: focused ? 1.18 : 1,
            ...SPRING.snappy,
        }).start();
    }, [focused]);

    return (
        <Animated.View style={[styles.iconWrap, { transform: [{ scale }] }]}>
            {focused && <View style={[styles.iconBg, { backgroundColor: color + '18' }]} />}
            <Icon
                size={focused ? 23 : 22}
                color={color}
                strokeWidth={focused ? 2.5 : 2}
            />
        </Animated.View>
    );
};

// ── Custom Glass Tab Bar ──────────────────────────────────────────
const GlassTabBar = ({ state, descriptors, navigation, colors, openChat }) => {
    const routes = state.routes;

    return (
        <View style={[styles.barContainer, { pointerEvents: 'box-none' }]}>
            <LiquidGlass
                intensity={colors.glass.blurStrong}
                tint={colors.glass.tint}
                padding={0}
                containerStyle={[styles.bar, { overflow: 'visible' }]}
            >
                <View style={styles.tabRow}>
                    {routes.map((route, idx) => {
                        const { options } = descriptors[route.key];
                        const focused = state.index === idx;

                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress', target: route.key, canPreventDefault: true,
                            });
                            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
                        };

                        // Centre FAB slot
                        if (route.name === 'NyraAI') {
                            return (
                                <TouchableOpacity
                                    key={route.key}
                                    onPress={() => {
                                        navigation.emit({ type: 'tabPress', target: route.key });
                                        openChat?.();
                                    }}
                                    style={styles.fabSlot}
                                    activeOpacity={0.9}
                                >
                                    <NyraFab colors={colors} />
                                </TouchableOpacity>
                            );
                        }

                        const labelMap = {
                            Home: 'Home',
                            Patients: 'Patients',
                            Appointments: 'Schedule',
                            More: 'More',
                        };
                        const IconMap = {
                            Home: LayoutDashboard,
                            Patients: Users,
                            Appointments: Calendar,
                            More: MoreHorizontal,
                        };
                        const Icon = IconMap[route.name] ?? LayoutDashboard;
                        const label = options.tabBarLabel ?? labelMap[route.name] ?? route.name;
                        const col = focused ? colors.primary : colors.mutedForeground;

                        return (
                            <TouchableOpacity
                                key={route.key}
                                onPress={onPress}
                                style={styles.tabItem}
                                activeOpacity={0.75}
                            >
                                <TabIcon Icon={Icon} focused={focused} color={col} />
                                <Text style={[styles.tabLabel, {
                                    color: col,
                                    fontWeight: focused ? '800' : '500',
                                }]}>
                                    {label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </LiquidGlass >
        </View >
    );
};

const TabNavigator = () => {
    const { colors } = useTheme();
    const { openChat } = useChat();

    return (
        <Tab.Navigator
            tabBar={(props) => <GlassTabBar {...props} colors={colors} openChat={openChat} />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name="Home" component={DashboardScreen} />
            <Tab.Screen name="Patients" component={PatientsNavigator} />
            <Tab.Screen
                name="NyraAI"
                component={DashboardScreen}
                listeners={{ tabPress: (e) => { e.preventDefault(); openChat?.(); } }}
            />
            <Tab.Screen name="Appointments" component={AppointmentsNavigator} />
            <Tab.Screen name="More" component={MoreScreen} />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    barContainer: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        paddingHorizontal: 14,
        paddingBottom: layout.tabBarPadBottom,
        paddingTop: 5,
    },
    bar: {
        borderRadius: 30, borderWidth: 1.2, overflow: 'hidden',
        ...Platform.select({
            ios: { shadowOffset: { width: 0, height: -4 }, shadowOpacity: 1, shadowRadius: 20 },
            android: { elevation: 14 },
        }),
    },
    shimmerLine: {
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 1.5, zIndex: 10,
    },
    tabRow: { flexDirection: 'row', paddingTop: 9, paddingBottom: 6 },
    tabItem: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 4 },
    tabLabel: { fontSize: 10, letterSpacing: 0.2 },
    iconWrap: {
        width: 38, height: 32,
        justifyContent: 'center', alignItems: 'center',
        position: 'relative',
    },
    iconBg: {
        position: 'absolute',
        width: 38, height: 32, borderRadius: 10,
    },
    fabSlot: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        marginTop: -30,
    },
    fabOuter: { width: 60, height: 60 },
    fabRing: {
        width: 60, height: 60, borderRadius: 30, borderWidth: 2,
        justifyContent: 'center', alignItems: 'center',
    },
    fabGlass: {
        width: 54, height: 54, borderRadius: 27, overflow: 'hidden', borderWidth: 1.5,
        ...Platform.select({
            ios: { shadowColor: '#2563eb', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 12 },
            android: { elevation: 16 },
        }),
    },
    fabCore: {
        flex: 1, margin: 2, borderRadius: 25,
        justifyContent: 'center', alignItems: 'center',
        position: 'relative', overflow: 'hidden',
    },
    fabVideo: {
        width: '100%', height: '100%',
    },
    fabGlowInner: {
        position: 'absolute', width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)', top: -10, right: -10,
    },
});

export default TabNavigator;
