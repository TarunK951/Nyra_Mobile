import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, FlatList, ActivityIndicator,
    TouchableOpacity, RefreshControl, TextInput, Platform, Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeContext';
import { doctorApi } from '../api/doctors';
import {
    Stethoscope, Search, ChevronRight, AlertCircle,
    Phone, Calendar,
} from 'lucide-react-native';
import { layout } from '../utils/layout';
import { useStagger, useScalePressAnim } from '../utils/animations';

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

const DoctorCard = ({ item, colors, index, onPress, anim }) => {
    const accentColor = COLORS_BY_INDEX[index % COLORS_BY_INDEX.length];
    const specialty = item.specialty || item.specialization || item.department || 'General';
    const qualification = item.qualification || item.qualifications || '';
    const status = item.isAvailable ? 'Available' : 'Unavailable';
    const g = colors.glass;
    const { scale, pressIn, pressOut } = useScalePressAnim();

    return (
        <Animated.View style={anim ? { opacity: anim.opacity, transform: [{ translateY: anim.translateY }, { scale }] } : { transform: [{ scale }] }}>
            <TouchableOpacity
                activeOpacity={1}
                onPress={onPress}
                onPressIn={pressIn}
                onPressOut={pressOut}
            >
                <BlurView
                    intensity={g.blur}
                    tint={g.tint}
                    experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                    style={[styles.card, { borderColor: g.border }]}
                >
                    <View style={[styles.cardShimmer, { backgroundColor: g.shimmer }]} />
                    <View style={[styles.avatar, { backgroundColor: accentColor + '15' }]}>
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
                                <Stethoscope size={12} color={accentColor} strokeWidth={2.5} />
                                <Text style={[styles.meta, { color: colors.mutedForeground }]}> {specialty}</Text>
                            </View>
                        ) : null}
                        {qualification ? (
                            <Text style={[styles.qual, { color: colors.mutedForeground, opacity: 0.7 }]} numberOfLines={1}>
                                {qualification}
                            </Text>
                        ) : null}

                        <View style={styles.metaRow}>
                            {/* Availability badge */}
                            <View style={[
                                styles.badge,
                                {
                                    backgroundColor: item.isAvailable ? colors.success + '12' : colors.error + '12',
                                    borderColor: item.isAvailable ? colors.success + '30' : colors.error + '30'
                                }
                            ]}>
                                <View style={[styles.dot, { backgroundColor: item.isAvailable ? colors.success : colors.error }]} />
                                <Text style={[styles.badgeTxt, { color: item.isAvailable ? colors.success : colors.error }]}>
                                    {status}
                                </Text>
                            </View>

                            <View style={styles.scheduleHint}>
                                <Calendar size={11} color={colors.primary} />
                                <Text style={[styles.scheduleHintText, { color: colors.primary }]}>VIEW SCHEDULE</Text>
                            </View>
                        </View>
                    </View>
                    <ChevronRight size={16} color={colors.mutedForeground} opacity={0.4} />
                </BlurView>
            </TouchableOpacity>
        </Animated.View>
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

    const staggerAnims = useStagger(8, 80);
    const g = colors.glass;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Search bar */}
            <BlurView
                intensity={g.blur}
                tint={g.tint}
                experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                style={[styles.searchBar, { borderColor: g.border }]}
            >
                <Search size={18} color={colors.mutedForeground} />
                <TextInput
                    style={[styles.searchInput, { color: colors.foreground }]}
                    placeholder="Search doctors..."
                    placeholderTextColor={colors.mutedForeground}
                    value={search}
                    onChangeText={setSearch}
                />
            </BlurView>

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
                            anim={staggerAnims[Math.min(index, staggerAnims.length - 1)]}
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
        margin: 16, borderRadius: 16, borderWidth: 1,
        paddingHorizontal: 14, height: 48,
        marginTop: layout.statusBarHeight + 10,
        overflow: 'hidden',
    },
    searchInput: { flex: 1, fontSize: 15, marginLeft: 10, fontWeight: '600' },
    list: { paddingHorizontal: 16, paddingBottom: layout.tabBarHeight + 20 },
    countLabel: { fontSize: 12, fontWeight: '800', marginBottom: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
    card: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 22, borderWidth: 1,
        padding: 16, marginBottom: 14, overflow: 'hidden',
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10 }, android: { elevation: 3 } }),
    },
    cardShimmer: { position: 'absolute', top: 0, left: 0, right: 0, height: 1.5 },
    avatar: {
        width: 54, height: 54, borderRadius: 18,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 16,
    },
    avatarText: { fontSize: 22, fontWeight: '800' },
    cardBody: { flex: 1 },
    doctorName: { fontSize: 17, fontWeight: '800', marginBottom: 4, letterSpacing: -0.4 },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    meta: { fontSize: 13, fontWeight: '600' },
    qual: { fontSize: 12, fontWeight: '500', marginBottom: 6 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
    badge: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
        gap: 5,
    },
    badgeTxt: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
    dot: { width: 7, height: 7, borderRadius: 4 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60, gap: 12 },
    loadingText: { fontSize: 14, marginTop: 10, fontWeight: '600' },
    errorText: { fontSize: 15, textAlign: 'center', paddingHorizontal: 30, lineHeight: 22, fontWeight: '500' },
    retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 10 },
    retryText: { color: '#fff', fontWeight: '800', fontSize: 14, textTransform: 'uppercase' },
    scheduleHint: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
    },
    scheduleHintText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.3 },
    emptyText: { fontSize: 16, marginTop: 10, fontWeight: '500' },
});

export default DoctorsScreen;
