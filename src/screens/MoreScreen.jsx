// ─── More Screen — Access all hidden navigation targets ───────────
// Replaces the sidebar for screens that aren't in the main tabs
import React, { useRef, useEffect } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity, ScrollView,
    Platform, Animated, StatusBar,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
    Calendar, Stethoscope, PhoneCall, PhoneOutgoing,
    MessageSquare, Bell, IndianRupee, Users,
    ChevronRight, LogOut, Moon, Sun, User,
} from 'lucide-react-native';
import LiquidGlass from '../components/LiquidGlass';
import { layout } from '../utils/layout';
import { useStagger, useScalePressAnim, SPRING } from '../utils/animations';

// ── Quick action tile ─────────────────────────────────────────────
const QuickTile = ({ icon: Icon, label, color, onPress, anim }) => {
    const { colors } = useTheme();
    const g = colors.glass;
    const { scale, pressIn, pressOut } = useScalePressAnim();

    return (
        <Animated.View style={anim ? [styles.tileWrap, { opacity: anim.opacity, transform: [{ translateY: anim.translateY }, { scale }] }] : [styles.tileWrap, { transform: [{ scale }] }]}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={pressIn}
                onPressOut={pressOut}
                activeOpacity={1}
            >
                <LiquidGlass
                    intensity={g.blur}
                    tint={g.tint}
                    padding={14}
                    borderRadius={18}
                    style={{ alignItems: 'center', gap: 6 }}
                >
                    <View style={[styles.tileIcon, { backgroundColor: color + '12' }]}>
                        <Icon size={20} color={color} strokeWidth={2.5} />
                    </View>
                    <Text style={[styles.tileLabel, { color: colors.foreground }]} numberOfLines={1}>{label}</Text>
                </LiquidGlass>
            </TouchableOpacity>
        </Animated.View>
    );
};

// ── Navigation row (for profile actions) ─────────────────────────
const NavRow = ({ icon: Icon, label, color, onPress, index, colors }) => {
    const { scale, pressIn, pressOut } = useScalePressAnim();
    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity
                onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}
                activeOpacity={1}
                style={[styles.navRow, index > 0 && { borderTopWidth: 1, borderTopColor: colors.glass.borderSubtle }]}
            >
                <View style={[styles.navIcon, { backgroundColor: (color || colors.primary) + '15' }]}>
                    <Icon size={20} color={color || colors.primary} strokeWidth={2.5} />
                </View>
                <Text style={[styles.navLabel, { color: colors.foreground }]}>{label}</Text>
                <ChevronRight size={16} color={colors.mutedForeground} opacity={0.5} />
            </TouchableOpacity>
        </Animated.View>
    );
};

const MoreScreen = ({ navigation }) => {
    const { colors, themeMode, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const g = colors.glass;

    // Navigate to screens (handles bubbling to Drawer if screen not in Tabs)
    const goTo = (screen) => navigation.navigate(screen);

    const quickItems = [
        { icon: Calendar, label: 'Appointments', color: colors.primary, nav: () => goTo('Appointments') },
        { icon: Stethoscope, label: 'Doctors', color: '#8b5cf6', nav: () => goTo('Doctors') },
        { icon: PhoneCall, label: 'Live Calls', color: '#10b981', nav: () => goTo('LiveCalls') },
        { icon: PhoneOutgoing, label: 'Follow Up', color: '#f59e0b', nav: () => goTo('FollowUp') },
        { icon: MessageSquare, label: 'Conversations', color: '#3b82f6', nav: () => goTo('Conversations') },
        { icon: Bell, label: 'Reminders', color: '#ef4444', nav: () => goTo('ReminderCalls') },
        { icon: IndianRupee, label: 'Revenue', color: '#059669', nav: () => goTo('Revenue') },
        { icon: Users, label: 'Patients', color: '#0ea5e9', nav: () => goTo('Patients') },
    ];

    const staggerAnims = useStagger(quickItems.length + 4, 60);

    return (
        <View style={[styles.screen, { backgroundColor: colors.background }]}>
            {/* Rich Apple Background Layering */}
            <View style={[styles.bgGlow, { backgroundColor: colors.primary + '08' }]} />
            <View style={[styles.bgGlowSecondary, { backgroundColor: colors.error + '05' }]} />

            <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} />
            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingTop: layout.statusBarHeight + 24 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Animated.View style={staggerAnims[0] ? [styles.header, { opacity: staggerAnims[0].opacity, transform: [{ translateY: staggerAnims[0].translateY }] }] : styles.header}>
                    <LiquidGlass
                        intensity={g.blurStrong}
                        tint={g.tint}
                        padding={0}
                        containerStyle={styles.avatarCircle}
                        style={{ justifyContent: 'center', alignItems: 'center' }}
                    >
                        <User size={24} color={colors.primary} strokeWidth={2.5} />
                    </LiquidGlass>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.userName, { color: colors.foreground }]}>{user?.name || 'Healthcare Practitioner'}</Text>
                        <Text style={[styles.userRole, { color: colors.primary }]}>
                            {(user?.role || 'Clinician Access').replace(/_/g, ' ')}
                        </Text>
                    </View>
                </Animated.View>

                {/* Section label */}
                <Animated.Text style={staggerAnims[1] ? [styles.sectionLabel, { color: colors.mutedForeground, opacity: staggerAnims[1].opacity }] : styles.sectionLabel}>Quick Access</Animated.Text>

                {/* 2-column tile grid */}
                <View style={styles.grid}>
                    {quickItems.map((item, idx) => (
                        <QuickTile
                            key={item.label}
                            icon={item.icon}
                            label={item.label}
                            color={item.color}
                            onPress={item.nav}
                            anim={staggerAnims[idx + 2]}
                        />
                    ))}
                </View>

                {/* Settings section */}
                <Animated.Text style={staggerAnims[quickItems.length + 2] ? [styles.sectionLabel, { color: colors.mutedForeground, marginTop: 4, opacity: staggerAnims[quickItems.length + 2].opacity }] : styles.sectionLabel}>Settings</Animated.Text>
                <Animated.View style={staggerAnims[quickItems.length + 3] ? { opacity: staggerAnims[quickItems.length + 3].opacity, transform: [{ translateY: staggerAnims[quickItems.length + 3].translateY }] } : {}}>
                    <LiquidGlass
                        intensity={g.blur}
                        tint={g.tint}
                        containerStyle={styles.glassCard}
                        padding={0}
                    >
                        <NavRow icon={themeMode === 'dark' ? Moon : Sun}
                            label={`${themeMode === 'dark' ? 'MIDNIGHT' : 'DAYLIGHT'} THEME`}
                            color={themeMode === 'dark' ? '#818cf8' : '#f59e0b'}
                            onPress={toggleTheme} index={0} colors={colors} />
                    </LiquidGlass>
                </Animated.View>

                {/* Logout */}
                <Animated.View style={staggerAnims[quickItems.length + 4] ? { opacity: staggerAnims[quickItems.length + 4].opacity, transform: [{ translateY: staggerAnims[quickItems.length + 4].translateY }] } : {}}>
                    <TouchableOpacity onPress={logout} activeOpacity={0.8} style={styles.logoutRow}>
                        <LiquidGlass
                            intensity={g.blur}
                            tint={g.tint}
                            containerStyle={styles.logoutGlass}
                            padding={14}
                            borderRadius={18}
                            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                        >
                            <LogOut size={16} color={colors.error} strokeWidth={2.5} />
                            <Text style={[styles.logoutText, { color: colors.error }]}>Log Out of Session</Text>
                        </LiquidGlass>
                    </TouchableOpacity>
                </Animated.View>

                <Text style={[styles.version, { color: colors.mutedForeground }]}>NyraAI Mobile v1.0.4</Text>
                <View style={{ height: layout.tabBarHeight + 30 }} />
            </ScrollView>
        </View>
    );
};

const TILE_W = (layout.screenWidth - layout.px * 2 - 14) / 2;

const styles = StyleSheet.create({
    screen: { flex: 1 },
    bgGlow: { position: 'absolute', top: -100, left: -100, width: 400, height: 400, borderRadius: 200, opacity: 0.6 },
    bgGlowSecondary: { position: 'absolute', bottom: -150, right: -150, width: 500, height: 500, borderRadius: 250, opacity: 0.4 },
    scroll: { paddingHorizontal: 20 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 28, paddingHorizontal: 4 },
    avatarCircle: {
        width: 42, height: 42, borderRadius: 15, justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, overflow: 'hidden',
    },
    avatarGlow: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', top: -20, left: -20 },
    userName: { fontSize: 18, fontWeight: '900', letterSpacing: -0.4 },
    userRole: { fontSize: 11, fontWeight: '800', marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.5 },
    sectionLabel: { fontSize: 13, fontWeight: '900', marginBottom: 12, marginLeft: 4 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
    tileWrap: { width: (layout.screenWidth - 40 - 10) / 2 },
    tileIcon: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    tileLabel: { fontSize: 12, fontWeight: '800', letterSpacing: -0.1, opacity: 0.8 },
    glassCard: {
        borderRadius: 22, borderWidth: 1, overflow: 'hidden', marginBottom: 12,
    },
    cardShimmer: { position: 'absolute', top: 0, left: 0, right: 0, height: 1.5 },
    navRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    navIcon: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    navLabel: { flex: 1, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.5 },
    logoutRow: { marginTop: 12 },
    logoutGlass: { overflow: 'hidden' },
    logoutText: { fontSize: 14, fontWeight: '900', letterSpacing: -0.1 },
    version: { textAlign: 'center', fontSize: 11, fontWeight: '800', marginTop: 32, opacity: 0.2, letterSpacing: 1 },
});

export default MoreScreen;
