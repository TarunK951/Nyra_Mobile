import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Platform, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, Users, MessageSquare, UserCircle } from 'lucide-react-native';
import { Video, ResizeMode } from 'expo-av';
import DashboardScreen from '../screens/DashboardScreen';
import PatientListScreen from '../screens/PatientListScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ConversationsScreen from '../screens/ConversationsScreen';
import { useTheme } from '../theme/ThemeContext';
import { useChat } from '../components/Chat/ChatContext';

const Tab = createBottomTabNavigator();

// ── Nyra AI FAB icon — plays branded video, no controls ────────────────────
const NYRA_VIDEO_URL = 'https://res.cloudinary.com/duh3toy4g/video/upload/v1770877221/grok-video-3d077b4f-a502-4a2f-83bb-6519bed21f5f_esrhms.mp4';

const NyraFabIcon = () => {
    const videoRef = useRef(null);

    return (
        <View style={styles.fabVideoWrapper}>
            <Video
                ref={videoRef}
                source={{ uri: NYRA_VIDEO_URL }}
                style={styles.fabVideo}
                resizeMode={ResizeMode.COVER}
                isLooping
                isMuted
                shouldPlay
                useNativeControls={false}
            />
        </View>
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
            <Tab.Screen name="Patients" component={PatientListScreen} />

            {/* ── Central Nyra AI FAB ── */}
            <Tab.Screen
                name="NyraAI"
                component={DashboardScreen}   // never actually rendered
                options={{
                    tabBarLabel: () => null,
                    tabBarIcon: () => (
                        <View style={[styles.fab, { borderColor: colors.primary }]}>
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

            <Tab.Screen name="Chat" component={ConversationsScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    fab: {
        width: 62,
        height: 62,
        borderRadius: 31,
        overflow: 'hidden',
        borderWidth: 3,
        marginBottom: Platform.OS === 'ios' ? 0 : 10,
        marginTop: -28,
        ...Platform.select({
            ios: {
                shadowColor: '#7c3aed',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.55,
                shadowRadius: 12,
            },
            android: { elevation: 14 },
            web: { boxShadow: '0 8px 24px rgba(124,58,237,0.55)' },
        }),
    },
    fabVideoWrapper: {
        width: '100%',
        height: '100%',
        borderRadius: 31,
        overflow: 'hidden',
    },
    fabVideo: {
        width: '100%',
        height: '100%',
    },
});

export default TabNavigator;
