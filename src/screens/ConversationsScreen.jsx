import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    StyleSheet, View, Text, FlatList, ActivityIndicator,
    TouchableOpacity, RefreshControl, TextInput, Animated,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { callApi } from '../api/calls';
import { getName, getPhone, getConvId, getStatus, getDirection, getType, getDuration, getFmtDate, normaliseList } from '../shared/callHelpers';
import {
    MessageSquare, PhoneCall, PhoneIncoming, PhoneOutgoing,
    Search, Clock, ChevronRight, AlertCircle, Wifi,
} from 'lucide-react-native';

// ─── Type config ─────────────────────────────────────────────────────────────
const TYPE_CFG = {
    reminder: { label: 'Reminder', color: '#6366f1' },
    booking: { label: 'Booking', color: '#3b82f6' },
    feedback: { label: 'Feedback', color: '#f59e0b' },
    follow_up: { label: 'Follow-up', color: '#10b981' },
    live: { label: 'Live', color: '#ef4444' },
};
const STATUS_COLORS = {
    LIVE: '#10b981', ENDED: '#6b7280', FAILED: '#ef4444', CANCELLED: '#f59e0b',
    ACTIVE: '#10b981', COMPLETED: '#3b82f6',
};

// ─── Pulsing Live dot ────────────────────────────────────────────────────────
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

// ─── Conversation row card ────────────────────────────────────────────────────
const ConvCard = ({ item, colors, onPress }) => {
    const status = getStatus(item);
    const direction = getDirection(item);
    const type = getType(item);
    const isLive = status === 'LIVE' || status === 'ACTIVE';
    const statusColor = STATUS_COLORS[status] || colors.mutedForeground;
    const typeCfg = TYPE_CFG[type];

    const DirectionIcon = direction === 'OUTBOUND' ? PhoneOutgoing : direction === 'INBOUND' ? PhoneIncoming : PhoneCall;

    return (
        <TouchableOpacity
            activeOpacity={0.75}
            onPress={onPress}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        >
            {/* Icon */}
            <View style={[styles.iconBox, { backgroundColor: (typeCfg?.color || colors.primary) + '18' }]}>
                <DirectionIcon size={20} color={typeCfg?.color || colors.primary} />
            </View>

            {/* Content */}
            <View style={styles.cardBody}>
                <View style={styles.cardRow}>
                    <Text style={[styles.patientName, { color: colors.foreground }]} numberOfLines={1}>
                        {getName(item)}
                    </Text>
                    {isLive && <PulsingDot color="#ef4444" />}
                </View>
                <Text style={[styles.phone, { color: colors.mutedForeground }]}>{getPhone(item)}</Text>
                <View style={styles.cardRow2}>
                    {!!typeCfg && (
                        <View style={[styles.pill, { backgroundColor: typeCfg.color + '18', borderColor: typeCfg.color + '40' }]}>
                            <Text style={[styles.pillTxt, { color: typeCfg.color }]}>{typeCfg.label}</Text>
                        </View>
                    )}
                    <View style={[styles.pill, { backgroundColor: statusColor + '18', borderColor: statusColor + '40' }]}>
                        <Text style={[styles.pillTxt, { color: statusColor }]}>{status}</Text>
                    </View>
                </View>
                <View style={styles.cardFooter}>
                    {!!getDuration(item) && (
                        <View style={styles.footerItem}>
                            <Clock size={12} color={colors.mutedForeground} />
                            <Text style={[styles.footerTxt, { color: colors.mutedForeground }]}>{getDuration(item)}</Text>
                        </View>
                    )}
                    <Text style={[styles.footerDate, { color: colors.mutedForeground }]}>{getFmtDate(item)}</Text>
                </View>
            </View>
            <ChevronRight size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
    );
};

// ─── Tab buttons ───────────────────────────────────────────────────────────────
const TABS = [
    { key: 'live', label: 'Live', params: { status: 'live' } },
    { key: 'history', label: 'History', params: { status: 'history' } },
    { key: 'outbound', label: 'Follow-up', params: { status: 'history', direction: 'OUTBOUND' } },
];

const HISTORY_TYPES = [
    { key: '', label: 'All' },
    { key: 'reminder', label: 'Reminder' },
    { key: 'booking', label: 'Booking' },
    { key: 'feedback', label: 'Feedback' },
    { key: 'follow_up', label: 'Follow-up' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────
const ConversationsScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const [tab, setTab] = useState('live');
    const [typeFilter, setTypeFilter] = useState('');
    const [search, setSearch] = useState('');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const liveInterval = useRef(null);

    const fetchData = useCallback(async () => {
        setError(null);
        try {
            const tabCfg = TABS.find(t => t.key === tab);
            const params = { ...tabCfg.params };
            if (tab === 'history' && typeFilter) params.type = typeFilter;

            const res = await callApi.getConversations(params);
            setItems(normaliseList(res.data));
        } catch (e) {
            console.error('[Conversations]', e?.response?.data || e.message);
            setError(e?.response?.data?.message || 'Failed to load conversations.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [tab, typeFilter]);

    useEffect(() => {
        setLoading(true);
        setItems([]);
        fetchData();

        // Auto-refresh live tab every 15s
        if (tab === 'live') {
            liveInterval.current = setInterval(fetchData, 15000);
        }
        return () => clearInterval(liveInterval.current);
    }, [fetchData]);

    const displayed = search.trim()
        ? items.filter(c => {
            const q = search.toLowerCase();
            return getName(c).toLowerCase().includes(q)
                || getPhone(c).includes(q);
        })
        : items;

    const onPressItem = (item) => {
        navigation.navigate('ConversationDetail', {
            conversation: item,
            conversationId: getConvId(item),
        });
    };

    return (
        <View style={[styles.screen, { backgroundColor: colors.background }]}>
            {/* Tabs */}
            <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
                {TABS.map(t => {
                    const active = tab === t.key;
                    return (
                        <TouchableOpacity
                            key={t.key}
                            onPress={() => { setTab(t.key); setTypeFilter(''); }}
                            style={[styles.tabBtn, active && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                        >
                            {t.key === 'live' && <Wifi size={13} color={active ? colors.primary : colors.mutedForeground} />}
                            <Text style={[styles.tabTxt, { color: active ? colors.primary : colors.mutedForeground }]}>
                                {t.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Search */}
            <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Search size={16} color={colors.mutedForeground} />
                <TextInput
                    style={[styles.searchInput, { color: colors.foreground }]}
                    placeholder="Search patient or phone…"
                    placeholderTextColor={colors.mutedForeground}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {/* Type filter pills (History tab only) */}
            {tab === 'history' && (
                <FlatList
                    data={HISTORY_TYPES}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={i => i.key}
                    contentContainerStyle={styles.filterRow}
                    renderItem={({ item }) => {
                        const active = typeFilter === item.key;
                        return (
                            <TouchableOpacity
                                onPress={() => setTypeFilter(item.key)}
                                style={[styles.filterPill,
                                { borderColor: active ? colors.primary : colors.cardBorder },
                                active && { backgroundColor: colors.primary }
                                ]}
                            >
                                <Text style={[styles.filterTxt, { color: active ? '#fff' : colors.mutedForeground }]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            )}

            {/* Content */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingTxt, { color: colors.mutedForeground }]}>Loading conversations…</Text>
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <AlertCircle size={48} color="#ef4444" />
                    <Text style={[styles.errorTxt, { color: '#ef4444' }]}>{error}</Text>
                    <TouchableOpacity onPress={() => { setLoading(true); fetchData(); }}
                        style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
                        <Text style={styles.retryTxt}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={displayed}
                    keyExtractor={(item) => getConvId(item) || Math.random().toString()}
                    renderItem={({ item }) => <ConvCard item={item} colors={colors} onPress={() => onPressItem(item)} />}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />}
                    ListHeaderComponent={
                        displayed.length > 0
                            ? <Text style={[styles.countLabel, { color: colors.mutedForeground }]}>{displayed.length} conversation{displayed.length !== 1 ? 's' : ''}</Text>
                            : null
                    }
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <MessageSquare size={52} color={colors.cardBorder} />
                            <Text style={[styles.emptyTxt, { color: colors.mutedForeground }]}>
                                {tab === 'live' ? 'No active calls right now' : 'No conversations found'}
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
    tabBar: {
        flexDirection: 'row', borderBottomWidth: 1,
    },
    tabBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 14, gap: 6,
    },
    tabTxt: { fontSize: 14, fontWeight: '600' },
    searchBar: {
        flexDirection: 'row', alignItems: 'center',
        mx: 16, margin: 12, marginBottom: 4, borderRadius: 12, borderWidth: 1,
        paddingHorizontal: 12, height: 44,
    },
    searchInput: { flex: 1, fontSize: 14, marginLeft: 8 },
    filterRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
    filterPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
    filterTxt: { fontSize: 13, fontWeight: '500' },
    list: { paddingHorizontal: 12, paddingBottom: 24 },
    countLabel: { fontSize: 13, marginBottom: 8, marginTop: 4 },

    card: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 14, borderWidth: 1,
        padding: 14, marginBottom: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
    },
    iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    cardBody: { flex: 1 },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
    cardRow2: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
    patientName: { fontSize: 15, fontWeight: '600', flex: 1 },
    phone: { fontSize: 13 },
    pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, borderWidth: 1 },
    pillTxt: { fontSize: 11, fontWeight: '600' },
    footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    footerTxt: { fontSize: 12 },
    footerDate: { fontSize: 12 },
    liveDot: { width: 8, height: 8, borderRadius: 4 },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
    loadingTxt: { fontSize: 14 },
    errorTxt: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
    retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
    retryTxt: { color: '#fff', fontWeight: '600' },
    emptyTxt: { fontSize: 16, marginTop: 8, textAlign: 'center' },
});

export default ConversationsScreen;
