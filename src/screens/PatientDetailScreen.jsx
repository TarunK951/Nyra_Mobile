import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, ScrollView, TouchableOpacity,
    ActivityIndicator, RefreshControl, Platform, Alert, Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeContext';
import { patientApi } from '../api/patients';
import { appointmentApi } from '../api/appointments';
import { callApi } from '../api/calls';
import {
    ChevronLeft, User, Phone, Mail, Calendar, MapPin,
    AlertCircle, PhoneCall, MessageSquare,
    Activity, ChevronRight, Heart,
} from 'lucide-react-native';
import LiquidGlass from '../components/LiquidGlass';
import LiquidButton from '../components/LiquidButton';
import { layout } from '../utils/layout';
import { useStagger, useScalePressAnim, SPRING } from '../utils/animations';

const InfoRow = ({ icon: Icon, label, value, colors }) => (
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
    ) : null
);

const Section = ({ title, children, colors, anim }) => {
    const g = colors.glass;
    return (
        <Animated.View style={anim ? { opacity: anim.opacity, transform: [{ translateY: anim.translateY }] } : {}}>
            <LiquidGlass
                intensity={g.blur}
                tint={g.tint}
                containerStyle={styles.section}
                padding={20}
            >
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>{title}</Text>
                {children}
            </LiquidGlass>
        </Animated.View>
    );
};

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
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!patient) {
        return (
            <View style={styles.center}>
                <AlertCircle size={48} color="#ef4444" />
                <Text style={[styles.errorTxt, { color: '#ef4444' }]}>Patient not found</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.btn, { backgroundColor: colors.primary }]}>
                    <Text style={styles.btnTxt}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const staggerAnims = useStagger(6, 80);
    const g = colors.glass;
    const { scale: callScale, pressIn: callIn, pressOut: callOut } = useScalePressAnim();
    const { scale: mailScale, pressIn: mailIn, pressOut: mailOut } = useScalePressAnim();

    return (
        <View style={styles.container}>
            {/* Glass Header */}
            <LiquidGlass
                intensity={g.blurStrong}
                tint={g.tint}
                padding={0}
                containerStyle={styles.header}
                style={{ flexDirection: 'row', alignItems: 'center' }}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.muted }]}>
                    <ChevronLeft size={22} color={colors.foreground} strokeWidth={2.5} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
                        Patient Detail
                    </Text>
                    {!!patient.uhid && (
                        <Text style={[styles.headerSub, { color: colors.primary }]}>UHID: {patient.uhid}</Text>
                    )}
                </View>
            </LiquidGlass>

            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Avatar Hero */}
                <Animated.View style={staggerAnims[0] ? { opacity: staggerAnims[0].opacity, transform: [{ translateY: staggerAnims[0].translateY }] } : {}}>
                    <LiquidGlass
                        intensity={g.blurStrong}
                        tint={g.tint}
                        containerStyle={styles.heroCard}
                        padding={26}
                        style={{ alignItems: 'center' }}
                    >
                        <View style={[styles.avatarLarge, { backgroundColor: colors.primary + '12' }]}>
                            <User size={44} color={colors.primary} strokeWidth={2.5} />
                        </View>
                        <Text style={[styles.heroName, { color: colors.foreground }]}>{patient.name}</Text>
                        {!!patient.phone && (
                            <Text style={[styles.heroPhone, { color: colors.mutedForeground }]}>{patient.phone}</Text>
                        )}
                        <View style={styles.heroRow}>
                            <View style={[styles.pill, { backgroundColor: colors.primary + '10' }]}>
                                <Text style={[styles.pillTxt, { color: colors.primary }]}>{gender || 'N/A'}</Text>
                            </View>
                            <View style={[styles.pill, { backgroundColor: colors.error + '10' }]}>
                                <Heart size={12} color={colors.error} strokeWidth={3} />
                                <Text style={[styles.pillTxt, { color: colors.error }]}>{bloodGroup || 'O+'}</Text>
                            </View>
                        </View>

                        {/* Quick actions */}
                        <View style={styles.actions}>
                            <LiquidButton
                                variant="primary"
                                text="Call"
                                icon={PhoneCall}
                                onPress={() => Alert.alert('Call', `Call ${patient.phone}?`)}
                                style={{ minWidth: 120 }}
                            />
                            <LiquidButton
                                variant="glass"
                                text="Email"
                                icon={Mail}
                                onPress={() => { }}
                                style={{ minWidth: 120 }}
                            />
                        </View>
                    </LiquidGlass>
                </Animated.View>

                {/* Personal Info */}
                <Section title="Personal Information" colors={colors} anim={staggerAnims[1]}>
                    <InfoRow icon={Phone} label="Phone" value={patient.phone} colors={colors} />
                    <InfoRow icon={Mail} label="Email" value={patient.email} colors={colors} />
                    <InfoRow icon={Calendar} label="Date of Birth" value={dob} colors={colors} />
                    <InfoRow icon={Activity} label="Blood Group" value={bloodGroup} colors={colors} />
                    <InfoRow icon={MapPin} label="Address" value={addr || patient.address} colors={colors} />
                    <InfoRow icon={User} label="UHID" value={patient.uhid} colors={colors} />
                </Section>

                {/* Recent Appointments */}
                <Section title={`Recent Appointments`} colors={colors} anim={staggerAnims[2]}>
                    {aptsLoading ? (
                        <ActivityIndicator color={colors.primary} style={{ margin: 12 }} />
                    ) : appointments.length === 0 ? (
                        <Text style={[styles.emptyLabel, { color: colors.mutedForeground }]}>No appointments found</Text>
                    ) : appointments.map((apt) => {
                        const d = apt.date || apt.appointmentDate || apt.scheduledAt;
                        const dateStr = d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                        return (
                            <View key={apt.id} style={[styles.miniCard, { backgroundColor: colors.muted, borderColor: g.borderSubtle }]}>
                                <View style={styles.miniCardLeft}>
                                    <Text style={[styles.miniCardTitle, { color: colors.foreground }]}>
                                        {apt.doctor?.name || apt.doctorName || 'Doctor'}
                                    </Text>
                                    <Text style={[styles.miniCardSub, { color: colors.mutedForeground }]}>
                                        {dateStr}
                                    </Text>
                                </View>
                                <View style={[styles.statusBadge, {
                                    backgroundColor: apt.status === 'CONFIRMED' ? colors.success + '20' : colors.muted,
                                }]}>
                                    <Text style={[styles.statusTxt, {
                                        color: apt.status === 'CONFIRMED' ? colors.success : colors.mutedForeground
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
                            <ChevronRight size={14} color={colors.primary} strokeWidth={2.5} />
                        </TouchableOpacity>
                    )}
                </Section>

                {/* Recent Conversations */}
                <Section title={`Call History`} colors={colors} anim={staggerAnims[3]}>
                    {conversations.length === 0 ? (
                        <Text style={[styles.emptyLabel, { color: colors.mutedForeground }]}>No call history</Text>
                    ) : conversations.slice(0, 3).map((c, idx) => {
                        const dateStr = c.created_at || c.createdAt
                            ? new Date(c.created_at || c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                            : '—';
                        return (
                            <TouchableOpacity
                                key={c.id || idx}
                                style={[styles.miniCard, { backgroundColor: colors.muted, borderColor: g.borderSubtle }]}
                                onPress={() => navigation.navigate('Chat', {
                                    screen: 'ConversationDetail',
                                    params: { conversation: c, conversationId: c.id }
                                })}
                            >
                                <View style={styles.iconBox}>
                                    <MessageSquare size={14} color={colors.primary} />
                                </View>
                                <View style={[styles.miniCardLeft, { marginLeft: 8 }]}>
                                    <Text style={[styles.miniCardTitle, { color: colors.foreground }]}>
                                        {c.call_type || c.type || 'Inbound Call'}
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
        paddingTop: layout.statusBarHeight + 4, paddingBottom: 14, paddingHorizontal: 16,
        borderBottomWidth: 1, gap: 12, overflow: 'hidden',
    },
    backBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    headerCenter: { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
    headerSub: { fontSize: 13, fontWeight: '700', marginTop: 1 },

    scroll: { padding: 20, gap: 18 },

    heroCard: {
        borderRadius: 30, borderWidth: 1, padding: 26,
        alignItems: 'center', overflow: 'hidden',
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 20 }, android: { elevation: 6 } })
    },
    avatarLarge: {
        width: 84, height: 84, borderRadius: 24,
        justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    },
    heroName: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
    heroPhone: { fontSize: 15, fontWeight: '600', opacity: 0.6, marginBottom: 14 },
    heroRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
    pill: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
    },
    pillTxt: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
    actions: { flexDirection: 'row', gap: 14 },
    actionBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12, minWidth: 100,
        justifyContent: 'center',
    },
    actionTxt: { fontSize: 14, fontWeight: '800' },

    section: {
        borderRadius: 26, borderWidth: 1, padding: 20, overflow: 'hidden',
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16 }, android: { elevation: 4 } })
    },
    secShimmer: { position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, opacity: 0.8 },
    sectionTitle: { fontSize: 12, fontWeight: '900', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },

    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
    infoIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    infoText: { flex: 1 },
    infoLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.6 },
    infoValue: { fontSize: 15, fontWeight: '700', marginTop: 1 },

    miniCard: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderRadius: 14,
        padding: 12, marginBottom: 10,
    },
    iconBox: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    miniCardLeft: { flex: 1 },
    miniCardTitle: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
    miniCardSub: { fontSize: 12, fontWeight: '600', opacity: 0.6, marginTop: 1 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusTxt: { fontSize: 11, fontWeight: '800' },

    emptyLabel: { fontSize: 14, fontWeight: '600', textAlign: 'center', paddingVertical: 12, opacity: 0.5 },
    viewAll: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, marginTop: 10, paddingVertical: 8,
    },
    viewAllTxt: { fontSize: 14, fontWeight: '800' },
});

export default PatientDetailScreen;
