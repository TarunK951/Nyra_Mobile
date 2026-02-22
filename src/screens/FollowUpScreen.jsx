import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, FlatList, ActivityIndicator,
    TouchableOpacity, RefreshControl, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeContext';
import { callApi } from '../api/calls';
import { getName, getPhone, getConvId, getType, getStatus, getDuration, getFmtDate, normaliseList } from '../shared/callHelpers';
import {
    PhoneOutgoing, Clock, ChevronRight, AlertCircle,
    Phone, X, Send, Calendar, RotateCcw,
} from 'lucide-react-native';
import { layout } from '../utils/layout';
import { useStagger, useScalePressAnim } from '../utils/animations';

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
    const g = colors.glass;

    useEffect(() => { if (visible) setPhone(initialPhone || ''); }, [visible, initialPhone]);

    const trigger = async () => {
        const clean = phone.replace(/\D/g, '');
        if (clean.length < 10) { Alert.alert('Invalid', 'Please enter 10 digits.'); return; }
        setLoading(true);
        try {
            await callApi.testFeedbackCall(clean);
            Alert.alert('✓ Success', 'Clinical follow-up triggered.');
            onClose();
        } catch (e) {
            Alert.alert('Trigger Failed', e?.response?.data?.message || 'Check connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <BlurView
                    intensity={g.blurStrong}
                    tint={g.tint}
                    experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                    style={[styles.modalSheet, { borderColor: g.border }]}
                >
                    <View style={styles.modalGlow} />
                    <View style={[styles.cardShimmer, { backgroundColor: g.shimmer }]} />
                    <View style={styles.modalHeader}>
                        <View>
                            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Trigger Follow-up</Text>
                            <Text style={[styles.modalSub, { color: colors.primary }]}>OUTBOUND CLINIC CALL</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
                            <X size={18} color={colors.foreground} strokeWidth={3} />
                        </TouchableOpacity>
                    </View>

                    <BlurView
                        intensity={g.blur}
                        tint={g.tint}
                        experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                        style={[styles.phoneInput, { borderColor: g.borderSubtle }]}
                    >
                        <View style={[styles.inputIcon, { backgroundColor: colors.primary + '10' }]}>
                            <Phone size={16} color={colors.primary} strokeWidth={2.5} />
                        </View>
                        <TextInput
                            style={[styles.phoneField, { color: colors.foreground }]}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            placeholder="Patient Mobile..."
                            placeholderTextColor={colors.mutedForeground}
                            maxLength={12}
                        />
                    </BlurView>

                    <TouchableOpacity
                        onPress={trigger}
                        disabled={loading}
                        activeOpacity={0.8}
                        style={[styles.triggerBtn, { backgroundColor: colors.foreground }]}
                    >
                        {loading
                            ? <ActivityIndicator size="small" color={colors.background} />
                            : <>
                                <Send size={18} color={colors.background} strokeWidth={2.5} />
                                <Text style={[styles.triggerTxt, { color: colors.background }]}>START SESSION</Text>
                            </>
                        }
                    </TouchableOpacity>
                </BlurView>
            </View>
        </Modal>
    );
};

// ─── Call row ─────────────────────────────────────────────────────────────────
const CallRow = ({ item, colors, onPress, onRedial, anim }) => {
    const status = getStatus(item);
    const type = getType(item);
    const statusClr = STATUS_COLORS[status] || colors.mutedForeground;
    const typeClr = TYPE_COLORS[type] || colors.primary;
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
                <BlurView
                    intensity={g.blur}
                    tint={g.tint}
                    experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                    style={[styles.card, { borderColor: g.border }]}
                >
                    <View style={[styles.cardShimmer, { backgroundColor: g.shimmer }]} />
                    <View style={[styles.iconBox, { backgroundColor: typeClr + '10' }]}>
                        <PhoneOutgoing size={20} color={typeClr} strokeWidth={2.5} />
                    </View>
                    <View style={styles.cardBody}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
                                {getName(item)}
                            </Text>
                            {!!getDuration(item) && (
                                <View style={[styles.durationRow, { backgroundColor: colors.success + '10' }]}>
                                    <Clock size={11} color={colors.success} strokeWidth={3} />
                                    <Text style={[styles.duration, { color: colors.success }]}>{getDuration(item)}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.phone, { color: colors.mutedForeground }]}>{getPhone(item) || 'Unknown Identity'}</Text>
                        <View style={styles.metaRow}>
                            {!!type && (
                                <View style={[styles.pill, { backgroundColor: typeClr + '08', borderColor: typeClr + '20' }]}>
                                    <Text style={[styles.pillTxt, { color: typeClr }]}>{type.replace('_', ' ')}</Text>
                                </View>
                            )}
                            <View style={[styles.pill, { backgroundColor: statusClr + '08', borderColor: statusClr + '20' }]}>
                                <Text style={[styles.pillTxt, { color: statusClr }]}>{status}</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.actionCol}>
                        <TouchableOpacity onPress={onRedial} style={[styles.redialBtn, { backgroundColor: colors.primary + '10' }]} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                            <RotateCcw size={16} color={colors.primary} strokeWidth={3} />
                        </TouchableOpacity>
                        <ChevronRight size={14} color={colors.mutedForeground} strokeWidth={3} opacity={0.4} />
                    </View>
                </BlurView>
            </TouchableOpacity>
        </Animated.View>
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

    const staggerAnims = useStagger(8, 80);
    const grouped = groupByDate(items);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Trigger FAB */}
            <TouchableOpacity
                onPress={() => setModal({ visible: true, phone: '' })}
                activeOpacity={0.9}
                style={styles.fabWrap}
            >
                <BlurView
                    intensity={g.blurStrong}
                    tint={g.tint}
                    experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                    style={[styles.fabGl, { backgroundColor: colors.primary, borderColor: colors.glass.border }]}
                >
                    <View style={styles.fabGlow} />
                    <Phone size={26} color="#fff" strokeWidth={2.5} />
                </BlurView>
            </TouchableOpacity>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <AlertCircle size={48} color={colors.error} strokeWidth={1.5} />
                    <Text style={[styles.errorTxt, { color: colors.error }]}>{error}</Text>
                    <TouchableOpacity onPress={() => { setLoading(true); fetchData(); }}
                        style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
                        <Text style={styles.retryTxt}>Retry Connection</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={grouped}
                    keyExtractor={(item, idx) => item.type === 'header' ? `h-${item.label}` : getConvId(item.item) || String(idx)}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />}
                    contentContainerStyle={styles.list}
                    renderItem={({ item: row, index }) => {
                        if (row.type === 'header') {
                            return (
                                <View style={styles.sectionHeader}>
                                    <View style={[styles.sectionLine, { backgroundColor: g.borderSubtle }]} />
                                    <Text style={[styles.sectionTxt, { color: colors.mutedForeground }]}>{row.label}</Text>
                                    <View style={[styles.sectionLine, { backgroundColor: g.borderSubtle }]} />
                                </View>
                            );
                        }
                        const c = row.item;
                        return (
                            <CallRow
                                item={c}
                                colors={colors}
                                anim={staggerAnims[Math.min(index, staggerAnims.length - 1)]}
                                onPress={() => navigation.navigate('ConversationDetail', {
                                    conversation: c,
                                    conversationId: getConvId(c),
                                })}
                                onRedial={() => setModal({ visible: true, phone: getPhone(c) })}
                            />
                        );
                    }}
                    ListEmptyComponent={
                        <Animated.View style={staggerAnims[1] ? [styles.center, { opacity: staggerAnims[1].opacity, transform: [{ translateY: staggerAnims[1].translateY }] }] : styles.center}>
                            <BlurView intensity={20} tint={g.tint} style={styles.emptyIconWrap}>
                                <PhoneOutgoing size={48} color={colors.primary} strokeWidth={1.5} />
                            </BlurView>
                            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Sessions Yet</Text>
                            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                                All outbound clinic communication logs will appear here.
                            </Text>
                        </Animated.View>
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
    list: { padding: 20, paddingBottom: layout.tabBarHeight + 100, paddingTop: layout.statusBarHeight + 10 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, marginTop: 24, paddingHorizontal: 4 },
    sectionLine: { flex: 1, height: 1, opacity: 0.5 },
    sectionTxt: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.5 },
    card: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 26, borderWidth: 1, padding: 18, marginBottom: 14, overflow: 'hidden',
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16 }, android: { elevation: 6 } }),
    },
    cardShimmer: { position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, opacity: 0.8 },
    iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    cardBody: { flex: 1 },
    cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    name: { fontSize: 17, fontWeight: '900', letterSpacing: -0.4, maxWidth: '70%' },
    phone: { fontSize: 13, fontWeight: '700', opacity: 0.6, marginBottom: 8 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
    pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
    pillTxt: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
    durationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    duration: { fontSize: 12, fontWeight: '900', fontVariant: ['tabular-nums'] },
    actionCol: { alignItems: 'center', gap: 10, marginLeft: 12 },
    redialBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

    fabWrap: { position: 'absolute', bottom: layout.tabBarHeight + 24, right: 24, zIndex: 100 },
    fabGl: {
        width: 64, height: 64, borderRadius: 24, borderWidth: 1.5,
        justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 20 }, android: { elevation: 12 } }),
    },
    fabGlow: { position: 'absolute', top: -30, left: -30, width: 60, height: 60, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 30 },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 16 },
    emptyIconWrap: { width: 100, height: 100, borderRadius: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)' },
    emptyTitle: { fontSize: 24, fontWeight: '900', textAlign: 'center', letterSpacing: -0.6 },
    emptySubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, fontWeight: '600', opacity: 0.6 },
    errorTxt: { fontSize: 15, textAlign: 'center', fontWeight: '800' },
    retryBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 16, marginTop: 8 },
    retryTxt: { color: '#fff', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },

    // Modal
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 24 },
    modalSheet: { width: '100%', borderRadius: 36, padding: 30, borderWidth: 1.5, overflow: 'hidden' },
    modalGlow: { position: 'absolute', top: -100, left: -100, width: 250, height: 250, backgroundColor: 'rgba(255,100,255,0.05)', borderRadius: 125 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
    closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    modalTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.8 },
    modalSub: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
    phoneInput: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        borderRadius: 20, borderWidth: 1.5, padding: 16, marginBottom: 24, overflow: 'hidden',
    },
    inputIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    phoneField: { flex: 1, fontSize: 18, fontWeight: '700' },
    triggerBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 12, paddingVertical: 18, borderRadius: 20,
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16 }, android: { elevation: 8 } }),
    },
    triggerTxt: { fontWeight: '900', fontSize: 15, letterSpacing: 1 },
});

export default FollowUpScreen;
