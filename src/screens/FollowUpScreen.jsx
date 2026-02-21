import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, FlatList, ActivityIndicator,
    TouchableOpacity, RefreshControl, Modal, TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { callApi } from '../api/calls';
import { getName, getPhone, getConvId, getType, getStatus, getDuration, getFmtDate, normaliseList } from '../shared/callHelpers';
import {
    PhoneOutgoing, Clock, ChevronRight, AlertCircle,
    Phone, X, Send, Calendar, RotateCcw,
} from 'lucide-react-native';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function groupByDate(items) {
    const groups = {};
    items.forEach(item => {
        const raw = item?.started_at || item?.startedAt || item?.created_at || item?.createdAt;
        if (!raw) { (groups['Earlier'] = groups['Earlier'] || []).push(item); return; }
        const d = new Date(raw);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7);
        let label;
        if (d >= today) label = 'Today';
        else if (d >= yesterday) label = 'Yesterday';
        else if (d >= weekAgo) label = 'This Week';
        else label = 'Earlier';
        (groups[label] = groups[label] || []).push(item);
    });
    const ORDER = ['Today', 'Yesterday', 'This Week', 'Earlier'];
    const flat = [];
    ORDER.forEach(label => {
        if (groups[label]) {
            flat.push({ type: 'header', label });
            groups[label].forEach(item => flat.push({ type: 'item', item }));
        }
    });
    return flat;
}

const STATUS_COLORS = {
    ENDED: '#6b7280', FAILED: '#ef4444', CANCELLED: '#f59e0b', COMPLETED: '#10b981',
};
const TYPE_COLORS = {
    feedback: '#f59e0b', follow_up: '#10b981', reminder: '#6366f1', booking: '#3b82f6',
};

// ─── Redial Modal ─────────────────────────────────────────────────────────────
const RedialModal = ({ visible, initialPhone, onClose, colors }) => {
    const [phone, setPhone] = useState(initialPhone || '');
    const [loading, setLoading] = useState(false);

    useEffect(() => { if (visible) setPhone(initialPhone || ''); }, [visible, initialPhone]);

    const trigger = async () => {
        const clean = phone.replace(/\D/g, '');
        if (clean.length < 10) { Alert.alert('Invalid', 'Please enter a valid 10-digit phone number.'); return; }
        setLoading(true);
        try {
            await callApi.testFeedbackCall(clean);
            Alert.alert('✓ Call Triggered', 'Feedback call initiated successfully.');
            onClose();
        } catch (e) {
            Alert.alert('Error', e?.response?.data?.message || 'Failed to trigger call.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
                <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.foreground }]}>Trigger Feedback Call</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <X size={22} color={colors.mutedForeground} />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>Phone number (10 digits)</Text>
                    <View style={[styles.phoneInput, { backgroundColor: colors.muted, borderColor: colors.cardBorder }]}>
                        <Phone size={16} color={colors.mutedForeground} />
                        <TextInput
                            style={[styles.phoneField, { color: colors.foreground }]}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            placeholder="9XXXXXXXXX"
                            placeholderTextColor={colors.mutedForeground}
                            maxLength={12}
                        />
                    </View>
                    <TouchableOpacity
                        onPress={trigger}
                        disabled={loading}
                        style={[styles.triggerBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
                    >
                        {loading
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <>
                                <Send size={16} color="#fff" />
                                <Text style={styles.triggerTxt}>Trigger Call</Text>
                            </>
                        }
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

// ─── Call row ─────────────────────────────────────────────────────────────────
const CallRow = ({ item, colors, onPress, onRedial }) => {
    const status = getStatus(item);
    const type = getType(item);
    const statusClr = STATUS_COLORS[status] || colors.mutedForeground;
    const typeClr = TYPE_COLORS[type] || colors.primary;

    return (
        <TouchableOpacity
            activeOpacity={0.75}
            onPress={onPress}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        >
            <View style={[styles.iconBox, { backgroundColor: typeClr + '18' }]}>
                <PhoneOutgoing size={18} color={typeClr} />
            </View>
            <View style={styles.cardBody}>
                <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
                    {getName(item)}
                </Text>
                <Text style={[styles.phone, { color: colors.mutedForeground }]}>{getPhone(item) || '—'}</Text>
                <View style={styles.row}>
                    {!!type && (
                        <View style={[styles.pill, { backgroundColor: typeClr + '18', borderColor: typeClr + '40' }]}>
                            <Text style={[styles.pillTxt, { color: typeClr }]}>{type.replace('_', '-')}</Text>
                        </View>
                    )}
                    <View style={[styles.pill, { backgroundColor: statusClr + '18', borderColor: statusClr + '40' }]}>
                        <Text style={[styles.pillTxt, { color: statusClr }]}>{status}</Text>
                    </View>
                    {!!getDuration(item) && (
                        <View style={styles.durationRow}>
                            <Clock size={11} color={colors.mutedForeground} />
                            <Text style={[styles.duration, { color: colors.mutedForeground }]}>{getDuration(item)}</Text>
                        </View>
                    )}
                </View>
                <Text style={[styles.date, { color: colors.mutedForeground }]}>{getFmtDate(item)}</Text>
            </View>
            <TouchableOpacity onPress={onRedial} style={styles.redialBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <RotateCcw size={16} color={colors.primary} />
            </TouchableOpacity>
            <ChevronRight size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
    );
};

// ─── Screen ──────────────────────────────────────────────────────────────────
const FollowUpScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [modal, setModal] = useState({ visible: false, phone: '' });

    const fetchData = useCallback(async () => {
        setError(null);
        try {
            const res = await callApi.getOutboundHistory();
            let raw = normaliseList(res.data);
            // Extra client-side filter in case backend doesn't filter by direction
            raw = raw.filter(c => {
                const dir = (c?.direction || c?.call_direction || '').toUpperCase();
                return dir === 'OUTBOUND' || dir === '';
            });
            setItems(raw);
        } catch (e) {
            setError(e?.response?.data?.message || 'Failed to load follow-up calls.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const grouped = groupByDate(items);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Trigger FAB */}
            <TouchableOpacity
                onPress={() => setModal({ visible: true, phone: '' })}
                style={[styles.fab, { backgroundColor: colors.primary }]}
            >
                <Phone size={22} color="#fff" />
            </TouchableOpacity>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
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
                    data={grouped}
                    keyExtractor={(item, idx) => item.type === 'header' ? `h-${item.label}` : getConvId(item.item) || String(idx)}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />}
                    contentContainerStyle={styles.list}
                    renderItem={({ item: row }) => {
                        if (row.type === 'header') {
                            return (
                                <View style={styles.sectionHeader}>
                                    <Calendar size={13} color={colors.primary} />
                                    <Text style={[styles.sectionTxt, { color: colors.primary }]}>{row.label}</Text>
                                </View>
                            );
                        }
                        const c = row.item;
                        return (
                            <CallRow
                                item={c}
                                colors={colors}
                                onPress={() => navigation.navigate('ConversationDetail', {
                                    conversation: c,
                                    conversationId: getConvId(c),
                                })}
                                onRedial={() => setModal({ visible: true, phone: getPhone(c) })}
                            />
                        );
                    }}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <PhoneOutgoing size={64} color={colors.cardBorder} />
                            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Follow-up Calls</Text>
                            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                                Outbound call history will appear here.
                            </Text>
                        </View>
                    }
                />
            )}

            <RedialModal
                visible={modal.visible}
                initialPhone={modal.phone}
                onClose={() => setModal({ visible: false, phone: '' })}
                colors={colors}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    list: { padding: 16, paddingBottom: 80 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, marginTop: 16 },
    sectionTxt: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    card: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04, shadowRadius: 3, elevation: 2,
    },
    iconBox: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    cardBody: { flex: 1 },
    name: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
    phone: { fontSize: 13, marginBottom: 6 },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 4 },
    pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, borderWidth: 1 },
    pillTxt: { fontSize: 11, fontWeight: '600' },
    durationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    duration: { fontSize: 11 },
    date: { fontSize: 12 },
    redialBtn: { padding: 8, marginRight: 4 },

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
    emptySubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },

    // Modal
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
    modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '700' },
    modalLabel: { fontSize: 13, marginBottom: 8 },
    phoneInput: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 16,
    },
    phoneField: { flex: 1, fontSize: 16 },
    triggerBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 14, borderRadius: 14,
    },
    triggerTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default FollowUpScreen;
