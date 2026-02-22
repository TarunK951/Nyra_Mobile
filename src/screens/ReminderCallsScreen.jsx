import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, FlatList, ActivityIndicator,
    TouchableOpacity, RefreshControl, Modal, TextInput,
    Alert, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeContext';
import { reminderCallApi } from '../api/reminderCalls';
import {
    Bell, Phone, Trash2, X, Send, Play, CheckCircle,
    AlertCircle, Clock, ChevronRight, Zap,
} from 'lucide-react-native';
import { layout } from '../utils/layout';
import { useStagger, useScalePressAnim } from '../utils/animations';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getDate(item) {
    const raw = item?.scheduled_at || item?.created_at || item?.createdAt || item?.scheduledAt;
    if (!raw) return '—';
    return new Date(raw).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
}

const RESULT_COLORS = {
    success: '#10b981', completed: '#10b981',
    failed: '#ef4444', no_answer: '#f59e0b',
    cancelled: '#6b7280', pending: '#6366f1',
};
const STATUS_COLORS = {
    completed: '#10b981', failed: '#ef4444', pending: '#6366f1',
    cancelled: '#6b7280', queued: '#f59e0b',
};

// ─── Trigger Modal ─────────────────────────────────────────────────────────────
const TriggerModal = ({ visible, onClose, colors, type = 'reminder' }) => {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const g = colors.glass;

    useEffect(() => { if (!visible) setPhone(''); }, [visible]);

    const trigger = async () => {
        const clean = phone.replace(/\D/g, '');
        if (clean.length < 10) { Alert.alert('Invalid', 'Enter 10 digits.'); return; }
        setLoading(true);
        try {
            if (type === 'reminder') await reminderCallApi.triggerReminder(clean);
            else await reminderCallApi.triggerFeedback(clean);
            Alert.alert('✓ Triggered', 'Call initiated.');
            onClose();
        } catch (e) {
            Alert.alert('Error', e?.response?.data?.message || 'Failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
                <BlurView
                    intensity={g.blurStrong}
                    tint={g.tint}
                    experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                    style={[styles.sheet, { borderColor: g.border }]}
                >
                    <View style={[styles.cardShimmer, { backgroundColor: g.shimmer }]} />
                    <View style={styles.sheetHeader}>
                        <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                            Trigger Call
                        </Text>
                        <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
                            <X size={18} color={colors.foreground} />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.sheetLabel, { color: colors.mutedForeground }]}>Enter phone number</Text>
                    <BlurView
                        intensity={g.blur}
                        tint={g.tint}
                        experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                        style={[styles.phoneRow, { borderColor: g.borderSubtle }]}
                    >
                        <Phone size={16} color={colors.primary} />
                        <TextInput
                            style={[styles.phoneInput, { color: colors.foreground }]}
                            value={phone} onChangeText={setPhone}
                            keyboardType="phone-pad" placeholder="9XXXXXXXXX"
                            placeholderTextColor={colors.mutedForeground} maxLength={12}
                        />
                    </BlurView>
                    <TouchableOpacity
                        onPress={trigger} disabled={loading}
                        activeOpacity={0.8}
                        style={[styles.triggerBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
                    >
                        {loading
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <><Send size={16} color="#fff" /><Text style={styles.triggerTxt}>Triger Now</Text></>
                        }
                    </TouchableOpacity>
                </BlurView>
            </KeyboardAvoidingView>
        </Modal>
    );
};

// ─── Stats banner ─────────────────────────────────────────────────────────────
const StatsBanner = ({ stats, colors }) => {
    if (!stats) return null;
    const total = stats.total || stats.totalCalls || 0;
    const completed = stats.completed || stats.completedCalls || 0;
    const failed = stats.failed || stats.failedCalls || 0;
    const g = colors.glass;

    return (
        <BlurView
            intensity={g.blur}
            tint={g.tint}
            experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
            style={[styles.statsBanner, { borderColor: g.border }]}
        >
            <View style={[styles.cardShimmer, { backgroundColor: g.shimmer }]} />
            <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: colors.foreground }]}>{total}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: g.borderSubtle }]} />
            <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: colors.success }]}>{completed}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Completed</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: g.borderSubtle }]} />
            <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: colors.error }]}>{failed}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Failed</Text>
            </View>
        </BlurView>
    );
};

// ─── History row ──────────────────────────────────────────────────────────────
const HistoryRow = ({ item, colors, anim }) => {
    const status = (item?.status || '').toLowerCase();
    const result = (item?.result || '').toLowerCase();
    const statusClr = STATUS_COLORS[status] || colors.mutedForeground;
    const resultClr = RESULT_COLORS[result] || colors.mutedForeground;
    const name = item?.patient_name || item?.patientName || item?.patient?.name || 'Unknown';
    const phone = item?.phone_number || item?.phone || item?.patient?.phone || '—';
    const g = colors.glass;
    const { scale, pressIn, pressOut } = useScalePressAnim();

    return (
        <Animated.View style={anim ? { opacity: anim.opacity, transform: [{ translateY: anim.translateY }, { scale }] } : { transform: [{ scale }] }}>
            <BlurView
                intensity={g.blur}
                tint={g.tint}
                experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                style={[styles.histCard, { borderColor: g.border }]}
            >
                <View style={[styles.cardShimmer, { backgroundColor: g.shimmer }]} />
                <View style={[styles.histIcon, { backgroundColor: statusClr + '12' }]}>
                    <Bell size={16} color={statusClr} strokeWidth={2.5} />
                </View>
                <View style={styles.histBody}>
                    <Text style={[styles.histName, { color: colors.foreground }]} numberOfLines={1}>{name}</Text>
                    <Text style={[styles.histPhone, { color: colors.mutedForeground }]}>{phone}</Text>
                    <View style={styles.histRow}>
                        <View style={[styles.pill, { backgroundColor: statusClr + '12', borderColor: statusClr + '30' }]}>
                            <Text style={[styles.pillTxt, { color: statusClr }]}>{status || '—'}</Text>
                        </View>
                        {!!result && (
                            <View style={[styles.pill, { backgroundColor: resultClr + '12', borderColor: resultClr + '30' }]}>
                                <Text style={[styles.pillTxt, { color: resultClr }]}>{result.replace('_', ' ')}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={[styles.histDate, { color: colors.mutedForeground, opacity: 0.6 }]}>{getDate(item)}</Text>
                </View>
            </BlurView>
        </Animated.View>
    );
};

// ─── Queue row ────────────────────────────────────────────────────────────────
const QueueRow = ({ item, colors, onDelete, anim }) => {
    const name = item?.patient_name || item?.patientName || '—';
    const phone = item?.phone_number || item?.phone || '—';
    const id = item?.id || item?._id;
    const g = colors.glass;

    return (
        <Animated.View style={anim ? { opacity: anim.opacity, transform: [{ translateY: anim.translateY }] } : null}>
            <BlurView
                intensity={g.blur}
                tint={g.tint}
                experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                style={[styles.histCard, { borderColor: g.border }]}
            >
                <View style={[styles.cardShimmer, { backgroundColor: g.shimmer }]} />
                <View style={[styles.histIcon, { backgroundColor: colors.primary + '12' }]}>
                    <Clock size={16} color={colors.primary} strokeWidth={2.5} />
                </View>
                <View style={styles.histBody}>
                    <Text style={[styles.histName, { color: colors.foreground }]} numberOfLines={1}>{name}</Text>
                    <Text style={[styles.histPhone, { color: colors.mutedForeground }]}>{phone}</Text>
                </View>
                <TouchableOpacity onPress={() => onDelete(id)} style={[styles.deleteBtn, { backgroundColor: colors.error + '12' }]}>
                    <Trash2 size={16} color={colors.error} />
                </TouchableOpacity>
            </BlurView>
        </Animated.View>
    );
};

// ─── Screen ──────────────────────────────────────────────────────────────────
const TABS = ['History', 'Queue'];

const ReminderCallsScreen = () => {
    const { colors } = useTheme();
    const [tab, setTab] = useState('History');
    const [histItems, setHistItems] = useState([]);
    const [queueItems, setQueueItems] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [modal, setModal] = useState({ visible: false, type: 'reminder' });
    const [bulkLoading, setBulkLoading] = useState(false);

    const fetchHistory = useCallback(async () => {
        try {
            const [histRes, statsRes] = await Promise.all([
                reminderCallApi.getAll({ limit: 50 }),
                reminderCallApi.getStats().catch(() => ({ data: null })),
            ]);
            const raw = histRes.data?.reminderCalls || histRes.data?.rows || histRes.data?.data || histRes.data || [];
            setHistItems(Array.isArray(raw) ? raw : []);
            setStats(statsRes.data?.stats || statsRes.data);
        } catch (e) {
            setError(e?.response?.data?.message || 'Failed to load reminder calls.');
        }
    }, []);

    const fetchQueue = useCallback(async () => {
        try {
            const res = await reminderCallApi.getQueue();
            const raw = res.data?.queue || res.data?.items || res.data || [];
            setQueueItems(Array.isArray(raw) ? raw : []);
        } catch (e) {
            setError(e?.response?.data?.message || 'Failed to load queue.');
        }
    }, []);

    const fetchAll = useCallback(async () => {
        setError(null);
        await Promise.all([fetchHistory(), fetchQueue()]);
        setLoading(false);
        setRefreshing(false);
    }, [fetchHistory, fetchQueue]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const deleteQueue = async (id) => {
        Alert.alert('Remove', 'Remove from queue?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove', style: 'destructive',
                onPress: async () => {
                    try {
                        await reminderCallApi.removeFromQueue(id);
                        setQueueItems(prev => prev.filter(i => (i.id || i._id) !== id));
                    } catch { Alert.alert('Error', 'Could not remove from queue.'); }
                }
            }
        ]);
    };

    const bulkTrigger = async () => {
        Alert.alert('Trigger All', `Trigger all ${queueItems.length} queued calls?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Trigger All',
                onPress: async () => {
                    setBulkLoading(true);
                    try {
                        await reminderCallApi.bulkTrigger();
                        Alert.alert('✓ Done', 'All queued calls triggered.');
                        fetchQueue();
                    } catch (e) {
                        Alert.alert('Error', e?.response?.data?.message || 'Failed.');
                    } finally { setBulkLoading(false); }
                }
            }
        ]);
    };

    const bulkClear = async () => {
        Alert.alert('Clear Queue', 'Clear all queued items?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Clear All', style: 'destructive',
                onPress: async () => {
                    try {
                        await reminderCallApi.bulkClear();
                        setQueueItems([]);
                    } catch { Alert.alert('Error', 'Could not clear queue.'); }
                }
            }
        ]);
    };

    const staggerAnims = useStagger(8, 80);
    const g = colors.glass;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Tabs */}
            <BlurView
                intensity={g.blurStrong}
                tint={g.tint}
                experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                style={[styles.tabs, { borderBottomColor: g.borderSubtle, borderBottomWidth: 1 }]}
            >
                {TABS.map(t => {
                    const active = tab === t;
                    return (
                        <TouchableOpacity key={t} onPress={() => setTab(t)}
                            style={[styles.tabBtn, active && { borderBottomColor: colors.primary, borderBottomWidth: 2.5 }]}>
                            <Text style={[styles.tabTxt, { color: active ? colors.primary : colors.mutedForeground, fontWeight: active ? '800' : '600' }]}>{t}</Text>
                            {t === 'Queue' && queueItems.length > 0 && (
                                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                                    <Text style={styles.badgeTxt}>{queueItems.length}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </BlurView>

            {/* FAB */}
            <View style={styles.fabWrap}>
                <TouchableOpacity
                    onPress={() => setModal({ visible: true, type: 'reminder' })}
                    activeOpacity={0.9}
                >
                    <BlurView
                        intensity={g.blurStrong}
                        tint={g.tint}
                        experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                        style={[styles.fabGl, { backgroundColor: colors.primary, borderColor: colors.glass.border }]}
                    >
                        <Bell size={24} color="#fff" strokeWidth={2.5} />
                    </BlurView>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
            ) : error ? (
                <View style={styles.center}>
                    <AlertCircle size={48} color="#ef4444" />
                    <Text style={[styles.errorTxt, { color: '#ef4444' }]}>{error}</Text>
                    <TouchableOpacity onPress={() => { setLoading(true); fetchAll(); }}
                        style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
                        <Text style={styles.retryTxt}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : tab === 'History' ? (
                <FlatList
                    data={histItems}
                    keyExtractor={(item, i) => item?.id || item?._id || String(i)}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor={colors.primary} />}
                    contentContainerStyle={styles.list}
                    ListHeaderComponent={<StatsBanner stats={stats} colors={colors} />}
                    renderItem={({ item, index }) => <HistoryRow item={item} colors={colors} anim={staggerAnims[Math.min(index, staggerAnims.length - 1)]} />}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Bell size={56} color={colors.cardBorder} />
                            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Reminder Calls</Text>
                        </View>
                    }
                />
            ) : (
                <FlatList
                    data={queueItems}
                    keyExtractor={(item, i) => item?.id || item?._id || String(i)}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchQueue().then(() => setRefreshing(false)); }} tintColor={colors.primary} />}
                    contentContainerStyle={styles.list}
                    ListHeaderComponent={
                        queueItems.length > 0 ? (
                            <View style={styles.queueActions}>
                                <TouchableOpacity
                                    onPress={bulkTrigger}
                                    disabled={bulkLoading}
                                    style={[styles.queueBtn, { backgroundColor: colors.primary }]}
                                >
                                    {bulkLoading
                                        ? <ActivityIndicator size="small" color="#fff" />
                                        : <><Zap size={14} color="#fff" /><Text style={styles.queueBtnTxt}>Trigger All</Text></>
                                    }
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={bulkClear}
                                    style={[styles.queueBtn, { backgroundColor: '#ef4444' }]}
                                >
                                    <Trash2 size={14} color="#fff" />
                                    <Text style={styles.queueBtnTxt}>Clear Queue</Text>
                                </TouchableOpacity>
                            </View>
                        ) : null
                    }
                    renderItem={({ item, index }) => (
                        <QueueRow item={item} colors={colors} onDelete={deleteQueue} anim={staggerAnims[Math.min(index, staggerAnims.length - 1)]} />
                    )}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Clock size={56} color={colors.cardBorder} />
                            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Queue is Empty</Text>
                            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                                Add appointments to the queue to batch-trigger reminder calls.
                            </Text>
                        </View>
                    }
                />
            )}

            <TriggerModal {...modal} onClose={() => setModal({ visible: false, type: 'reminder' })} colors={colors} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    tabs: { flexDirection: 'row', overflow: 'hidden' },
    tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 6 },
    tabTxt: { fontSize: 13, letterSpacing: 0.3 },
    badge: { minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
    badgeTxt: { color: '#fff', fontSize: 10, fontWeight: '900' },
    list: { padding: 16, paddingBottom: layout.tabBarHeight + 40 },
    statsBanner: { flexDirection: 'row', borderRadius: 22, borderWidth: 1, padding: 18, marginBottom: 20, overflow: 'hidden' },
    cardShimmer: { position: 'absolute', top: 0, left: 0, right: 0, height: 1.5 },
    statItem: { flex: 1, alignItems: 'center' },
    statNum: { fontSize: 24, fontWeight: '900', marginBottom: 2, letterSpacing: -0.5 },
    statLabel: { fontSize: 11, fontWeight: '600' },
    statDivider: { width: 1, height: '60%', alignSelf: 'center', opacity: 0.5 },
    histCard: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 22, borderWidth: 1, padding: 16, marginBottom: 14, overflow: 'hidden',
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 }, android: { elevation: 3 } }),
    },
    histIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    histBody: { flex: 1 },
    histName: { fontSize: 16, fontWeight: '800', marginBottom: 2, letterSpacing: -0.3 },
    histPhone: { fontSize: 13, fontWeight: '600' },
    histRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 6, marginTop: 4 },
    histDate: { fontSize: 11, fontWeight: '600' },
    pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, borderWidth: 1.5 },
    pillTxt: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
    deleteBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    queueActions: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    queueBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16 },
    queueBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },

    fabWrap: { position: 'absolute', bottom: layout.tabBarHeight + 20, right: 20, zIndex: 100 },
    fabGl: {
        width: 60, height: 60, borderRadius: 30, borderWidth: 1.5,
        justifyContent: 'center', alignItems: 'center',
        ...Platform.select({ ios: { shadowColor: '#2563eb', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 14 }, android: { elevation: 12 } }),
    },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
    errorTxt: { fontSize: 15, textAlign: 'center', fontWeight: '600' },
    retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    retryTxt: { color: '#fff', fontWeight: '800', textTransform: 'uppercase' },
    emptyTitle: { fontSize: 20, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 },
    emptySub: { fontSize: 15, textAlign: 'center', lineHeight: 22, fontWeight: '500' },

    // Modal
    overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
    sheet: { width: '100%', borderRadius: 30, padding: 24, borderWidth: 1, overflow: 'hidden' },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    sheetTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    sheetLabel: { fontSize: 14, fontWeight: '600', marginBottom: 10, opacity: 0.7 },
    phoneRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 20, overflow: 'hidden',
    },
    phoneInput: { flex: 1, fontSize: 17, fontWeight: '700' },
    triggerBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, paddingVertical: 16, borderRadius: 16,
    },
    triggerTxt: { color: '#fff', fontWeight: '800', fontSize: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
});

export default ReminderCallsScreen;
