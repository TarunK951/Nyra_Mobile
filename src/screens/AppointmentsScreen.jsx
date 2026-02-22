// ─── iOS 26 Liquid Glass — Appointments Screen ───────────────────
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    StyleSheet, View, Text, FlatList, ActivityIndicator,
    TouchableOpacity, RefreshControl, Platform, Animated, ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeContext';
import { appointmentApi } from '../api/appointments';
import { Calendar, Clock, ChevronRight, Plus, AlertCircle, CheckCircle2, XCircle, User } from 'lucide-react-native';
import LiquidGlass from '../components/LiquidGlass';
import { layout } from '../utils/layout';
import { useStagger, useScalePressAnim, SPRING } from '../utils/animations';

const FILTERS = ['All', 'Confirmed', 'Pending', 'Cancelled'];

const STATUS_MAP = {
    CONFIRMED: { icon: CheckCircle2, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
    PENDING: { icon: User, color: colors => colors.primary, bg: colors => colors.primary + '12' },
    CANCELLED: { icon: XCircle, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
    DEFAULT: { icon: Calendar, color: '#6b7280', bg: 'rgba(107, 114, 128, 0.12)' },
};

const GlassFilterPill = ({ label, active, onPress, colors }) => {
    const { scale, pressIn, pressOut } = useScalePressAnim();
    const g = colors.glass;
    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={1}>
                <LiquidGlass
                    intensity={active ? 0 : g.blur}
                    tint={g.tint}
                    padding={0}
                    borderRadius={14}
                    containerStyle={[
                        styles.pill,
                        {
                            borderColor: active ? colors.primary : g.border,
                            backgroundColor: active ? colors.primary : colors.card,
                        }
                    ]}
                    style={{ paddingHorizontal: 16, paddingVertical: 8 }}
                >
                    <Text style={[styles.pillText, { color: active ? '#ffffff' : colors.mutedForeground, fontWeight: active ? '800' : '600' }]}>
                        {label}
                    </Text>
                </LiquidGlass>
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
    const initials = (patient.name || item.patientName || 'P').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    const sColor = typeof S.color === 'function' ? S.color(colors) : S.color;
    const sBg = typeof S.bg === 'function' ? S.bg(colors) : S.bg;

    return (
        <Animated.View style={anim ? { opacity: anim.opacity, transform: [{ translateY: anim.translateY }, { scale }] } : { transform: [{ scale }] }}>
            <TouchableOpacity onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={1}>
                <LiquidGlass
                    intensity={g.blur}
                    tint={g.tint}
                    padding={16}
                    borderRadius={24}
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                >
                    {/* Left Initials/Avatar */}
                    <View style={[styles.iconBox, { backgroundColor: sColor + '12' }]}>
                        <Text style={[styles.initials, { color: sColor }]}>{initials}</Text>
                    </View>

                    <View style={styles.cardContent}>
                        <View style={styles.cardHeader}>
                            <Text style={[styles.patientName, { color: colors.foreground }]} numberOfLines={1}>
                                {patient.name || item.patientName || 'Patient Name'}
                            </Text>
                            <View style={[styles.statusBadge, { backgroundColor: sBg }]}>
                                <Text style={[styles.statusText, { color: sColor }]}>{statusKey}</Text>
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
                </LiquidGlass>
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
            {/* Rich Apple Background Layering */}
            <View style={[styles.bgGlow, { backgroundColor: colors.primary + '08' }]} />
            <View style={[styles.bgGlowSecondary, { backgroundColor: colors.error + '05' }]} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: layout.statusBarHeight + 10 }]}>
                <View>
                    <Text style={[styles.title, { color: colors.foreground }]}>Schedule</Text>
                    <Text style={[styles.subtitle, { color: colors.primary }]}>Patient Appointments</Text>
                </View>
                <TouchableOpacity activeOpacity={0.8} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
                    <Plus size={22} color="#fff" strokeWidth={3} />
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
    bgGlow: { position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: 200, opacity: 0.6 },
    bgGlowSecondary: { position: 'absolute', bottom: -150, left: -150, width: 500, height: 500, borderRadius: 250, opacity: 0.4 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 18 },
    title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.8 },
    subtitle: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: -1, opacity: 0.6 },
    addBtn: {
        width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    },
    filterBar: { paddingHorizontal: 20, gap: 8, height: 46, alignItems: 'center' },
    pill: { overflow: 'hidden', borderWidth: 1 },
    pillText: { fontSize: 13, letterSpacing: -0.2 },
    list: { paddingHorizontal: 16, paddingBottom: layout.tabBarHeight + 30, gap: 10 },
    iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    initials: { fontSize: 16, fontWeight: '900' },
    cardContent: { flex: 1, paddingRight: 4, gap: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 },
    statusText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
    patientName: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    metaText: { fontSize: 12, fontWeight: '700', opacity: 0.6 },
    metaDot: { width: 3, height: 3, borderRadius: 1.5, opacity: 0.1 },
    arrowBox: { width: 26, height: 26, borderRadius: 8, justifyContent: 'center', alignItems: 'center', opacity: 0.7 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: 14 },
    errorText: { fontSize: 15, fontWeight: '700', textAlign: 'center', opacity: 0.6 },
    retryBtn: { marginTop: 12, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
    retryText: { color: '#fff', fontWeight: '800' },
    emptyText: { fontSize: 15, fontWeight: '800', textAlign: 'center', opacity: 0.4 },
});

export default AppointmentsScreen;
