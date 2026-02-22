import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, ScrollView, TouchableOpacity,
    ActivityIndicator, RefreshControl, Platform, Alert, Modal, TextInput,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { appointmentApi } from '../api/appointments';
import {
    ChevronLeft, Calendar, Clock, User, Stethoscope,
    CheckCircle, XCircle, AlertCircle, Circle, Edit2,
    Phone, MessageSquare, ChevronRight,
} from 'lucide-react-native';
import { layout } from '../utils/layout';

const STATUS_CONFIG = {
    CONFIRMED: { label: 'Confirmed', color: '#10b981', icon: CheckCircle },
    COMPLETED: { label: 'Completed', color: '#3b82f6', icon: CheckCircle },
    CANCELLED: { label: 'Cancelled', color: '#ef4444', icon: XCircle },
    PENDING: { label: 'Pending', color: '#f59e0b', icon: AlertCircle },
    SCHEDULED: { label: 'Scheduled', color: '#8b5cf6', icon: Circle },
    NO_SHOW: { label: 'No Show', color: '#6b7280', icon: XCircle },
};

const StatusBadge = ({ status, colors }) => {
    const cfg = STATUS_CONFIG[status] || { label: status || '—', color: colors.mutedForeground };
    const Icon = cfg.icon || Circle;
    return (
        <View style={[styles.badge, { backgroundColor: cfg.color + '18', borderColor: cfg.color + '40' }]}>
            <Icon size={12} color={cfg.color} />
            <Text style={[styles.badgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
    );
};

const InfoRow = ({ icon: Icon, label, value, colors }) =>
    value ? (
        <View style={styles.infoRow}>
            <Icon size={15} color={colors.mutedForeground} />
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

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={22} color={colors.primary} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: colors.foreground }]}>Appointment Detail</Text>
                </View>
                <StatusBadge status={apt.status} colors={colors} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAppointment(); }} tintColor={colors.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero date card */}
                <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
                    <Calendar size={32} color="#fff" />
                    <Text style={styles.heroDate}>{dateStr}</Text>
                    <Text style={styles.heroTime}>{timeStr}</Text>
                </View>

                {/* Appointment info */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <Text style={[styles.cardTitle, { color: colors.foreground }]}>Appointment Info</Text>
                    <InfoRow icon={User} label="Patient" value={apt.patient?.name || apt.patientName} colors={colors} />
                    <InfoRow icon={Stethoscope} label="Doctor" value={apt.doctor?.name || apt.doctorName} colors={colors} />
                    <InfoRow icon={Calendar} label="Date" value={dateStr} colors={colors} />
                    <InfoRow icon={Clock} label="Time" value={timeStr} colors={colors} />
                    <InfoRow icon={MessageSquare} label="Reason" value={apt.reason || apt.notes} colors={colors} />
                    {apt.appointment_number && (
                        <InfoRow icon={AlertCircle} label="Appt #" value={apt.appointment_number} colors={colors} />
                    )}
                </View>

                {/* Patient contact */}
                {(apt.patient?.phone || apt.patientPhone) && (
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Patient Contact</Text>
                        <InfoRow icon={Phone} label="Phone" value={apt.patient?.phone || apt.patientPhone} colors={colors} />
                        {apt.patient?.email && (
                            <InfoRow icon={MessageSquare} label="Email" value={apt.patient.email} colors={colors} />
                        )}
                    </View>
                )}

                {/* Actions */}
                {(canConfirm || canCancel) && (
                    <View style={styles.actionsRow}>
                        {canConfirm && (
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#10b981' }]}
                                onPress={handleConfirm}
                                disabled={!!actionLoading}
                            >
                                {actionLoading === 'confirm'
                                    ? <ActivityIndicator size="small" color="#fff" />
                                    : <CheckCircle size={16} color="#fff" />}
                                <Text style={styles.actionTxt}>Confirm</Text>
                            </TouchableOpacity>
                        )}
                        {canCancel && (
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#ef4444' }]}
                                onPress={() => setCancelModal(true)}
                                disabled={!!actionLoading}
                            >
                                <XCircle size={16} color="#fff" />
                                <Text style={styles.actionTxt}>Cancel</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Cancel Modal */}
            <Modal visible={cancelModal} transparent animationType="fade">
                <View style={styles.overlay}>
                    <View style={[styles.modal, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.foreground }]}>Cancel Appointment</Text>
                        <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
                            Please provide a reason for cancellation (optional)
                        </Text>
                        <TextInput
                            style={[styles.modalInput, { color: colors.foreground, borderColor: colors.cardBorder, backgroundColor: colors.background }]}
                            placeholder="Reason..."
                            placeholderTextColor={colors.mutedForeground}
                            value={cancelReason}
                            onChangeText={setCancelReason}
                            multiline
                            numberOfLines={3}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setCancelModal(false)} style={[styles.modalBtn, { backgroundColor: colors.muted }]}>
                                <Text style={{ color: colors.foreground, fontWeight: '600' }}>Back</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleCancel} style={[styles.modalBtn, { backgroundColor: '#ef4444' }]} disabled={actionLoading === 'cancel'}>
                                {actionLoading === 'cancel'
                                    ? <ActivityIndicator size="small" color="#fff" />
                                    : <Text style={{ color: '#fff', fontWeight: '600' }}>Cancel Appointment</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
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
        paddingTop: layout.statusBarHeight,
        paddingBottom: 14, paddingHorizontal: 16,
        borderBottomWidth: 1, gap: 10,
    },
    backBtn: { padding: 4 },
    headerCenter: { flex: 1 },
    headerTitle: { fontSize: 17, fontWeight: '700' },
    badge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
    },
    badgeTxt: { fontSize: 11, fontWeight: '700' },
    scroll: { padding: 16, gap: 14 },
    heroCard: {
        borderRadius: 16, padding: 24,
        alignItems: 'center', gap: 8,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15, shadowRadius: 10, elevation: 5,
    },
    heroDate: { color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' },
    heroTime: { color: 'rgba(255,255,255,0.8)', fontSize: 24, fontWeight: '800' },
    card: {
        borderRadius: 16, borderWidth: 1, padding: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
    },
    cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14 },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 10 },
    infoText: { flex: 1 },
    infoLabel: { fontSize: 12, marginBottom: 2 },
    infoValue: { fontSize: 15, fontWeight: '500' },
    actionsRow: { flexDirection: 'row', gap: 12 },
    actionBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 13, borderRadius: 12,
    },
    actionTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
    // Modal
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
    modal: { borderRadius: 20, padding: 24, gap: 12 },
    modalTitle: { fontSize: 18, fontWeight: '700' },
    modalSub: { fontSize: 14, lineHeight: 20 },
    modalInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: 'top' },
    modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
});

export default AppointmentDetailScreen;
