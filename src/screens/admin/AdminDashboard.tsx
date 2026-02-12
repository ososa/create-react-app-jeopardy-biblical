import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from './index';

type AdminDashboardProps = {
    navigation: NativeStackNavigationProp<AdminStackParamList, 'AdminDashboard'>;
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ navigation }) => {
    const menuItems = [
        {
            title: 'Categorías',
            icon: '📂',
            description: 'Gestionar categorías de preguntas',
            screen: 'Categories' as const,
            color: ['#667eea', '#764ba2'] as const,
        },
        {
            title: 'Preguntas',
            icon: '❓',
            description: 'Agregar, editar y eliminar preguntas',
            screen: 'Questions' as const,
            color: ['#f093fb', '#f5576c'] as const,
        },
        {
            title: 'Usuarios',
            icon: '👥',
            description: 'Ver usuarios registrados',
            screen: 'Users' as const,
            color: ['#4facfe', '#00f2fe'] as const,
        },
    ];

    return (
        <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>⚙️ Panel de Administración</Text>
                    <Text style={styles.subtitle}>Gestiona tu juego de Jeopardy Bíblico</Text>
                </View>

                <View style={styles.menuGrid}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.menuCard}
                            onPress={() => navigation.navigate(item.screen)}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={item.color}
                                style={styles.cardGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Text style={styles.cardIcon}>{item.icon}</Text>
                                <Text style={styles.cardTitle}>{item.title}</Text>
                                <Text style={styles.cardDescription}>{item.description}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.getParent()?.goBack()}
                >
                    <Text style={styles.backButtonText}>← Volver al Juego</Text>
                </TouchableOpacity>
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingTop: 20,
    },
    header: {
        marginBottom: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    subtitle: {
        fontSize: 16,
        color: '#FFFFFF',
        opacity: 0.8,
    },
    menuGrid: {
        gap: 15,
    },
    menuCard: {
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    cardGradient: {
        padding: 25,
        alignItems: 'center',
    },
    cardIcon: {
        fontSize: 48,
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 5,
    },
    cardDescription: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.9,
        textAlign: 'center',
    },
    backButton: {
        marginTop: 30,
        paddingVertical: 15,
        alignItems: 'center',
    },
    backButtonText: {
        fontSize: 16,
        color: '#FFD700',
        fontWeight: '600',
    },
});
