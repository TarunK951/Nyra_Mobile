import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    StyleSheet, View, Text, FlatList, ActivityIndicator,
    TouchableOpacity, RefreshControl, Platform, Image,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { callApi } from '../api/calls';
import AudioPlayer from '../components/AudioPlayer';
import socketService from '../services/socket';
import { storage } from '../api/storage';
import { getName, getPhone, getConvId, getStatus, getDirection, getType, getDuration, getFmtDate, getAudioUrl } from '../shared/callHelpers';
import {
    ChevronLeft, PhoneCall, PhoneIncoming, PhoneOutgoing,
    Clock, User, Calendar, Mic, AlertCircle,
} from 'lucide-react-native';

// Normalise messages from all possible shapes
function normaliseMessages(conv) {
    const raw = conv?.messages
        || conv?.conversation?.messages
        || conv?.data?.messages
        || [];
    if (!Array.isArray(raw)) return [];

    return raw
        .filter(m => (m?.text || m?.content || m?.message)?.trim())
        .map(m => ({
            id: m?.id || Math.random().toString(),
            text: m?.text || m?.content || m?.message,
            role: (m?.role || m?.sender || 'user').toString().toLowerCase(),
            ts: m?.ts || m?.timestamp || m?.created_at || m?.createdAt || 0,
        }))
        .sort((a, b) => {
            const ta = typeof a.ts === 'number' ? a.ts : new Date(a.ts).getTime();
            const tb = typeof b.ts === 'number' ? b.ts : new Date(b.ts).getTime();
            return ta - tb;
        });
}

function isBot(role) { return ['agent', 'assistant', 'ai', 'bot'].includes(role); }

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_COLORS = {
    LIVE: '#10b981', ENDED: '#6b7280', FAILED: '#ef4444',
    CANCELLED: '#f59e0b', ACTIVE: '#10b981', COMPLETED: '#3b82f6',
};
const StatusBadge = ({ status, colors }) => {
    const color = STATUS_COLORS[status] || colors.mutedForeground;
    return (
        <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color + '40' }]}>
            {status === 'LIVE' && <View style={[styles.dot, { backgroundColor: color }]} />}
            <Text style={[styles.badgeTxt, { color }]}>{status}</Text>
        </View>
    );
};

// ─── Message bubble ──────────────────────────────────────────────────────────
const NYRA_LOGO = 'https://nyraai-main-website.vercel.app/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.c1949d52.png&w=64&q=75';

const Bubble = ({ msg, colors }) => {
    const bot = isBot(msg.role);
    const ts = msg.ts ? new Date(typeof msg.ts === 'number' ? msg.ts : msg.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';

    return (
        <View style={[styles.bubbleRow, bot ? styles.bubbleLeft : styles.bubbleRight]}>
            {bot && (
                <Image source={{ uri: NYRA_LOGO }} style={styles.avatar} />
            )}
            <View style={[
                styles.bubble,
                bot
                    ? [styles.bubbleBot, { backgroundColor: colors.accentSoft, borderColor: colors.cardBorder }]
                    : [styles.bubbleUser, { backgroundColor: colors.primary }]
            ]}>
                {bot && (
                    <Text style={[styles.bubbleLabel, { color: colors.primary }]}>NyraAI</Text>
                )}
                <Text style={[styles.bubbleTxt, { color: bot ? colors.foreground : '#fff' }]}>
                    {msg.text}
                </Text>
                {!!ts && <Text style={[styles.bubbleTime, { color: bot ? colors.mutedForeground : 'rgba(255,255,255,0.6)' }]}>{ts}</Text>}
            </View>
        </View>
    );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const ConversationDetailScreen = ({ route, navigation }) => {
    const { colors } = useTheme();
    const { user } = useAuth();
    const { conversation: convProp, conversationId } = route?.params || {};

    const [conv, setConv] = useState(convProp || null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(!convProp);
    const [refreshing, setRefreshing] = useState(false);
    const [wsStatus, setWsStatus] = useState('disconnected');
    const listRef = useRef(null);

    const id = getConvId(convProp) || conversationId;

    // Fetch full conversation
    const fetchDetail = useCallback(async () => {
        if (!id) return;
        try {
            const res = await callApi.getConversationById(id);
            const data = res.data?.conversation || res.data?.data || res.data;
            setConv(data);
            setMessages(normaliseMessages(data));
        } catch (e) {
            console.error('[ConvDetail]', e?.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    // WebSocket for live transcripts
    useEffect(() => {
        if (!conv || getStatus(conv) !== 'LIVE') return;
        const token = storage.getItem('accessToken');

        (async () => {
            const t = await storage.getItem('accessToken');
            socketService.connect(t);
            setWsStatus('connecting');

            const onConnect = () => {
                setWsStatus('connected');
                socketService.subscribeTranscript(id);
            };
            const onHistory = (data) => {
                const lines = data?.transcripts || data || [];
                if (Array.isArray(lines)) setMessages(lines.map(m => ({
                    id: m?.id || Math.random().toString(),
                    text: m?.text || m?.content || m?.message || '',
                    role: (m?.role || m?.sender || 'user').toString().toLowerCase(),
                    ts: m?.ts || m?.timestamp || 0,
                })).filter(m => m.text));
            };
            const onLine = (line) => {
                const msg = {
                    id: line?.id || Math.random().toString(),
                    text: line?.text || line?.content || line?.message || '',
                    role: (line?.role || line?.sender || 'user').toString().toLowerCase(),
                    ts: line?.ts || line?.timestamp || Date.now(),
                };
                if (msg.text) {
                    setMessages(prev => [...prev, msg]);
                    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
                }
            };
            const onDisconnect = () => setWsStatus('disconnected');

            socketService.on('connect', onConnect);
            socketService.on('transcript:history', onHistory);
            socketService.on('transcript:line', onLine);
            socketService.on('disconnect', onDisconnect);

            return () => {
                socketService.off('connect', onConnect);
                socketService.off('transcript:history', onHistory);
                socketService.off('transcript:line', onLine);
                socketService.off('disconnect', onDisconnect);
                socketService.unsubscribeTranscript(id);
            };
        })();
    }, [conv, id]);

    const audioUrl = getAudioUrl(conv);
    const status = getStatus(conv);
    const isLive = status === 'LIVE' || status === 'ACTIVE';

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* ── Header ── */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={22} color={colors.primary} />
                </TouchableOpacity>
                <View style={styles.headerMid}>
                    <Text style={[styles.headerName, { color: colors.foreground }]} numberOfLines={1}>
                        {conv ? getName(conv) : 'Conversation'}
                    </Text>
                    <View style={styles.headerMeta}>
                        {!!getPhone(conv) && getPhone(conv) !== '—' && (
                            <Text style={[styles.headerPhone, { color: colors.mutedForeground }]}>
                                {getPhone(conv)}
                            </Text>
                        )}
                        {!!status && <StatusBadge status={status} colors={colors} />}
                        {isLive && (
                            <Text style={[styles.wsIndicator, { color: wsStatus === 'connected' ? '#10b981' : colors.mutedForeground }]}>
                                {wsStatus === 'connected' ? '● Live' : '○ Connecting…'}
                            </Text>
                        )}
                    </View>
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    ref={listRef}
                    data={messages}
                    keyExtractor={m => m.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDetail(); }} tintColor={colors.primary} />}
                    ListHeaderComponent={
                        <View>
                            {/* Meta card */}
                            <View style={[styles.metaCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                                <View style={styles.metaRow}>
                                    <Calendar size={14} color={colors.mutedForeground} />
                                    <Text style={[styles.metaTxt, { color: colors.mutedForeground }]}>{getFmtDate(conv)}</Text>
                                </View>
                                {!!getDuration(conv) && (
                                    <View style={styles.metaRow}>
                                        <Clock size={14} color={colors.mutedForeground} />
                                        <Text style={[styles.metaTxt, { color: colors.mutedForeground }]}>{getDuration(conv)}</Text>
                                    </View>
                                )}
                                {!!getType(conv) && (
                                    <View style={styles.metaRow}>
                                        <Mic size={14} color={colors.mutedForeground} />
                                        <Text style={[styles.metaTxt, { color: colors.mutedForeground, textTransform: 'capitalize' }]}>{getType(conv)}</Text>
                                    </View>
                                )}
                                {getDirection(conv) === 'OUTBOUND' && (
                                    <View style={styles.metaRow}>
                                        <PhoneOutgoing size={14} color={colors.mutedForeground} />
                                        <Text style={[styles.metaTxt, { color: colors.mutedForeground }]}>Outbound</Text>
                                    </View>
                                )}
                                {getDirection(conv) === 'INBOUND' && (
                                    <View style={styles.metaRow}>
                                        <PhoneIncoming size={14} color={colors.mutedForeground} />
                                        <Text style={[styles.metaTxt, { color: colors.mutedForeground }]}>Inbound</Text>
                                    </View>
                                )}
                            </View>

                            {/* Audio player — show when we have a URL, or the call has ended (recording likely exists) */}
                            {(audioUrl || ['ENDED', 'COMPLETED', 'FAILED'].includes(status)) && (
                                <AudioPlayer
                                    uri={audioUrl || undefined}
                                    conversationId={!audioUrl ? id : undefined}
                                    colors={colors}
                                    title="Recording"
                                />
                            )}

                            {messages.length === 0 && (
                                <View style={styles.center}>
                                    <Mic size={40} color={colors.cardBorder} />
                                    <Text style={[styles.emptyTxt, { color: colors.mutedForeground }]}>No transcript available</Text>
                                </View>
                            )}
                        </View>
                    }
                    renderItem={({ item }) => <Bubble msg={item} colors={colors} />}
                    ListFooterComponent={<View style={{ height: 40 }} />}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 54 : 16, paddingBottom: 14,
        borderBottomWidth: 1, gap: 10,
    },
    backBtn: { padding: 4 },
    headerMid: { flex: 1 },
    headerName: { fontSize: 17, fontWeight: '700' },
    headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' },
    headerPhone: { fontSize: 13 },
    wsIndicator: { fontSize: 12, fontWeight: '600' },
    badge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        borderWidth: 1, borderRadius: 20,
        paddingHorizontal: 8, paddingVertical: 2,
    },
    dot: { width: 6, height: 6, borderRadius: 3 },
    badgeTxt: { fontSize: 11, fontWeight: '700' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
    listContent: { padding: 16 },
    metaCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12, gap: 8 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    metaTxt: { fontSize: 13 },
    emptyTxt: { fontSize: 16, textAlign: 'center', marginTop: 8 },

    // Bubbles
    bubbleRow: { marginBottom: 12 },
    bubbleLeft: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'flex-start' },
    bubbleRight: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'flex-end' },
    avatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8, marginBottom: 4 },
    bubble: { maxWidth: '78%', borderRadius: 16, padding: 12, borderWidth: 1 },
    bubbleBot: { borderBottomLeftRadius: 4 },
    bubbleUser: { borderBottomRightRadius: 4, borderWidth: 0 },
    bubbleLabel: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
    bubbleTxt: { fontSize: 15, lineHeight: 22 },
    bubbleTime: { fontSize: 11, marginTop: 4, textAlign: 'right' },
});

export default ConversationDetailScreen;
