import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    ActivityIndicator,
    TextInput,
    TouchableOpacity,
    SafeAreaView
} from 'react-native';
import { patientApi } from '../api/patients';
import { useTheme } from '../theme/ThemeContext';
import { Search, User, Phone, ChevronRight } from 'lucide-react-native';

const PatientListScreen = () => {
    const { colors } = useTheme();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async (query = '') => {
        setLoading(true);
        try {
            // patientApi.search doesn't exist — getAll() accepts a `search` param
            const params = query ? { search: query } : {};
            const response = await patientApi.getAll(params);
            const raw = response.data?.patients || response.data?.data || response.data || [];
            setPatients(Array.isArray(raw) ? raw : []);
        } catch (error) {
            console.error('Error fetching patients', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.patientCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder }
            ]}
        >
            <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
                <User color={colors.primary} size={24} />
            </View>
            <View style={styles.patientInfo}>
                <Text style={[styles.patientName, { color: colors.foreground }]}>{item.name || 'Unknown Patient'}</Text>
                <View style={styles.detailRow}>
                    <Phone size={14} color={colors.mutedForeground} />
                    <Text style={[styles.patientPhone, { color: colors.mutedForeground }]}>{item.phone || 'No phone'}</Text>
                </View>
            </View>
            <ChevronRight size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <View style={[styles.searchBar, { backgroundColor: colors.muted }]}>
                    <Search size={18} color={colors.mutedForeground} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.foreground }]}
                        placeholder="Search patients..."
                        placeholderTextColor={colors.mutedForeground}
                        value={searchQuery}
                        onChangeText={(text) => {
                            setSearchQuery(text);
                            fetchPatients(text);
                        }}
                    />
                </View>
            </View>

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator color={colors.primary} size="large" />
                </View>
            ) : (
                <FlatList
                    data={patients}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No patients found</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 15,
        borderBottomWidth: 1,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 45,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    listContainer: {
        padding: 15,
    },
    patientCard: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    patientInfo: {
        flex: 1,
    },
    patientName: {
        fontSize: 17,
        fontWeight: '600',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    patientPhone: {
        fontSize: 14,
        marginLeft: 6,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        fontSize: 16,
    },
});

export default PatientListScreen;
