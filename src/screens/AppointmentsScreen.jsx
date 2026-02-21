import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, FlatList, ActivityIndicator,
    TouchableOpacity, RefreshControl, TextInput
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { appointmentApi } from '../api/appointments';
import {
    Calendar, Clock, User, Stethoscope, ChevronRight,
    Search, CheckCircle, XCircle, AlertCircle, Circle
} from 'lucide-react-native';

const STATUS_CONFIG = {
    CONFIRMED: { label: 'Confirmed', color: '#10b981', icon: CheckCircle },
    COMPLETED: { label: 'Completed', color: '#3b82f6', icon: CheckCircle },
    CANCELLED: { label: 'Cancelled', color: '#ef4444', icon: XCircle },
    PENDING: { label: 'Pending', color: '#f59e0b', icon: AlertCircle },
    SCHEDULED: { label: 'Scheduled', color: '#8b5cf6', icon: Circle },
};

const StatusBadge = ({ status, colors }) => {
    const cfg = STATUS_CONFIG[status] || { label: status, color: colors.mutedForeground };
    const IconComp = cfg.icon || Circle;
    return (
        <View style={[styles.badge, { backgroundColor: cfg.color + '18', borderColor: cfg.color + '40' }]}>
            <IconComp size={11} color={cfg.color} />
            <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
    );
};

const AppointmentCard = ({ item, colors }) => {
    const date = item.date || item.appointmentDate || item.scheduledAt;
    const formattedDate = date ? new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    }) : '—';
    const formattedTime = date ? new Date(date).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true
    }) : item.time || '—';

    const patientName = item.patient?.name || item.patientName || 'Unknown Patient';
    const doctorName = item.doctor?.name || item.doctorName || 'Unknown Doctor';

    return (
        <TouchableOpacity
            activeOpacity={0.75}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        >
            <View style={styles.cardLeft}>
                <View style={[styles.avatarBox, { backgroundColor: colors.accentSoft }]}>
                    <Calendar size={20} color={colors.primary} />
                </View>
            </View>
            <View style={styles.cardBody}>
                <Text style={[styles.patientName, { color: colors.foreground }]} numberOfLines={1}>
                    {patientName}
                </Text>
                <View style={styles.row}>
                    <Stethoscope size={13} color={colors.mutedForeground} />
                    <Text style={[styles.meta, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {' '}{doctorName}
                    </Text>
                </View>
                <View style={styles.row}>
                    <Clock size={13} color={colors.mutedForeground} />
                    <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                        {' '}{formattedDate}  {formattedTime}
                    </Text>
                </View>
                <StatusBadge status={item.status} colors={colors} />
            </View>
            <ChevronRight size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
    );
};

const FILTERS = ['All', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

const AppointmentsScreen = () => {
    const { colors } = useTheme();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [error, setError] = useState(null);

    const fetchAppointments = useCallback(async () => {
        setError(null);
        try {
            const params = {};
            if (activeFilter !== 'All') params.status = activeFilter;

            const res = await appointmentApi.getAll(params);
            // Backend may return { appointments: [] } or [] directly
            const raw = res.data?.appointments || res.data?.data || res.data || [];
            setAppointments(Array.isArray(raw) ? raw : []);
        } catch (err) {
            console.error('AppointmentsScreen fetch error:', err?.response?.data || err.message);
            setError(err?.response?.data?.message || 'Failed to load appointments. Check your connection or permissions.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeFilter]);

    useEffect(() => {
        setLoading(true);
        fetchAppointments();
    }, [fetchAppointments]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchAppointments();
    };

    const filtered = search.trim()
        ? appointments.filter(a => {
            const pName = (a.patient?.name || a.patientName || '').toLowerCase();
            const dName = (a.doctor?.name || a.doctorName || '').toLowerCase();
            const q = search.toLowerCase();
            return pName.includes(q) || dName.includes(q);
        })
        : appointments;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Search bar */}
            <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Search size={18} color={colors.mutedForeground} />
                <TextInput
                    style={[styles.searchInput, { color: colors.foreground }]}
                    placeholder="Search patient or doctor…"
                    placeholderTextColor={colors.mutedForeground}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {/* Status filter pills */}
            <FlatList
                data={FILTERS}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={i => i}
                contentContainerStyle={styles.filterRow}
                renderItem={({ item }) => {
                    const active = activeFilter === item;
                    return (
                        <TouchableOpacity
                            onPress={() => setActiveFilter(item)}
                            style={[
                                styles.pill,
                                { borderColor: active ? colors.primary : colors.cardBorder },
                                active && { backgroundColor: colors.primary }
                            ]}
                        >
                            <Text style={[
                                styles.pillText,
                                { color: active ? '#fff' : colors.mutedForeground }
                            ]}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    );
                }}
            />

            {/* Content */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                        Loading appointments…
                    </Text>
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <AlertCircle size={48} color="#ef4444" />
                    <Text style={[styles.errorText, { color: '#ef4444' }]}>{error}</Text>
                    <TouchableOpacity
                        onPress={() => { setLoading(true); fetchAppointments(); }}
                        style={[styles.retryBtn, { backgroundColor: colors.primary }]}
                    >
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                    renderItem={({ item }) => <AppointmentCard item={item} colors={colors} />}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Calendar size={52} color={colors.cardBorder} />
                            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                                No appointments found
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    searchBar: {
        flexDirection: 'row', alignItems: 'center',
        margin: 16, borderRadius: 12, borderWidth: 1,
        paddingHorizontal: 14, height: 46,
    },
    searchInput: { flex: 1, fontSize: 15, marginLeft: 10 },
    filterRow: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
    pill: {
        paddingHorizontal: 14, paddingVertical: 6,
        borderRadius: 20, borderWidth: 1,
    },
    pillText: { fontSize: 13, fontWeight: '500' },
    list: { paddingHorizontal: 16, paddingBottom: 24 },
    card: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 14, borderWidth: 1,
        padding: 14, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    cardLeft: { marginRight: 14 },
    avatarBox: {
        width: 44, height: 44, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center',
    },
    cardBody: { flex: 1 },
    patientName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
    meta: { fontSize: 13 },
    badge: {
        flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
        borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
        marginTop: 6, gap: 4,
    },
    badgeText: { fontSize: 11, fontWeight: '600' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60, gap: 12 },
    loadingText: { fontSize: 14, marginTop: 10 },
    errorText: { fontSize: 15, textAlign: 'center', paddingHorizontal: 30, lineHeight: 22 },
    retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
    retryText: { color: '#fff', fontWeight: '600', fontSize: 15 },
    emptyText: { fontSize: 16, marginTop: 10 },
});

export default AppointmentsScreen;
