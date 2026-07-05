import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DropdownMenuProps {
    onProfile?: () => void;
    onMyGames?: () => void;
    onLogout?: () => void;
    onAdmin?: () => void;
    isAdmin?: boolean;
    style?: any;
    invitationCount?: number;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
    onProfile,
    onMyGames,
    onLogout,
    onAdmin,
    isAdmin,
    style,
    invitationCount = 0
}) => {
    const [visible, setVisible] = useState(false);
    const { t, i18n } = useTranslation();

    const changeLanguage = async (lang: string) => {
        await i18n.changeLanguage(lang);
        await AsyncStorage.setItem('user-language', lang);
        setVisible(false);
    };

    const toggleMenu = () => setVisible(!visible);

    const handleAction = (action: () => void) => {
        setVisible(false);
        action();
    };

    return (
        <View style={[styles.container, style]}>
            <TouchableOpacity
                style={styles.menuButton}
                onPress={toggleMenu}
                activeOpacity={0.8}
            >
                <Text style={[styles.menuIcon, { color: '#000' }]}>☰</Text>
                <Text style={styles.menuLabel}>{t('common.menu', 'Menu')}</Text>

                {invitationCount > 0 && (
                    <View style={styles.badge} />
                )}
            </TouchableOpacity>

            {visible && (
                <>
                    {/* Backdrop to close menu when clicking outside */}
                    <TouchableOpacity
                        style={styles.backdrop}
                        onPress={() => setVisible(false)}
                        activeOpacity={1}
                    />

                    <View style={styles.dropdown}>
                        {onProfile && (
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => handleAction(onProfile)}
                            >
                                <Text style={styles.itemIcon}>👤</Text>
                                <Text style={styles.itemText}>{t('profile.title', 'Mi Perfil')}</Text>
                                {invitationCount > 0 && (
                                    <View style={styles.innerBadge}>
                                        <Text style={styles.badgeText}>{invitationCount}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        )}

                        {onMyGames && (
                            <>
                                <View style={styles.divider} />
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => handleAction(onMyGames)}
                                >
                                    <Text style={styles.itemIcon}>🕹️</Text>
                                    <Text style={styles.itemText}>{t('common.myGames', 'Mis Partidas')}</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {(onProfile || onMyGames) && <View style={styles.divider} />}

                        {onLogout && (
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => handleAction(onLogout)}
                            >
                                <Text style={styles.itemIcon}>🏃</Text>
                                <Text style={styles.itemText}>{t('common.logout', 'Salir')}</Text>
                            </TouchableOpacity>
                        )}

                        {isAdmin && onAdmin && (
                            <View>
                                <View style={styles.divider} />
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => handleAction(onAdmin)}
                                >
                                    <Text style={styles.itemIcon}>⚙️</Text>
                                    <Text style={styles.itemText}>{t('welcome.admin', 'Admin')}</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={styles.divider} />

                        {/* Language Selector */}
                        <View style={styles.languageContainer}>
                            <TouchableOpacity onPress={() => changeLanguage('es')} style={[styles.langButton, i18n.language === 'es' && styles.activeLang]}>
                                <Text style={styles.langFlag}>🇪🇸</Text>
                                <Text style={[styles.langText, i18n.language === 'es' && styles.activeLangText]}>{t('languages.es', 'Español')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => changeLanguage('en')} style={[styles.langButton, i18n.language === 'en' && styles.activeLang]}>
                                <Text style={styles.langFlag}>🇺🇸</Text>
                                <Text style={[styles.langText, i18n.language === 'en' && styles.activeLangText]}>{t('languages.en', 'Inglés')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => changeLanguage('pt')} style={[styles.langButton, i18n.language === 'pt' && styles.activeLang]}>
                                <Text style={styles.langFlag}>🇧🇷</Text>
                                <Text style={[styles.langText, i18n.language === 'pt' && styles.activeLangText]}>{t('languages.pt', 'Portugues')}</Text>
                            </TouchableOpacity>
                        </View>
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
    },
    menuButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFD700',
        paddingVertical: 4,
        paddingHorizontal: 15,
        borderRadius: 20,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        borderTopLeftRadius: 20,
        borderBottomLeftRadius: 20,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
    },
    menuIcon: {
        fontSize: 18,
    },
    menuLabel: {
        color: '#001B3A',
        fontWeight: 'bold',
        fontSize: 16,
        fontFamily: 'Mulish-Bold',
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FF3B30',
        borderWidth: 1,
        borderColor: '#FFF',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: -1000,
        right: -1000,
        bottom: -1000, // Cover screen mostly
        width: 5000, // Hack to cover screen in absolute context without portal
        height: 5000,
        zIndex: 90,
    },
    dropdown: {
        position: 'absolute',
        top: '100%',
        right: 0,
        minWidth: 180,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderTopRightRadius: 0, // Connect visually with button
        paddingVertical: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 10,
        zIndex: 100,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 15,
        gap: 5,
    },
    itemIcon: {
        fontSize: 16,
        width: 24,
        textAlign: 'center',
    },
    itemText: {
        fontSize: 16,
        color: '#333',
        fontFamily: 'Mulish-Bold',
    },
    divider: {
        height: 1,
        backgroundColor: '#EEE',
        marginVertical: 2,
    },
    innerBadge: {
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 1,
        marginLeft: 'auto',
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    languageContainer: {
        paddingVertical: 5,
        paddingHorizontal: 15,
    },
    langButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderRadius: 5,
        marginBottom: 2,
    },
    activeLang: {
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    langFlag: {
        fontSize: 16,
        marginRight: 10,
    },
    langText: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'Mulish-Regular',
    },
    activeLangText: {
        color: '#000',
        fontWeight: 'bold',
    },
});
