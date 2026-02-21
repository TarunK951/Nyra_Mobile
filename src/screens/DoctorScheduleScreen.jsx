import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, ScrollView, TouchableOpacity,
    ActivityIndicator, Switch, Alert, RefreshControl, Modal,
    TextInput, Platform
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { doctorApi } from '../api/doctors';
import {
    Moon, Sun, Sunrise, Sunset, Plus, Trash2,
    Clock, IndianRupee, Copy, Settings, ChevronLeft, AlertCircle
} from 'lucide-react-native';

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

    const handleSave = () => {
        if (!start || !end) { Alert.alert('Error', 'Please enter start and end times.'); return; }
        onSave(start, end);
        setStart('09:00');
        setEnd('17:00');
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
                    <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Time Slot</Text>
                    <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>Start Time (HH:MM, 24h)</Text>
                    <TextInput
                        style={[styles.modalInput, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.cardBorder }]}
                        value={start} onChangeText={setStart}
                        placeholder="09:00" placeholderTextColor={colors.mutedForeground}
                        keyboardType="numeric"
                    />
                    <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>End Time (HH:MM, 24h)</Text>
                    <TextInput
                        style={[styles.modalInput, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.cardBorder }]}
                        value={end} onChangeText={setEnd}
                        placeholder="17:00" placeholderTextColor={colors.mutedForeground}
                        keyboardType="numeric"
                    />
                    <View style={styles.modalBtns}>
                        <TouchableOpacity onPress={onClose} style={[styles.modalBtn, { backgroundColor: colors.muted }]}>
                            <Text style={{ color: colors.mutedForeground, fontWeight: '600' }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSave} style={[styles.modalBtn, { backgroundColor: colors.primary }]}>
                            <Text style={{ color: '#fff', fontWeight: '600' }}>Add Slot</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// ─── Slot Pill ───────────────────────────────────────────────────────────────
const SlotPill = ({ slot, duration, colors, onDelete }) => {
    const count = countSlots(slot.startTime, slot.endTime, duration);
    return (
        <View style={[styles.slotPill, { backgroundColor: colors.accentSoft, borderColor: colors.cardBorder }]}>
            <Clock size={14} color={colors.primary} />
            <Text style={[styles.slotTime, { color: colors.foreground }]}>
                {to12h(slot.startTime)}  –  {to12h(slot.endTime)}
            </Text>
            {count > 0 && (
                <View style={[styles.slotCountBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.slotCountText, { color: colors.primary }]}>{count} SLOTS</Text>
                </View>
            )}
            <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Trash2 size={15} color="#ef4444" />
            </TouchableOpacity>
        </View>
    );
};

// ─── Day Card ────────────────────────────────────────────────────────────────
const DayCard = ({ dayName, dayData = {}, duration, colors, onToggle, onAddSlot, onDeleteSlot, onCopy }) => {
    const enabled = dayData.enabled ?? false;
    const slots = dayData.slots ?? [];

    // Group slots by period
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
        <View style={[styles.dayCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            {/* Day Header */}
            <View style={styles.dayHeader}>
                <Switch
                    value={enabled}
                    onValueChange={onToggle}
                    trackColor={{ false: colors.muted, true: colors.primary }}
                    thumbColor="#fff"
                />
                <Text style={[styles.dayName, { color: colors.foreground }]}>{dayName}</Text>
                <View style={styles.dayActions}>
                    <TouchableOpacity onPress={() => { }} style={styles.iconBtn}>
                        <Settings size={17} color={colors.mutedForeground} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onCopy} style={styles.iconBtn}>
                        <Copy size={17} color={colors.mutedForeground} />
                    </TouchableOpacity>
                </View>
            </View>

            {enabled && (
                <>
                    {PERIODS.map(period => {
                        const PeriodIcon = period.icon;
                        const periodSlots = slotsInPeriod(period.key);
                        return (
                            <View key={period.key} style={styles.periodBlock}>
                                {/* Period label */}
                                <View style={styles.periodLabelRow}>
                                    <PeriodIcon size={15} color={period.color} />
                                    <Text style={[styles.periodLabel, { color: period.color }]}>
                                        {period.label}
                                    </Text>
                                </View>

                                {periodSlots.length === 0 ? (
                                    <Text style={[styles.noSlots, { color: colors.mutedForeground }]}>
                                        No slots
                                    </Text>
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

                                {/* Add Slot button */}
                                <TouchableOpacity
                                    onPress={() => onAddSlot(period.key)}
                                    style={[styles.addSlotBtn, { borderColor: colors.cardBorder }]}
                                >
                                    <Plus size={14} color={colors.primary} />
                                    <Text style={[styles.addSlotText, { color: colors.primary }]}>Add Slot</Text>
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </>
            )}
        </View>
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

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* ── Custom header ── */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={22} color={colors.primary} />
                </TouchableOpacity>
                <View style={styles.headerMid}>
                    <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                        Schedule: {doctor?.name || 'Doctor'}
                    </Text>
                    {!!specialtyLabel && (
                        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
                            {specialtyLabel}
                        </Text>
                    )}
                </View>
                <TouchableOpacity
                    onPress={saveSchedule}
                    disabled={saving}
                    style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
                >
                    {saving
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={styles.saveBtnText}>Save</Text>
                    }
                </TouchableOpacity>
            </View>

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
                    <View style={[styles.configCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                        {/* Slot duration */}
                        <Text style={[styles.configLabel, { color: colors.mutedForeground }]}>SLOT DURATION</Text>
                        <TouchableOpacity
                            onPress={() => setShowDurationPicker(p => !p)}
                            style={[styles.durationSelector, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}
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
                                            { borderColor: colors.cardBorder },
                                            slotDuration === d && { backgroundColor: colors.primary }
                                        ]}
                                    >
                                        <Text style={[
                                            styles.durationOptionText,
                                            { color: slotDuration === d ? '#fff' : colors.foreground }
                                        ]}>
                                            {d} min
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Consultation Fee */}
                        <Text style={[styles.configLabel, { color: colors.mutedForeground, marginTop: 16 }]}>CONSULTATION FEE</Text>
                        <View style={[styles.feeInput, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
                            <IndianRupee size={16} color={colors.mutedForeground} />
                            <TextInput
                                style={[styles.feeInputText, { color: colors.foreground }]}
                                value={consultFee}
                                onChangeText={setConsultFee}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor={colors.mutedForeground}
                            />
                        </View>

                        {/* Period pills */}
                        <View style={styles.periodPills}>
                            {PERIOD_FILTER_PILLS.map(p => {
                                const PIcon = p.icon;
                                return (
                                    <View key={p.key} style={[styles.periodPill, { backgroundColor: p.color + '18', borderColor: p.color + '40' }]}>
                                        <PIcon size={12} color={p.color} />
                                        <Text style={[styles.periodPillText, { color: p.color }]}>{p.label}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

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
        paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 54 : 16, paddingBottom: 14,
        borderBottomWidth: 1, gap: 10,
    },
    backBtn: { padding: 4 },
    headerMid: { flex: 1 },
    headerTitle: { fontSize: 17, fontWeight: '700' },
    headerSub: { fontSize: 13, marginTop: 1 },
    saveBtn: {
        paddingHorizontal: 18, paddingVertical: 8,
        borderRadius: 10, minWidth: 60, alignItems: 'center',
    },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    body: { padding: 16, gap: 16 },

    // Config card
    configCard: {
        borderRadius: 16, borderWidth: 1, padding: 18,
    },
    configLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
    durationSelector: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 10, borderWidth: 1, padding: 12, gap: 10,
    },
    durationValue: { flex: 1, fontSize: 16 },
    durationOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    durationOption: {
        paddingHorizontal: 14, paddingVertical: 7,
        borderRadius: 8, borderWidth: 1,
    },
    durationOptionText: { fontSize: 14 },
    feeInput: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 10, borderWidth: 1, padding: 12, gap: 8,
    },
    feeInputText: { flex: 1, fontSize: 16 },
    periodPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
    periodPill: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 20, borderWidth: 1, gap: 5,
    },
    periodPillText: { fontSize: 12, fontWeight: '500' },

    // Day card
    dayCard: {
        borderRadius: 16, borderWidth: 1, overflow: 'hidden',
    },
    dayHeader: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14, gap: 12,
    },
    dayName: { flex: 1, fontSize: 17, fontWeight: '700' },
    dayActions: { flexDirection: 'row', gap: 8 },
    iconBtn: { padding: 4 },

    // Period block
    periodBlock: {
        borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.04)',
        paddingHorizontal: 16, paddingVertical: 14,
    },
    periodLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
    periodLabel: { fontSize: 14, fontWeight: '600' },
    noSlots: { fontSize: 13, textAlign: 'center', marginBottom: 10, fontStyle: 'italic' },

    // Slot pill
    slotPill: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 10, borderWidth: 1,
        paddingHorizontal: 12, paddingVertical: 10,
        marginBottom: 8, gap: 8,
    },
    slotTime: { flex: 1, fontSize: 14, fontWeight: '500' },
    slotCountBadge: {
        paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20,
    },
    slotCountText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

    // Add slot button
    addSlotBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        borderRadius: 10, borderWidth: 1, borderStyle: 'dashed',
        paddingVertical: 10, gap: 6,
    },
    addSlotText: { fontSize: 14, fontWeight: '600' },

    // Modal
    modalOverlay: {
        flex: 1, justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    modalSheet: {
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24, paddingBottom: 40,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 20 },
    modalLabel: { fontSize: 13, marginBottom: 6 },
    modalInput: {
        borderRadius: 10, borderWidth: 1, padding: 12,
        fontSize: 16, marginBottom: 16,
    },
    modalBtns: { flexDirection: 'row', gap: 12, marginTop: 4 },
    modalBtn: {
        flex: 1, paddingVertical: 13, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
});

export default DoctorScheduleScreen;
