// ─── Glass Tab Navigator — iOS 26 — with More screen ─────────────
import React, { useRef, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Platform, Animated, Text, TouchableOpacity
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Video, ResizeMode } from 'expo-av';
import {
    LayoutDashboard, Users, Zap, Calendar, Stethoscope, Bot,
} from 'lucide-react-native';
import LiquidGlass from '../components/LiquidGlass';
import DashboardScreen from '../screens/DashboardScreen';
import PatientsNavigator from './PatientsNavigator';
import AppointmentsNavigator from './AppointmentsNavigator';
import DoctorsNavigator from './DoctorsNavigator';
import { useTheme } from '../theme/ThemeContext';
import { useChat } from '../components/Chat/ChatContext';
import { layout } from '../utils/layout';

const Tab = createBottomTabNavigator();

const NyraFab = ({ colors }) => {
    return (
        <View style={styles.fabOuter}>
            <Video
                source={{ uri: 'https://res.cloudinary.com/duh3toy4g/video/upload/v1770877221/grok-video-3d077b4f-a502-4a2f-83bb-6519bed21f5f_esrhms.mp4' }}
                style={styles.fabVideo}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted
                useNativeControls={false}
            />
        </View>
    );
};

// ── Animated tab icon ─────────────────────────────────────────────
const TabIcon = ({ Icon, focused, color }) => {
    return (
        <View style={styles.iconWrap}>
            {focused && <View style={[styles.iconBg, { backgroundColor: color + '18' }]} />}
            <Icon
                size={22}
                color={color}
                strokeWidth={focused ? 2.5 : 2}
            />
        </View>
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
                                        navigation.emit({
                                            type: 'tabPress',
                                            target: route.key,
                                            canPreventDefault: true,
                                        });
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
                            Doctors: 'Doctors',
                        };
                        const IconMap = {
                            Home: LayoutDashboard,
                            Patients: Users,
                            Appointments: Calendar,
                            Doctors: Stethoscope,
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
            <Tab.Screen name="Doctors" component={DoctorsNavigator} />
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
            ios: {
                boxShadow: [{
                    offsetX: 0,
                    offsetY: -4,
                    blur: 20,
                    color: 'rgba(0,0,0,0.3)', // Softened for better look
                }],
            },
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
    fabOuter: {
        width: 65,
        height: 65,
        borderRadius: 32.5,
        overflow: 'hidden',
        backgroundColor: '#000'
    },
    fabVideo: {
        flex: 1,
    },
});

export default TabNavigator;
