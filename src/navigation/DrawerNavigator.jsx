import React from 'react';
import {
    createDrawerNavigator,
    DrawerContentScrollView,
    DrawerItemList,
    DrawerItem
} from '@react-navigation/drawer';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import TabNavigator from './TabNavigator';
import ModuleScreen from '../screens/ModuleScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AppointmentsNavigator from './AppointmentsNavigator';
import DoctorsNavigator from './DoctorsNavigator';
import ConversationsNavigator from './ConversationsNavigator';
import LiquidGlass from '../components/LiquidGlass';
import LiveCallsScreen from '../screens/LiveCallsScreen';
import FollowUpScreen from '../screens/FollowUpScreen';
import ReminderCallsScreen from '../screens/ReminderCallsScreen';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import {
    LayoutDashboard,
    Users,
    Calendar,
    Stethoscope,
    IndianRupee,
    PhoneCall,
    FileText,
    Pill,
    BarChart3,
    Settings,
    ShieldCheck,
    Building2,
    Bell,
    MessageSquare,
    PhoneOutgoing,
    History,
} from 'lucide-react-native';

const Drawer = createDrawerNavigator();

const CustomDrawerContent = (props) => {
    const { user } = useAuth();
    const { colors } = useTheme();

    return (
        <DrawerContentScrollView {...props} style={{ backgroundColor: colors.background }}>
            <LiquidGlass
                intensity={colors.glass.blur}
                tint={colors.glass.tint}
                containerStyle={styles.drawerHeaderBlur}
                padding={0}
                style={{ flexDirection: 'row', alignItems: 'center', padding: 20 }}
            >
                <View style={[styles.logoSquare, { backgroundColor: colors.primary + '15' }]}>
                    <Image
                        source={{ uri: 'https://nyraai-main-website.vercel.app/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.c1949d52.png&w=64&q=75' }}
                        style={styles.logo}
                    />
                </View>
                <View style={styles.headerInfo}>
                    <Text style={[styles.userName, { color: colors.foreground }]}>{user?.name || 'Staff'}</Text>
                    <Text style={[styles.userRole, { color: colors.mutedForeground }]}>{user?.role?.replace('_', ' ') || 'Healthcare'}</Text>
                </View>
            </LiquidGlass>
            <View style={[styles.divider, { backgroundColor: colors.glass.borderSubtle }]} />
            <DrawerItemList {...props} />
        </DrawerContentScrollView>
    );
};

const DrawerNavigator = () => {
    const { user } = useAuth();
    const { colors } = useTheme();

    const role = user?.role || 'DOCTOR';

    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerStyle: {
                    backgroundColor: colors.card,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                headerTitleStyle: {
                    fontWeight: '700',
                    color: colors.foreground,
                },
                headerTintColor: colors.primary,
                drawerActiveTintColor: colors.primary,
                drawerInactiveTintColor: colors.mutedForeground,
                drawerStyle: {
                    width: 280,
                },
            }}
        >
            <Drawer.Screen
                name="MainDashboard"
                component={TabNavigator}
                options={{
                    title: 'Dashboard',
                    headerShown: false,
                    drawerIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />
                }}
            />

            {/* Main Section */}
            <Drawer.Screen
                name="Doctors"
                component={DoctorsNavigator}
                options={{
                    drawerIcon: ({ color, size }) => <Stethoscope size={size} color={color} />
                }}
            />

            <Drawer.Screen
                name="Appointments"
                component={AppointmentsNavigator}
                options={{
                    drawerIcon: ({ color, size }) => <Calendar size={size} color={color} />
                }}
            />

            <Drawer.Screen
                name="Revenue"
                component={ModuleScreen}
                initialParams={{ title: 'Revenue', icon: 'IndianRupee' }}
                options={{
                    drawerIcon: ({ color, size }) => <IndianRupee size={size} color={color} />
                }}
            />

            {/* NyraAI Section */}
            <Drawer.Screen
                name="LiveCalls"
                component={LiveCallsScreen}
                options={{
                    title: 'Live Calls',
                    drawerIcon: ({ color, size }) => <PhoneCall size={size} color={color} />
                }}
            />

            <Drawer.Screen
                name="FollowUp"
                component={FollowUpScreen}
                options={{
                    title: 'Follow Up',
                    drawerIcon: ({ color, size }) => <PhoneOutgoing size={size} color={color} />
                }}
            />

            <Drawer.Screen
                name="Conversations"
                component={ConversationsNavigator}
                options={{
                    title: 'Conversations',
                    drawerIcon: ({ color, size }) => <MessageSquare size={size} color={color} />
                }}
            />

            <Drawer.Screen
                name="ReminderCalls"
                component={ReminderCallsScreen}
                options={{
                    title: 'Reminder Calls',
                    drawerIcon: ({ color, size }) => <Bell size={size} color={color} />
                }}
            />

            {/* Hospital Section */}
            <Drawer.Screen
                name="Medications"
                component={ModuleScreen}
                initialParams={{ title: 'Medications', icon: 'Pill' }}
                options={{
                    drawerIcon: ({ color, size }) => <Pill size={size} color={color} />
                }}
            />

            <Drawer.Screen
                name="Invoices"
                component={ModuleScreen}
                initialParams={{ title: 'Invoices', icon: 'FileText' }}
                options={{
                    drawerIcon: ({ color, size }) => <FileText size={size} color={color} />
                }}
            />

            <Drawer.Screen
                name="Analytics"
                component={ModuleScreen}
                initialParams={{ title: 'Analytics', icon: 'BarChart3' }}
                options={{
                    drawerIcon: ({ color, size }) => <BarChart3 size={size} color={color} />
                }}
            />

            {/* Super Admin Section (Conditional) */}
            {(role === 'SUPER_ADMIN' || role === 'SUPER_ADMIN') && (
                <Drawer.Screen
                    name="Hospitals"
                    component={ModuleScreen}
                    initialParams={{ title: 'Hospitals', icon: 'Building2' }}
                    options={{
                        drawerIcon: ({ color, size }) => <Building2 size={size} color={color} />
                    }}
                />
            )}

            {/* Config Section */}
            <Drawer.Screen
                name="ProfileDrawer"
                component={ProfileScreen}
                options={{
                    title: 'Settings & Profile',
                    drawerIcon: ({ color, size }) => <Settings size={size} color={color} />
                }}
            />

        </Drawer.Navigator>
    );
};

const styles = StyleSheet.create({
    drawerHeaderBlur: {
        padding: 20, flexDirection: 'row', alignItems: 'center',
        marginBottom: 10, borderBottomWidth: 1, overflow: 'hidden',
    },
    logoSquare: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    logo: {
        width: 32,
        height: 32,
    },
    headerInfo: {
        justifyContent: 'center',
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
    },
    userRole: {
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 2,
    },
    divider: {
        height: 1,
        marginHorizontal: 20,
        marginBottom: 10,
    }
});

export default DrawerNavigator;
