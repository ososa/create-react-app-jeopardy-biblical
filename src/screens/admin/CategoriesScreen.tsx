import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    Modal,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../utils/supabase';
import { useAdmin, Category } from '../../context/AdminContext';

export const CategoriesScreen: React.FC = () => {
    const navigation = useNavigation();
    const { categories, refreshCategories } = useAdmin();
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('📖');

    const icons = ['📖', '🌍', '🔥', '👑', '✝️', '📜', '📢', '⭐', '🙏', '💒', '🕊️', '🎺'];

    useEffect(() => {
        refreshCategories();
    }, []);

    const openAddModal = () => {
        setEditingCategory(null);
        setName('');
        setIcon('📖');
        setShowModal(true);
    };

    const openEditModal = (category: Category) => {
        setEditingCategory(category);
        setName(category.name);
        setIcon(category.icon);
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'El nombre es requerido');
            return;
        }

        setIsLoading(true);
        try {
            if (editingCategory) {
                const { error } = await supabase
                    .from('categories')
                    .update({ name: name.trim(), icon })
                    .eq('id', editingCategory.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('categories')
                    .insert({ name: name.trim(), icon });
                if (error) throw error;
            }

            await refreshCategories();
            setShowModal(false);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (category: Category) => {
        Alert.alert(
            'Eliminar Categoría',
            `¿Estás seguro de eliminar "${category.name}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('categories')
                                .delete()
                                .eq('id', category.id);
                            if (error) throw error;
                            await refreshCategories();
                        } catch (error: any) {
                            Alert.alert('Error', error.message);
                        }
                    },
                },
            ]
        );
    };

    const renderCategory = ({ item }: { item: Category }) => (
        <View style={styles.categoryItem}>
            <View style={styles.categoryInfo}>
                <Text style={styles.categoryIcon}>{item.icon}</Text>
                <Text style={styles.categoryName}>{item.name}</Text>
            </View>
            <View style={styles.categoryActions}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => openEditModal(item)}
                >
                    <Text style={styles.actionButtonText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(item)}
                >
                    <Text style={styles.actionButtonText}>🗑️</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Volver</Text>
                </TouchableOpacity>
                <Text style={styles.title}>📂 Categorías</Text>
                <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                    <LinearGradient
                        colors={['#4CAF50', '#45A049']}
                        style={styles.addButtonGradient}
                    >
                        <Text style={styles.addButtonText}>+ Agregar</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <FlatList
                data={categories}
                renderItem={renderCategory}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No hay categorías. ¡Agrega una!</Text>
                }
            />

            <Modal visible={showModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                        </Text>

                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Nombre de la categoría"
                            placeholderTextColor="#999"
                        />

                        <Text style={styles.iconLabel}>Selecciona un icono:</Text>
                        <View style={styles.iconGrid}>
                            {icons.map((i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={[styles.iconOption, icon === i && styles.iconSelected]}
                                    onPress={() => setIcon(i)}
                                >
                                    <Text style={styles.iconText}>{i}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleSave}
                                disabled={isLoading}
                            >
                                <LinearGradient
                                    colors={['#FFD700', '#FFA500']}
                                    style={styles.saveButtonGradient}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#000" />
                                    ) : (
                                        <Text style={styles.saveButtonText}>Guardar</Text>
                                    )}
                                </LinearGradient>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
    },
    backButton: {
        padding: 5,
        marginRight: 10,
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
    addButton: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    addButtonGradient: {
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    list: {
        padding: 20,
    },
    categoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
    },
    categoryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    categoryIcon: {
        fontSize: 28,
        marginRight: 12,
    },
    categoryName: {
        fontSize: 18,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    categoryActions: {
        flexDirection: 'row',
        gap: 10,
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    editButton: {
        backgroundColor: 'rgba(100, 181, 246, 0.3)',
    },
    deleteButton: {
        backgroundColor: 'rgba(239, 83, 80, 0.3)',
    },
    actionButtonText: {
        fontSize: 18,
    },
    emptyText: {
        color: '#999',
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1a1a2e',
        borderRadius: 20,
        padding: 25,
        width: '100%',
        maxWidth: 400,
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        color: '#FFFFFF',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
    },
    iconLabel: {
        color: '#FFFFFF',
        marginBottom: 10,
        fontSize: 14,
    },
    iconGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 20,
    },
    iconOption: {
        width: 45,
        height: 45,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconSelected: {
        backgroundColor: 'rgba(255,215,0,0.3)',
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    iconText: {
        fontSize: 24,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 15,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#999',
        fontSize: 16,
    },
    saveButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    saveButtonGradient: {
        paddingVertical: 15,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
