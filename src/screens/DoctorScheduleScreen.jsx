import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, ScrollView, TouchableOpacity,
    ActivityIndicator, Switch, Alert, RefreshControl, Modal,
    TextInput, Platform, Animated
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeContext';
import { doctorApi } from '../api/doctors';
import {
    Moon, Sun, Sunrise, Plus, Trash2,
    Clock, IndianRupee, Copy, Settings, ChevronLeft,
} from 'lucide-react-native';
import { layout } from '../utils/layout';
import { useStagger, useScalePressAnim } from '../utils/animations';

// ─── Constants ─────────────────────────────────────────────────────────────
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const PERIODS = [
    { key: 'early', label: 'Early Morning', subtitle: '(0–6)', icon: Moon, color: '#6366f1' },
    { key: 'morning', label: 'Morning', subtitle: '(6–12)', icon: Sun, color: '#f59e0b' },
    { key: 'afternoon', label: 'Afternoon', subtitle: '(12–18)', icon: Sunrise, color: '#ef4444' },
    { key: 'evening', label: 'Evening / Night', subtitle: '(18–24)', icon: Moon, color: '#8b5cf6' },
];

const PERIOD_FILTER_PILLS = [
    { key: 'early', label: 'Early (0-6)', icon: Moon, color: '#6366f1' },
    { key: 'morning', label: 'Morning (6-12)', icon: Sun, color: '#f59e0b' },
    { key: 'afternoon', label: 'Afternoon (12-18)', icon: Sunrise, color: '#ef4444' },
    { key: 'evening', label: 'Evening (18-24)', icon: Moon, color: '#8b5cf6' },
];

const SLOT_DURATIONS = [10, 15, 20, 30, 45, 60];

function to12h(time24) {
    if (!time24) return '—';
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${String(m || 0).padStart(2, '0')} ${period}`;
}

function countSlots(start, end, duration) {
    if (!start || !end || !duration) return 0;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const totalMins = (eh * 60 + em) - (sh * 60 + sm);
    return totalMins > 0 ? Math.floor(totalMins / duration) : 0;
}

// ─── Add Slot Modal ─────────────────────────────────────────────────────────
const AddSlotModal = ({ visible, onClose, onSave, colors }) => {
    const [start, setStart] = useState('09:00');
    const [end, setEnd] = useState('17:00');
    const g = colors.glass;

    const handleSave = () => {
        if (!start || !end) { Alert.alert('Error', 'Enter times.'); return; }
        onSave(start, end);
        setStart('09:00');
        setEnd('17:00');
        onClose();
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
                    <View style={[styles.cardShimmer, { backgroundColor: g.shimmer }]} />
                    <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Time Slot</Text>
                    <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>Start Time (24h)</Text>
                    <BlurView intensity={g.blur} tint={g.tint} style={[styles.modalInputWrap, { borderColor: g.borderSubtle }]}>
                        <TextInput
                            style={[styles.modalInput, { color: colors.foreground }]}
                            value={start} onChangeText={setStart}
                            placeholder="09:00" placeholderTextColor={colors.mutedForeground}
                            keyboardType="numeric"
                        />
                    </BlurView>
                    <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>End Time (24h)</Text>
                    <BlurView intensity={g.blur} tint={g.tint} style={[styles.modalInputWrap, { borderColor: g.borderSubtle }]}>
                        <TextInput
                            style={[styles.modalInput, { color: colors.foreground }]}
                            value={end} onChangeText={setEnd}
                            placeholder="17:00" placeholderTextColor={colors.mutedForeground}
                            keyboardType="numeric"
                        />
                    </BlurView>
                    <View style={styles.modalBtns}>
                        <TouchableOpacity onPress={onClose} style={[styles.modalBtn, { backgroundColor: colors.muted }]}>
                            <Text style={{ color: colors.foreground, fontWeight: '800' }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSave} style={[styles.modalBtn, { backgroundColor: colors.primary }]}>
                            <Text style={{ color: '#fff', fontWeight: '800' }}>Add Slot</Text>
                        </TouchableOpacity>
                    </View>
                </BlurView>
            </View>
        </Modal>
    );
};

// ─── Slot Pill ───────────────────────────────────────────────────────────────
const SlotPill = ({ slot, duration, colors, onDelete }) => {
    const count = countSlots(slot.startTime, slot.endTime, duration);
    const g = colors.glass;
    return (
        <View style={[styles.slotPill, { backgroundColor: colors.primary + '08', borderColor: g.borderSubtle }]}>
            <Clock size={14} color={colors.primary} strokeWidth={2.5} />
            <Text style={[styles.slotTime, { color: colors.foreground }]}>
                {to12h(slot.startTime)}  –  {to12h(slot.endTime)}
            </Text>
            {count > 0 && (
                <View style={[styles.slotCountBadge, { backgroundColor: colors.primary + '18' }]}>
                    <Text style={[styles.slotCountText, { color: colors.primary }]}>{count} SLOTS</Text>
                </View>
            )}
            <TouchableOpacity onPress={onDelete} style={styles.deleteSlotBtn}>
                <Trash2 size={14} color={colors.error} />
            </TouchableOpacity>
        </View>
    );
};

// ─── Day Card ────────────────────────────────────────────────────────────────
const DayCard = ({ dayName, dayData = {}, duration, colors, onToggle, onAddSlot, onDeleteSlot, onCopy }) => {
    const enabled = dayData.enabled ?? false;
    const slots = dayData.slots ?? [];
    const g = colors.glass;

    function slotsInPeriod(periodKey) {
        return slots.filter(s => {
            const h = parseInt((s.startTime || '00:00').split(':')[0], 10);
            if (periodKey === 'early') return h >= 0 && h < 6;
            if (periodKey === 'morning') return h >= 6 && h < 12;
            if (periodKey === 'afternoon') return h >= 12 && h < 18;
            if (periodKey === 'evening') return h >= 18 && h < 24;
            return false;
        });
    }

    return (
        <BlurView
            intensity={g.blur}
            tint={g.tint}
            experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
            style={[styles.dayCard, { borderColor: g.border }]}
        >
            <View style={[styles.cardShimmer, { backgroundColor: g.shimmer }]} />
            <View style={styles.dayHeader}>
                <Switch
                    value={enabled}
                    onValueChange={onToggle}
                    trackColor={{ false: colors.muted, true: colors.primary }}
                    thumbColor="#fff"
                />
                <Text style={[styles.dayName, { color: colors.foreground }]}>{dayName}</Text>
                <View style={styles.dayActions}>
                    <TouchableOpacity onPress={onCopy} style={[styles.iconBtn, { backgroundColor: colors.primary + '12' }]}>
                        <Copy size={16} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            {enabled && (
                <View style={styles.expandedContent}>
                    {PERIODS.map(period => {
                        const PeriodIcon = period.icon;
                        const periodSlots = slotsInPeriod(period.key);
                        return (
                            <View key={period.key} style={styles.periodBlock}>
                                <View style={styles.periodLabelRow}>
                                    <View style={[styles.periodDot, { backgroundColor: period.color }]} />
                                    <Text style={[styles.periodLabel, { color: colors.foreground }]}>
                                        {period.label}
                                    </Text>
                                </View>

                                {periodSlots.length === 0 ? (
                                    <Text style={[styles.noSlots, { color: colors.mutedForeground }]}>No slots defined</Text>
                                ) : (
                                    periodSlots.map((slot, idx) => (
                                        <SlotPill
                                            key={idx}
                                            slot={slot}
                                            duration={duration}
                                            colors={colors}
                                            onDelete={() => onDeleteSlot(slot)}
                                        />
                                    ))
                                )}

                                <TouchableOpacity
                                    onPress={() => onAddSlot(period.key)}
                                    style={[styles.addSlotBtn, { borderColor: colors.primary + '40' }]}
                                >
                                    <Plus size={14} color={colors.primary} strokeWidth={3} />
                                    <Text style={[styles.addSlotText, { color: colors.primary }]}>Add Slot</Text>
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>
            )}
        </BlurView>
    );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const DoctorScheduleScreen = ({ route, navigation }) => {
    const { colors } = useTheme();
    const { doctor } = route?.params || {};
    const doctorId = doctor?.id || doctor?._id;

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [schedule, setSchedule] = useState({});
    const [slotDuration, setSlotDuration] = useState(30);
    const [consultFee, setConsultFee] = useState('');
    const [showDurationPicker, setShowDurationPicker] = useState(false);
    const [addSlotModal, setAddSlotModal] = useState({ visible: false, day: null, period: null });

    const fetchSchedule = useCallback(async () => {
        setError(null);
        try {
            const res = await doctorApi.getAvailability(doctorId);
            const raw = res.data?.availability || res.data?.schedule || res.data || {};

            // Normalise into { Monday: { enabled, slots: [] }, ... }
            const normalised = {};
            DAYS.forEach(d => {
                const dayRaw = raw[d] || raw[d.toLowerCase()] || {};
                normalised[d] = {
                    enabled: dayRaw.enabled ?? dayRaw.isEnabled ?? false,
                    slots: dayRaw.slots || dayRaw.timeSlots || [],
                };
            });
            setSchedule(normalised);
            setSlotDuration(raw.slotDuration ?? 30);
            setConsultFee(String(raw.consultationFee ?? raw.fee ?? ''));
        } catch (err) {
            console.error('DoctorSchedule fetch:', err?.response?.data || err.message);
            // If 404, just show empty schedule
            const empty = {};
            DAYS.forEach(d => { empty[d] = { enabled: false, slots: [] }; });
            setSchedule(empty);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [doctorId]);

    useEffect(() => { if (doctorId) fetchSchedule(); }, [fetchSchedule]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchSchedule();
    };

    // ── Toggle day ──
    const toggleDay = (day) => {
        setSchedule(prev => ({
            ...prev,
            [day]: { ...prev[day], enabled: !prev[day]?.enabled },
        }));
    };

    // ── Add slot ──
    const addSlot = (day, _period, startTime, endTime) => {
        setSchedule(prev => {
            const existing = prev[day]?.slots || [];
            return {
                ...prev,
                [day]: {
                    ...prev[day],
                    slots: [...existing, { startTime, endTime }],
                },
            };
        });
    };

    // ── Delete slot ──
    const deleteSlot = (day, slot) => {
        setSchedule(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                slots: (prev[day]?.slots || []).filter(
                    s => !(s.startTime === slot.startTime && s.endTime === slot.endTime)
                ),
            },
        }));
    };

    // ── Copy to all days ──
    const copyDay = (sourceDayName) => {
        const source = schedule[sourceDayName];
        if (!source) return;
        Alert.alert(
            'Copy Schedule',
            `Copy ${sourceDayName}'s slots to all other days?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Copy',
                    onPress: () => {
                        setSchedule(prev => {
                            const next = { ...prev };
                            DAYS.forEach(d => {
                                if (d !== sourceDayName) {
                                    next[d] = {
                                        ...next[d],
                                        enabled: source.enabled,
                                        slots: [...(source.slots || [])],
                                    };
                                }
                            });
                            return next;
                        });
                    }
                },
            ]
        );
    };

    // ── Save ──
    const saveSchedule = async () => {
        if (!doctorId) return;
        setSaving(true);
        try {
            await doctorApi.setAvailability(doctorId, {
                schedule,
                slotDuration,
                consultationFee: Number(consultFee) || 0,
            });
            Alert.alert('Saved', 'Doctor schedule updated successfully.');
        } catch (err) {
            Alert.alert('Error', err?.response?.data?.message || 'Failed to save schedule.');
        } finally {
            setSaving(false);
        }
    };

    const specialtyLabel = doctor?.specialty || doctor?.specialization || doctor?.department || '';

    const g = colors.glass;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* ── Glass Header ── */}
            <BlurView
                intensity={g.blurStrong}
                tint={g.tint}
                experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                style={[styles.header, { borderBottomColor: g.borderSubtle }]}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.muted }]}>
                    <ChevronLeft size={22} color={colors.foreground} />
                </TouchableOpacity>
                <View style={styles.headerMid}>
                    <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                        {doctor?.name || 'Schedule'}
                    </Text>
                    <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
                        Availability Settings
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={saveSchedule}
                    disabled={saving}
                    activeOpacity={0.8}
                    style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
                >
                    {saving
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={styles.saveBtnText}>Save</Text>
                    }
                </TouchableOpacity>
            </BlurView>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.body}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                >
                    {/* ── Config Card ── */}
                    {/* ── Glass Config Card ── */}
                    <BlurView
                        intensity={g.blur}
                        tint={g.tint}
                        experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                        style={[styles.configCard, { borderColor: g.border }]}
                    >
                        <View style={[styles.cardShimmer, { backgroundColor: g.shimmer }]} />

                        <Text style={[styles.configLabel, { color: colors.primary }]}>SLOT DURATION</Text>
                        <TouchableOpacity
                            onPress={() => setShowDurationPicker(p => !p)}
                            style={[styles.durationSelector, { backgroundColor: colors.primary + '08', borderColor: g.borderSubtle }]}
                        >
                            <Clock size={16} color={colors.primary} />
                            <Text style={[styles.durationValue, { color: colors.foreground }]}>{slotDuration} mins</Text>
                            <ChevronLeft size={16} color={colors.mutedForeground} style={{ transform: [{ rotate: '-90deg' }] }} />
                        </TouchableOpacity>

                        {showDurationPicker && (
                            <View style={styles.durationOptions}>
                                {SLOT_DURATIONS.map(d => (
                                    <TouchableOpacity
                                        key={d}
                                        onPress={() => { setSlotDuration(d); setShowDurationPicker(false); }}
                                        style={[
                                            styles.durationOption,
                                            { borderColor: g.borderSubtle },
                                            slotDuration === d && { backgroundColor: colors.primary, borderColor: colors.primary }
                                        ]}
                                    >
                                        <Text style={[
                                            styles.durationOptionText,
                                            { color: slotDuration === d ? '#fff' : colors.foreground, fontWeight: slotDuration === d ? '800' : '600' }
                                        ]}>
                                            {d}m
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <Text style={[styles.configLabel, { color: colors.primary, marginTop: 20 }]}>CONSULTATION FEE</Text>
                        <View style={[styles.feeInput, { backgroundColor: colors.primary + '08', borderColor: g.borderSubtle }]}>
                            <IndianRupee size={16} color={colors.primary} />
                            <TextInput
                                style={[styles.feeInputText, { color: colors.foreground }]}
                                value={consultFee}
                                onChangeText={setConsultFee}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor={colors.mutedForeground}
                            />
                        </View>
                    </BlurView>

                    {/* ── Day Cards ── */}
                    {DAYS.map(day => (
                        <DayCard
                            key={day}
                            dayName={day}
                            dayData={schedule[day]}
                            duration={slotDuration}
                            colors={colors}
                            onToggle={() => toggleDay(day)}
                            onAddSlot={(period) => setAddSlotModal({ visible: true, day, period })}
                            onDeleteSlot={(slot) => deleteSlot(day, slot)}
                            onCopy={() => copyDay(day)}
                        />
                    ))}

                    <View style={{ height: 40 }} />
                </ScrollView>
            )}

            {/* Add Slot Modal */}
            <AddSlotModal
                visible={addSlotModal.visible}
                colors={colors}
                onClose={() => setAddSlotModal({ visible: false, day: null, period: null })}
                onSave={(start, end) => addSlot(addSlotModal.day, addSlotModal.period, start, end)}
            />
        </View>
    );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingTop: layout.statusBarHeight + 4, paddingBottom: 14,
        borderBottomWidth: 1, gap: 10, overflow: 'hidden',
    },
    backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    headerMid: { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
    headerSub: { fontSize: 13, fontWeight: '600' },
    saveBtn: {
        paddingHorizontal: 20, paddingVertical: 10,
        borderRadius: 14, minWidth: 70, alignItems: 'center',
    },
    saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 14, textTransform: 'uppercase' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    body: { padding: 16, gap: 16, paddingTop: 10 },

    // Config card
    configCard: { borderRadius: 24, borderWidth: 1, padding: 20, overflow: 'hidden' },
    cardShimmer: { position: 'absolute', top: 0, left: 0, right: 0, height: 1.5 },
    configLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2, marginBottom: 10 },
    durationSelector: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 14, borderWidth: 1, padding: 14, gap: 10,
    },
    durationValue: { flex: 1, fontSize: 16, fontWeight: '700' },
    durationOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    durationOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5 },
    durationOptionText: { fontSize: 13 },
    feeInput: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 14, borderWidth: 1, padding: 14, gap: 10,
    },
    feeInputText: { flex: 1, fontSize: 17, fontWeight: '700' },

    // Day card
    dayCard: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
    dayHeader: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
    dayName: { flex: 1, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
    dayActions: { flexDirection: 'row', gap: 10 },
    iconBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    expandedContent: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },

    // Period block
    periodBlock: { padding: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
    periodLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    periodDot: { width: 6, height: 6, borderRadius: 3 },
    periodLabel: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    noSlots: { fontSize: 13, textAlign: 'center', marginVertical: 10, opacity: 0.5, fontWeight: '600' },

    // Slot pill
    slotPill: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 12, borderWidth: 1,
        paddingHorizontal: 14, paddingVertical: 12,
        marginBottom: 10, gap: 10,
    },
    slotTime: { flex: 1, fontSize: 15, fontWeight: '700' },
    slotCountBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    slotCountText: { fontSize: 10, fontWeight: '900' },
    deleteSlotBtn: { padding: 4 },

    // Add slot button
    addSlotBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed',
        paddingVertical: 12, gap: 8, marginTop: 4,
    },
    addSlotText: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

    // Modal
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
    modalSheet: { width: '100%', borderRadius: 30, padding: 24, borderWidth: 1, overflow: 'hidden' },
    modalTitle: { fontSize: 22, fontWeight: '900', marginBottom: 20, letterSpacing: -0.5 },
    modalLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8, opacity: 0.7 },
    modalInputWrap: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 16, overflow: 'hidden' },
    modalInput: { fontSize: 16, fontWeight: '800' },
    modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
    modalBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});

export default DoctorScheduleScreen;
