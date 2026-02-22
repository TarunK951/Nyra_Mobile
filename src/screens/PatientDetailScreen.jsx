import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, ScrollView, TouchableOpacity,
    ActivityIndicator, RefreshControl, Platform, Alert,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { patientApi } from '../api/patients';
import { appointmentApi } from '../api/appointments';
import { callApi } from '../api/calls';
import {
    ChevronLeft, User, Phone, Mail, Calendar, MapPin,
    FileText, Clock, AlertCircle, PhoneCall, MessageSquare,
    Activity, ChevronRight, Heart,
} from 'lucide-react-native';
import { layout } from '../utils/layout';

const InfoRow = ({ icon: Icon, label, value, colors }) => (
    value ? (
        <View style={styles.infoRow}>
            <Icon size={15} color={colors.mutedForeground} />
            <View style={styles.infoText}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
            </View>
        </View>
    ) : null
);

const Section = ({ title, children, colors }) => (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
        {children}
    </View>
);

const PatientDetailScreen = ({ route, navigation }) => {
    const { colors } = useTheme();
    const { patientId, patient: patientProp } = route?.params || {};
    const id = patientId || patientProp?.id;

    const [patient, setPatient] = useState(patientProp || null);
    const [appointments, setAppointments] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(!patientProp);
    const [refreshing, setRefreshing] = useState(false);
    const [aptsLoading, setAptsLoading] = useState(true);

    const fetchPatient = useCallback(async () => {
        if (!id) return;
        try {
            const res = await patientApi.getById(id);
            const data = res.data?.patient || res.data?.data || res.data;
            setPatient(data);
        } catch (e) {
            console.error('[PatientDetail]', e?.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id]);

    const fetchRelated = useCallback(async () => {
        if (!id) return;
        setAptsLoading(true);
        try {
            const [aptsRes, convRes] = await Promise.allSettled([
                appointmentApi.getAll({ patient_id: id, limit: 5 }),
                callApi.getUserConversations(id),
            ]);
            if (aptsRes.status === 'fulfilled') {
                const data = aptsRes.value?.data?.appointments || aptsRes.value?.data?.data || aptsRes.value?.data || [];
                setAppointments(Array.isArray(data) ? data.slice(0, 5) : []);
            }
            if (convRes.status === 'fulfilled') {
                const data = convRes.value?.data?.conversations || convRes.value?.data?.data || convRes.value?.data || [];
                setConversations(Array.isArray(data) ? data.slice(0, 5) : []);
            }
        } catch (e) {
            console.error('[PatientDetail] related', e?.message);
        } finally {
            setAptsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchPatient();
        fetchRelated();
    }, [fetchPatient, fetchRelated]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchPatient();
        fetchRelated();
    };

    const formatDate = (d) => {
        if (!d) return null;
        try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
        catch { return d; }
    };

    const gender = patient?.gender?.charAt(0).toUpperCase() + (patient?.gender?.slice(1).toLowerCase() || '');
    const bloodGroup = patient?.blood_group || patient?.bloodGroup;
    const dob = formatDate(patient?.date_of_birth || patient?.dob || patient?.dateOfBirth);
    const addr = [patient?.address, patient?.city, patient?.state].filter(Boolean).join(', ');

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!patient) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <AlertCircle size={48} color="#ef4444" />
                <Text style={[styles.errorTxt, { color: '#ef4444' }]}>Patient not found</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.btn, { backgroundColor: colors.primary }]}>
                    <Text style={styles.btnTxt}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={22} color={colors.primary} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
                        {patient.name || 'Patient'}
                    </Text>
                    {!!patient.uhid && (
                        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>UHID: {patient.uhid}</Text>
                    )}
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Avatar Hero */}
                <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <View style={[styles.avatarLarge, { backgroundColor: colors.accentSoft }]}>
                        <User size={40} color={colors.primary} />
                    </View>
                    <Text style={[styles.heroName, { color: colors.foreground }]}>{patient.name}</Text>
                    {!!patient.phone && (
                        <Text style={[styles.heroPhone, { color: colors.mutedForeground }]}>{patient.phone}</Text>
                    )}
                    {!!(gender || bloodGroup) && (
                        <View style={styles.heroRow}>
                            {!!gender && (
                                <View style={[styles.pill, { backgroundColor: colors.accentSoft }]}>
                                    <Text style={[styles.pillTxt, { color: colors.primary }]}>{gender}</Text>
                                </View>
                            )}
                            {!!bloodGroup && (
                                <View style={[styles.pill, { backgroundColor: '#fef2f2' }]}>
                                    <Heart size={11} color="#ef4444" />
                                    <Text style={[styles.pillTxt, { color: '#ef4444' }]}>{bloodGroup}</Text>
                                </View>
                            )}
                        </View>
                    )}
                    {/* Quick actions */}
                    <View style={styles.actions}>
                        {!!patient.phone && (
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}
                                onPress={() => Alert.alert('Call', `Call ${patient.phone}?`)}
                            >
                                <PhoneCall size={16} color={colors.primary} />
                                <Text style={[styles.actionTxt, { color: colors.primary }]}>Call</Text>
                            </TouchableOpacity>
                        )}
                        {!!patient.email && (
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#3b82f618', borderColor: '#3b82f640' }]}
                            >
                                <Mail size={16} color="#3b82f6" />
                                <Text style={[styles.actionTxt, { color: '#3b82f6' }]}>Email</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Personal Info */}
                <Section title="Personal Information" colors={colors}>
                    <InfoRow icon={Phone} label="Phone" value={patient.phone} colors={colors} />
                    <InfoRow icon={Mail} label="Email" value={patient.email} colors={colors} />
                    <InfoRow icon={Calendar} label="Date of Birth" value={dob} colors={colors} />
                    <InfoRow icon={Activity} label="Blood Group" value={bloodGroup} colors={colors} />
                    <InfoRow icon={MapPin} label="Address" value={addr || patient.address} colors={colors} />
                    <InfoRow icon={User} label="UHID" value={patient.uhid} colors={colors} />
                </Section>

                {/* Recent Appointments */}
                <Section title={`Recent Appointments (${appointments.length})`} colors={colors}>
                    {aptsLoading ? (
                        <ActivityIndicator color={colors.primary} style={{ margin: 12 }} />
                    ) : appointments.length === 0 ? (
                        <Text style={[styles.emptyLabel, { color: colors.mutedForeground }]}>No appointments found</Text>
                    ) : appointments.map((apt) => {
                        const d = apt.date || apt.appointmentDate || apt.scheduledAt;
                        const dateStr = d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                        return (
                            <View key={apt.id} style={[styles.miniCard, { borderColor: colors.cardBorder }]}>
                                <View style={styles.miniCardLeft}>
                                    <Text style={[styles.miniCardTitle, { color: colors.foreground }]}>
                                        {apt.doctor?.name || apt.doctorName || 'Doctor'}
                                    </Text>
                                    <Text style={[styles.miniCardSub, { color: colors.mutedForeground }]}>
                                        {dateStr}
                                    </Text>
                                </View>
                                <View style={[styles.statusPill, {
                                    backgroundColor: apt.status === 'CONFIRMED' ? '#10b98118' : '#6b728018',
                                }]}>
                                    <Text style={[styles.statusTxt, {
                                        color: apt.status === 'CONFIRMED' ? '#10b981' : '#6b7280'
                                    }]}>{apt.status || '—'}</Text>
                                </View>
                            </View>
                        );
                    })}
                    {appointments.length > 0 && (
                        <TouchableOpacity
                            style={styles.viewAll}
                            onPress={() => navigation.navigate('Appointments')}
                        >
                            <Text style={[styles.viewAllTxt, { color: colors.primary }]}>View All Appointments</Text>
                            <ChevronRight size={14} color={colors.primary} />
                        </TouchableOpacity>
                    )}
                </Section>

                {/* Recent Conversations */}
                <Section title={`Call History (${conversations.length})`} colors={colors}>
                    {conversations.length === 0 ? (
                        <Text style={[styles.emptyLabel, { color: colors.mutedForeground }]}>No call history</Text>
                    ) : conversations.slice(0, 3).map((c, idx) => {
                        const dateStr = c.created_at || c.createdAt
                            ? new Date(c.created_at || c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                            : '—';
                        return (
                            <TouchableOpacity
                                key={c.id || idx}
                                style={[styles.miniCard, { borderColor: colors.cardBorder }]}
                                onPress={() => navigation.navigate('Chat', {
                                    screen: 'ConversationDetail',
                                    params: { conversation: c, conversationId: c.id }
                                })}
                            >
                                <MessageSquare size={14} color={colors.primary} />
                                <View style={[styles.miniCardLeft, { marginLeft: 8 }]}>
                                    <Text style={[styles.miniCardTitle, { color: colors.foreground }]}>
                                        {c.call_type || c.type || 'Call'}
                                    </Text>
                                    <Text style={[styles.miniCardSub, { color: colors.mutedForeground }]}>{dateStr}</Text>
                                </View>
                                <ChevronRight size={14} color={colors.mutedForeground} />
                            </TouchableOpacity>
                        );
                    })}
                </Section>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    errorTxt: { fontSize: 16, textAlign: 'center' },
    btn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
    btnTxt: { color: '#fff', fontWeight: '600' },

    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingTop: layout.statusBarHeight,
        paddingBottom: 14, paddingHorizontal: 16,
        borderBottomWidth: 1, gap: 10,
    },
    backBtn: { padding: 4 },
    headerCenter: { flex: 1 },
    headerTitle: { fontSize: 17, fontWeight: '700' },
    headerSub: { fontSize: 13, marginTop: 2 },

    scroll: { padding: 16, gap: 16 },

    heroCard: {
        borderRadius: 16, borderWidth: 1, padding: 20,
        alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
    },
    avatarLarge: {
        width: 80, height: 80, borderRadius: 40,
        justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    },
    heroName: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
    heroPhone: { fontSize: 15, marginBottom: 10 },
    heroRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
    pill: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
    },
    pillTxt: { fontSize: 13, fontWeight: '600' },
    actions: { flexDirection: 'row', gap: 10 },
    actionBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        borderWidth: 1, borderRadius: 12,
        paddingHorizontal: 16, paddingVertical: 8,
    },
    actionTxt: { fontSize: 14, fontWeight: '600' },

    section: {
        borderRadius: 16, borderWidth: 1, padding: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
    },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14 },

    infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 10 },
    infoText: { flex: 1 },
    infoLabel: { fontSize: 12, marginBottom: 2 },
    infoValue: { fontSize: 15, fontWeight: '500' },

    miniCard: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderRadius: 10,
        padding: 10, marginBottom: 8,
    },
    miniCardLeft: { flex: 1 },
    miniCardTitle: { fontSize: 14, fontWeight: '500' },
    miniCardSub: { fontSize: 12, marginTop: 2 },
    statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
    statusTxt: { fontSize: 11, fontWeight: '600' },

    emptyLabel: { fontSize: 14, textAlign: 'center', paddingVertical: 12 },
    viewAll: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 4, marginTop: 4, paddingVertical: 6,
    },
    viewAllTxt: { fontSize: 13, fontWeight: '600' },
});

export default PatientDetailScreen;
