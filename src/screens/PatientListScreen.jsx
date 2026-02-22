import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, FlatList, ActivityIndicator,
    TouchableOpacity, RefreshControl, TextInput,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { patientApi } from '../api/patients';
import {
    Search, User, Phone, ChevronRight, RefreshCw,
    AlertCircle, Plus, Heart, Calendar,
} from 'lucide-react-native';

const PatientCard = ({ item, onPress, colors }) => {
    const initials = (item.name || 'P').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const gender = item.gender?.charAt(0).toUpperCase() + (item.gender?.slice(1).toLowerCase() || '');
    const bloodGroup = item.blood_group || item.bloodGroup;

    return (
        <TouchableOpacity
            activeOpacity={0.75}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={onPress}
        >
            <View style={[styles.avatar, { backgroundColor: colors.primary + '18' }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
            </View>
            <View style={styles.cardBody}>
                <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
                    {item.name || 'Unknown Patient'}
                </Text>
                <View style={styles.metaRow}>
                    {!!item.phone && (
                        <View style={styles.metaItem}>
                            <Phone size={12} color={colors.mutedForeground} />
                            <Text style={[styles.metaTxt, { color: colors.mutedForeground }]}>{item.phone}</Text>
                        </View>
                    )}
                    {!!(gender || bloodGroup) && (
                        <View style={styles.metaItem}>
                            {!!bloodGroup && <Heart size={12} color="#ef4444" />}
                            <Text style={[styles.metaTxt, { color: colors.mutedForeground }]}>
                                {[gender, bloodGroup].filter(Boolean).join('  •  ')}
                            </Text>
                        </View>
                    )}
                </View>
                {!!item.uhid && (
                    <Text style={[styles.uhid, { color: colors.mutedForeground }]}>UHID: {item.uhid}</Text>
                )}
            </View>
            <ChevronRight size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
    );
};

const PatientListScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState(null);
    const [total, setTotal] = useState(0);

    const fetchPatients = useCallback(async (query = '') => {
        setError(null);
        try {
            const params = query ? { search: query } : {};
            const response = await patientApi.getAll(params);
            const raw = response.data?.patients || response.data?.data || response.data || [];
            const count = response.data?.total || response.data?.count || (Array.isArray(raw) ? raw.length : 0);
            setPatients(Array.isArray(raw) ? raw : []);
            setTotal(count);
        } catch (e) {
            console.error('[PatientList]', e?.response?.data || e.message);
            setError(e?.response?.data?.message || 'Failed to load patients.');
        } finally {
            setLoading(false);
            setRefreshing(false);
            setSearching(false);
        }
    }, []);

    useEffect(() => { fetchPatients(); }, [fetchPatients]);

    const handleSearch = (text) => {
        setSearchQuery(text);
        setSearching(true);
        clearTimeout(handleSearch._timer);
        handleSearch._timer = setTimeout(() => fetchPatients(text), 400);
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchPatients(searchQuery);
    };

    const onPressPatient = (patient) => {
        navigation.navigate('PatientDetail', { patientId: patient.id, patient });
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Search bar */}
            <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Search size={16} color={colors.mutedForeground} />
                <TextInput
                    style={[styles.searchInput, { color: colors.foreground }]}
                    placeholder="Search by name, phone, UHID…"
                    placeholderTextColor={colors.mutedForeground}
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
                {searching && <ActivityIndicator size="small" color={colors.primary} />}
            </View>

            {/* Count label */}
            {!loading && !error && (
                <Text style={[styles.countLabel, { color: colors.mutedForeground }]}>
                    {total > 0 ? `${total} patient${total !== 1 ? 's' : ''}` : 'No patients found'}
                </Text>
            )}

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadTxt, { color: colors.mutedForeground }]}>Loading patients…</Text>
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <AlertCircle size={48} color="#ef4444" />
                    <Text style={{ color: '#ef4444', textAlign: 'center', paddingHorizontal: 24 }}>{error}</Text>
                    <TouchableOpacity onPress={() => { setLoading(true); fetchPatients(); }}
                        style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
                        <RefreshCw size={14} color="#fff" />
                        <Text style={styles.retryTxt}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={patients}
                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                    renderItem={({ item }) => (
                        <PatientCard item={item} colors={colors} onPress={() => onPressPatient(item)} />
                    )}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <User size={52} color={colors.cardBorder} />
                            <Text style={[styles.emptyTxt, { color: colors.mutedForeground }]}>
                                {searchQuery ? 'No patients match your search' : 'No patients registered yet'}
                            </Text>
                        </View>
                    }
                    showsVerticalScrollIndicator={false}
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
        paddingHorizontal: 14, height: 46, gap: 10,
    },
    searchInput: { flex: 1, fontSize: 15 },
    countLabel: { fontSize: 13, marginHorizontal: 16, marginBottom: 4 },
    list: { paddingHorizontal: 16, paddingBottom: 24 },
    card: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 14, borderWidth: 1,
        padding: 14, marginBottom: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    avatar: {
        width: 50, height: 50, borderRadius: 25,
        justifyContent: 'center', alignItems: 'center', marginRight: 14,
    },
    avatarText: { fontSize: 18, fontWeight: '700' },
    cardBody: { flex: 1 },
    name: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    metaRow: { gap: 4 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    metaTxt: { fontSize: 13 },
    uhid: { fontSize: 12, marginTop: 3 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingTop: 60 },
    loadTxt: { fontSize: 14 },
    retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
    retryTxt: { color: '#fff', fontWeight: '600' },
    emptyTxt: { fontSize: 16, textAlign: 'center', paddingHorizontal: 32 },
});

export default PatientListScreen;
