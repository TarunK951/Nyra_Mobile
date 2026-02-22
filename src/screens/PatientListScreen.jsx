import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, FlatList, ActivityIndicator,
    TouchableOpacity, RefreshControl, TextInput, Platform, Dimensions
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { patientApi } from '../api/patients';
import { Search, User, Phone, ChevronRight, Filter, Plus, AlertCircle } from 'lucide-react-native';
import { layout } from '../utils/layout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PatientListScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [error, setError] = useState(null);
    const [total, setTotal] = useState(0);

    const fetchPatients = useCallback(async (query = '') => {
        try {
            setError(null);
            const params = query ? { search: query } : {};
            const response = await patientApi.getAll(params);

            if (response && response.data) {
                const data = response.data;
                const raw = data?.patients || data?.data || (Array.isArray(data) ? data : []);
                const list = Array.isArray(raw) ? raw : [];
                setPatients(list);
                setTotal(data?.total || data?.meta?.total || list.length);
            } else {
                setError("No response from server.");
            }
        } catch (e) {
            console.error('[PatientList]', e.message);
            setError(e?.response?.data?.message || 'Failed to load patients.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => fetchPatients(search), 500);
        return () => clearTimeout(timer);
    }, [search, fetchPatients]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchPatients(search);
    };

    const renderPatient = ({ item }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => navigation.navigate('PatientDetail', { patientId: item.id, patient: item })}
            activeOpacity={0.7}
        >
            <View style={[styles.avatar, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {(item.name || 'P').charAt(0).toUpperCase()}
                </Text>
            </View>
            <View style={styles.cardInfo}>
                <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
                    {item.name || 'Unknown Patient'}
                </Text>
                <View style={styles.metaRow}>
                    <Phone size={12} color={colors.mutedForeground} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                        {item.phone || 'No phone'}
                    </Text>
                    <View style={[styles.dot, { backgroundColor: colors.mutedForeground }]} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                        {item.gender || 'N/A'}
                    </Text>
                </View>
            </View>
            <ChevronRight size={18} color={colors.mutedForeground} opacity={0.5} />
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: layout.statusBarHeight }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.foreground }]}>Patients</Text>
                <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: colors.primary }]}
                    onPress={() => {/* TODO: Add Patient */ }}
                >
                    <Plus size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={[styles.searchWrapper, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <Search size={18} color={colors.mutedForeground} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.foreground }]}
                        placeholder="Search by name or phone..."
                        placeholderTextColor={colors.mutedForeground}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
                <TouchableOpacity style={[styles.filterBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <Filter size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
            </View>

            {/* List */}
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
                    data={patients}
                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                    renderItem={renderPatient}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                    }
                    ListHeaderComponent={
                        patients.length > 0 && (
                            <Text style={[styles.countText, { color: colors.mutedForeground }]}>
                                Showing {patients.length} {patients.length === 1 ? 'patient' : 'patients'}
                            </Text>
                        )
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <User size={64} color={colors.mutedForeground} opacity={0.2} />
                            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                                {search ? 'No patients match your search' : 'No patients found'}
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
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 16
    },
    title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
    addBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 2 },
    searchContainer: {
        flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16
    },
    searchWrapper: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 14, height: 48, borderRadius: 14, borderWidth: 1
    },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '500' },
    filterBtn: {
        width: 48, height: 48, borderRadius: 14, borderWidth: 1,
        justifyContent: 'center', alignItems: 'center'
    },
    list: { paddingHorizontal: 20, paddingBottom: 30 },
    countText: { fontSize: 13, fontWeight: '600', marginBottom: 12, marginLeft: 4 },
    card: {
        flexDirection: 'row', alignItems: 'center', padding: 14,
        borderRadius: 20, borderWidth: 1, marginBottom: 12,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
            android: { elevation: 2 }
        })
    },
    avatar: {
        width: 50, height: 50, borderRadius: 25,
        justifyContent: 'center', alignItems: 'center', marginRight: 14
    },
    avatarText: { fontSize: 18, fontWeight: '700' },
    cardInfo: { flex: 1, gap: 4 },
    name: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 13, fontWeight: '500' },
    dot: { width: 3, height: 3, borderRadius: 1.5 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    errorText: { marginTop: 12, textAlign: 'center', fontSize: 15, fontWeight: '500' },
    retryBtn: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
    retryText: { color: '#fff', fontWeight: '700' },
    emptyContainer: { alignItems: 'center', marginTop: 100, gap: 16 },
    emptyText: { fontSize: 15, fontWeight: '500', textAlign: 'center' },
});

export default PatientListScreen;
