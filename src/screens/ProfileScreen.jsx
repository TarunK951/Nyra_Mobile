import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Image
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { LogOut, User, Mail, Shield, Settings, Moon, Sun } from 'lucide-react-native';

const ProfileScreen = () => {
    const { user, logout } = useAuth();
    const { colors, themeMode, toggleTheme } = useTheme();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View style={[styles.avatarContainer, { backgroundColor: colors.accentSoft }]}>
                        <User size={40} color={colors.primary} />
                    </View>
                    <Text style={[styles.userName, { color: colors.foreground }]}>{user?.name || 'User Profile'}</Text>
                    <Text style={[styles.userRole, { color: colors.mutedForeground }]}>{user?.role?.replace('_', ' ') || 'Staff'}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Account Information</Text>
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                        <View style={styles.infoRow}>
                            <Mail size={18} color={colors.mutedForeground} />
                            <View style={styles.infoTextContainer}>
                                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Email</Text>
                                <Text style={[styles.infoValue, { color: colors.foreground }]}>{user?.email || 'N/A'}</Text>
                            </View>
                        </View>
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <View style={styles.infoRow}>
                            <Shield size={18} color={colors.mutedForeground} />
                            <View style={styles.infoTextContainer}>
                                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Hospital ID</Text>
                                <Text style={[styles.infoValue, { color: colors.foreground }]}>{user?.hospitalId || 'N/A'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Preferences</Text>
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                        <TouchableOpacity style={styles.actionRow} onPress={toggleTheme}>
                            <View style={styles.actionLeft}>
                                {themeMode === 'dark' ? <Sun size={18} color={colors.foreground} /> : <Moon size={18} color={colors.foreground} />}
                                <Text style={[styles.actionLabel, { color: colors.foreground }]}>
                                    {themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'}
                                </Text>
                            </View>
                            <View style={[styles.toggleTrack, { backgroundColor: themeMode === 'dark' ? colors.primary : colors.muted }]}>
                                <View style={[styles.toggleThumb, {
                                    backgroundColor: '#fff',
                                    transform: [{ translateX: themeMode === 'dark' ? 18 : 2 }]
                                }]} />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.bottomSection}>
                    <TouchableOpacity
                        style={[styles.logoutButton, { borderColor: colors.destructive }]}
                        onPress={logout}
                    >
                        <LogOut size={20} color={colors.destructive} />
                        <Text style={[styles.logoutText, { color: colors.destructive }]}>Log Out</Text>
                    </TouchableOpacity>
                    <Text style={[styles.versionText, { color: colors.mutedForeground }]}>Version 1.0.0</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    userName: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 4,
    },
    userRole: {
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
        marginLeft: 5,
    },
    card: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    infoTextContainer: {
        marginLeft: 15,
    },
    infoLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        marginHorizontal: 15,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
    },
    actionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionLabel: {
        fontSize: 16,
        marginLeft: 15,
        fontWeight: '500',
    },
    toggleTrack: {
        width: 40,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
    },
    toggleThumb: {
        width: 18,
        height: 18,
        borderRadius: 9,
    },
    bottomSection: {
        marginTop: 20,
        alignItems: 'center',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 12,
        borderWidth: 1.5,
        width: '100%',
        marginBottom: 20,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    versionText: {
        fontSize: 12,
    },
});

export default ProfileScreen;
