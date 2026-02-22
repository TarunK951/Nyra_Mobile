// ─── iOS 26 Dashboard — Polished ─────────────────────────────────
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    StyleSheet, View, Text, ScrollView, ActivityIndicator,
    TouchableOpacity, RefreshControl, Platform, Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
    Users, Calendar, TrendingUp, ChevronRight,
    Bell, Stethoscope, Activity, AlertCircle, User,
    History, Menu,
} from 'lucide-react-native';
import { patientApi } from '../api/patients';
import { appointmentApi } from '../api/appointments';
import LiquidGlass from '../components/LiquidGlass';
import { layout } from '../utils/layout';
import { useFadeIn, useSlideUp, useStagger, useScalePressAnim } from '../utils/animations';

const CARD_W = (layout.screenWidth - layout.px * 2 - 14) / 2;

// ── Animated stat card ────────────────────────────────────────────
const StatCard = ({ stat, colors, delay }) => {
    const { translateY, opacity } = useSlideUp(delay, 22);
    const { scale, pressIn, pressOut } = useScalePressAnim();
    const g = colors.glass;

    return (
        <Animated.View style={{ opacity, transform: [{ translateY }, { scale }], width: CARD_W }}>
            <TouchableOpacity onPressIn={pressIn} onPressOut={pressOut} activeOpacity={1}>
                <LiquidGlass
                    intensity={g.blur}
                    tint={g.tint}
                    padding={16}
                    borderRadius={22}
                    style={{ minHeight: 125, justifyContent: 'space-between' }}
                >
                    <View style={[styles.statIconWrap, { backgroundColor: stat.color + '12' }]}>
                        <stat.icon size={18} color={stat.color} strokeWidth={2.5} />
                    </View>
                    <View style={styles.statValueRow}>
                        <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
                    </View>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
                </LiquidGlass>
            </TouchableOpacity>
        </Animated.View>
    );
};

// ── Recent patient row ────────────────────────────────────────────
const PatientRow = ({ patient, index, colors, onPress, anim }) => {
    const initials = (patient.name || 'P').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return (
        <Animated.View style={anim ? { opacity: anim.opacity, transform: [{ translateY: anim.translateY }] } : {}}>
            <TouchableOpacity onPress={onPress} activeOpacity={0.8}
                style={[styles.patientRow, index > 0 && { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }]}>
                <View style={[styles.avatar, { backgroundColor: colors.primary + '12' }]}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.patName, { color: colors.foreground }]} numberOfLines={1}>{patient.name || 'Unknown'}</Text>
                    <View style={styles.patMetaRow}>
                        <Text style={[styles.patMeta, { color: colors.mutedForeground }]}>
                            {patient.phone || 'No phone'}
                        </Text>
                        <View style={[styles.metaDot, { backgroundColor: colors.mutedForeground }]} />
                        <Text style={[styles.patMeta, { color: colors.mutedForeground }]}>
                            {patient.gender || 'N/A'}
                        </Text>
                    </View>
                </View>
                <View style={[styles.rowArrow, { backgroundColor: colors.muted }]}>
                    <ChevronRight size={14} color={colors.foreground} strokeWidth={3} />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

// ── Quick action card ─────────────────────────────────────────────
const QuickAction = ({ icon: Icon, label, color, onPress, colors }) => {
    const { scale, pressIn, pressOut } = useScalePressAnim();
    const g = colors.glass;
    return (
        <Animated.View style={{ transform: [{ scale }], flex: 1 }}>
            <TouchableOpacity onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={1}>
                <LiquidGlass
                    intensity={g.blur}
                    tint={g.tint}
                    padding={12}
                    borderRadius={18}
                    style={{ alignItems: 'center', gap: 6 }}
                >
                    <View style={[styles.qaIcon, { backgroundColor: color + '12' }]}>
                        <Icon size={18} color={color} strokeWidth={2.5} />
                    </View>
                    <Text style={[styles.qaLabel, { color: colors.foreground }]}>{label}</Text>
                </LiquidGlass>
            </TouchableOpacity>
        </Animated.View>
    );
};

const DashboardScreen = ({ navigation }) => {
    const { colors, themeMode } = useTheme();
    const { user } = useAuth();
    const g = colors.glass;

    const [totalPatients, setTotalPatients] = useState(null);
    const [todayAppts, setTodayAppts] = useState(null);
    const [recentPatients, setRecentPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const headerOp = useFadeIn(0);
    const staggerAnims = useStagger(4, 80);

    const fetchData = useCallback(async () => {
        try {
            setError(null);
            const [pr, ar] = await Promise.allSettled([
                patientApi.getAll({ limit: 5 }),
                appointmentApi.getAll({ date: new Date().toISOString().split('T')[0] }),
            ]);

            if (pr.status === 'fulfilled' && pr.value?.data) {
                const d = pr.value.data;
                const arr = d?.patients || d?.data || (Array.isArray(d) ? d : []);
                setRecentPatients(Array.isArray(arr) ? arr.slice(0, 4) : []);
                setTotalPatients(d?.total ?? d?.meta?.total ?? (Array.isArray(arr) ? arr.length : null));
            }
            if (ar.status === 'fulfilled' && ar.value?.data) {
                const d = ar.value.data;
                const arr = d?.appointments || d?.data || (Array.isArray(d) ? d : []);
                setTodayAppts(d?.total ?? (Array.isArray(arr) ? arr.length : 0));
            }
        } catch (e) {
            setError('Could not load dashboard data.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const hourNow = new Date().getHours();
    const greetStr = hourNow < 12 ? 'Good morning' : hourNow < 17 ? 'Good afternoon' : 'Good evening';
    const firstName = (user?.name || 'Doctor').split(' ')[0];

    const stats = [
        { label: 'Total Patients', value: loading ? '…' : (totalPatients ?? '0'), icon: Users, color: colors.primary, sub: '+3 this week' },
        { label: "Today's Appts", value: loading ? '…' : (todayAppts ?? '0'), icon: Calendar, color: '#10b981', sub: 'Next: 10:30 AM' },
        { label: 'Doctors Active', value: '12', icon: Stethoscope, color: '#8b5cf6', sub: 'Live now' },
        { label: 'Pending Calls', value: '08', icon: Activity, color: '#f59e0b', sub: 'Urgent' },
    ];

    return (
        <View style={[styles.screen, { backgroundColor: colors.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchData(); }}
                        tintColor={colors.primary}
                        progressViewOffset={layout.statusBarHeight}
                    />
                }
                contentContainerStyle={[styles.scroll, { paddingTop: layout.statusBarHeight + 14 }]}
            >
                {/* Header */}
                <Animated.View style={[styles.header, { opacity: headerOp }]}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity
                            onPress={() => navigation.openDrawer()}
                            activeOpacity={0.8}
                            style={[styles.menuBtn, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '20' }]}
                        >
                            <Menu size={26} color={colors.primary} strokeWidth={2.5} />
                        </TouchableOpacity>
                        <View>
                            <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{user?.name?.split(' ')[0] || 'Doctor'}</Text>
                            <Text style={[styles.greeting, { color: colors.mutedForeground, marginTop: 1 }]}>{user?.role?.replace('_', ' ') || 'HEALTHCARE'}</Text>
                        </View>
                    </View>

                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Conversations')}
                            activeOpacity={0.7}
                            style={styles.headerIconBtn}
                        >
                            <LiquidGlass intensity={20} tint={g.tint} style={styles.iconBlur} padding={0} borderRadius={15}>
                                <History size={22} color={colors.foreground} strokeWidth={2.2} />
                            </LiquidGlass>
                        </TouchableOpacity>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            style={styles.headerIconBtn}
                        >
                            <LiquidGlass intensity={20} tint={g.tint} style={styles.iconBlur} padding={0} borderRadius={15}>
                                <Bell size={22} color={colors.foreground} strokeWidth={2.2} />
                                <View style={[styles.notifDot, { backgroundColor: colors.error }]} />
                            </LiquidGlass>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* Error banner */}
                {error && (
                    <BlurView
                        intensity={g.blur} tint={g.tint}
                        experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                        style={[styles.errBanner, { borderColor: colors.error + '40' }]}
                    >
                        <AlertCircle size={15} color={colors.error} />
                        <Text style={[styles.errText, { color: colors.error }]}>{error}</Text>
                    </BlurView>
                )}

                {/* Stats grid */}
                <View style={styles.statsGrid}>
                    {stats.map((s, i) => <StatCard key={i} stat={s} colors={colors} delay={i * 65} />)}
                </View>

                {/* Quick actions */}
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
                <View style={styles.qaRow}>
                    <QuickAction icon={Calendar} label="Schedule" color="#2563eb" colors={colors}
                        onPress={() => navigation.navigate('Appointments')} />
                    <QuickAction icon={Users} label="Patients" color="#7c3aed" colors={colors}
                        onPress={() => navigation.navigate('Patients')} />
                    <QuickAction icon={Activity} label="Calls" color="#059669" colors={colors}
                        onPress={() => navigation.navigate('Conversations')} />
                </View>

                {/* Recent Patients */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Patients</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Patients')}>
                        <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
                    </TouchableOpacity>
                </View>

                <LiquidGlass
                    intensity={g.blurStrong} tint={g.tint}
                    padding={0}
                    containerStyle={styles.listCard}
                >
                    {loading ? (
                        <View style={styles.loader}><ActivityIndicator color={colors.primary} /></View>
                    ) : recentPatients.length > 0 ? (
                        recentPatients.map((p, i) => (
                            <PatientRow
                                key={p.id ?? i}
                                patient={p} index={i} colors={colors}
                                anim={staggerAnims[Math.min(i, staggerAnims.length - 1)]}
                                onPress={() => navigation.navigate('Patients', {
                                    screen: 'PatientDetail',
                                    params: { patientId: p.id || p._id, patient: p },
                                })}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyBox}>
                            <Users size={40} color={colors.mutedForeground} opacity={0.2} />
                            <Text style={[styles.emptyTxt, { color: colors.mutedForeground }]}>No recent patients</Text>
                        </View>
                    )}
                </LiquidGlass>

                <View style={{ height: layout.tabBarHeight + 24 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1 },
    screen: { flex: 1 },
    scroll: { paddingHorizontal: 20 },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
    menuBtn: { width: 52, height: 52, borderRadius: 18, borderWith: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    greeting: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.6 },
    name: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
    headerRight: { flexDirection: 'row', gap: 12 },
    headerIconBtn: { borderRadius: 16, overflow: 'hidden' },
    iconBlur: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    notifDot: { position: 'absolute', top: 13, right: 13, width: 7, height: 7, borderRadius: 3.5, borderWidth: 1.5, borderColor: '#000' },

    errBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        padding: 14, borderRadius: 18, borderWidth: 1,
        marginBottom: 24, overflow: 'hidden',
    },
    errText: { fontSize: 14, fontWeight: '700', flex: 1 },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    statIconWrap: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    statValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    statValue: { fontSize: 24, fontWeight: '900', letterSpacing: -0.8 },
    statLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, opacity: 0.6 },
    statSub: { fontSize: 10, fontWeight: '700', marginTop: 4, opacity: 0.8 },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 10 },
    sectionTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    seeAll: { fontSize: 13, fontWeight: '800', opacity: 0.6 },

    qaRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    qaIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    qaLabel: { fontSize: 11, fontWeight: '800', letterSpacing: -0.2 },

    listCard: {
        borderRadius: 22, borderWidth: 1, overflow: 'hidden',
    },
    listShimmer: { position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, zIndex: 1 },
    patientRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
    avatar: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 15, fontWeight: '900' },
    patName: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
    patMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    patMeta: { fontSize: 11, fontWeight: '600', opacity: 0.6 },
    metaDot: { width: 3, height: 3, borderRadius: 1.5, opacity: 0.3 },
    rowArrow: { width: 24, height: 24, borderRadius: 8, justifyContent: 'center', alignItems: 'center', opacity: 0.5 },

    loader: { padding: 40, alignItems: 'center' },
    emptyBox: { padding: 40, alignItems: 'center', gap: 12 },
    emptyTxt: { fontSize: 14, fontWeight: '700', opacity: 0.4 },
});

export default DashboardScreen;
