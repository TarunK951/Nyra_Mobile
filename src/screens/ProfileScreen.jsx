import React from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity,
    ScrollView, Image, Platform, Dimensions
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { LogOut, User, Mail, Shield, Settings, Moon, Sun, ChevronRight, Bell, CreditCard, Lock } from 'lucide-react-native';
import { layout } from '../utils/layout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ProfileScreen = () => {
    const { user, logout } = useAuth();
    const { colors, themeMode, toggleTheme } = useTheme();

    const menuItems = [
        { id: 'profile', label: 'Personal Information', icon: User, color: colors.primary },
        { id: 'notif', label: 'Notifications', icon: Bell, color: '#f59e0b' },
        { id: 'billing', label: 'Billing & Subscriptions', icon: CreditCard, color: '#10b981' },
        { id: 'security', label: 'Security & Password', icon: Lock, color: '#ef4444' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: layout.statusBarHeight }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Header / Avatar */}
                <View style={styles.header}>
                    <View style={[styles.avatarBox, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                        <User size={42} color={colors.primary} strokeWidth={1.5} />
                        <TouchableOpacity style={[styles.editBadge, { backgroundColor: colors.primary }]}>
                            <Settings size={12} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.userName, { color: colors.foreground }]}>{user?.name || 'Practitioner'}</Text>
                    <Text style={[styles.userRole, { color: colors.mutedForeground }]}>{user?.role?.replace(/_/g, ' ') || 'Healthcare Staff'}</Text>
                </View>

                {/* Info Card */}
                <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <View style={styles.infoRow}>
                        <Mail size={18} color={colors.mutedForeground} />
                        <View style={styles.infoText}>
                            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Email Address</Text>
                            <Text style={[styles.infoValue, { color: colors.foreground }]}>{user?.email || 'N/A'}</Text>
                        </View>
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.infoRow}>
                        <Shield size={18} color={colors.mutedForeground} />
                        <View style={styles.infoText}>
                            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Hospital ID</Text>
                            <Text style={[styles.infoValue, { color: colors.foreground }]}>{user?.hospitalId || 'N/A'}</Text>
                        </View>
                    </View>
                </View>

                {/* Settings Section */}
                <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Account Settings</Text>
                <View style={[styles.menuWrapper, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    {menuItems.map((item, idx) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.menuRow, idx !== menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                        >
                            <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                                <item.icon size={18} color={item.color} />
                            </View>
                            <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
                            <ChevronRight size={16} color={colors.mutedForeground} opacity={0.6} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Theme Toggle */}
                <View style={[styles.themeCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <View style={styles.themeLeft}>
                        {themeMode === 'dark' ? <Moon size={20} color={colors.primary} /> : <Sun size={20} color="#f59e0b" />}
                        <Text style={[styles.themeLabel, { color: colors.foreground }]}>Dark Appearance</Text>
                    </View>
                    <TouchableOpacity onPress={toggleTheme} style={[styles.switch, { backgroundColor: themeMode === 'dark' ? colors.primary : colors.muted }]}>
                        <View style={[styles.switchThumb, { transform: [{ translateX: themeMode === 'dark' ? 20 : 2 }] }]} />
                    </TouchableOpacity>
                </View>

                {/* Logout */}
                <TouchableOpacity
                    style={[styles.logoutBtn, { borderColor: colors.destructive + '40' }]}
                    onPress={logout}
                >
                    <LogOut size={20} color={colors.destructive} />
                    <Text style={[styles.logoutText, { color: colors.destructive }]}>Sign Out</Text>
                </TouchableOpacity>

                <Text style={[styles.version, { color: colors.mutedForeground }]}>NyraAI Mobile v1.0.4 (Stable)</Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    header: { alignItems: 'center', marginVertical: 30 },
    avatarBox: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', borderWidth: 2, position: 'relative' },
    editBadge: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
    userName: { fontSize: 24, fontWeight: '800', marginTop: 15, letterSpacing: -0.5 },
    userRole: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 4 },
    infoCard: { borderRadius: 24, borderWidth: 1, padding: 10, marginTop: 10 },
    infoRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
    infoText: { marginLeft: 15, gap: 2 },
    infoLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    infoValue: { fontSize: 15, fontWeight: '600' },
    divider: { height: 1, marginHorizontal: 15 },
    sectionTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginTop: 30, marginBottom: 12, marginLeft: 6 },
    menuWrapper: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
    menuRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    menuLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
    themeCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderRadius: 24, borderWidth: 1, marginTop: 20 },
    themeLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    themeLabel: { fontSize: 15, fontWeight: '600' },
    switch: { width: 44, height: 24, borderRadius: 12, justifyContent: 'center' },
    switchThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 20, borderWidth: 1.5, marginTop: 40 },
    logoutText: { fontSize: 16, fontWeight: '700' },
    version: { textAlign: 'center', fontSize: 12, marginTop: 20, opacity: 0.6 },
});

export default ProfileScreen;
