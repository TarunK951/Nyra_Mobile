import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import * as LucideIcons from 'lucide-react-native';

const ModuleScreen = ({ route }) => {
    const { colors } = useTheme();
    const title = route?.params?.title || 'Feature';
    const iconName = route?.params?.icon || 'Layout';

    const Icon = LucideIcons[iconName] || LucideIcons.Layout;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.accentSoft }]}>
                        <Icon size={40} color={colors.primary} />
                    </View>
                    <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
                    <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                        This module is being integrated. Check back soon for full functionality.
                    </Text>
                </View>

                <View style={[styles.placeholderCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <Text style={[styles.cardText, { color: colors.mutedForeground }]}>
                        All hospital data for {title} will be synchronized with the NyraAI core server.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
        alignItems: 'center',
        paddingTop: 60,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    placeholderCard: {
        width: '100%',
        padding: 30,
        borderRadius: 20,
        borderWidth: 1,
        borderStyle: 'dashed',
        alignItems: 'center',
    },
    cardText: {
        textAlign: 'center',
        fontSize: 15,
    }
});

export default ModuleScreen;
