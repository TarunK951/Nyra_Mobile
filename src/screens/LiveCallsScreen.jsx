import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    StyleSheet, View, Text, FlatList, ActivityIndicator,
    TouchableOpacity, RefreshControl, Animated, Alert, Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { callApi } from '../api/calls';
import socketService from '../services/socket';
import { storage } from '../api/storage';
import { getName, getPhone, getConvId, getType, normaliseList } from '../shared/callHelpers';
import {
    PhoneCall, ChevronRight, AlertCircle, Wifi, WifiOff, Clock,
} from 'lucide-react-native';
import LiquidGlass from '../components/LiquidGlass';
import { layout } from '../utils/layout';
import { useStagger, useScalePressAnim, SPRING } from '../utils/animations';

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
                Animated.timing(scale, { toValue: 1.6, duration: 1200, useNativeDriver: true }),
                Animated.timing(scale, { toValue: 1, duration: 1200, useNativeDriver: true }),
            ]),
            Animated.sequence([
                Animated.timing(opacity, { toValue: 0.1, duration: 1200, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.8, duration: 1200, useNativeDriver: true }),
            ]),
        ])).start();
    }, []);
    return (
        <View style={styles.ringWrap}>
            <Animated.View style={[styles.ring, { borderColor: color, transform: [{ scale }], opacity }]} />
            <View style={[styles.dot, { backgroundColor: color, shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8 }]} />
        </View>
    );
};

// ── Call card ──────────────────────────────────────────────────────────────────
const LiveCallCard = ({ item, colors, elapsed, onPress, anim }) => {
    const type = getType(item);
    const direction = (item?.direction || item?.call_direction || '').toLowerCase();
    const rawType = type || direction || 'call';
    const typeColor = TYPE_COLORS[rawType] || TYPE_COLORS[direction] || colors.primary;
    const typeLabel = rawType.replace('_', ' ');
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
                <LiquidGlass
                    intensity={g.blur}
                    tint={g.tint}
                    padding={16}
                    borderRadius={24}
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                >
                    <View style={[styles.accentBar, { backgroundColor: typeColor }]} />
                    <PulsingRing color="#ef4444" />

                    <View style={styles.cardBody}>
                        <View style={styles.cardTopRow}>
                            <Text style={[styles.name, { color: colors.foreground, flex: 1 }]} numberOfLines={1}>
                                {getName(item)}
                            </Text>
                            <View style={[styles.timerRow, { backgroundColor: colors.success + '10', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }]}>
                                <Clock size={12} color={colors.success} strokeWidth={3} />
                                <Text style={[styles.timer, { color: colors.success }]}>{elapsed}</Text>
                            </View>
                        </View>

                        <Text style={[styles.phone, { color: colors.mutedForeground }]}>{getPhone(item)}</Text>

                        <View style={styles.metaRow}>
                            <View style={[styles.pill, { backgroundColor: typeColor + '10', borderColor: typeColor + '20' }]}>
                                <Text style={[styles.pillTxt, { color: typeColor }]}>{typeLabel}</Text>
                            </View>
                            <View style={[styles.liveBadge, { backgroundColor: colors.error + '10' }]}>
                                <View style={[styles.liveDot, { backgroundColor: colors.error }]} />
                                <Text style={[styles.liveTxt, { color: colors.error }]}>LIVE MONITOR</Text>
                            </View>
                        </View>
                    </View>
                    <ChevronRight size={14} color={colors.mutedForeground} strokeWidth={3} opacity={0.4} />
                </LiquidGlass>
            </TouchableOpacity>
        </Animated.View>
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
const LiveCardWrapper = ({ item, colors, onPress, anim }) => {
    const elapsed = useElapsed(item?.started_at || item?.startedAt || item?.created_at || item?.createdAt);
    return <LiveCallCard item={item} colors={colors} elapsed={elapsed} onPress={onPress} anim={anim} />;
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
    const staggerAnims = useStagger(10, 80);

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

    const g = colors.glass;

    return (
        <View style={styles.container}>
            {/* WS status banner */}
            <LiquidGlass
                intensity={g.blurStrong}
                tint={g.tint}
                padding={0}
                containerStyle={styles.wsBanner}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 }}
            >
                <View style={styles.bannerGlow} />
                <View style={[styles.wsPill, { backgroundColor: wsConnected ? colors.success + '15' : colors.muted }]}>
                    <View style={[styles.wsStatusDot, { backgroundColor: wsConnected ? colors.success : colors.mutedForeground }]} />
                    <Text style={[styles.wsTxt, { color: wsConnected ? colors.success : colors.mutedForeground }]}>
                        {wsConnected ? 'SECURE SOCKET LIVE' : 'CONNECTING TO CLINIC…'}
                    </Text>
                </View>
                {calls.length > 0 && (
                    <View style={[styles.activeIndicator, { backgroundColor: colors.error + '15' }]}>
                        <Text style={[styles.countBadge, { color: colors.error }]}>
                            {calls.length} ACTIVE NOW
                        </Text>
                    </View>
                )}
            </LiquidGlass>

            {/* Type filter segment */}
            <Animated.View style={staggerAnims[0] ? [styles.filterOuter, { opacity: staggerAnims[0].opacity, transform: [{ translateY: staggerAnims[0].translateY }] }] : styles.filterOuter}>
                <LiquidGlass
                    intensity={g.blur}
                    tint={g.tint}
                    padding={0}
                    containerStyle={styles.filterRow}
                >
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                        {TYPE_TABS.map(t => {
                            const active = typeFilter === t.key;
                            return (
                                <TouchableOpacity
                                    key={t.key}
                                    onPress={() => setTypeFilter(t.key)}
                                    style={[
                                        styles.filterTab,
                                        active && { backgroundColor: colors.primary }
                                    ]}
                                >
                                    <Text style={[styles.filterTxt, { color: active ? '#fff' : colors.mutedForeground, fontWeight: '800' }]}>
                                        {t.label.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </LiquidGlass>
            </Animated.View>

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
                    renderItem={({ item, index }) => (
                        <LiveCardWrapper
                            item={item}
                            colors={colors}
                            onPress={() => navigation.navigate('Conversations', {
                                screen: 'ConversationDetail',
                                params: {
                                    conversation: item,
                                    conversationId: getConvId(item),
                                }
                            })}
                            anim={staggerAnims[index + 1]}
                        />
                    )}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCalls(); }} tintColor={colors.primary} />}
                    ListEmptyComponent={
                        <Animated.View style={staggerAnims[1] ? [styles.center, { opacity: staggerAnims[1].opacity, transform: [{ translateY: staggerAnims[1].translateY }] }] : styles.center}>
                            <BlurView intensity={20} tint={g.tint} style={styles.emptyIconWrap}>
                                <PhoneCall size={48} color={colors.primary} strokeWidth={1.5} />
                            </BlurView>
                            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Active Calls</Text>
                            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                                {typeFilter
                                    ? `There are no live ${typeFilter.replace('_', '-')} sessions at the moment.`
                                    : 'All real-time clinical conversations will appear here as they happen.'
                                }
                            </Text>
                        </Animated.View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    wsBanner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 10,
    },
    bannerGlow: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.08)', top: -20, left: -20 },
    wsPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    wsStatusDot: { width: 5, height: 5, borderRadius: 2.5 },
    wsTxt: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    activeIndicator: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    countBadge: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },

    filterOuter: { paddingHorizontal: 16, marginTop: 14, marginBottom: 10 },
    filterRow: {
        flexDirection: 'row', borderRadius: 15, borderWidth: 1, overflow: 'hidden',
    },
    filterScroll: { padding: 4 },
    filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginRight: 5, minWidth: 70, alignItems: 'center' },
    filterTxt: { fontSize: 9, letterSpacing: 1 },

    list: { padding: 16, paddingBottom: layout.tabBarHeight + 20 },
    accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
    cardBody: { flex: 1, marginLeft: 14 },
    cardTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    name: { fontSize: 17, fontWeight: '900', flex: 1, letterSpacing: -0.4 },
    phone: { fontSize: 13, fontWeight: '700', opacity: 0.6 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
    pill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
    pillTxt: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
    timerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    timer: { fontSize: 13, fontWeight: '900', fontVariant: ['tabular-nums'] },
    liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    liveDot: { width: 6, height: 6, borderRadius: 3 },
    liveTxt: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },

    ringWrap: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    ring: { position: 'absolute', width: 44, height: 44, borderRadius: 22, borderWidth: 1.5 },
    dot: { width: 12, height: 12, borderRadius: 6 },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 16 },
    emptyIconWrap: { width: 100, height: 100, borderRadius: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)' },
    emptyTitle: { fontSize: 24, fontWeight: '900', textAlign: 'center', letterSpacing: -0.6 },
    emptySubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, fontWeight: '600', opacity: 0.6 },
    errorTxt: { fontSize: 15, textAlign: 'center', fontWeight: '800' },
    retryBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 16, marginTop: 8 },
    retryTxt: { color: '#fff', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
});

export default LiveCallsScreen;
