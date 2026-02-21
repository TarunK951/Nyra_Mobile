import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, FlatList, ActivityIndicator,
    TouchableOpacity, RefreshControl, TextInput
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { doctorApi } from '../api/doctors';
import {
    Stethoscope, Search, ChevronRight, AlertCircle,
    Clock, Star, Phone, Calendar
} from 'lucide-react-native';

const SPECIALTIES = {
    GENERAL: 'General',
    CARDIOLOGY: 'Cardiology',
    ORTHOPEDICS: 'Orthopedics',
    NEUROLOGY: 'Neurology',
    PEDIATRICS: 'Pediatrics',
    DERMATOLOGY: 'Dermatology',
    GYNECOLOGY: 'Gynecology',
};

const COLORS_BY_INDEX = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];

const DoctorCard = ({ item, colors, index, onPress }) => {
    const accentColor = COLORS_BY_INDEX[index % COLORS_BY_INDEX.length];
    const specialty = item.specialty || item.specialization || item.department || 'General';
    const qualification = item.qualification || item.qualifications || '';
    const status = item.isAvailable ? 'Available' : 'Unavailable';

    return (
        <TouchableOpacity
            activeOpacity={0.75}
            onPress={onPress}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        >
            {/* Avatar */}
            <View style={[styles.avatar, { backgroundColor: accentColor + '20' }]}>
                <Text style={[styles.avatarText, { color: accentColor }]}>
                    {(item.name || 'D').charAt(0).toUpperCase()}
                </Text>
            </View>
            <View style={styles.cardBody}>
                <Text style={[styles.doctorName, { color: colors.foreground }]} numberOfLines={1}>
                    {item.name || 'Unknown Doctor'}
                </Text>
                {specialty ? (
                    <View style={styles.row}>
                        <Stethoscope size={13} color={accentColor} />
                        <Text style={[styles.meta, { color: accentColor }]}> {specialty}</Text>
                    </View>
                ) : null}
                {qualification ? (
                    <Text style={[styles.qual, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {qualification}
                    </Text>
                ) : null}
                {item.phone ? (
                    <View style={styles.row}>
                        <Phone size={12} color={colors.mutedForeground} />
                        <Text style={[styles.metaSmall, { color: colors.mutedForeground }]}>
                            {' '}{item.phone}
                        </Text>
                    </View>
                ) : null}
                {/* Availability badge */}
                <View style={[
                    styles.badge,
                    {
                        backgroundColor: item.isAvailable ? '#10b98118' : '#ef444418',
                        borderColor: item.isAvailable ? '#10b98140' : '#ef444440'
                    }
                ]}>
                    <View style={[
                        styles.dot,
                        { backgroundColor: item.isAvailable ? '#10b981' : '#ef4444' }
                    ]} />
                    <Text style={{
                        fontSize: 11, fontWeight: '600',
                        color: item.isAvailable ? '#10b981' : '#ef4444'
                    }}>
                        {status}
                    </Text>
                </View>
                {/* View Schedule hint */}
                <View style={styles.scheduleHint}>
                    <Calendar size={12} color={colors.primary} />
                    <Text style={[styles.scheduleHintText, { color: colors.primary }]}>View Schedule</Text>
                </View>
            </View>
            <ChevronRight size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
    );
};

const DoctorsScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [error, setError] = useState(null);

    const fetchDoctors = useCallback(async () => {
        setError(null);
        try {
            const res = await doctorApi.getAll();
            // Backend may return { doctors: [] } or [] directly
            const raw = res.data?.doctors || res.data?.data || res.data || [];
            setDoctors(Array.isArray(raw) ? raw : []);
        } catch (err) {
            console.error('DoctorsScreen fetch error:', err?.response?.data || err.message);
            setError(err?.response?.data?.message || 'Failed to load doctors. Check your connection or permissions.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchDoctors();
    }, [fetchDoctors]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDoctors();
    };

    const filtered = search.trim()
        ? doctors.filter(d => {
            const name = (d.name || '').toLowerCase();
            const spec = (d.specialty || d.specialization || d.department || '').toLowerCase();
            const q = search.toLowerCase();
            return name.includes(q) || spec.includes(q);
        })
        : doctors;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Search bar */}
            <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Search size={18} color={colors.mutedForeground} />
                <TextInput
                    style={[styles.searchInput, { color: colors.foreground }]}
                    placeholder="Search by name or specialty…"
                    placeholderTextColor={colors.mutedForeground}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                        Loading doctors…
                    </Text>
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <AlertCircle size={48} color="#ef4444" />
                    <Text style={[styles.errorText, { color: '#ef4444' }]}>{error}</Text>
                    <TouchableOpacity
                        onPress={() => { setLoading(true); fetchDoctors(); }}
                        style={[styles.retryBtn, { backgroundColor: colors.primary }]}
                    >
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                    renderItem={({ item, index }) => (
                        <DoctorCard
                            item={item}
                            colors={colors}
                            index={index}
                            onPress={() => navigation.navigate('DoctorSchedule', { doctor: item })}
                        />
                    )}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                    }
                    ListHeaderComponent={
                        filtered.length > 0 ? (
                            <Text style={[styles.countLabel, { color: colors.mutedForeground }]}>
                                {filtered.length} doctor{filtered.length !== 1 ? 's' : ''}
                            </Text>
                        ) : null
                    }
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Stethoscope size={52} color={colors.cardBorder} />
                            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                                No doctors found
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
    list: { paddingHorizontal: 16, paddingBottom: 24 },
    countLabel: { fontSize: 13, marginBottom: 10 },
    card: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 14, borderWidth: 1,
        padding: 14, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    avatar: {
        width: 48, height: 48, borderRadius: 24,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 14,
    },
    avatarText: { fontSize: 20, fontWeight: '700' },
    cardBody: { flex: 1 },
    doctorName: { fontSize: 16, fontWeight: '600', marginBottom: 3 },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    meta: { fontSize: 13, fontWeight: '500' },
    qual: { fontSize: 12, marginBottom: 2 },
    metaSmall: { fontSize: 12 },
    badge: {
        flexDirection: 'row', alignItems: 'center',
        alignSelf: 'flex-start', borderWidth: 1,
        borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
        marginTop: 6, gap: 5,
    },
    dot: { width: 6, height: 6, borderRadius: 3 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60, gap: 12 },
    loadingText: { fontSize: 14, marginTop: 10 },
    errorText: { fontSize: 15, textAlign: 'center', paddingHorizontal: 30, lineHeight: 22 },
    retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
    retryText: { color: '#fff', fontWeight: '600', fontSize: 15 },
    scheduleHint: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        marginTop: 6,
    },
    scheduleHintText: { fontSize: 11, fontWeight: '600' },
    emptyText: { fontSize: 16, marginTop: 10 },
});

export default DoctorsScreen;
