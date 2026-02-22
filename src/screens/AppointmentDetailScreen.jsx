import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, ScrollView, TouchableOpacity,
    ActivityIndicator, RefreshControl, Platform, Alert, Modal, TextInput, Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeContext';
import { appointmentApi } from '../api/appointments';
import {
    ChevronLeft, Calendar, Clock, User, Stethoscope,
    CheckCircle, XCircle, AlertCircle, Circle,
    Phone, MessageSquare,
} from 'lucide-react-native';
import { layout } from '../utils/layout';
import { useStagger, useScalePressAnim, SPRING } from '../utils/animations';

const STATUS_CONFIG = {
    CONFIRMED: { label: 'Confirmed', color: '#10b981', icon: CheckCircle, bg: 'rgba(16, 185, 129, 0.12)' },
    COMPLETED: { label: 'Completed', color: '#2563eb', icon: CheckCircle, bg: 'rgba(37, 99, 235, 0.12)' },
    CANCELLED: { label: 'Cancelled', color: '#ef4444', icon: XCircle, bg: 'rgba(239, 68, 68, 0.12)' },
    PENDING: { label: 'Pending', color: '#f59e0b', icon: AlertCircle, bg: 'rgba(245, 158, 11, 0.12)' },
    SCHEDULED: { label: 'Scheduled', color: '#8b5cf6', icon: Circle, bg: 'rgba(139, 92, 246, 0.12)' },
    NO_SHOW: { label: 'No Show', color: '#6b7280', icon: XCircle, bg: 'rgba(107, 114, 128, 0.12)' },
};

const StatusBadge = ({ status, colors }) => {
    const cfg = STATUS_CONFIG[status] || { label: status || '—', color: colors.mutedForeground, bg: 'rgba(0,0,0,0.05)' };
    const Icon = cfg.icon || Circle;
    return (
        <BlurView
            intensity={colors.glass.blurStrong}
            tint={colors.glass.tint}
            experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
            style={[styles.badge, { backgroundColor: cfg.bg, borderColor: cfg.color + '40' }]}
        >
            <Icon size={12} color={cfg.color} strokeWidth={2.5} />
            <Text style={[styles.badgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
        </BlurView>
    );
};

const InfoRow = ({ icon: Icon, label, value, colors }) =>
    value ? (
        <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: colors.muted }]}>
                <Icon size={14} color={colors.primary} strokeWidth={2.5} />
            </View>
            <View style={styles.infoText}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
            </View>
        </View>
    ) : null;

const AppointmentDetailScreen = ({ route, navigation }) => {
    const { colors } = useTheme();
    const { appointmentId, appointment: apptProp } = route?.params || {};
    const id = appointmentId || apptProp?.id;

    const [appointment, setAppointment] = useState(apptProp || null);
    const [loading, setLoading] = useState(!apptProp);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [cancelModal, setCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    const fetchAppointment = useCallback(async () => {
        if (!id) return;
        try {
            const res = await appointmentApi.getById(id);
            const data = res.data?.appointment || res.data?.data || res.data;
            setAppointment(data);
        } catch (e) {
            console.error('[AppointmentDetail]', e?.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id]);

    useEffect(() => { fetchAppointment(); }, [fetchAppointment]);

    const handleConfirm = async () => {
        try {
            setActionLoading('confirm');
            await appointmentApi.confirm(id);
            await fetchAppointment();
            Alert.alert('Success', 'Appointment confirmed.');
        } catch (e) {
            Alert.alert('Error', e?.response?.data?.message || 'Failed to confirm');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancel = async () => {
        try {
            setActionLoading('cancel');
            await appointmentApi.cancel(id, cancelReason);
            setCancelModal(false);
            await fetchAppointment();
            Alert.alert('Cancelled', 'Appointment cancelled.');
        } catch (e) {
            Alert.alert('Error', e?.response?.data?.message || 'Failed to cancel');
        } finally {
            setActionLoading(null);
        }
    };

    const fmtDate = (d) => {
        if (!d) return '—';
        try {
            return new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
        } catch { return d; }
    };

    const fmtTime = (d) => {
        if (!d) return '—';
        try { return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }); }
        catch { return '—'; }
    };

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const apt = appointment || {};
    const dateStr = fmtDate(apt.date || apt.appointmentDate || apt.scheduledAt);
    const timeStr = apt.time || fmtTime(apt.date || apt.appointmentDate || apt.scheduledAt);
    const canConfirm = ['PENDING', 'SCHEDULED'].includes(apt.status);
    const canCancel = !['CANCELLED', 'COMPLETED'].includes(apt.status);

    const staggerAnims = useStagger(6, 80);
    const g = colors.glass;
    const { scale: confirmScale, pressIn: confirmIn, pressOut: confirmOut } = useScalePressAnim();
    const { scale: cancelScale, pressIn: cancelIn, pressOut: cancelOut } = useScalePressAnim();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Glass Header */}
            <BlurView
                intensity={g.blurStrong}
                tint={g.tint}
                experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                style={[styles.header, { borderBottomColor: g.borderSubtle }]}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.muted }]}>
                    <ChevronLeft size={22} color={colors.foreground} strokeWidth={2.5} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: colors.foreground }]}>Appointment</Text>
                    <Text style={[styles.headerSub, { color: colors.primary }]}>{apt?.uhid ? `UHID: ${apt.uhid}` : 'Details'}</Text>
                </View>
                <StatusBadge status={apt.status} colors={colors} />
            </BlurView>

            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAppointment(); }} tintColor={colors.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero date card */}
                <Animated.View style={staggerAnims[0] ? { opacity: staggerAnims[0].opacity, transform: [{ translateY: staggerAnims[0].translateY }] } : {}}>
                    <BlurView
                        intensity={g.blurStrong}
                        tint={g.tint}
                        experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                        style={[styles.heroCard, { backgroundColor: colors.primary, borderColor: g.border }]}
                    >
                        <View style={[styles.cardShimmer, { backgroundColor: 'rgba(255,255,255,0.25)' }]} />
                        <View style={styles.heroGlow} />
                        <View style={[styles.heroIconBox, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                            <Calendar size={32} color="#fff" strokeWidth={2.5} />
                        </View>
                        <Text style={styles.heroDate}>{dateStr}</Text>
                        <Text style={styles.heroTime}>{timeStr}</Text>
                    </BlurView>
                </Animated.View>

                {/* Appointment info */}
                <Animated.View style={staggerAnims[1] ? { opacity: staggerAnims[1].opacity, transform: [{ translateY: staggerAnims[1].translateY }] } : {}}>
                    <BlurView
                        intensity={g.blur}
                        tint={g.tint}
                        experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                        style={[styles.card, { borderColor: g.border }]}
                    >
                        <View style={[styles.cardShimmer, { backgroundColor: g.shimmer }]} />
                        <Text style={[styles.cardTitle, { color: colors.primary }]}>APPOINTMENT INFO</Text>
                        <InfoRow icon={User} label="Patient" value={apt.patient?.name || apt.patientName} colors={colors} />
                        <InfoRow icon={Stethoscope} label="Doctor" value={apt.doctor?.name || apt.doctorName} colors={colors} />
                        <InfoRow icon={Calendar} label="Date" value={dateStr} colors={colors} />
                        <InfoRow icon={Clock} label="Time" value={timeStr} colors={colors} />
                        <InfoRow icon={MessageSquare} label="Reason" value={apt.reason || apt.notes} colors={colors} />
                        {apt.appointment_number && (
                            <InfoRow icon={AlertCircle} label="Appt #" value={apt.appointment_number} colors={colors} />
                        )}
                    </BlurView>
                </Animated.View>

                {/* Patient contact */}
                {(apt.patient?.phone || apt.patientPhone) && (
                    <Animated.View style={staggerAnims[2] ? { opacity: staggerAnims[2].opacity, transform: [{ translateY: staggerAnims[2].translateY }] } : {}}>
                        <BlurView
                            intensity={g.blur}
                            tint={g.tint}
                            experimentalBlurMethod={Platform.OS === 'android' ? 'blur' : undefined}
                            style={[styles.card, { borderColor: g.border }]}
                        >
                            <View style={[styles.cardShimmer, { backgroundColor: g.shimmer }]} />
                            <Text style={[styles.cardTitle, { color: colors.primary }]}>PATIENT CONTACT</Text>
                            <InfoRow icon={Phone} label="Phone" value={apt.patient?.phone || apt.patientPhone} colors={colors} />
                            {apt.patient?.email && (
                                <InfoRow icon={MessageSquare} label="Email" value={apt.patient.email} colors={colors} />
                            )}
                        </BlurView>
                    </Animated.View>
                )}

                {/* Actions */}
                {(canConfirm || canCancel) && (
                    <Animated.View style={staggerAnims[3] ? { opacity: staggerAnims[3].opacity, transform: [{ translateY: staggerAnims[3].translateY }] } : {}}>
                        <View style={styles.actionsRow}>
                            {canConfirm && (
                                <Animated.View style={{ flex: 1, transform: [{ scale: confirmScale }] }}>
                                    <TouchableOpacity
                                        activeOpacity={1}
                                        onPressIn={confirmIn} onPressOut={confirmOut}
                                        style={[styles.actionBtn, { backgroundColor: colors.success }]}
                                        onPress={handleConfirm}
                                        disabled={!!actionLoading}
                                    >
                                        {actionLoading === 'confirm'
                                            ? <ActivityIndicator size="small" color="#fff" />
                                            : <CheckCircle size={18} color="#fff" strokeWidth={2.5} />}
                                        <Text style={styles.actionTxt}>Confirm</Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            )}
                            {canCancel && (
                                <Animated.View style={{ flex: 1, transform: [{ scale: cancelScale }] }}>
                                    <TouchableOpacity
                                        activeOpacity={1}
                                        onPressIn={cancelIn} onPressOut={cancelOut}
                                        style={[styles.actionBtn, { backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.error + '40' }]}
                                        onPress={() => setCancelModal(true)}
                                        disabled={!!actionLoading}
                                    >
                                        <XCircle size={18} color={colors.error} strokeWidth={2.5} />
                                        <Text style={[styles.actionTxt, { color: colors.error }]}>Cancel</Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            )}
                        </View>
                    </Animated.View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Cancel Modal */}
            <Modal visible={cancelModal} transparent animationType="fade">
                <View style={styles.overlay}>
                    <BlurView
                        intensity={g.blurStrong} tint={g.tint}
                        style={[styles.modal, { borderColor: g.border }]}
                    >
                        <View style={[styles.cardShimmer, { backgroundColor: g.shimmer }]} />
                        <Text style={[styles.modalTitle, { color: colors.foreground }]}>Cancel Appointment</Text>
                        <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
                            Please provide a reason for cancellation (optional)
                        </Text>
                        <TextInput
                            style={[styles.modalInput, { color: colors.foreground, borderColor: g.borderSubtle, backgroundColor: 'rgba(255,255,255,0.05)' }]}
                            placeholder="Reason..."
                            placeholderTextColor={colors.mutedForeground}
                            value={cancelReason}
                            onChangeText={setCancelReason}
                            multiline
                            numberOfLines={3}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setCancelModal(false)} style={[styles.modalBtn, { backgroundColor: colors.muted }]}>
                                <Text style={{ color: colors.foreground, fontWeight: '800' }}>BACK</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleCancel} style={[styles.modalBtn, { backgroundColor: colors.error }]} disabled={actionLoading === 'cancel'}>
                                {actionLoading === 'cancel'
                                    ? <ActivityIndicator size="small" color="#fff" />
                                    : <Text style={{ color: '#fff', fontWeight: '800' }}>CANCEL NOW</Text>}
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingTop: layout.statusBarHeight + 4, paddingBottom: 14, paddingHorizontal: 16,
        borderBottomWidth: 1, gap: 12, overflow: 'hidden',
    },
    backBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    headerCenter: { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
    headerSub: { fontSize: 13, fontWeight: '700', marginTop: 1 },

    badge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, overflow: 'hidden',
    },
    badgeTxt: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
    scroll: { padding: 20, gap: 18 },

    heroCard: {
        borderRadius: 30, padding: 30,
        alignItems: 'center', gap: 12,
        borderWidth: 1, overflow: 'hidden',
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 24 }, android: { elevation: 8 } }),
    },
    heroGlow: { position: 'absolute', top: -100, left: -100, width: 300, height: 300, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 150 },
    heroIconBox: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    heroDate: { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center', letterSpacing: -0.2, opacity: 0.9 },
    heroTime: { color: '#fff', fontSize: 34, fontWeight: '900', letterSpacing: -1 },

    card: {
        borderRadius: 26, borderWidth: 1, padding: 20, overflow: 'hidden',
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16 }, android: { elevation: 4 } })
    },
    cardShimmer: { position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, opacity: 0.8 },
    cardTitle: { fontSize: 12, fontWeight: '900', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },

    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
    infoIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    infoText: { flex: 1 },
    infoLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.6 },
    infoValue: { fontSize: 15, fontWeight: '700', marginTop: 1 },

    actionsRow: { flexDirection: 'row', gap: 14 },
    actionBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, paddingVertical: 14, borderRadius: 16,
    },
    actionTxt: { color: '#fff', fontSize: 15, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },

    // Modal
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
    modal: { borderRadius: 30, padding: 26, gap: 16, borderWidth: 1, overflow: 'hidden' },
    modalTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
    modalSub: { fontSize: 15, fontWeight: '600', opacity: 0.7, lineHeight: 22 },
    modalInput: { borderWidth: 1, borderRadius: 16, padding: 16, fontSize: 15, fontWeight: '500', minHeight: 100, textAlignVertical: 'top' },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 6 },
    modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});

export default AppointmentDetailScreen;
