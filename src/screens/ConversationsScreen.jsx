import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    StyleSheet, View, Text, FlatList, ActivityIndicator,
    TouchableOpacity, RefreshControl, TextInput, Animated, Platform
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { callApi } from '../api/calls';
import { getName, getPhone, getConvId, getStatus, getDirection, getType, getDuration, getFmtDate, normaliseList } from '../shared/callHelpers';
import {
    MessageSquare, PhoneCall, PhoneIncoming, PhoneOutgoing,
    Search, Clock, ChevronRight, AlertCircle, Wifi
} from 'lucide-react-native';
import { layout } from '../utils/layout';

const STATUS_COLORS = {
    LIVE: '#10b981', ENDED: '#6b7280', FAILED: '#ef4444', CANCELLED: '#f59e0b',
    ACTIVE: '#10b981', COMPLETED: '#3b82f6',
};

const PulsingDot = ({ color }) => {
    const anim = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(anim, { toValue: 0.3, duration: 700, useNativeDriver: true }),
                Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
            ])
        ).start();
    }, []);
    return <Animated.View style={[styles.liveDot, { backgroundColor: color, opacity: anim }]} />;
};

const ConversationsScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const [tab, setTab] = useState('live');
    const [search, setSearch] = useState('');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            setError(null);
            const params = { status: tab };
            const res = await callApi.getConversations(params);
            setItems(normaliseList(res.data));
        } catch (e) {
            console.error('[Conversations]', e.message);
            setError('Failed to load. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [tab]);

    useEffect(() => {
        setLoading(true);
        fetchData();
        let interval;
        if (tab === 'live') {
            interval = setInterval(fetchData, 10000);
        }
        return () => clearInterval(interval);
    }, [fetchData, tab]);

    const displayed = items.filter(c => {
        const q = search.toLowerCase();
        return getName(c).toLowerCase().includes(q) || getPhone(c).includes(q);
    });

    const renderItem = ({ item }) => {
        const status = getStatus(item);
        const direction = getDirection(item);
        const name = getName(item);
        const isLive = status === 'LIVE' || status === 'ACTIVE';
        const DirectionIcon = direction === 'OUTBOUND' ? PhoneOutgoing : PhoneIncoming;

        return (
            <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                onPress={() => navigation.navigate('ConversationDetail', { conversation: item, conversationId: getConvId(item) })}
                activeOpacity={0.7}
            >
                <View style={[styles.iconBox, { backgroundColor: colors.primary + '10' }]}>
                    <DirectionIcon size={20} color={colors.primary} />
                </View>
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{name}</Text>
                        {isLive && <PulsingDot color="#ef4444" />}
                    </View>
                    <Text style={[styles.phone, { color: colors.mutedForeground }]}>{getPhone(item)}</Text>
                    <View style={styles.footer}>
                        <View style={[styles.statusPill, { backgroundColor: (STATUS_COLORS[status] || colors.mutedForeground) + '15' }]}>
                            <Text style={[styles.statusText, { color: STATUS_COLORS[status] || colors.mutedForeground }]}>{status}</Text>
                        </View>
                        <Text style={[styles.date, { color: colors.mutedForeground }]}>{getFmtDate(item)}</Text>
                    </View>
                </View>
                <ChevronRight size={18} color={colors.mutedForeground} opacity={0.5} />
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: layout.statusBarHeight }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.foreground }]}>Calls</Text>
                <View style={[styles.tabContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    {['live', 'history'].map(t => (
                        <TouchableOpacity
                            key={t}
                            onPress={() => setTab(t)}
                            style={[styles.tab, tab === t && { backgroundColor: colors.primary }]}
                        >
                            <Text style={[styles.tabText, { color: tab === t ? '#fff' : colors.mutedForeground }]}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Search size={18} color={colors.mutedForeground} />
                <TextInput
                    style={[styles.searchInput, { color: colors.foreground }]}
                    placeholder="Search by patient or phone..."
                    placeholderTextColor={colors.mutedForeground}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <AlertCircle size={40} color="#ef4444" opacity={0.5} />
                    <Text style={[styles.errorText, { color: colors.mutedForeground }]}>{error}</Text>
                    <TouchableOpacity onPress={fetchData} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={displayed}
                    keyExtractor={(item) => getConvId(item) || Math.random().toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <MessageSquare size={50} color={colors.mutedForeground} opacity={0.2} />
                            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No calls found</Text>
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
    tabContainer: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 3 },
    tab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9 },
    tabText: { fontSize: 13, fontWeight: '700' },
    searchBox: {
        flexDirection: 'row', alignItems: 'center', marginHorizontal: 20,
        paddingHorizontal: 12, height: 46, borderRadius: 12, borderWidth: 1, marginBottom: 16
    },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 14, fontWeight: '500' },
    list: { paddingHorizontal: 20, paddingBottom: 30 },
    card: {
        flexDirection: 'row', alignItems: 'center', padding: 14,
        borderRadius: 20, borderWidth: 1, marginBottom: 12,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
            android: { elevation: 2 }
        })
    },
    iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    cardContent: { flex: 1, gap: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    name: { fontSize: 15, fontWeight: '700' },
    phone: { fontSize: 13, fontWeight: '500' },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
    statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
    date: { fontSize: 11, fontWeight: '500' },
    liveDot: { width: 8, height: 8, borderRadius: 4 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    errorText: { marginTop: 10, fontSize: 14, fontWeight: '500' },
    retryBtn: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10 },
    retryText: { color: '#fff', fontWeight: '700' },
    empty: { alignItems: 'center', marginTop: 100, gap: 12 },
    emptyText: { fontSize: 15, fontWeight: '500' },
});

export default ConversationsScreen;
