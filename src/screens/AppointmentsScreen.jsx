import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, FlatList, ActivityIndicator,
    TouchableOpacity, RefreshControl, Platform, Dimensions
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { appointmentApi } from '../api/appointments';
import { Calendar, Clock, ChevronRight, Filter, Plus, AlertCircle, User, CheckCircle2, Circle } from 'lucide-react-native';
import { layout } from '../utils/layout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AppointmentsScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('ALL');
    const [error, setError] = useState(null);

    const fetchAppointments = useCallback(async () => {
        try {
            setError(null);
            const response = await appointmentApi.getAll();
            if (response && response.data) {
                const data = response.data;
                const raw = data?.appointments || data?.data || (Array.isArray(data) ? data : []);
                setAppointments(Array.isArray(raw) ? raw : []);
            } else {
                setError("No response from server.");
            }
        } catch (e) {
            console.error('[Appointments] fetch error:', e.message);
            setError(e?.response?.data?.message || 'Failed to load appointments.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchAppointments();
    };

    const getStatusStyle = (status) => {
        switch (status?.toUpperCase()) {
            case 'CONFIRMED': return { bg: '#dcfce7', text: '#166534', icon: CheckCircle2 };
            case 'CANCELLED': return { bg: '#fee2e2', text: '#991b1b', icon: AlertCircle };
            case 'PENDING': return { bg: '#fef9c3', text: '#854d0e', icon: Clock };
            default: return { bg: '#f3f4f6', text: '#374151', icon: Circle };
        }
    };

    const filteredData = appointments.filter(appt => {
        if (filter === 'ALL') return true;
        return appt.status?.toUpperCase() === filter;
    });

    const renderAppointment = ({ item }) => {
        const patient = item.patient || {};
        const status = getStatusStyle(item.status);

        return (
            <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: item.id, appointment: item })}
                activeOpacity={0.7}
            >
                <View style={styles.cardHeader}>
                    <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                        <status.icon size={12} color={status.text} />
                        <Text style={[styles.statusText, { color: status.text }]}>{item.status || 'Scheduled'}</Text>
                    </View>
                    <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
                        {item.date ? new Date(item.date).toLocaleDateString() : 'No date'}
                    </Text>
                </View>

                <View style={styles.cardBody}>
                    <View style={[styles.userIcon, { backgroundColor: colors.accentSoft }]}>
                        <User size={20} color={colors.primary} />
                    </View>
                    <View style={styles.info}>
                        <Text style={[styles.patientName, { color: colors.foreground }]} numberOfLines={1}>
                            {patient.name || 'Unknown Patient'}
                        </Text>
                        <View style={styles.timeRow}>
                            <Clock size={13} color={colors.mutedForeground} />
                            <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
                                {item.time || 'TBD'}
                            </Text>
                        </View>
                    </View>
                    <ChevronRight size={18} color={colors.mutedForeground} opacity={0.5} />
                </View>

                {item.type && (
                    <View style={[styles.typeFooter, { borderTopColor: colors.border }]}>
                        <Text style={[styles.typeText, { color: colors.mutedForeground }]}>{item.type}</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: layout.statusBarHeight }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.foreground }]}>Appointments</Text>
                <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: colors.primary }]}
                >
                    <Plus size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.filterBar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {['ALL', 'CONFIRMED', 'PENDING', 'CANCELLED'].map((f) => (
                        <TouchableOpacity
                            key={f}
                            onPress={() => setFilter(f)}
                            style={[
                                styles.filterItem,
                                { borderColor: filter === f ? colors.primary : colors.cardBorder, backgroundColor: filter === f ? colors.primary : colors.card }
                            ]}
                        >
                            <Text style={[styles.filterText, { color: filter === f ? '#fff' : colors.mutedForeground }]}>
                                {f.charAt(0) + f.slice(1).toLowerCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <AlertCircle size={48} color="#ef4444" opacity={0.5} />
                    <Text style={[styles.errorText, { color: colors.mutedForeground }]}>{error}</Text>
                    <TouchableOpacity onPress={onRefresh} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filteredData}
                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                    renderItem={renderAppointment}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Calendar size={64} color={colors.mutedForeground} opacity={0.2} />
                            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No appointments found</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 16
    },
    title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
    addBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 2 },
    filterBar: { marginBottom: 12 },
    filterScroll: { paddingHorizontal: 20, gap: 8 },
    filterItem: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
    },
    filterText: { fontSize: 13, fontWeight: '700' },
    list: { paddingHorizontal: 20, paddingBottom: 30 },
    card: {
        borderRadius: 22, borderWidth: 1, marginBottom: 16, overflow: 'hidden',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
            android: { elevation: 3 }
        })
    },
    cardHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 12, paddingHorizontal: 16
    },
    statusPill: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12
    },
    statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
    dateText: { fontSize: 12, fontWeight: '600' },
    cardBody: {
        flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 4
    },
    userIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    info: { flex: 1, gap: 2 },
    patientName: { fontSize: 16, fontWeight: '700' },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    timeText: { fontSize: 13, fontWeight: '500' },
    typeFooter: { padding: 8, paddingHorizontal: 16, borderTopWidth: 1, alignItems: 'flex-end' },
    typeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    errorText: { marginTop: 12, textAlign: 'center', fontSize: 15, fontWeight: '500' },
    retryBtn: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
    retryText: { color: '#fff', fontWeight: '700' },
    emptyContainer: { alignItems: 'center', marginTop: 100, gap: 16 },
    emptyText: { fontSize: 15, fontWeight: '500', textAlign: 'center' },
});

export default AppointmentsScreen;
