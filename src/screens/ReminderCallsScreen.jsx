import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, FlatList, ActivityIndicator,
    TouchableOpacity, RefreshControl, Modal, TextInput,
    Alert, KeyboardAvoidingView, Platform, SectionList,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { reminderCallApi } from '../api/reminderCalls';
import {
    Bell, Phone, Trash2, X, Send, Play, CheckCircle,
    AlertCircle, Clock, ChevronRight, Zap, BarChart3,
} from 'lucide-react-native';

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

    useEffect(() => { if (!visible) setPhone(''); }, [visible]);

    const trigger = async () => {
        const clean = phone.replace(/\D/g, '');
        if (clean.length < 10) { Alert.alert('Invalid', 'Enter a valid 10-digit number.'); return; }
        setLoading(true);
        try {
            if (type === 'reminder') await reminderCallApi.triggerReminder(clean);
            else await reminderCallApi.triggerFeedback(clean);
            Alert.alert('✓ Triggered', `${type === 'reminder' ? 'Reminder' : 'Feedback'} call initiated.`);
            onClose();
        } catch (e) {
            Alert.alert('Error', e?.response?.data?.message || 'Failed to trigger call.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
                <View style={[styles.sheet, { backgroundColor: colors.card }]}>
                    <View style={styles.sheetHeader}>
                        <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                            Trigger {type === 'reminder' ? 'Reminder' : 'Feedback'} Call
                        </Text>
                        <TouchableOpacity onPress={onClose}><X size={22} color={colors.mutedForeground} /></TouchableOpacity>
                    </View>
                    <Text style={[styles.sheetLabel, { color: colors.mutedForeground }]}>Phone number (10 digits)</Text>
                    <View style={[styles.phoneRow, { backgroundColor: colors.muted, borderColor: colors.cardBorder }]}>
                        <Phone size={16} color={colors.mutedForeground} />
                        <TextInput
                            style={[styles.phoneInput, { color: colors.foreground }]}
                            value={phone} onChangeText={setPhone}
                            keyboardType="phone-pad" placeholder="9XXXXXXXXX"
                            placeholderTextColor={colors.mutedForeground} maxLength={12}
                        />
                    </View>
                    <TouchableOpacity
                        onPress={trigger} disabled={loading}
                        style={[styles.triggerBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
                    >
                        {loading
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <><Send size={16} color="#fff" /><Text style={styles.triggerTxt}>Trigger Call</Text></>
                        }
                    </TouchableOpacity>
                </View>
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

    return (
        <View style={[styles.statsBanner, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: colors.foreground }]}>{total}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.cardBorder }]} />
            <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: '#10b981' }]}>{completed}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Completed</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.cardBorder }]} />
            <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: '#ef4444' }]}>{failed}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Failed</Text>
            </View>
        </View>
    );
};

// ─── History row ──────────────────────────────────────────────────────────────
const HistoryRow = ({ item, colors }) => {
    const status = (item?.status || '').toLowerCase();
    const result = (item?.result || '').toLowerCase();
    const statusClr = STATUS_COLORS[status] || colors.mutedForeground;
    const resultClr = RESULT_COLORS[result] || colors.mutedForeground;
    const name = item?.patient_name || item?.patientName || item?.patient?.name || 'Unknown';
    const phone = item?.phone_number || item?.phone || item?.patient?.phone || '—';

    return (
        <View style={[styles.histCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[styles.histIcon, { backgroundColor: statusClr + '18' }]}>
                <Bell size={16} color={statusClr} />
            </View>
            <View style={styles.histBody}>
                <Text style={[styles.histName, { color: colors.foreground }]} numberOfLines={1}>{name}</Text>
                <Text style={[styles.histPhone, { color: colors.mutedForeground }]}>{phone}</Text>
                <View style={styles.histRow}>
                    <View style={[styles.pill, { backgroundColor: statusClr + '18', borderColor: statusClr + '40' }]}>
                        <Text style={[styles.pillTxt, { color: statusClr }]}>{status || '—'}</Text>
                    </View>
                    {!!result && (
                        <View style={[styles.pill, { backgroundColor: resultClr + '18', borderColor: resultClr + '40' }]}>
                            <Text style={[styles.pillTxt, { color: resultClr }]}>{result.replace('_', ' ')}</Text>
                        </View>
                    )}
                </View>
                <Text style={[styles.histDate, { color: colors.mutedForeground }]}>{getDate(item)}</Text>
            </View>
        </View>
    );
};

// ─── Queue row ────────────────────────────────────────────────────────────────
const QueueRow = ({ item, colors, onDelete }) => {
    const name = item?.patient_name || item?.patientName || '—';
    const phone = item?.phone_number || item?.phone || '—';
    const id = item?.id || item?._id;

    return (
        <View style={[styles.histCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[styles.histIcon, { backgroundColor: '#6366f118' }]}>
                <Clock size={16} color="#6366f1" />
            </View>
            <View style={styles.histBody}>
                <Text style={[styles.histName, { color: colors.foreground }]} numberOfLines={1}>{name}</Text>
                <Text style={[styles.histPhone, { color: colors.mutedForeground }]}>{phone}</Text>
            </View>
            <TouchableOpacity onPress={() => onDelete(id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Trash2 size={18} color="#ef4444" />
            </TouchableOpacity>
        </View>
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

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Tabs */}
            <View style={[styles.tabs, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
                {TABS.map(t => {
                    const active = tab === t;
                    return (
                        <TouchableOpacity key={t} onPress={() => setTab(t)}
                            style={[styles.tabBtn, active && { borderBottomColor: colors.primary, borderBottomWidth: 2.5 }]}>
                            <Text style={[styles.tabTxt, { color: active ? colors.primary : colors.mutedForeground }]}>{t}</Text>
                            {t === 'Queue' && queueItems.length > 0 && (
                                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                                    <Text style={styles.badgeTxt}>{queueItems.length}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* FAB */}
            <TouchableOpacity
                onPress={() => setModal({ visible: true, type: 'reminder' })}
                style={[styles.fab, { backgroundColor: colors.primary }]}
            >
                <Bell size={22} color="#fff" />
            </TouchableOpacity>

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
                    renderItem={({ item }) => <HistoryRow item={item} colors={colors} />}
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
                    renderItem={({ item }) => (
                        <QueueRow item={item} colors={colors} onDelete={deleteQueue} />
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
    tabs: { flexDirection: 'row', borderBottomWidth: 1 },
    tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 6 },
    tabTxt: { fontSize: 14, fontWeight: '600' },
    badge: { minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
    badgeTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
    list: { padding: 16, paddingBottom: 80 },
    statsBanner: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
    statItem: { flex: 1, alignItems: 'center' },
    statNum: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
    statLabel: { fontSize: 12 },
    statDivider: { width: 1, height: '80%', alignSelf: 'center' },
    histCard: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04, shadowRadius: 3, elevation: 2,
    },
    histIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    histBody: { flex: 1 },
    histName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
    histPhone: { fontSize: 13, marginBottom: 6 },
    histRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 4 },
    histDate: { fontSize: 12 },
    pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, borderWidth: 1 },
    pillTxt: { fontSize: 11, fontWeight: '600' },
    queueActions: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    queueBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 12 },
    queueBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
    fab: {
        position: 'absolute', bottom: 24, right: 24, zIndex: 99,
        width: 56, height: 56, borderRadius: 28,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25, shadowRadius: 8, elevation: 10,
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
    errorTxt: { fontSize: 15, textAlign: 'center' },
    retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
    retryTxt: { color: '#fff', fontWeight: '600' },
    emptyTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
    emptySub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
    // Modal
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
    sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    sheetTitle: { fontSize: 18, fontWeight: '700' },
    sheetLabel: { fontSize: 13, marginBottom: 8 },
    phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 16 },
    phoneInput: { flex: 1, fontSize: 16 },
    triggerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
    triggerTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default ReminderCallsScreen;
