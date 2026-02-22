import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity, TextInput,
    ScrollView, KeyboardAvoidingView, Platform, Dimensions,
    ActivityIndicator, Modal, SafeAreaView, Image, Animated
} from 'react-native';
import {
    X, Send, Zap, PhoneCall, MessageSquare,
    User, ChevronRight, LayoutDashboard, Bot, History
} from 'lucide-react-native';
import { Video, ResizeMode } from 'expo-av';
import { USE_NATIVE } from '../../utils/animations';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { aiApi } from '../../api/ai';
import { callApi } from '../../api/calls';
import { patientApi } from '../../api/patients';
import { appointmentApi } from '../../api/appointments';
import {
    getGreeting, getSuggestionChips, processIntent, extractEntities,
    handleIntent, tryPatientLookup, normalizeRole, filterActionsByRole,
    getPageName, INTENTS,
} from './AiAssistant';

const { width } = Dimensions.get('window');

// ─── Animated FAB Brain Avatar ────────────────
export const NyraAvatar = ({ size = 44, color }) => {
    return (
        <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
            <View style={StyleSheet.absoluteFill}>
                <Video
                    source={{ uri: 'https://res.cloudinary.com/duh3toy4g/video/upload/v1770877221/grok-video-3d077b4f-a502-4a2f-83bb-6519bed21f5f_esrhms.mp4' }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay
                    isLooping
                    isMuted
                />
            </View>
            <Bot size={size * 0.6} color="#6366f1" strokeWidth={1.5} opacity={0.6} />
        </View>
    );
};

// ─── Message Bubble ────────────────────────────
const MessageBubble = ({ message, colors, onActionPress }) => {
    const isAi = message.role === 'assistant';
    return (
        <View style={[styles.messageRow, isAi ? styles.aiRow : styles.userRow]}>
            {isAi && (
                <View style={[styles.avatarSmall, { backgroundColor: '#000' }]}>
                    <NyraAvatar size={24} />
                </View>
            )}
            <View style={styles.bubbleCol}>
                <View style={[
                    styles.bubble,
                    isAi
                        ? { backgroundColor: colors.muted || '#f4f4f5' }
                        : { backgroundColor: colors.primary }
                ]}>
                    <Text style={[styles.bubbleText, { color: isAi ? colors.foreground : '#fff' }]}>
                        {message.content}
                    </Text>
                </View>
                {isAi && message.actions && message.actions.length > 0 && (
                    <View style={styles.actionsRow}>
                        {message.actions.map((action, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[styles.actionBtn, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}
                                onPress={() => onActionPress && onActionPress(action)}
                            >
                                <ChevronRight size={13} color={colors.primary} />
                                <Text style={[styles.actionBtnText, { color: colors.primary }]}>{action.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
                {/* Call flow type buttons */}
                {isAi && message.callButtons && (
                    <View style={styles.actionsRow}>
                        {message.callButtons.map((btn, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[styles.callBtn, { backgroundColor: colors.primary }]}
                                onPress={() => btn.onPress()}
                            >
                                <PhoneCall size={13} color="#fff" />
                                <Text style={styles.callBtnText}>{btn.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
                {/* Patient match list buttons */}
                {isAi && message.patientButtons && (
                    <View style={styles.actionsCol}>
                        {message.patientButtons.map((btn, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[styles.patientBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                                onPress={() => btn.onPress()}
                            >
                                <User size={14} color={colors.primary} />
                                <Text style={[styles.patientBtnText, { color: colors.foreground }]}>{btn.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
};

// ─── Main ChatOverlay ──────────────────────────
const ChatOverlay = ({ visible, onClose, currentScreen }) => {
    const { user } = useAuth();
    const { colors, setTheme } = useTheme();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [callFlow, setCallFlow] = useState(null); // { step: 'PHONE'|'TYPE', data: { phone?, name? } }
    const [stats, setStats] = useState({
        todayApts: 0, tomorrowApts: 0, totalPatients: 0, totalDoctors: 0,
        pendingApts: 0, completedApts: 0, totalRevenue: 0, totalRevenueToday: 0,
        time: new Date().toLocaleTimeString(), date: new Date().toLocaleDateString(),
    });
    const [patients, setPatients] = useState([]);
    const scrollRef = useRef();

    // Fetch stats and patients on open
    useEffect(() => {
        if (visible) {
            fetchStats();
            if (messages.length === 0) {
                pushBot(buildInitialGreeting(currentScreen));
            }
        }
    }, [visible]);

    const fetchStats = async () => {
        try {
            const [aptsRes, patientsRes] = await Promise.allSettled([
                appointmentApi.getAll({ date: new Date().toISOString().split('T')[0] }),
                patientApi.getAll({ limit: 100 }),
            ]);
            if (aptsRes.status === 'fulfilled') {
                const apts = aptsRes.value?.data?.appointments || aptsRes.value?.data || [];
                setStats(s => ({
                    ...s,
                    todayApts: apts.length,
                    pendingApts: apts.filter(a => a.status === 'PENDING' || a.status === 'pending').length,
                    completedApts: apts.filter(a => a.status === 'COMPLETED' || a.status === 'completed').length,
                }));
            }
            if (patientsRes.status === 'fulfilled') {
                const data = patientsRes.value?.data?.patients || patientsRes.value?.data || [];
                setPatients(Array.isArray(data) ? data : []);
                setStats(s => ({ ...s, totalPatients: Array.isArray(data) ? data.length : 0 }));
            }
        } catch (_) { }
    };

    const buildInitialGreeting = (screen) => {
        const pageName = getPageName(screen);
        const greeting = getGreeting();
        const name = user?.name || 'there';
        const greetings = [
            `Hello ${name}! ${greeting}. Welcome to **${pageName}**. How can I assist you today?`,
            `Hi ${name}, you are now viewing **${pageName}**. Need help finding anything?`,
            `Welcome back, ${name}. I've synchronized the latest data for **${pageName}**.`,
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    };

    const pushBot = useCallback((content, extras = {}) => {
        setMessages(prev => [...prev, {
            id: Date.now() + Math.random(),
            role: 'assistant',
            content,
            ...extras,
        }]);
    }, []);

    const pushUser = useCallback((content) => {
        setMessages(prev => [...prev, {
            id: Date.now() + Math.random(),
            role: 'user',
            content,
        }]);
    }, []);

    // ── Call Flow Handler ──────────────────────
    const handleCallFlow = async (input) => {
        const digits = input.replace(/\D/g, '');
        const isPhone = /^\d{7,15}$/.test(digits);

        if (!callFlow || callFlow.step === 'PHONE') {
            // Try to find phone: from digits or from patient name
            let phone = null;
            let foundName = null;

            if (isPhone) {
                phone = digits;
            } else {
                // Try name lookup
                const matched = tryPatientLookup(input, patients);
                if (matched && matched.length === 1) {
                    phone = (matched[0].phone || '').replace(/\D/g, '');
                    foundName = matched[0].name;
                }
            }

            if (phone) {
                setCallFlow({ step: 'TYPE', data: { phone, name: foundName } });
                pushBot(
                    `I found ${foundName ? `**${foundName}**` : `the number **${phone}**`}. Is this a **Reminder** or **Feedback** call?`,
                    {
                        callButtons: [
                            { label: 'Reminder Call', onPress: () => handleSend('Reminder') },
                            { label: 'Feedback Call', onPress: () => handleSend('Feedback') },
                        ]
                    }
                );
            } else {
                setCallFlow({ step: 'PHONE', data: {} });
                pushBot(`Sure, I can make a call. Who would you like to call? Please enter the **phone number** (10 digits).`);
            }
            return true;
        }

        if (callFlow.step === 'TYPE') {
            // If they sent a phone number, update it
            if (isPhone) {
                setCallFlow({ step: 'TYPE', data: { ...callFlow.data, phone: digits } });
                pushBot(
                    `Got it (**${digits}**). Should this be a **Reminder Call** or **Feedback Call**?`,
                    {
                        callButtons: [
                            { label: 'Reminder Call', onPress: () => handleSend('Reminder') },
                            { label: 'Feedback Call', onPress: () => handleSend('Feedback') },
                        ]
                    }
                );
                return true;
            }

            const lower = input.toLowerCase();
            const phone = callFlow.data.phone;
            const name = callFlow.data.name;

            if (lower.includes('reminder')) {
                try {
                    await callApi.testReminderCall(phone);
                    pushBot(`✅ **Reminder Call** initiated for ${name || phone}.`);
                } catch {
                    pushBot(`❌ Failed to initiate the call. Please try again.`);
                }
                setCallFlow(null);
                return true;
            }

            if (lower.includes('feedback')) {
                try {
                    await callApi.testFeedbackCall(phone);
                    pushBot(`✅ **Feedback Call** initiated for ${name || phone}.`);
                } catch {
                    pushBot(`❌ Failed to initiate the call. Please try again.`);
                }
                setCallFlow(null);
                return true;
            }

            // Unrecognised – re-prompt
            pushBot(
                `I didn't catch that. Please choose **Reminder** or **Feedback** call for ${name || phone}.`,
                {
                    callButtons: [
                        { label: 'Reminder Call', onPress: () => handleSend('Reminder') },
                        { label: 'Feedback Call', onPress: () => handleSend('Feedback') },
                    ]
                }
            );
            return true;
        }

        return false;
    };

    // ── Main Send Handler ──────────────────────
    const handleSend = async (content = inputText) => {
        const text = (content || '').trim();
        if (!text) return;

        pushUser(text);
        setInputText('');
        setIsThinking(true);

        try {
            // 1. Active call flow
            if (callFlow || /\b(call|ring)\b/i.test(text)) {
                if (callFlow || /\b(call|ring)\b/i.test(text)) {
                    const handled = await handleCallFlow(text);
                    if (handled) { setIsThinking(false); return; }
                }
            }

            // 2. Direct patient lookup (no call keyword)
            if (!/\b(call|ring)\b/i.test(text)) {
                const matches = tryPatientLookup(text, patients);
                if (matches && matches.length > 0) {
                    if (matches.length === 1) {
                        const p = matches[0];
                        pushBot(
                            `I found **${p.name}** (${p.phone || 'No phone'}).`,
                            { actions: [{ label: 'View Profile', screen: 'Patients' }] }
                        );
                    } else {
                        pushBot(
                            `I found **${matches.length}** patients with similar details. Please select one:`,
                            {
                                patientButtons: matches.map(p => ({
                                    label: `${p.name} (···${(p.phone || '').slice(-4)})`,
                                    onPress: () => pushBot(`**${p.name}** — Phone: ${p.phone || 'N/A'}`, { actions: [{ label: 'View Profile', screen: 'Patients' }] }),
                                }))
                            }
                        );
                    }
                    setIsThinking(false);
                    return;
                }
            }

            // 3. Try backend LLM
            try {
                const apiResponse = await aiApi.chat({
                    query: text,
                    userRole: user?.role || 'DOCTOR',
                    context: {
                        page: getPageName(currentScreen),
                        stats,
                        history: messages.slice(-5).map(m => ({ role: m.role, content: m.content })),
                    },
                });
                const reply = apiResponse?.data?.response || apiResponse?.data?.message;
                if (reply) {
                    const role = normalizeRole(user?.role);
                    const roleActions = getRoleActions(role);
                    pushBot(reply, { actions: filterActionsByRole(roleActions, role) });
                    setIsThinking(false);
                    return;
                }
            } catch (_) { /* LLM unavailable – fall through to local engine */ }

            // 4. Local intent engine
            const intent = processIntent(text);
            const entities = extractEntities(text);
            const result = handleIntent({ intent, entities, user, stats, setTheme });
            pushBot(result.text, { actions: result.actions || [] });

        } catch (error) {
            console.error('Chat error', error);
            pushBot(`Sorry, I'm having trouble connecting. How can I assist you otherwise?`);
        } finally {
            setIsThinking(false);
        }
    };

    const getRoleActions = (role) => {
        const map = {
            SUPER_ADMIN: [
                { label: 'Hospital Management', screen: 'Overview', resource: 'all_hospitals' },
                { label: 'System Config', screen: 'Profile', resource: 'system_config' },
                { label: 'Support Tickets', screen: 'Profile', resource: 'support_tickets' },
            ],
            ADMIN: [
                { label: 'Revenue Tracking', screen: 'Overview', resource: 'revenue' },
                { label: 'Staff Management', screen: 'Profile', resource: 'staff_management' },
                { label: 'Patient Stats', screen: 'Patients', resource: 'patients' },
            ],
            MANAGER: [
                { label: 'Branch Schedule', screen: 'Chat', resource: 'appointments' },
                { label: 'Inventory', screen: 'Overview', resource: 'medications' },
            ],
            RECEPTIONIST: [
                { label: 'Patient Check-in', screen: 'Chat', resource: 'appointments' },
                { label: 'New Registration', screen: 'Patients', resource: 'patient_registration' },
                { label: 'Invoices', screen: 'Chat', resource: 'invoices' },
            ],
            DOCTOR: [
                { label: 'My Schedule', screen: 'Chat', resource: 'my_schedule' },
                { label: 'Patient Records', screen: 'Patients', resource: 'medical_sheets' },
            ],
        };
        return map[role] || map['DOCTOR'];
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>

                    {/* ── Header ── */}
                    <View style={[styles.header, { borderBottomColor: colors.border + '12' }]}>
                        <View style={styles.headerLeft}>
                            <NyraAvatar size={44} />
                            <View style={{ marginLeft: 6 }}>
                                <Text style={[styles.headerTitle, { color: colors.foreground }]}>Nyra AI</Text>
                                <View style={styles.statusRow}>
                                    <View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
                                    <Text style={[styles.headerSub, { color: colors.mutedForeground, opacity: 0.8 }]}>CLINICAL CO-PILOT</Text>
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
                            <X size={20} color={colors.foreground} strokeWidth={3} />
                        </TouchableOpacity>
                    </View>

                    {/* ── Messages ── */}
                    <ScrollView
                        ref={scrollRef}
                        style={styles.flex}
                        contentContainerStyle={styles.scrollContent}
                        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
                        keyboardShouldPersistTaps="handled"
                    >
                        {messages.map(msg => (
                            <MessageBubble
                                key={msg.id}
                                message={msg}
                                colors={colors}
                                onActionPress={(action) => {
                                    // Could navigate to screen here via navigation prop if needed
                                }}
                            />
                        ))}
                        {isThinking && (
                            <View style={styles.thinkingRow}>
                                <ActivityIndicator size="small" color={colors.primary} />
                                <Text style={[styles.thinkingText, { color: colors.mutedForeground }]}>Nyra is thinking...</Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* ── Suggestion Chips ── */}
                    {!isThinking && messages.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContent}>
                            {getSuggestionChips(user?.role || 'DOCTOR').map((chip, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={[styles.chip, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '20' }]}
                                    onPress={() => handleSend(chip)}
                                >
                                    <Text style={[styles.chipText, { color: colors.primary }]}>{chip}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}

                    {/* ── Input Bar ── */}
                    <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]}
                            placeholder="Ask Nyra AI..."
                            placeholderTextColor={colors.mutedForeground}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            onSubmitEditing={() => handleSend()}
                            returnKeyType="send"
                        />
                        <TouchableOpacity
                            style={[styles.sendBtn, { backgroundColor: inputText.trim() ? colors.primary : colors.muted }]}
                            onPress={() => handleSend()}
                            disabled={!inputText.trim()}
                        >
                            <Send size={18} color={inputText.trim() ? '#fff' : colors.mutedForeground} />
                        </TouchableOpacity>
                    </View>

                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    flex: { flex: 1 },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: -1 },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
    headerSub: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    closeBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

    // Messages
    scrollContent: { paddingHorizontal: 16, paddingVertical: 20 },
    messageRow: { flexDirection: 'row', marginBottom: 18, maxWidth: '88%' },
    aiRow: { alignSelf: 'flex-start' },
    userRow: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
    avatarSmall: {
        width: 24, height: 24, borderRadius: 12,
        overflow: 'hidden',
        marginRight: 10, marginTop: 4,
    },
    bubbleCol: { flex: 1 },
    bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
    bubbleText: { fontSize: 13.5, lineHeight: 20 },

    // Actions
    actionsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 6 },
    actionsCol: { marginTop: 8 },
    actionBtn: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 6, paddingHorizontal: 12,
        borderRadius: 14, borderWidth: 1, marginRight: 6, marginBottom: 4,
    },
    actionBtnText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
    callBtn: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 8, paddingHorizontal: 14,
        borderRadius: 20, marginRight: 8,
    },
    callBtnText: { color: '#fff', fontSize: 13, fontWeight: '600', marginLeft: 5 },
    patientBtn: {
        flexDirection: 'row', alignItems: 'center',
        padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 6,
    },
    patientBtnText: { fontSize: 14, marginLeft: 8 },

    // Thinking
    thinkingRow: { flexDirection: 'row', alignItems: 'center', padding: 8 },
    thinkingText: { fontSize: 13, marginLeft: 8, fontStyle: 'italic' },

    // Chips
    chipsScroll: { maxHeight: 50 },
    chipsContent: { paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
    chip: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 7, paddingHorizontal: 13,
        borderRadius: 20, borderWidth: 1, marginRight: 8,
    },
    chipText: { fontSize: 12, fontWeight: '500' },

    // Input
    inputBar: {
        flexDirection: 'row', alignItems: 'flex-end',
        padding: 12, borderTopWidth: 1,
    },
    input: {
        flex: 1, borderRadius: 22,
        paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10,
        fontSize: 14, maxHeight: 100,
    },
    sendBtn: {
        width: 42, height: 42, borderRadius: 21,
        justifyContent: 'center', alignItems: 'center', marginLeft: 10,
    },
});

export default ChatOverlay;
