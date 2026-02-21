import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    StyleSheet, View, Text, FlatList, ActivityIndicator,
    TouchableOpacity, RefreshControl, Animated, Alert, TextInput, Modal,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { callApi } from '../api/calls';
import socketService from '../services/socket';
import { storage } from '../api/storage';
import { getName, getPhone, getConvId, getType, normaliseList } from '../shared/callHelpers';
import {
    PhoneCall, ChevronRight, AlertCircle, Wifi, WifiOff, User, Clock,
} from 'lucide-react-native';

function getFmtDate(c) {
    const raw = c?.started_at || c?.startedAt || c?.created_at || c?.createdAt;
    if (!raw) return '';
    return new Date(raw).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

const TYPE_COLORS = {
    reminder: '#6366f1',
    booking: '#3b82f6',
    feedback: '#f59e0b',
    follow_up: '#10b981',
    inbound: '#0ea5e9',
    outbound: '#8b5cf6',
};

const TYPE_TABS = [
    { key: '', label: 'All' },
    { key: 'reminder', label: 'Reminder' },
    { key: 'feedback', label: 'Feedback' },
    { key: 'booking', label: 'Booking' },
    { key: 'follow_up', label: 'Follow-up' },
];

function dedupeById(arr) {
    const seen = new Set();
    return arr.filter(c => {
        const id = getConvId(c);
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
    });
}

// ── Pulsing live ring ─────────────────────────────────────────────────────────
const PulsingRing = ({ color }) => {
    const scale = useRef(new Animated.Value(1)).current;
    const opacity = useRef(new Animated.Value(0.8)).current;
    useEffect(() => {
        Animated.loop(Animated.parallel([
            Animated.sequence([
                Animated.timing(scale, { toValue: 1.5, duration: 900, useNativeDriver: true }),
                Animated.timing(scale, { toValue: 1, duration: 900, useNativeDriver: true }),
            ]),
            Animated.sequence([
                Animated.timing(opacity, { toValue: 0, duration: 900, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.8, duration: 900, useNativeDriver: true }),
            ]),
        ])).start();
    }, []);
    return (
        <View style={styles.ringWrap}>
            <Animated.View style={[styles.ring, { borderColor: color, transform: [{ scale }], opacity }]} />
            <View style={[styles.dot, { backgroundColor: color }]} />
        </View>
    );
};

// ── Call card ──────────────────────────────────────────────────────────────────
const LiveCallCard = ({ item, colors, elapsed, onPress }) => {
    const type = getType(item);
    const direction = (item?.direction || item?.call_direction || '').toLowerCase();
    const rawType = type || direction || 'call';
    const typeColor = TYPE_COLORS[rawType] || TYPE_COLORS[direction] || colors.primary;
    const typeLabel = rawType.replace('_', '-');

    return (
        <TouchableOpacity
            activeOpacity={0.75}
            onPress={onPress}
            style={[styles.card, { backgroundColor: colors.card, borderColor: typeColor + '50' }]}
        >
            {/* Coloured left accent bar */}
            <View style={[styles.accentBar, { backgroundColor: typeColor }]} />

            <PulsingRing color="#ef4444" />

            <View style={styles.cardBody}>
                <View style={styles.cardTopRow}>
                    <Text style={[styles.name, { color: colors.foreground, flex: 1 }]} numberOfLines={1}>
                        {getName(item)}
                    </Text>
                    <View style={[styles.liveBadge, { backgroundColor: '#ef444420' }]}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveTxt}>LIVE</Text>
                    </View>
                </View>

                <Text style={[styles.phone, { color: colors.mutedForeground }]}>{getPhone(item)}</Text>

                <View style={styles.metaRow}>
                    {/* Type pill */}
                    <View style={[styles.pill, { backgroundColor: typeColor + '18', borderColor: typeColor + '40' }]}>
                        <Text style={[styles.pillTxt, { color: typeColor }]}>{typeLabel}</Text>
                    </View>

                    {/* Elapsed timer */}
                    <View style={styles.timerRow}>
                        <Clock size={12} color="#10b981" />
                        <Text style={[styles.timer, { color: '#10b981' }]}>{elapsed}</Text>
                    </View>
                </View>
            </View>
            <ChevronRight size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
    );
};

// ── Timer hook for elapsed display ────────────────────────────────────────────
function useElapsed(startedAt) {
    const [elapsed, setElapsed] = useState('');
    useEffect(() => {
        const start = startedAt ? new Date(startedAt).getTime() : Date.now();
        const tick = () => {
            const s = Math.floor((Date.now() - start) / 1000);
            const m = Math.floor(s / 60), ss = s % 60;
            setElapsed(`${m}:${String(ss).padStart(2, '0')}`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [startedAt]);
    return elapsed;
}

// Wrapper to give each card its own timer
const LiveCardWrapper = ({ item, colors, onPress }) => {
    const elapsed = useElapsed(item?.started_at || item?.startedAt || item?.created_at || item?.createdAt);
    return <LiveCallCard item={item} colors={colors} elapsed={elapsed} onPress={onPress} />;
};

// ── Screen ───────────────────────────────────────────────────────────────────
const LiveCallsScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const { user } = useAuth();
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [wsConnected, setWsConnected] = useState(false);
    const [error, setError] = useState(null);
    const [typeFilter, setTypeFilter] = useState('');

    const hospitalId = user?.hospital_id || user?.hospitalId || user?.branch_id;

    const fetchCalls = useCallback(async () => {
        setError(null);
        try {
            // Fetch from both endpoints and merge, deduping by ID
            const [res1, res2] = await Promise.allSettled([
                callApi.getLiveConversations(),
                callApi.getLiveCalls(),
            ]);
            const list1 = res1.status === 'fulfilled'
                ? (res1.value.data?.conversations || res1.value.data?.rows || res1.value.data || [])
                : [];
            const list2 = res2.status === 'fulfilled'
                ? (res2.value.data?.calls || res2.value.data?.rows || res2.value.data || [])
                : [];
            const merged = dedupeById([...list1, ...list2].filter(Array.isArray(list1) ? Boolean : Boolean));
            setCalls(Array.isArray(merged) ? merged : []);
        } catch (e) {
            setError(e?.response?.data?.message || 'Failed to load live calls.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchCalls();

        // WebSocket for real-time call updates
        (async () => {
            const token = await storage.getItem('accessToken');
            socketService.connect(token);

            const onConnect = () => {
                setWsConnected(true);
                if (hospitalId) socketService.subscribeHospital(hospitalId);
            };
            const onDisconnect = () => setWsConnected(false);
            const onCallUpdate = (data) => {
                // Refetch on any call:update event
                fetchCalls();
                // If this call ended and it's our selected call, remove from list
                if (data?.type === 'call_ended' && data?.sessionId) {
                    setCalls(prev => prev.filter(c => getConvId(c) !== data.sessionId));
                }
            };

            socketService.on('connect', onConnect);
            socketService.on('disconnect', onDisconnect);
            socketService.on('call:update', onCallUpdate);

            return () => {
                socketService.off('connect', onConnect);
                socketService.off('disconnect', onDisconnect);
                socketService.off('call:update', onCallUpdate);
                if (hospitalId) socketService.unsubscribeHospital(hospitalId);
            };
        })();
    }, [fetchCalls, hospitalId]);

    const displayed = typeFilter
        ? calls.filter(c => getType(c) === typeFilter)
        : calls;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* WS status banner */}
            <View style={[styles.wsBanner, { backgroundColor: wsConnected ? '#10b98115' : colors.muted }]}>
                {wsConnected
                    ? <Wifi size={14} color="#10b981" />
                    : <WifiOff size={14} color={colors.mutedForeground} />
                }
                <Text style={[styles.wsTxt, { color: wsConnected ? '#10b981' : colors.mutedForeground }]}>
                    {wsConnected ? 'Real-time connected' : 'Connecting to real-time…'}
                </Text>
                {calls.length > 0 && (
                    <Text style={[styles.countBadge, { backgroundColor: '#ef444420', color: '#ef4444' }]}>
                        {calls.length} active
                    </Text>
                )}
            </View>

            {/* Type filter tabs */}
            <View style={[styles.filterRow, { borderBottomColor: colors.cardBorder }]}>
                {TYPE_TABS.map(t => {
                    const active = typeFilter === t.key;
                    return (
                        <TouchableOpacity
                            key={t.key}
                            onPress={() => setTypeFilter(t.key)}
                            style={[
                                styles.filterTab,
                                active && { borderBottomColor: colors.primary, borderBottomWidth: 2.5 }
                            ]}
                        >
                            <Text style={[styles.filterTxt, { color: active ? colors.primary : colors.mutedForeground }]}>
                                {t.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <AlertCircle size={48} color="#ef4444" />
                    <Text style={[styles.errorTxt, { color: '#ef4444' }]}>{error}</Text>
                    <TouchableOpacity onPress={() => { setLoading(true); fetchCalls(); }}
                        style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
                        <Text style={styles.retryTxt}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={displayed}
                    keyExtractor={(item) => getConvId(item) || Math.random().toString()}
                    renderItem={({ item }) => (
                        <LiveCardWrapper
                            item={item}
                            colors={colors}
                            onPress={() => navigation.navigate('ConversationDetail', {
                                conversation: item,
                                conversationId: getConvId(item),
                            })}
                        />
                    )}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCalls(); }} tintColor={colors.primary} />}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <PhoneCall size={64} color={colors.cardBorder} />
                            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Active Calls</Text>
                            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                                {typeFilter
                                    ? `No live ${typeFilter.replace('_', '-')} calls right now.`
                                    : 'All call types appear here in real time.\nPull down to refresh.'
                                }
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
    wsBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 16, paddingVertical: 8,
    },
    wsTxt: { fontSize: 12, fontWeight: '500', flex: 1 },
    countBadge: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
    filterRow: {
        flexDirection: 'row', borderBottomWidth: 1,
    },
    filterTab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
    filterTxt: { fontSize: 12, fontWeight: '600' },
    list: { padding: 16, paddingBottom: 40 },
    card: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 16, borderWidth: 1.5,
        padding: 14, marginBottom: 12, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
    },
    accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
    cardBody: { flex: 1, marginLeft: 14 },
    cardTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    name: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
    phone: { fontSize: 13, marginBottom: 6 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, borderWidth: 1 },
    pillTxt: { fontSize: 11, fontWeight: '600' },
    timerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    timer: { fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
    liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444' },
    liveTxt: { fontSize: 11, fontWeight: '800', color: '#ef4444', letterSpacing: 0.5 },

    ringWrap: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
    ring: { position: 'absolute', width: 24, height: 24, borderRadius: 12, borderWidth: 2 },
    dot: { width: 10, height: 10, borderRadius: 5 },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
    errorTxt: { fontSize: 15, textAlign: 'center' },
    retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
    retryTxt: { color: '#fff', fontWeight: '600' },
    emptyTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
    emptySubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});

export default LiveCallsScreen;
