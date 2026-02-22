// ─── Patient List — iOS 26 Liquid Glass ──────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, FlatList, ActivityIndicator,
    TouchableOpacity, RefreshControl, TextInput, Platform, Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeContext';
import { patientApi } from '../api/patients';
import { Search, Plus, AlertCircle, Users, ChevronRight, Phone } from 'lucide-react-native';
import { layout } from '../utils/layout';
import { useStagger, useScalePressAnim, SPRING } from '../utils/animations';

// ─── Patient Card ────────────────────────────────────────────────
const PatientCard = ({ item, onPress, colors, anim }) => {
    const g = colors.glass;
    const { scale, pressIn, pressOut } = useScalePressAnim();

    return (
        <Animated.View style={anim ? { opacity: anim.opacity, transform: [{ translateY: anim.translateY }, { scale }] } : { transform: [{ scale }] }}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={pressIn}
                onPressOut={pressOut}
                activeOpacity={1}
            >
                <BlurView
                    intensity={g.blur}
                    tint={g.tint}
                    experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                    style={[styles.card, { borderColor: g.border }]}
                >
                    <View style={[styles.cardShimmer, { backgroundColor: g.shimmer }]} />
                    <View style={[styles.avatar, { backgroundColor: colors.primary + '10' }]}>
                        <Text style={[styles.avatarText, { color: colors.primary }]}>
                            {(item.name || 'P').charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.cardInfo}>
                        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
                            {item.name || 'Anonymous Person'}
                        </Text>
                        <View style={styles.metaRow}>
                            <View style={[styles.metaPill, { backgroundColor: colors.primary + '08' }]}>
                                <Phone size={11} color={colors.primary} strokeWidth={3} />
                                <Text style={[styles.meta, { color: colors.primary }]}>
                                    {item.phone || 'No phone'}
                                </Text>
                            </View>
                            <View style={[styles.metaPill, { backgroundColor: colors.mutedForeground + '08' }]}>
                                <Text style={[styles.meta, { color: colors.foreground, opacity: 0.6 }]}>
                                    {item.gender || 'N/A'}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <ChevronRight size={14} color={colors.mutedForeground} strokeWidth={3} opacity={0.3} />
                </BlurView>
            </TouchableOpacity>
        </Animated.View>
    );
};

const PatientListScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const g = colors.glass;

    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [searchFocus, setSearchFocus] = useState(false);
    const [error, setError] = useState(null);
    const [total, setTotal] = useState(0);

    const searchBorderAnim = React.useRef(new Animated.Value(0)).current;

    const onSearchFocus = () => {
        setSearchFocus(true);
        Animated.spring(searchBorderAnim, { toValue: 1, ...SPRING.snappy }).start();
    };
    const onSearchBlur = () => {
        setSearchFocus(false);
        Animated.spring(searchBorderAnim, { toValue: 0, ...SPRING.gentle }).start();
    };

    const searchBorder = searchBorderAnim.interpolate({
        inputRange: [0, 1], outputRange: [g.border, colors.primary],
    });

    const fetchPatients = useCallback(async (q = '') => {
        try {
            setError(null);
            const res = await patientApi.getAll(q ? { search: q } : {});
            if (res?.data) {
                const d = res.data;
                const raw = d?.patients || d?.data || (Array.isArray(d) ? d : []);
                setPatients(Array.isArray(raw) ? raw : []);
                setTotal(d?.total || d?.meta?.total || (Array.isArray(raw) ? raw.length : 0));
            }
        } catch (e) {
            setError(e?.response?.data?.message || 'Failed to load patients.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => fetchPatients(search), 450);
        return () => clearTimeout(t);
    }, [search, fetchPatients]);

    const onRefresh = () => { setRefreshing(true); fetchPatients(search); };
    const staggerAnims = useStagger(8, 80);

    return (
        <View style={[styles.screen, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: layout.statusBarHeight + 10 }]}>
                <View>
                    <Text style={[styles.title, { color: colors.foreground }]}>Patients</Text>
                    <Text style={[styles.count, { color: colors.mutedForeground }]}>
                        {total > 0 ? `${total} Records Found` : 'No Records'}
                    </Text>
                </View>
                <TouchableOpacity activeOpacity={0.8} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
                    <Plus size={24} color="#fff" strokeWidth={3} />
                </TouchableOpacity>
            </View>

            {/* Glass Search Bar */}
            <Animated.View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                <Animated.View style={{ borderColor: searchBorder, borderWidth: 1.5, borderRadius: 22, overflow: 'hidden' }}>
                    <BlurView
                        intensity={g.blurStrong}
                        tint={g.tint}
                        experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                        style={styles.searchBlur}
                    >
                        <Search size={18} color={searchFocus ? colors.primary : colors.mutedForeground} strokeWidth={2.5} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.foreground }]}
                            placeholder="Find patients by name or phone…"
                            placeholderTextColor={colors.mutedForeground}
                            value={search}
                            onChangeText={setSearch}
                            onFocus={onSearchFocus}
                            onBlur={onSearchBlur}
                        />
                    </BlurView>
                </Animated.View>
            </Animated.View>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <AlertCircle size={44} color={colors.error} opacity={0.5} />
                    <Text style={[styles.errorText, { color: colors.mutedForeground }]}>{error}</Text>
                    <TouchableOpacity
                        onPress={onRefresh}
                        style={[styles.retryBtn, { backgroundColor: colors.primary }]}
                    >
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={patients}
                    keyExtractor={(i) => i.id?.toString() || i._id?.toString() || Math.random().toString()}
                    renderItem={({ item, index }) => (
                        <PatientCard
                            item={item}
                            anim={staggerAnims[Math.min(index, staggerAnims.length - 1)]}
                            colors={colors}
                            onPress={() => navigation.navigate('PatientDetail', { patientId: item.id || item._id, patient: item })}
                        />
                    )}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <BlurView intensity={20} tint={g.tint} style={styles.emptyIconWrap}>
                                <Users size={48} color={colors.primary} strokeWidth={1.5} />
                            </BlurView>
                            <Text style={[styles.emptyText, { color: colors.foreground }]}>
                                {search ? 'Search Yielded No Results' : 'No Patient Database Found'}
                            </Text>
                            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                                {search ? 'Try refining your keywords or searching by phone number.' : 'Start adding patient records to build your clinic database.'}
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20 },
    title: { fontSize: 32, fontWeight: '900', letterSpacing: -0.8 },
    count: { fontSize: 11, fontWeight: '900', marginTop: 2, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.5 },
    addBtn: {
        width: 50, height: 50, borderRadius: 18,
        justifyContent: 'center', alignItems: 'center',
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16 }, android: { elevation: 8 } }),
    },
    searchBlur: { flexDirection: 'row', alignItems: 'center', height: 56, paddingHorizontal: 16, gap: 12, borderRadius: 22 },
    searchInput: { flex: 1, fontSize: 16, fontWeight: '800' },
    list: { paddingHorizontal: 20, paddingBottom: layout.tabBarHeight + 40, gap: 12 },
    card: {
        flexDirection: 'row', alignItems: 'center',
        padding: 16, borderRadius: 26, borderWidth: 1, overflow: 'hidden', gap: 16,
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16 }, android: { elevation: 6 } }),
    },
    cardShimmer: { position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, opacity: 0.8 },
    avatar: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 22, fontWeight: '900' },
    cardInfo: { flex: 1, gap: 6 },
    name: { fontSize: 18, fontWeight: '900', letterSpacing: -0.4 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    metaPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    meta: { fontSize: 12, fontWeight: '900' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16 },
    emptyIconWrap: { width: 100, height: 100, borderRadius: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 8 },
    emptyText: { fontSize: 22, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 },
    emptySub: { fontSize: 15, textAlign: 'center', lineHeight: 22, fontWeight: '600', opacity: 0.6 },
    errorText: { fontSize: 16, fontWeight: '800', textAlign: 'center' },
    retryBtn: { marginTop: 12, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 16 },
    retryText: { color: '#fff', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
});

export default PatientListScreen;
