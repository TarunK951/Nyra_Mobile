import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { MessageSquare, PhoneCall, Calendar } from 'lucide-react-native';
import { callApi } from '../api/calls';

const ConversationsScreen = () => {
    const { colors } = useTheme();
    const [loading, setLoading] = useState(true);
    const [conversations, setConversations] = useState([]);

    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        try {
            const response = await callApi.getConversations().catch(() => ({ data: [] }));
            setConversations(response.data || []);
        } catch (error) {
            console.error("Error fetching conversations:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <MessageSquare size={48} color={colors.primary} />
                    <Text style={[styles.title, { color: colors.foreground }]}>Conversations</Text>
                    <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                        AI-powered transcripts and patient interactions.
                    </Text>
                </View>

                {loading ? (
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : conversations.length > 0 ? (
                    conversations.map((conv, index) => (
                        <View key={index} style={[styles.convCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                            <View style={[styles.iconContainer, { backgroundColor: colors.accentSoft }]}>
                                {conv.type === 'call' ? (
                                    <PhoneCall size={20} color={colors.primary} />
                                ) : (
                                    <MessageSquare size={20} color={colors.primary} />
                                )}
                            </View>
                            <View style={styles.convContent}>
                                <Text style={[styles.convTitle, { color: colors.foreground }]}>
                                    {conv.recipientName || 'Unknown Patient'}
                                </Text>
                                <Text style={[styles.convPreview, { color: colors.mutedForeground }]} numberOfLines={1}>
                                    {conv.lastMessage || 'Ongoing interaction...'}
                                </Text>
                            </View>
                            <View style={styles.timeContainer}>
                                <Text style={[styles.convTime, { color: colors.mutedForeground }]}>
                                    {new Date(conv.updatedAt || Date.now()).toLocaleDateString()}
                                </Text>
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                        <Text style={[styles.cardText, { color: colors.mutedForeground }]}>
                            Conversations will appear here once integrated with the backend WebSocket and API.
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        marginTop: 15,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },
    card: {
        width: '100%',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 150,
    },
    cardText: {
        textAlign: 'center',
        fontSize: 15,
        lineHeight: 22,
    },
    convCard: {
        width: '100%',
        flexDirection: 'row',
        padding: 15,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    convContent: {
        flex: 1,
        justifyContent: 'center',
    },
    convTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    convPreview: {
        fontSize: 14,
    },
    timeContainer: {
        marginLeft: 10,
        justifyContent: 'center',
    },
    convTime: {
        fontSize: 12,
    },
});

export default ConversationsScreen;
