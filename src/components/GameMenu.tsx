import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

type GameMenuProps = {
    onEdit: () => void;
    onExit: () => void;
    style?: any;
};

export const GameMenu: React.FC<GameMenuProps> = ({ onEdit, onExit, style }) => {
    const [visible, setVisible] = useState(false);
    const { t } = useTranslation();

    const toggleMenu = () => setVisible(!visible);

    const handleAction = (action: () => void) => {
        setVisible(false);
        action();
    };

    return (
        <View style={[styles.container, style]}>
            <TouchableOpacity
                style={styles.menuContainer} // Added container for shadow/elevation
                onPress={toggleMenu}
                activeOpacity={0.9}
            >
                <LinearGradient
                    colors={['#D500F9', '#AA00FF']} // Purple gradient
                    style={styles.menuButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Text style={styles.menuIcon}>📂</Text>
                    <Text style={styles.menuLabel}>{t('game.menuTitle', 'Menú juego')}</Text>
                </LinearGradient>
            </TouchableOpacity>

            {visible && (
                <>
                    <TouchableOpacity
                        style={styles.backdrop}
                        onPress={() => setVisible(false)}
                        activeOpacity={1}
                    />

                    <View style={styles.dropdown}>
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => handleAction(onEdit)}
                        >
                            <Text style={styles.itemIcon}>✏️</Text>
                            <Text style={styles.itemText}>{t('game.editGame', 'Editar Juego')}</Text>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => handleAction(onExit)}
                        >
                            <Text style={styles.itemIcon}>🏃</Text>
                            <Text style={styles.itemText}>{t('game.exitGame', 'Salir de juego')}</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        zIndex: 100,
        alignItems: 'center', // Center content
    },
    menuContainer: {
        shadowColor: '#D500F9',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 10,
        borderRadius: 20,
    },
    menuButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        gap: 8,
    },
    menuIcon: {
        fontSize: 18,
        color: '#FFF',
    },
    menuLabel: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
        fontFamily: 'Mulish-Bold',
    },
    backdrop: {
        position: 'absolute',
        top: -1000,
        left: -1000,
        right: -1000,
        bottom: -1000,
        width: 5000,
        height: 5000,
        zIndex: 90,
    },
    dropdown: {
        position: 'absolute',
        top: '100%',
        marginTop: -10, // Negative margin as requested
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingVertical: 5,
        minWidth: 180, // Optimized width
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 10,
        zIndex: 100,
        alignSelf: 'center', // Ensure dropdown centers relative to button if container is wide
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        gap: 10,
    },
    itemIcon: {
        fontSize: 16,
        width: 24,
        textAlign: 'center',
    },
    itemText: {
        fontSize: 15,
        color: '#333',
        fontFamily: 'Mulish-Bold',
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: '#EEE',
        marginHorizontal: 10,
    },
});
