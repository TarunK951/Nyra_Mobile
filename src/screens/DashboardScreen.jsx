import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, ScrollView, ActivityIndicator,
    TouchableOpacity, RefreshControl, Platform, Dimensions
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Activity, Users, Calendar, TrendingUp, ChevronRight, User, AlertCircle } from 'lucide-react-native';
import { patientApi } from '../api/patients';
import { appointmentApi } from '../api/appointments';
import { layout } from '../utils/layout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 12;
const CONTENT_PADDING = 20;
const CARD_WIDTH = (SCREEN_WIDTH - (CONTENT_PADDING * 2) - GRID_GAP) / 2;

const DashboardScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [totalPatients, setTotalPatients] = useState(null);
    const [todayAppts, setTodayAppts] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [error, setError] = useState(null);

    const fetchDashboardData = useCallback(async () => {
        try {
            setError(null);
            // Fetch patients count + recent list
            const patientsRes = await patientApi.getAll({ limit: 5 }).catch((e) => {
                console.error('[Dashboard] Patients error:', e.message);
                return null;
            });

            if (patientsRes && patientsRes.data) {
                const data = patientsRes.data;
                const rawList = data?.patients || data?.data || (Array.isArray(data) ? data : []);
                setRecentActivity(Array.isArray(rawList) ? rawList.slice(0, 3) : []);
                const total = data?.total || data?.meta?.total || data?.count || (Array.isArray(rawList) ? rawList.length : 0);
                setTotalPatients(total);
            }

            // Fetch today's appointments
            const today = new Date().toISOString().split('T')[0];
            const apptRes = await appointmentApi.getAll({ date: today, limit: 10 }).catch((e) => {
                console.error('[Dashboard] Appts error:', e.message);
                return null;
            });

            if (apptRes && apptRes.data) {
                const data = apptRes.data;
                const rawAppts = data?.appointments || data?.data || (Array.isArray(data) ? data : []);
                setTodayAppts(data?.total || (Array.isArray(rawAppts) ? rawAppts.length : 0));
            }

            if (!patientsRes && !apptRes) {
                setError("Unable to connect to server. Please check your network.");
            }
        } catch (err) {
            console.error('Dashboard error:', err.message);
            setError("Something went wrong.");
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
        { label: 'Total Patients', value: totalPatients !== null ? String(totalPatients) : '—', icon: Users, color: '#3b82f6' },
        { label: "Today's Appts", value: todayAppts !== null ? String(todayAppts) : '—', icon: Calendar, color: '#10b981' },
        { label: 'Active Cases', value: '—', icon: Activity, color: colors.primary },
        { label: 'Revenue', value: '—', icon: TrendingUp, color: '#f59e0b' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: layout.statusBarHeight }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Welcome back,</Text>
                        <Text style={[styles.userName, { color: colors.foreground }]}>{user?.name || 'Practitioner'}</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.profileCircle, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}
                        onPress={() => navigation?.navigate('Profile')}
                    >
                        <User size={22} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {error && (
                    <View style={[styles.errorCard, { backgroundColor: '#fee2e2', borderColor: '#fecaca' }]}>
                        <AlertCircle size={18} color="#dc2626" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                <View style={styles.statsGrid}>
                    {stats.map((stat, index) => (
                        <View
                            key={index}
                            style={[
                                styles.statCard,
                                { backgroundColor: colors.card, borderColor: colors.cardBorder, width: CARD_WIDTH }
                            ]}
                        >
                            <View style={[styles.statIconBox, { backgroundColor: stat.color + '15' }]}>
                                <stat.icon size={20} color={stat.color} strokeWidth={2.5} />
                            </View>
                            <View style={styles.statData}>
                                {loading && stat.value === '—' ? (
                                    <ActivityIndicator size="small" color={stat.color} style={styles.statLoader} />
                                ) : (
                                    <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
                                )}
                                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Patients</Text>
                    <TouchableOpacity onPress={() => navigation?.navigate('Patients')}>
                        <Text style={[styles.seeAll, { color: colors.primary }]}>View All</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.listWrapper, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    {loading && recentActivity.length === 0 ? (
                        <View style={styles.loaderBox}>
                            <ActivityIndicator color={colors.primary} />
                        </View>
                    ) : recentActivity.length > 0 ? (
                        recentActivity.map((patient, idx) => (
                            <TouchableOpacity
                                key={patient.id || idx}
                                style={[
                                    styles.itemRow,
                                    idx !== recentActivity.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                                ]}
                                onPress={() => navigation?.navigate('Patients', { screen: 'PatientDetail', params: { patientId: patient.id } })}
                            >
                                <View style={[styles.avatarSmall, { backgroundColor: colors.accentSoft }]}>
                                    <Text style={[styles.avatarLetter, { color: colors.primary }]}>
                                        {(patient.name || 'P').charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <View style={styles.itemInfo}>
                                    <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
                                        {patient.name || 'Unknown'}
                                    </Text>
                                    <Text style={[styles.itemSub, { color: colors.mutedForeground }]}>
                                        {patient.phone || 'No phone'} • {patient.gender || '—'}
                                    </Text>
                                </View>
                                <ChevronRight size={18} color={colors.mutedForeground} opacity={0.6} />
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.emptyBox}>
                            <Users size={32} color={colors.mutedForeground} opacity={0.4} />
                            <Text style={{ color: colors.mutedForeground, marginTop: 8 }}>No recent patient records.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingHorizontal: CONTENT_PADDING, paddingBottom: 40 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 24 },
    greeting: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
    userName: { fontSize: 26, fontWeight: '800', letterSpacing: -0.6 },
    profileCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    errorCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 20, gap: 10 },
    errorText: { fontSize: 13, color: '#b91c1c', fontWeight: '500', flex: 1 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP, marginBottom: 25 },
    statCard: {
        padding: 16, borderRadius: 22, borderWidth: 1, minHeight: 115,
        justifyContent: 'space-between',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
            android: { elevation: 3 }
        })
    },
    statIconBox: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    statData: { gap: 2 },
    statValue: { fontSize: 20, fontWeight: '800' },
    statLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
    statLoader: { alignSelf: 'flex-start', marginVertical: 4 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 8 },
    sectionTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.4 },
    seeAll: { fontSize: 14, fontWeight: '600' },
    listWrapper: { borderRadius: 22, borderWidth: 1, overflow: 'hidden' },
    itemRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    avatarSmall: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarLetter: { fontSize: 16, fontWeight: '700' },
    itemInfo: { flex: 1, gap: 2 },
    itemName: { fontSize: 15, fontWeight: '700' },
    itemSub: { fontSize: 13, fontWeight: '500' },
    loaderBox: { padding: 40, alignItems: 'center' },
    emptyBox: { padding: 40, alignItems: 'center', gap: 6 },
});

export default DashboardScreen;
