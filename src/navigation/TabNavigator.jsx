import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Platform, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, Users, MessageSquare, UserCircle, Sparkles } from 'lucide-react-native';
import DashboardScreen from '../screens/DashboardScreen';
import PatientsNavigator from './PatientsNavigator';
import ProfileScreen from '../screens/ProfileScreen';
import ConversationsNavigator from './ConversationsNavigator';
import { useTheme } from '../theme/ThemeContext';
import { useChat } from '../components/Chat/ChatContext';

const Tab = createBottomTabNavigator();

// ── Nyra AI FAB icon — Pure Animated Pulsing Icon ────────────────────
const NyraFabIcon = () => {
    const pulse = useRef(new Animated.Value(1)).current;
    const rotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        ).start();

        Animated.loop(
            Animated.timing(rotate, { toValue: 1, duration: 10000, useNativeDriver: true })
        ).start();
    }, []);

    const spin = rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    return (
        <Animated.View style={{ transform: [{ scale: pulse }, { rotate: spin }] }}>
            <Sparkles size={28} color="#fff" />
        </Animated.View>
    );
};

const TabNavigator = () => {
    const { colors } = useTheme();
    const { openChat } = useChat();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    if (route.name === 'Overview') return <LayoutDashboard size={size} color={color} />;
                    if (route.name === 'Patients') return <Users size={size} color={color} />;
                    if (route.name === 'Chat') return <MessageSquare size={size} color={color} />;
                    if (route.name === 'Profile') return <UserCircle size={size} color={color} />;
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.mutedForeground,
                tabBarStyle: {
                    backgroundColor: colors.card,
                    borderTopColor: colors.border,
                    height: Platform.OS === 'ios' ? 88 : 68,
                    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
                    paddingTop: 10,
                },
                headerStyle: {
                    backgroundColor: colors.card,
                    borderBottomColor: colors.border,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                headerTitleStyle: {
                    color: colors.foreground,
                    fontSize: 18,
                    fontWeight: '700',
                },
                headerShown: false,
            })}
        >
            <Tab.Screen name="Overview" component={DashboardScreen} />
            <Tab.Screen name="Patients" component={PatientsNavigator} />

            {/* ── Central Nyra AI FAB ── */}
            <Tab.Screen
                name="NyraAI"
                component={DashboardScreen}   // never actually rendered
                options={{
                    tabBarLabel: () => null,
                    tabBarIcon: () => (
                        <View style={[styles.fab, { backgroundColor: colors.primary }]}>
                            <NyraFabIcon />
                        </View>
                    ),
                }}
                listeners={{
                    tabPress: (e) => {
                        e.preventDefault();
                        openChat();
                    },
                }}
            />

            <Tab.Screen
                name="Chat"
                component={ConversationsNavigator}
                options={{
                    headerShown: false,
                }}
            />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    fab: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Platform.OS === 'ios' ? 0 : 10,
        marginTop: -25,
        ...Platform.select({
            ios: {
                shadowColor: '#7c3aed',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.45,
                shadowRadius: 10,
            },
            android: { elevation: 10 },
            web: { boxShadow: '0 6px 15px rgba(124,58,237,0.45)' },
        }),
    },
});

export default TabNavigator;
