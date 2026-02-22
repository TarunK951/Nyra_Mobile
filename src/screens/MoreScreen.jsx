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
                <BlurView
                    intensity={g.blur}
                    tint={g.tint}
                    experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                    style={[styles.tile, { borderColor: g.border }]}
                >
                    <View style={[styles.tileShimmer, { backgroundColor: g.shimmer }]} />
                    <View style={[styles.tileIcon, { backgroundColor: color + '15' }]}>
                        <Icon size={24} color={color} strokeWidth={2.5} />
                    </View>
                    <Text style={[styles.tileLabel, { color: colors.foreground }]}>{label}</Text>
                </BlurView>
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

    // Navigate to drawer screens (parent of tab navigator)
    const goTo = (screen) => navigation.getParent()?.navigate(screen) ?? navigation.navigate(screen);

    const staggerAnims = useStagger(quickItems.length + 4, 60);

    const quickItems = [
        { icon: Calendar, label: 'Appointments', color: colors.primary, nav: () => goTo('Appointments') },
        { icon: Stethoscope, label: 'Doctors', color: '#8b5cf6', nav: () => goTo('Doctors') },
        { icon: PhoneCall, label: 'Live Calls', color: '#10b981', nav: () => goTo('LiveCalls') },
        { icon: PhoneOutgoing, label: 'Follow Up', color: '#f59e0b', nav: () => goTo('FollowUp') },
        { icon: MessageSquare, label: 'Conversations', color: '#3b82f6', nav: () => goTo('Conversations') },
        { icon: Bell, label: 'Reminders', color: '#ef4444', nav: () => goTo('ReminderCalls') },
        { icon: IndianRupee, label: 'Revenue', color: '#059669', nav: () => goTo('Revenue') },
        { icon: Users, label: 'Patients', color: '#0ea5e9', nav: () => navigation.navigate('Patients') },
    ];

    return (
        <View style={[styles.screen, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} />
            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingTop: layout.statusBarHeight + 24 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Animated.View style={staggerAnims[0] ? [styles.header, { opacity: staggerAnims[0].opacity, transform: [{ translateY: staggerAnims[0].translateY }] }] : styles.header}>
                    <BlurView
                        intensity={g.blurStrong}
                        tint={g.tint}
                        experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                        style={[styles.avatarCircle, { borderColor: g.border }]}
                    >
                        <View style={styles.avatarGlow} />
                        <User size={24} color={colors.primary} strokeWidth={2.5} />
                    </BlurView>
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
                    <BlurView
                        intensity={g.blur}
                        tint={g.tint}
                        experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                        style={[styles.glassCard, { borderColor: g.border }]}
                    >
                        <View style={[styles.cardShimmer, { backgroundColor: g.shimmer }]} />
                        <NavRow icon={themeMode === 'dark' ? Moon : Sun}
                            label={`${themeMode === 'dark' ? 'MIDNIGHT' : 'DAYLIGHT'} THEME`}
                            color={themeMode === 'dark' ? '#818cf8' : '#f59e0b'}
                            onPress={toggleTheme} index={0} colors={colors} />
                    </BlurView>
                </Animated.View>

                {/* Logout */}
                <Animated.View style={staggerAnims[quickItems.length + 4] ? { opacity: staggerAnims[quickItems.length + 4].opacity, transform: [{ translateY: staggerAnims[quickItems.length + 4].translateY }] } : {}}>
                    <TouchableOpacity onPress={logout} activeOpacity={0.8} style={styles.logoutRow}>
                        <BlurView
                            intensity={g.blur}
                            tint={g.tint}
                            experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                            style={[styles.logoutGlass, { borderColor: colors.error + '30' }]}
                        >
                            <LogOut size={18} color={colors.error} strokeWidth={2.5} />
                            <Text style={[styles.logoutText, { color: colors.error }]}>Log Out of Session</Text>
                        </BlurView>
                    </TouchableOpacity>
                </Animated.View>

                <Text style={[styles.version, { color: colors.mutedForeground }]}>NyraAI Mobile v1.0.4</Text>
                <View style={{ height: layout.tabBarHeight + 16 }} />
            </ScrollView>
        </View>
    );
};

const TILE_W = (layout.screenWidth - layout.px * 2 - 14) / 2;

const styles = StyleSheet.create({
    screen: { flex: 1 },
    scroll: { paddingHorizontal: 20 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 32, paddingHorizontal: 4 },
    avatarCircle: {
        width: 50, height: 50, borderRadius: 18, justifyContent: 'center', alignItems: 'center',
        borderWidth: 1.5, overflow: 'hidden',
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16 }, android: { elevation: 8 } }),
    },
    avatarGlow: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', top: -20, left: -20 },
    userName: { fontSize: 22, fontWeight: '900', letterSpacing: -0.8 },
    userRole: { fontSize: 13, fontWeight: '800', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
    sectionLabel: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14, marginLeft: 4, opacity: 0.5 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
    tileWrap: { width: (layout.screenWidth - 40 - 12) / 2 },
    tile: {
        borderRadius: 26, borderWidth: 1, overflow: 'hidden', padding: 20, gap: 14, alignItems: 'flex-start',
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 20 }, android: { elevation: 6 } }),
    },
    tileShimmer: { position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, opacity: 0.7 },
    tileIcon: { width: 48, height: 48, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    tileLabel: { fontSize: 14, fontWeight: '900', letterSpacing: -0.3, opacity: 0.8 },
    glassCard: {
        borderRadius: 26, borderWidth: 1, overflow: 'hidden', marginBottom: 12,
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12 }, android: { elevation: 4 } }),
    },
    cardShimmer: { position: 'absolute', top: 0, left: 0, right: 0, height: 1.5 },
    navRow: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
    navIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    navLabel: { flex: 1, fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.6 },
    logoutRow: { marginTop: 12 },
    logoutGlass: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 18, borderRadius: 24, borderWidth: 1.5, overflow: 'hidden' },
    logoutText: { fontSize: 16, fontWeight: '900', letterSpacing: -0.2 },
    version: { textAlign: 'center', fontSize: 12, fontWeight: '800', marginTop: 24, opacity: 0.3, letterSpacing: 1 },
});

export default MoreScreen;
