// ─── iOS 26 Liquid Glass — Profile Screen ────────────────────────
import React, { useRef } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform, Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { LogOut, User, Mail, Shield, Bell, Lock, ChevronRight, Moon, Sun } from 'lucide-react-native';
import { layout } from '../utils/layout';
import { useStagger, useScalePressAnim, SPRING } from '../utils/animations';

const GlassMenuRow = ({ icon: Icon, label, color, onPress, index, colors, anim }) => {
    const g = colors.glass;
    const { scale, pressIn, pressOut } = useScalePressAnim();
    return (
        <Animated.View style={anim ? { opacity: anim.opacity, transform: [{ translateY: anim.translateY }, { scale }] } : { transform: [{ scale }] }}>
            <TouchableOpacity
                onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}
                activeOpacity={1}
                style={[styles.menuRow, { borderTopWidth: index > 0 ? 1 : 0, borderTopColor: g.borderSubtle }]}
            >
                <View style={[styles.menuIcon, { backgroundColor: (color || colors.primary) + '10' }]}>
                    <Icon size={18} color={color || colors.primary} strokeWidth={2.5} />
                </View>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>{label}</Text>
                <ChevronRight size={14} color={colors.mutedForeground} strokeWidth={3} opacity={0.5} />
            </TouchableOpacity>
        </Animated.View>
    );
};

const ProfileScreen = () => {
    const { user, logout } = useAuth();
    const { colors, themeMode, toggleTheme } = useTheme();
    const g = colors.glass;

    const staggerAnims = useStagger(8, 80);
    const { scale: logoutScale, pressIn, pressOut } = useScalePressAnim();

    const switchAnim = useRef(new Animated.Value(themeMode === 'dark' ? 1 : 0)).current;
    const handleToggle = () => {
        toggleTheme();
        Animated.spring(switchAnim, {
            toValue: themeMode === 'dark' ? 0 : 1,
            tension: 200, friction: 14, useNativeDriver: true,
        }).start();
    };
    const thumbX = switchAnim.interpolate({ inputRange: [0, 1], outputRange: [2, 22] });

    const menuItems = [
        { icon: Mail, label: 'Email', value: user?.email || 'N/A', color: colors.primary },
        { icon: Shield, label: 'Role', value: (user?.role || 'Staff').replace(/_/g, ' '), color: '#6366f1' },
        { icon: Bell, label: 'Notifications', color: '#f59e0b' },
        { icon: Lock, label: 'Security', color: '#ef4444' },
    ];

    return (
        <View style={[styles.screen, { backgroundColor: colors.background }]}>
            {/* Rich Apple Background Layering */}
            <View style={[styles.bgGlow, { backgroundColor: colors.primary + '10' }]} />
            <View style={[styles.bgGlowSecondary, { backgroundColor: '#a855f708' }]} />

            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingTop: layout.statusBarHeight + 30 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero avatar */}
                <Animated.View style={staggerAnims[0] ? { opacity: staggerAnims[0].opacity, transform: [{ translateY: staggerAnims[0].translateY }], alignItems: 'center', marginBottom: 32, gap: 14 } : { alignItems: 'center', marginBottom: 32, gap: 14 }}>
                    <BlurView
                        intensity={g.blurStrong}
                        tint={g.tint}
                        experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                        style={[styles.avatarWrap, { borderColor: g.border }]}
                    >
                        <View style={styles.avatarGlow} />
                        <View style={[styles.avatarInner, { backgroundColor: colors.primary + '12' }]}>
                            <User size={48} color={colors.primary} strokeWidth={2.5} />
                        </View>
                    </BlurView>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={[styles.name, { color: colors.foreground }]}>{user?.name || 'Practitioner Name'}</Text>
                        <Text style={[styles.roleSub, { color: colors.primary }]}>
                            {(user?.role || 'Healthcare Professional').replace(/_/g, ' ').toUpperCase()}
                        </Text>
                    </View>
                </Animated.View>

                {/* Account info card */}
                <Animated.View style={staggerAnims[1] ? { opacity: staggerAnims[1].opacity, transform: [{ translateY: staggerAnims[1].translateY }] } : {}}>
                    <BlurView
                        intensity={g.blur}
                        tint={g.tint}
                        experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                        style={[styles.glassCard, { borderColor: g.border }]}
                    >
                        <View style={[styles.cardShimmer, { backgroundColor: g.shimmer }]} />
                        {menuItems.map((m, i) => (
                            <GlassMenuRow
                                key={m.label} {...m} index={i}
                                colors={colors} anim={staggerAnims[i + 2]}
                            />
                        ))}
                    </BlurView>
                </Animated.View>

                {/* Theme toggle */}
                <Animated.View style={staggerAnims[6] ? { opacity: staggerAnims[6].opacity, transform: [{ translateY: staggerAnims[6].translateY }] } : {}}>
                    <BlurView
                        intensity={g.blur}
                        tint={g.tint}
                        experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                        style={[styles.themeCard, { borderColor: g.border }]}
                    >
                        <View style={[styles.cardShimmer, { backgroundColor: g.shimmer }]} />
                        <View style={styles.themeRow}>
                            <View style={[styles.themeIcon, { backgroundColor: themeMode === 'dark' ? '#5c67f215' : '#f59e0b15' }]}>
                                {themeMode === 'dark'
                                    ? <Moon size={18} color="#818cf8" strokeWidth={2.5} />
                                    : <Sun size={18} color="#f59e0b" strokeWidth={2.5} />
                                }
                            </View>
                            <Text style={[styles.themeLabel, { color: colors.foreground }]}>
                                {themeMode === 'dark' ? 'MIDNIGHT THEME' : 'DAYLIGHT THEME'}
                            </Text>
                            <TouchableOpacity onPress={handleToggle} activeOpacity={0.9}>
                                <View style={[styles.switchTrack, { backgroundColor: themeMode === 'dark' ? colors.primary : colors.muted }]}>
                                    <Animated.View style={[styles.switchThumb, { transform: [{ translateX: thumbX }] }]} />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </Animated.View>

                {/* Logout */}
                <Animated.View style={staggerAnims[7] ? { opacity: staggerAnims[7].opacity, transform: [{ translateY: staggerAnims[7].translateY }, { scale: logoutScale }], marginTop: 8 } : { transform: [{ scale: logoutScale }], marginTop: 8 }}>
                    <TouchableOpacity
                        onPress={logout} onPressIn={pressIn} onPressOut={pressOut}
                        activeOpacity={1}
                    >
                        <BlurView
                            intensity={g.blur}
                            tint={g.tint}
                            experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                            style={[styles.logoutCard, { borderColor: colors.error + '30' }]}
                        >
                            <LogOut size={20} color={colors.error} strokeWidth={2.5} />
                            <Text style={[styles.logoutText, { color: colors.error }]}>Log Out Session</Text>
                        </BlurView>
                    </TouchableOpacity>
                </Animated.View>

                <Text style={[styles.version, { color: colors.mutedForeground }]}>
                    NYRAAI MOBILE • VERSION 1.0.4
                </Text>
                <View style={{ height: layout.tabBarHeight + 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1 },
    bgGlow: { position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: 200, opacity: 0.6 },
    bgGlowSecondary: { position: 'absolute', bottom: -150, left: -150, width: 500, height: 500, borderRadius: 250, opacity: 0.4 },
    scroll: { paddingHorizontal: 20 },
    avatarWrap: {
        width: 104, height: 104, borderRadius: 38, overflow: 'hidden', borderWidth: 1.5,
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24 }, android: { elevation: 12 } }),
    },
    avatarGlow: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.08)', top: -30, left: -30 },
    avatarInner: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    name: { fontSize: 32, fontWeight: '900', letterSpacing: -1.2, textAlign: 'center' },
    roleSub: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginTop: 4, opacity: 0.8 },

    glassCard: {
        borderRadius: 28, borderWidth: 1, overflow: 'hidden', marginBottom: 16,
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 20 }, android: { elevation: 6 } }),
    },
    cardShimmer: { position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, opacity: 0.8 },
    menuRow: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
    menuIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    menuLabel: { flex: 1, fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },

    themeCard: { borderRadius: 24, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
    themeRow: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
    themeIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    themeLabel: { flex: 1, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.6 },
    switchTrack: { width: 50, height: 28, borderRadius: 14, justifyContent: 'center', paddingHorizontal: 3 },
    switchThumb: {
        width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff',
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6 }, android: { elevation: 4 } }),
    },

    logoutCard: {
        borderRadius: 24, borderWidth: 1.5, overflow: 'hidden',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 18,
    },
    logoutText: { fontSize: 17, fontWeight: '900', letterSpacing: -0.4 },
    version: { textAlign: 'center', fontSize: 10, fontWeight: '800', marginTop: 32, opacity: 0.25, letterSpacing: 2 },
});

export default ProfileScreen;
