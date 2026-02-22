// ─── iOS 26 Liquid Glass — Conversations / Calls Screen ──────────
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    StyleSheet, View, Text, FlatList, ActivityIndicator,
    TouchableOpacity, RefreshControl, TextInput, Platform, Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeContext';
import { callApi } from '../api/calls';
import { MessageSquare, PhoneIncoming, PhoneOutgoing, Search, ChevronRight, AlertCircle, Wifi } from 'lucide-react-native';
import LiquidGlass from '../components/LiquidGlass';
import { layout } from '../utils/layout';
import { useStagger, useScalePressAnim, usePulse, SPRING } from '../utils/animations';

const LIVE_COLOR = '#10b981';
const ENDED_COLOR = '#6b7280';
const FAIL_COLOR = '#ef4444';

const getStatusColor = (s) => {
    s = s?.toUpperCase();
    if (s === 'LIVE' || s === 'ACTIVE') return LIVE_COLOR;
    if (s === 'FAILED') return FAIL_COLOR;
    return ENDED_COLOR;
};

const normalise = (d) => {
    if (!d) return [];
    const raw = d?.calls || d?.conversations || d?.data || (Array.isArray(d) ? d : []);
    return Array.isArray(raw) ? raw : [];
};

const getName = (c) => c?.patient?.name || c?.callee?.name || c?.callerName || 'Unknown Patient';
const getPhone = (c) => c?.patient?.phone || c?.phone || '—';
const getId = (c) => c?.id || c?.conversationId || c?._id;
const getDirn = (c) => c?.direction?.toUpperCase() || 'OUTBOUND';

// ── Live pulsing dot ─────────────────────────────────────────────
const LiveDot = ({ color }) => {
    const scale = usePulse(0.6, 1);
    return <Animated.View style={[styles.liveDot, { backgroundColor: color, transform: [{ scale }] }]} />;
};

// ── Glass Tab Toggle ──────────────────────────────────────────────
const SegmentTab = ({ tabs, active, onChange, colors }) => {
    const g = colors.glass;
    return (
        <LiquidGlass
            intensity={g.blur}
            tint={g.tint}
            containerStyle={styles.segmentWrap}
            padding={4}
            style={{ flexDirection: 'row' }}
        >
            {tabs.map(t => {
                const on = active === t;
                return (
                    <TouchableOpacity
                        key={t}
                        onPress={() => onChange(t)}
                        style={[styles.segmentTab, on && { backgroundColor: colors.foreground }]}
                    >
                        <Text style={[styles.segmentText, { color: on ? colors.background : colors.mutedForeground }]}>
                            {t}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </LiquidGlass>
    );
};

// ── Call card ───────────────────────────────────────────────────
const CallCard = ({ item, index, colors, onPress, anim }) => {
    const g = colors.glass;
    const { scale, pressIn, pressOut } = useScalePressAnim();

    const status = item.status?.toUpperCase() || 'ENDED';
    const isLive = status === 'LIVE' || status === 'ACTIVE';
    const sColor = getStatusColor(status);
    const DirIcon = getDirn(item) === 'INBOUND' ? PhoneIncoming : PhoneOutgoing;

    return (
        <Animated.View style={anim ? { opacity: anim.opacity, transform: [{ translateY: anim.translateY }, { scale }] } : { transform: [{ scale }] }}>
            <TouchableOpacity onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={1}>
                <LiquidGlass
                    intensity={g.blur}
                    tint={g.tint}
                    containerStyle={styles.card}
                    padding={0}
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                >
                    <View style={[styles.iconBox, { backgroundColor: sColor + '10' }]}>
                        <DirIcon size={20} color={sColor} strokeWidth={2.5} />
                    </View>
                    <View style={styles.cardBody}>
                        <View style={styles.cardHeader}>
                            <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{getName(item)}</Text>
                            {isLive && <LiveDot color={sColor} />}
                        </View>
                        <Text style={[styles.phone, { color: colors.mutedForeground }]}>{getPhone(item)}</Text>
                        <View style={styles.footerRow}>
                            <View style={[styles.statusBadge, { backgroundColor: sColor + '12' }]}>
                                <Text style={[styles.statusText, { color: sColor }]}>{status}</Text>
                            </View>
                            <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.arrowBox, { backgroundColor: colors.muted }]}>
                        <ChevronRight size={14} color={colors.foreground} strokeWidth={3} />
                    </View>
                </LiquidGlass>
            </TouchableOpacity>
        </Animated.View>
    );
};

const ConversationsScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const g = colors.glass;

    const [tab, setTab] = useState('Live');
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refresh, setRefresh] = useState(false);
    const [search, setSearch] = useState('');
    const [error, setError] = useState(null);
    const intervalRef = useRef(null);
    const staggerAnims = useStagger(8, 60);

    const fetchCalls = useCallback(async () => {
        try {
            setError(null);
            const params = tab === 'Live' ? { status: 'live' } : { status: 'history' };
            const res = await callApi.getConversations(params);
            setCalls(normalise(res?.data));
        } catch (e) {
            setError('Failed to load calls.');
        } finally {
            setLoading(false);
            setRefresh(false);
        }
    }, [tab]);

    useEffect(() => {
        setLoading(true);
        fetchCalls();
        if (tab === 'Live') {
            intervalRef.current = setInterval(fetchCalls, 12000);
        }
        return () => clearInterval(intervalRef.current);
    }, [fetchCalls, tab]);

    const displayed = calls.filter(c => {
        const q = search.toLowerCase();
        return getName(c).toLowerCase().includes(q) || getPhone(c).includes(q);
    });

    return (
        <View style={styles.screen}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: layout.statusBarHeight + 10 }]}>
                <View>
                    <Text style={[styles.title, { color: colors.foreground }]}>Calls</Text>
                    <Text style={[styles.subtitle, { color: colors.primary }]}>Conversation History</Text>
                </View>
                <SegmentTab
                    tabs={['Live', 'History']}
                    active={tab}
                    onChange={(t) => { setLoading(true); setTab(t); }}
                    colors={colors}
                />
            </View>

            {/* Search */}
            <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                <LiquidGlass
                    intensity={g.blur}
                    tint={g.tint}
                    padding={0}
                    style={styles.searchBlur}
                >
                    <View style={styles.searchIcon}>
                        <Search size={18} color={colors.primary} strokeWidth={2.5} />
                    </View>
                    <TextInput
                        style={[styles.searchInput, { color: colors.foreground }]}
                        placeholder="Search patient or phone…"
                        placeholderTextColor={colors.mutedForeground}
                        value={search}
                        onChangeText={setSearch}
                    />
                </LiquidGlass>
            </View>

            {loading && !refresh ? (
                <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
            ) : error ? (
                <View style={styles.center}>
                    <AlertCircle size={44} color={colors.error} opacity={0.5} />
                    <Text style={[styles.errorText, { color: colors.mutedForeground }]}>{error}</Text>
                    <TouchableOpacity onPress={() => { setRefresh(true); fetchCalls(); }} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={displayed}
                    keyExtractor={(i) => getId(i)?.toString() || Math.random().toString()}
                    renderItem={({ item, index }) => (
                        <CallCard
                            item={item} index={index} colors={colors}
                            anim={staggerAnims[Math.min(index, staggerAnims.length - 1)]}
                            onPress={() => navigation.navigate('ConversationDetail', {
                                conversationId: getId(item), conversation: item,
                            })}
                        />
                    )}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refresh} onRefresh={() => { setRefresh(true); fetchCalls(); }} tintColor={colors.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <MessageSquare size={60} color={colors.mutedForeground} opacity={0.2} />
                            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                                {tab === 'Live' ? 'No active calls right now' : 'No call history'}
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
    title: { fontSize: 34, fontWeight: '900', letterSpacing: -1.5 },
    subtitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: -2 },
    segmentWrap: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, overflow: 'hidden', padding: 4 },
    segmentTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
    segmentText: { fontSize: 13, fontWeight: '800' },
    searchBlur: { flexDirection: 'row', alignItems: 'center', height: 54, paddingHorizontal: 16, gap: 12, borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
    searchIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    searchInput: { flex: 1, fontSize: 16, fontWeight: '600' },
    list: { paddingHorizontal: 20, paddingBottom: layout.tabBarHeight + 30, gap: 12 },
    card: {
        flexDirection: 'row', alignItems: 'center', borderRadius: 28, borderWidth: 1, overflow: 'hidden',
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16 }, android: { elevation: 4 } }),
    },
    cardShimmer: { position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, opacity: 0.8 },
    iconBox: { width: 56, height: 56, margin: 14, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    cardBody: { flex: 1, paddingVertical: 16, paddingRight: 8, gap: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    name: { flex: 1, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
    phone: { fontSize: 13, fontWeight: '600', opacity: 0.6 },
    footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
    timeText: { fontSize: 12, fontWeight: '700', opacity: 0.6 },
    arrowBox: { width: 28, height: 28, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 14, opacity: 0.7 },
    liveDot: { width: 8, height: 8, borderRadius: 4 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: 14 },
    errorText: { fontSize: 16, fontWeight: '700', textAlign: 'center', opacity: 0.6 },
    retryBtn: { marginTop: 12, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 16 },
    retryText: { color: '#fff', fontWeight: '800' },
    emptyText: { fontSize: 16, fontWeight: '800', textAlign: 'center', opacity: 0.4 },
});

export default ConversationsScreen;
