// ─── Glass Tab Navigator — iOS 26 Liquid Glass ───────────────────
import React, { useRef, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Platform, Animated, Text, TouchableOpacity
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LayoutDashboard, Users, MessageSquare, UserCircle, Sparkles } from 'lucide-react-native';
import DashboardScreen from '../screens/DashboardScreen';
import PatientsNavigator from './PatientsNavigator';
import ProfileScreen from '../screens/ProfileScreen';
import ConversationsNavigator from './ConversationsNavigator';
import { useTheme } from '../theme/ThemeContext';
import { useChat } from '../components/Chat/ChatContext';
import { layout } from '../utils/layout';
import { useRotate, SPRING } from '../utils/animations';

const Tab = createBottomTabNavigator();

// ── Animated Nyra FAB center button ─────────────────────────────
const NyraFab = ({ colors }) => {
    const spin = useRotate(16000);
    const pulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1.12, duration: 2000, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={[styles.fabWrap, { transform: [{ scale: pulse }] }]}>
            <BlurView
                intensity={30}
                tint={colors.glass.tint}
                experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                style={[styles.fabGlass, { borderColor: colors.glass.border }]}
            >
                <View style={[styles.fabInner, { backgroundColor: colors.primary }]}>
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                        <Sparkles size={24} color="#fff" strokeWidth={2.5} />
                    </Animated.View>
                </View>
            </BlurView>
        </Animated.View>
    );
};

// ── Glass Tab Icon with animated active indicator ───────────────
const TabIcon = ({ Icon, focused, color }) => {
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.spring(scale, {
            toValue: focused ? 1.15 : 1,
            ...SPRING.snappy,
        }).start();
    }, [focused]);

    return (
        <Animated.View style={[styles.tabIconWrap, { transform: [{ scale }] }]}>
            {focused && <View style={[styles.iconActive, { backgroundColor: color + '20' }]} />}
            <Icon size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
        </Animated.View>
    );
};

// ── Custom Glass Tab Bar ────────────────────────────────────────
const GlassTabBar = ({ state, descriptors, navigation, colors }) => {
    return (
        <View style={styles.tabBarContainer} pointerEvents="box-none">
            <BlurView
                intensity={colors.glass.blurStrong}
                tint={colors.glass.tint}
                experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                style={[styles.tabBar, {
                    borderColor: colors.glass.border,
                    shadowColor: colors.glass.shadow,
                }]}
            >
                {/* Shimmer top */}
                <View style={[styles.tabShimmer, { backgroundColor: colors.glass.shimmer }]} />

                <View style={styles.tabRow}>
                    {state.routes.map((route, idx) => {
                        const { options } = descriptors[route.key];
                        const focused = state.index === idx;
                        const onPress = () => {
                            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
                        };

                        // Center FAB
                        if (route.name === 'NyraAI') {
                            return (
                                <TouchableOpacity
                                    key={route.key}
                                    onPress={() => {
                                        navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                                    }}
                                    style={styles.fabTab}
                                    activeOpacity={0.88}
                                >
                                    <NyraFab colors={colors} />
                                </TouchableOpacity>
                            );
                        }

                        const label = options.tabBarLabel ?? route.name;
                        const iconColor = focused ? colors.primary : colors.mutedForeground;
                        const IconMap = {
                            Overview: LayoutDashboard,
                            Patients: Users,
                            Chat: MessageSquare,
                            Profile: UserCircle,
                        };
                        const Icon = IconMap[route.name] ?? LayoutDashboard;

                        return (
                            <TouchableOpacity
                                key={route.key}
                                onPress={onPress}
                                style={styles.tabItem}
                                activeOpacity={0.7}
                            >
                                <TabIcon Icon={Icon} focused={focused} color={iconColor} />
                                <Text style={[styles.tabLabel, {
                                    color: iconColor,
                                    fontWeight: focused ? '700' : '500',
                                    opacity: focused ? 1 : 0.7,
                                }]}>
                                    {label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </BlurView>
        </View>
    );
};

const TabNavigator = () => {
    const { colors } = useTheme();
    const { openChat } = useChat();

    return (
        <Tab.Navigator
            tabBar={(props) => <GlassTabBar {...props} colors={colors} />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name="Overview" component={DashboardScreen} options={{ tabBarLabel: 'Home' }} />
            <Tab.Screen name="Patients" component={PatientsNavigator} options={{ tabBarLabel: 'Patients' }} />
            <Tab.Screen
                name="NyraAI"
                component={DashboardScreen}
                options={{ tabBarLabel: '' }}
                listeners={{ tabPress: (e) => { e.preventDefault(); openChat(); } }}
            />
            <Tab.Screen name="Chat" component={ConversationsNavigator} options={{ tabBarLabel: 'Calls' }} />
            <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Me' }} />
        </Tab.Navigator>
    );
};

const TAB_H = layout.tabBarHeight;

const styles = StyleSheet.create({
    tabBarContainer: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        paddingHorizontal: 12,
        paddingBottom: layout.tabBarPadBottom,
        paddingTop: 4,
    },
    tabBar: {
        borderRadius: 28,
        borderWidth: 1,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 1,
                shadowRadius: 20,
            },
            android: { elevation: 12 },
        }),
    },
    tabShimmer: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 1.5,
        zIndex: 10,
    },
    tabRow: {
        flexDirection: 'row',
        paddingTop: 8,
        paddingBottom: 4,
    },
    tabItem: {
        flex: 1, alignItems: 'center', gap: 3,
        paddingVertical: 6,
    },
    tabLabel: {
        fontSize: 11,
        letterSpacing: 0.3,
    },
    tabIconWrap: {
        width: 36, height: 36,
        justifyContent: 'center', alignItems: 'center',
        position: 'relative',
    },
    iconActive: {
        position: 'absolute',
        width: 36, height: 36,
        borderRadius: 18,
    },
    fabTab: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        marginTop: -28,
    },
    fabWrap: {
        width: 60, height: 60,
    },
    fabGlass: {
        width: 60, height: 60,
        borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 2,
        ...Platform.select({
            ios: {
                shadowColor: '#7c3aed',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.5,
                shadowRadius: 14,
            },
            android: { elevation: 14 },
        }),
    },
    fabInner: {
        flex: 1, borderRadius: 28,
        justifyContent: 'center', alignItems: 'center',
        margin: 3,
    },
});

export default TabNavigator;
