import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    Platform,
    Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../utils/supabase';

interface UserProfile {
    id: string;
    email: string;
    is_admin: boolean;
    created_at: string;
}

export const UsersScreen: React.FC = () => {
    const navigation = useNavigation();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [confirmation, setConfirmation] = useState<{
        title: string;
        message: string;
        action: () => Promise<void>;
        isDestructive?: boolean;
    } | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const handleToggleAdmin = (user: UserProfile) => {
        const newStatus = !user.is_admin;
        setConfirmation({
            title: 'Confirmar cambio',
            message: `¿Quieres ${newStatus ? 'asignar' : 'quitar'} permisos de Administrador a ${user.email}?`,
            action: async () => {
                try {
                    const { error } = await supabase
                        .from('profiles')
                        .update({ is_admin: newStatus })
                        .eq('id', user.id);

                    if (error) throw error;
                    loadUsers();
                } catch (error) {
                    console.error('Error toggling admin:', error);
                    window.alert('Error: No se pudo actualizar el rol.');
                }
            }
        });
    };

    const handleDeleteUser = (user: UserProfile) => {
        setConfirmation({
            title: 'Eliminar Usuario',
            message: `¿Estás seguro de que quieres eliminar a ${user.email}? Esta acción es irreversible.`,
            isDestructive: true,
            action: async () => {
                try {
                    const { error } = await supabase.rpc('delete_user_by_admin', {
                        target_user_id: user.id,
                    });

                    if (error) throw error;
                    loadUsers();
                } catch (error: any) {
                    console.error('Error deleting user:', error);
                    window.alert(`Error: ${error.message || 'Desconocido'}`);
                }
            }
        });
    };

    const confirmAction = async () => {
        if (!confirmation) return;
        const { action } = confirmation;
        setConfirmation(null); // Close modal
        await action();
    };

    const renderUser = ({ item }: { item: UserProfile }) => (
        <View style={styles.userItem}>
            <View style={styles.userAvatar}>
                <Text style={styles.avatarText}>
                    {item.email?.charAt(0).toUpperCase() || '?'}
                </Text>
            </View>
            <View style={styles.userInfo}>
                <View style={styles.userHeader}>
                    <Text style={styles.userEmail} numberOfLines={1}>
                        {item.email}
                    </Text>
                    {item.is_admin && (
                        <View style={styles.adminBadge}>
                            <Text style={styles.adminBadgeText}>ADMIN</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.userDate}>
                    Registrado: {formatDate(item.created_at)}
                </Text>

                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.actionButton, item.is_admin ? styles.revokeBtn : styles.grantBtn]}
                        onPress={() => handleToggleAdmin(item)}
                    >
                        <Text style={styles.actionText}>
                            {item.is_admin ? 'Quitar Admin' : 'Hacer Admin'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.deleteBtn]}
                        onPress={() => handleDeleteUser(item)}
                    >
                        <Text style={styles.actionText}>🗑️ Eliminar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Volver</Text>
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>👥 Usuarios</Text>
                    <Text style={styles.count}>{users.length} registrados</Text>
                </View>
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={users}
                    renderItem={renderUser}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No hay usuarios registrados</Text>
                    }
                />
            )}

            <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                    💡 Para hacer admin a un usuario, ejecuta en Supabase:
                </Text>
                <Text style={styles.codeText}>
                    UPDATE profiles SET is_admin = true WHERE email = 'email@ejemplo.com';
                </Text>
            </View>

            {/* Custom Modal for Confirmations */}
            <Modal
                transparent={true}
                visible={!!confirmation}
                animationType="fade"
                onRequestClose={() => setConfirmation(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{confirmation?.title}</Text>
                        <Text style={styles.modalMessage}>{confirmation?.message}</Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnCancel]}
                                onPress={() => setConfirmation(null)}
                            >
                                <Text style={styles.modalBtnText}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.modalBtn,
                                    confirmation?.isDestructive ? styles.modalBtnDelete : styles.modalBtnConfirm
                                ]}
                                onPress={confirmAction}
                            >
                                <Text style={styles.modalBtnText}>
                                    {confirmation?.isDestructive ? 'Eliminar' : 'Confirmar'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
    },
    backButton: {
        padding: 5,
        marginRight: 15,
    },
    backButtonText: {
        color: '#FFD700',
        fontSize: 16,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFD700',
    },
    count: {
        fontSize: 14,
        color: '#999',
    },
    list: {
        padding: 20,
        paddingBottom: 120,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
    },
    userAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,215,0,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    avatarText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFD700',
    },
    userInfo: {
        flex: 1,
    },
    userHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '600',
        flex: 1,
    },
    adminBadge: {
        backgroundColor: 'rgba(76, 175, 80, 0.3)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    adminBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    userDate: {
        fontSize: 13,
        color: '#999',
    },
    emptyText: {
        color: '#999',
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
    },
    infoBox: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255,215,0,0.1)',
        borderRadius: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
    },
    infoText: {
        color: '#FFD700',
        fontSize: 12,
        marginBottom: 8,
    },
    codeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontFamily: 'monospace',
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 8,
        borderRadius: 6,
    },
    actionRow: {
        flexDirection: 'row',
        marginTop: 10,
        gap: 10,
    },
    actionButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    grantBtn: {
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    revokeBtn: {
        backgroundColor: 'rgba(255, 193, 7, 0.2)',
        borderWidth: 1,
        borderColor: '#FFC107',
    },
    deleteBtn: {
        backgroundColor: 'rgba(244, 67, 54, 0.2)',
        borderWidth: 1,
        borderColor: '#F44336',
    },
    actionText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1E293B', // Slate 800
        padding: 25,
        borderRadius: 15,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 10,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 16,
        color: '#CBD5E1', // Slate 300
        marginBottom: 25,
        textAlign: 'center',
        lineHeight: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 15,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalBtnCancel: {
        backgroundColor: '#475569', // Slate 600
    },
    modalBtnConfirm: {
        backgroundColor: '#4CAF50', // Green
    },
    modalBtnDelete: {
        backgroundColor: '#EF4444', // Red 500
    },
    modalBtnText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
