import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Activity, Users, Calendar, TrendingUp, RefreshCw } from 'lucide-react-native';
import { patientApi } from '../api/patients';
import { appointmentApi } from '../api/appointments';

const DashboardScreen = () => {
    const { colors } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [totalPatients, setTotalPatients] = useState(null);
    const [todayAppts, setTodayAppts] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);

    const fetchDashboardData = useCallback(async () => {
        try {
            // Fetch patients count + recent list
            const patientsRes = await patientApi.getAll({ limit: 5 }).catch(() => null);
            if (patientsRes) {
                const raw = patientsRes.data?.patients || patientsRes.data?.data || patientsRes.data || [];
                const list = Array.isArray(raw) ? raw : [];
                setRecentActivity(list.slice(0, 3));
                // Use totalCount if backend provides it, otherwise fallback to list length
                const total = patientsRes.data?.total || patientsRes.data?.totalCount || list.length;
                setTotalPatients(total);
            }

            // Fetch today's appointments
            const today = new Date().toISOString().split('T')[0];
            const apptRes = await appointmentApi.getAll({ date: today, limit: 100 }).catch(() => null);
            if (apptRes) {
                const appts = apptRes.data?.appointments || apptRes.data?.data || apptRes.data || [];
                setTodayAppts(Array.isArray(appts) ? appts.length : 0);
            }
        } catch (error) {
            console.error('Dashboard fetch error:', error?.response?.data || error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    const stats = [
        { label: 'Total Patients', value: totalPatients != null ? String(totalPatients) : '—', icon: Users, color: '#3b82f6' },
        { label: "Today's Appts", value: todayAppts != null ? String(todayAppts) : '—', icon: Calendar, color: '#10b981' },
        { label: 'Active Cases', value: '—', icon: Activity, color: colors.primary },
        { label: 'Revenue', value: '—', icon: TrendingUp, color: '#f59e0b' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                <View style={styles.welcomeSection}>
                    <Text style={[styles.welcomeText, { color: colors.mutedForeground }]}>Welcome back,</Text>
                    <Text style={[styles.userName, { color: colors.foreground }]}>{user?.name || 'Doctor'}</Text>
                    {user?.role ? (
                        <Text style={[styles.roleText, { color: colors.primary }]}>
                            {user.role.replace(/_/g, ' ')}
                        </Text>
                    ) : null}
                </View>

                <View style={styles.statsGrid}>
                    {stats.map((stat, index) => (
                        <View
                            key={index}
                            style={[
                                styles.statCard,
                                { backgroundColor: colors.card, borderColor: colors.cardBorder }
                            ]}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: stat.color + '20' }]}>
                                <stat.icon size={20} color={stat.color} />
                            </View>
                            {loading ? (
                                <ActivityIndicator size="small" color={stat.color} style={{ marginVertical: 4 }} />
                            ) : (
                                <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
                            )}
                            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Patients</Text>
                    {loading ? (
                        <View style={[styles.placeholderCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                            <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                    ) : recentActivity.length > 0 ? (
                        recentActivity.map((item, idx) => (
                            <View key={idx} style={[styles.activityItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                                <View style={[styles.activityIcon, { backgroundColor: colors.accentSoft }]}>
                                    <Users size={16} color={colors.primary} />
                                </View>
                                <View style={styles.activityContent}>
                                    <Text style={[styles.activityText, { color: colors.foreground }]}>
                                        {item.name || 'Unknown Patient'}
                                    </Text>
                                    <Text style={[styles.activityTime, { color: colors.mutedForeground }]}>
                                        {item.phone || 'No phone'}
                                    </Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={[styles.placeholderCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                            <Text style={{ color: colors.mutedForeground }}>No recent patients to show.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    welcomeSection: {
        marginBottom: 25,
    },
    welcomeText: {
        fontSize: 14,
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
    },
    roleText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 2,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 25,
    },
    statCard: {
        width: '48%',
        borderRadius: 16,
        padding: 16,
        marginBottom: 15,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 15,
    },
    placeholderCard: {
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 100,
    },
    activityItem: {
        flexDirection: 'row',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 10,
        alignItems: 'center',
    },
    activityIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    activityContent: {
        flex: 1,
    },
    activityText: {
        fontSize: 14,
        marginBottom: 2,
    },
    activityTime: {
        fontSize: 12,
    },
});

export default DashboardScreen;
