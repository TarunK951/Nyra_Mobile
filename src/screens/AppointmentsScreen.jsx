// ─── iOS 26 Liquid Glass — Appointments Screen ───────────────────
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    StyleSheet, View, Text, FlatList, ActivityIndicator,
    TouchableOpacity, RefreshControl, Platform, Animated, ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeContext';
import { appointmentApi } from '../api/appointments';
import { Calendar, Clock, ChevronRight, Plus, AlertCircle, CheckCircle2, XCircle, Loader } from 'lucide-react-native';
import { layout } from '../utils/layout';
import { useStagger, useScalePressAnim, SPRING } from '../utils/animations';

const FILTERS = ['All', 'Confirmed', 'Pending', 'Cancelled'];

const STATUS_MAP = {
    CONFIRMED: { icon: CheckCircle2, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
    PENDING: { icon: Loader, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
    CANCELLED: { icon: XCircle, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
    DEFAULT: { icon: Calendar, color: '#6b7280', bg: 'rgba(107, 114, 128, 0.12)' },
};

const GlassFilterPill = ({ label, active, onPress, colors }) => {
    const { scale, pressIn, pressOut } = useScalePressAnim();
    const g = colors.glass;
    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={pressIn}
                onPressOut={pressOut}
                activeOpacity={1}
            >
                <BlurView
                    intensity={active ? 0 : g.blur}
                    tint={g.tint}
                    experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                    style={[
                        styles.pill,
                        {
                            borderColor: active ? colors.primary : g.border,
                            backgroundColor: active ? colors.primary : 'transparent'
                        }
                    ]}
                >
                    <View style={[styles.cardShimmer, { backgroundColor: g.shimmer }]} />
                    <Text style={[styles.pillText, { color: active ? '#fff' : colors.mutedForeground }]}>
                        {label}
                    </Text>
                </BlurView>
            </TouchableOpacity>
        </Animated.View>
    );
};

const AppointmentCard = ({ item, index, colors, onPress, anim }) => {
    const g = colors.glass;
    const { scale, pressIn, pressOut } = useScalePressAnim();

    const statusKey = item.status?.toUpperCase() || 'DEFAULT';
    const S = STATUS_MAP[statusKey] || STATUS_MAP.DEFAULT;
    const patient = item.patient || {};

    return (
        <Animated.View style={anim ? { opacity: anim.opacity, transform: [{ translateY: anim.translateY }, { scale }] } : { transform: [{ scale }] }}>
            <TouchableOpacity onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={1}>
                <BlurView
                    intensity={g.blur}
                    tint={g.tint}
                    experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                    style={[styles.card, { borderColor: g.border }]}
                >
                    <View style={[styles.cardShimmer, { backgroundColor: g.shimmer }]} />

                    {/* Left accented icon box */}
                    <View style={[styles.iconBox, { backgroundColor: S.color + '10' }]}>
                        <S.icon size={22} color={S.color} strokeWidth={2.5} />
                    </View>

                    <View style={styles.cardContent}>
                        <View style={styles.cardHeader}>
                            <Text style={[styles.patientName, { color: colors.foreground }]} numberOfLines={1}>
                                {patient.name || item.patientName || 'Patient Name'}
                            </Text>
                            <View style={[styles.statusBadge, { backgroundColor: S.bg }]}>
                                <Text style={[styles.statusText, { color: S.color }]}>{statusKey}</Text>
                            </View>
                        </View>

                        <View style={styles.metaRow}>
                            <View style={styles.metaItem}>
                                <Calendar size={12} color={colors.primary} strokeWidth={2.5} />
                                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                                    {item.date ? new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                                </Text>
                            </View>
                            <View style={styles.metaDot} />
                            <View style={styles.metaItem}>
                                <Clock size={12} color={colors.primary} strokeWidth={2.5} />
                                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{item.time || '10:00 AM'}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.arrowBox, { backgroundColor: colors.muted }]}>
                        <ChevronRight size={14} color={colors.foreground} strokeWidth={3} />
                    </View>
                </BlurView>
            </TouchableOpacity>
        </Animated.View>
    );
};

const AppointmentsScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const g = colors.glass;

    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('All');
    const [error, setError] = useState(null);

    const filterAnim = useRef(new Animated.Value(0)).current;
    const staggerAnims = useStagger(8, 60);

    const fetchAppointments = useCallback(async () => {
        try {
            setError(null);
            const res = await appointmentApi.getAll();
            if (res?.data) {
                const d = res.data;
                const raw = d?.appointments || d?.data || (Array.isArray(d) ? d : []);
                setAppointments(Array.isArray(raw) ? raw : []);
            }
        } catch (e) {
            setError(e?.response?.data?.message || 'Failed to load appointments.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

    const onRefresh = () => { setRefreshing(true); fetchAppointments(); };

    const filtered = filter === 'All'
        ? appointments
        : appointments.filter(a => a.status?.toUpperCase() === filter.toUpperCase());

    return (
        <View style={[styles.screen, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: layout.statusBarHeight + 10 }]}>
                <View>
                    <Text style={[styles.title, { color: colors.foreground }]}>Schedule</Text>
                    <Text style={[styles.subtitle, { color: colors.primary }]}>Patient Appointments</Text>
                </View>
                <TouchableOpacity activeOpacity={0.8} style={[styles.addBtn, { backgroundColor: colors.foreground }]}>
                    <Plus size={24} color={colors.background} strokeWidth={2.5} />
                </TouchableOpacity>
            </View>

            {/* Glass filter bar */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterBar}
                style={{ marginBottom: 20, maxHeight: 54 }}
            >
                {FILTERS.map(f => (
                    <GlassFilterPill
                        key={f} label={f}
                        active={filter === f}
                        onPress={() => setFilter(f)}
                        colors={colors}
                    />
                ))}
            </ScrollView>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <AlertCircle size={44} color={colors.error} opacity={0.5} />
                    <Text style={[styles.errorText, { color: colors.mutedForeground }]}>{error}</Text>
                    <TouchableOpacity onPress={onRefresh} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(i) => i.id?.toString() || Math.random().toString()}
                    renderItem={({ item, index }) => (
                        <AppointmentCard
                            item={item}
                            index={index}
                            colors={colors}
                            anim={staggerAnims[Math.min(index, staggerAnims.length - 1)]}
                            onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: item.id, appointment: item })}
                        />
                    )}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Calendar size={60} color={colors.mutedForeground} opacity={0.2} />
                            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No appointments found</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 22 },
    title: { fontSize: 34, fontWeight: '900', letterSpacing: -1.5 },
    subtitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: -2 },
    addBtn: {
        width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }, android: { elevation: 4 } }),
    },
    filterBar: { paddingHorizontal: 20, gap: 10, height: 50, alignItems: 'center' },
    pill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
    pillText: { fontSize: 13, fontWeight: '800' },
    list: { paddingHorizontal: 20, paddingBottom: layout.tabBarHeight + 30, gap: 12 },
    card: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 28, borderWidth: 1, overflow: 'hidden',
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16 }, android: { elevation: 4 } }),
    },
    cardShimmer: { position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, opacity: 0.8 },
    iconBox: { width: 56, height: 56, margin: 14, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    cardContent: { flex: 1, paddingVertical: 16, paddingRight: 8, gap: 4 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
    patientName: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 13, fontWeight: '700', opacity: 0.6 },
    metaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.1)' },
    arrowBox: { width: 28, height: 28, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 14, opacity: 0.7 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: 14 },
    errorText: { fontSize: 16, fontWeight: '700', textAlign: 'center', opacity: 0.6 },
    retryBtn: { marginTop: 12, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 16 },
    retryText: { color: '#fff', fontWeight: '800' },
    emptyText: { fontSize: 16, fontWeight: '800', textAlign: 'center', opacity: 0.4 },
});

export default AppointmentsScreen;
