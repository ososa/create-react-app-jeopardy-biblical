import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

import { useGame } from '../context/GameContext';
import { supabase } from '../utils/supabase';
import { useSession } from '../context/SessionContext';

import { getRank, getProgress } from '../utils/gamification';
import { useAdmin } from '../context/AdminContext';
import { DropdownMenu } from '../components/DropdownMenu';
import { HeaderBackground } from '../components/HeaderBackground';
import { Footer } from '../components/Footer';

const AVATARS = ['🦁', '🕊️', '👑', '🔥', '⚔️', '🛡️', '🍇', '🐟', '⚓', '⛪', '📜', '🕯️'];

type ProfileScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Profile'>;
};

const LANGUAGES = [
    { code: 'es', flag: '🇪🇸', label: 'Español' },
    { code: 'en', flag: '🇺🇸', label: 'English' },
    { code: 'pt', flag: '🇧🇷', label: 'Português' },
];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
    const { user, updateProfile, updatePassword, signOut } = useAuth();
    const { isAdmin } = useAdmin();
    const { t, i18n } = useTranslation();
    const { joinSession } = useSession();
    const { dispatch } = useGame();
    const { theme } = useTheme();

    const [username, setUsername] = useState(user?.user_metadata?.username || '');
    const [selectedAvatar, setSelectedAvatar] = useState(user?.user_metadata?.avatar || AVATARS[0]);
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [invitations, setInvitations] = useState<any[]>([]);
    const [myGames, setMyGames] = useState<any[]>([]);

    // Gamification Stats
    const xp = user?.user_metadata?.xp || 0;
    const rank = getRank(xp);
    const progress = getProgress(xp);

    useEffect(() => {
        if (user) {
            fetchInvitations();
            fetchMyGames();

            // Subscribe to new invitations
            const channel = supabase
                .channel(`invites:${user.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'game_invitations',
                    filter: `recipient_id=eq.${user.id}`
                }, (payload) => {
                    console.log('New invite received!', payload);
                    fetchInvitations();
                })
                .subscribe();

            return () => { supabase.removeChannel(channel); };
        }
    }, [user]);

    useEffect(() => {
        if (user?.user_metadata) {
            setUsername(user.user_metadata.username || '');
            setSelectedAvatar(user.user_metadata.avatar || AVATARS[0]);
        }
    }, [user]);

    const fetchInvitations = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('game_invitations')
            .select('*, sender:sender_id(username)')
            .eq('recipient_id', user.id)
            .eq('status', 'pending');

        if (!error && data) {
            setInvitations(data);
        }
    };

    const fetchMyGames = async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from('game_sessions')
            .select('*')
            .eq('host_id', user.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setMyGames(data);
        }
    };

    const handleResponse = async (invite: any, status: 'accepted' | 'rejected') => {
        try {
            const { error } = await supabase
                .from('game_invitations')
                .update({ status })
                .eq('id', invite.id);

            if (error) throw error;

            setInvitations(prev => prev.filter(i => i.id !== invite.id));

            if (status === 'accepted') {
                Alert.alert('¡Genial!', 'Uniéndote a la partida...');
                navigation.navigate('WaitingRoom', { sessionId: invite.game_id });
            } else {
                fetchInvitations();
            }
        } catch (error) {
            console.error('Error responding to invite:', error);
            Alert.alert('Error', 'No se pudo procesar la respuesta');
        }
    };

    const handleSave = async () => {
        if (!user) return;
        if (!username.trim()) {
            Alert.alert('Error', 'El nombre de usuario no puede estar vacío');
            return;
        }

        setLoading(true);

        const promises = [];
        promises.push(updateProfile({ username, avatar: selectedAvatar }));

        if (newPassword.trim()) {
            if (newPassword.length < 6) {
                Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
                setLoading(false);
                return;
            }
            promises.push(updatePassword(newPassword));
        }

        const results = await Promise.all(promises);
        setLoading(false);

        const errors = results.filter(r => r.error).map(r => r.error?.message);

        if (errors.length > 0) {
            Alert.alert('Error', 'Hubo un problema actualizando: ' + errors.join(', '));
        } else {
            Alert.alert('Éxito', 'Perfil actualizado correctamente');
            if (newPassword) setNewPassword('');
            navigation.goBack();
        }
    };

    const changeLanguage = async (langCode: string) => {
        await i18n.changeLanguage(langCode);
        await AsyncStorage.setItem('user-language', langCode);
    };

    const finishedGames = myGames.filter(g => g.status === 'finished');

    const handleLogout = async () => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm("¿Estás seguro que quieres salir?");
            if (confirmed) {
                await signOut();
            }
        } else {
            Alert.alert(
                "Cerrar Sesión",
                "¿Estás seguro que quieres salir?",
                [
                    { text: "Cancelar", style: "cancel" },
                    {
                        text: "Salir",
                        style: 'destructive',
                        onPress: async () => {
                            await signOut();
                        }
                    }
                ]
            );
        }
    };

    // ... existing code ...

    return (
        <LinearGradient colors={['#001B3A', '#0D3B66', '#1A5276']} style={styles.container}>
            <HeaderBackground style={StyleSheet.absoluteFillObject} />
            <Helmet>
                <title>Mi Perfil - Tribiblia</title>
            </Helmet>

            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => {
                        if (navigation.canGoBack()) {
                            navigation.goBack();
                        } else {
                            // Fallback for Web refresh or deep link
                            navigation.navigate('TeamConfig');
                        }
                    }}
                    style={styles.backButton}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                    <Text style={styles.backButtonText}>{t('common.back', 'Volver')}</Text>
                </TouchableOpacity>
                <Text style={[styles.title, { fontSize: useWindowDimensions().width < 768 ? 22 : 28 }]}>👤 {t('profile.title').toUpperCase()}</Text>
                <DropdownMenu
                    onProfile={() => { }} // Already on profile
                    onMyGames={() => navigation.navigate('MyGames')}
                    onLogout={handleLogout}
                    onAdmin={() => navigation.navigate('Admin')}
                    isAdmin={isAdmin}
                    invitationCount={invitations.length}
                />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* PLAYER STATS CARD */}
                <View style={styles.statsCard}>
                    <LinearGradient
                        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.3)']}
                        style={styles.statsGradient}
                    >
                        <View style={styles.statsHeader}>
                            <View style={styles.avatarContainer}>
                                <Text style={styles.statsAvatar}>{selectedAvatar}</Text>
                            </View>
                            <View style={styles.statsInfo}>
                                <Text style={styles.statsUsername}>{username || 'Jugador'}</Text>
                                <Text style={styles.statsRankTitle}>{t(rank.title)}</Text>
                            </View>
                            <View style={styles.rankIconContainer}>
                                <Text style={styles.rankIconSmall}>{rank.icon}</Text>
                            </View>
                        </View>

                        <View style={styles.xpContainer}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                                <Text style={styles.xpLabel}>{t('gamification.xp')}</Text>
                                <Text style={styles.xpValue}>{xp} XP</Text>
                            </View>
                            <View style={styles.progressBarContainer}>
                                <LinearGradient
                                    colors={['#FFD700', '#FFA500']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[styles.progressBarFill, { width: `${progress}%` }]}
                                />
                            </View>
                            <Text style={styles.progressText}>{t('profile.nextLevel')}: {Math.round(progress)}%</Text>
                        </View>

                        {/* Optional: Add simple stats grid */}
                        <View style={styles.miniStatsGrid}>
                            <View style={styles.miniStatItem}>
                                <Text style={styles.miniStatValue}>{myGames.length}</Text>
                                <Text style={styles.miniStatLabel}>{t('profile.stats.games')}</Text>
                            </View>
                            <View style={styles.miniStatItem}>
                                <Text style={styles.miniStatValue}>{finishedGames.length}</Text>
                                <Text style={styles.miniStatLabel}>{t('profile.stats.completed')}</Text>
                            </View>
                            <View style={styles.miniStatItem}>
                                <Text style={styles.miniStatValue}>Soon</Text>
                                <Text style={styles.miniStatLabel}>{t('profile.stats.wins')}</Text>
                            </View>
                        </View>

                    </LinearGradient>
                </View>

                {/* EDIT PROFILE SECTION */}
                <View style={styles.editProfileCard}>
                    <LinearGradient
                        colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                        style={styles.editProfileGradient}
                    >
                        <View style={styles.titleContainer}>
                            <View style={[styles.titleLine, { backgroundColor: 'rgb(16, 223, 224)' }]} />
                            <Text style={styles.sectionTitle}>{t('profile.sections.avatar')}</Text>
                            <View style={[styles.titleLine, { backgroundColor: 'rgb(16, 223, 224)' }]} />
                        </View>

                        <View style={styles.avatarPreviewContainer}>
                            <View style={styles.avatarPreviewGlow}>
                                <Text style={styles.avatarPreviewEmoji}>{selectedAvatar}</Text>
                            </View>
                        </View>

                        <View style={styles.avatarGrid}>
                            {AVATARS.map((avatar) => (
                                <TouchableOpacity
                                    key={avatar}
                                    onPress={() => setSelectedAvatar(avatar)}
                                    style={[
                                        styles.avatarGridItem,
                                        selectedAvatar === avatar && styles.avatarGridItemSelected,
                                    ]}
                                >
                                    <Text style={styles.avatarGridText}>{avatar}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>



                        <View style={styles.titleContainer}>
                            <View style={[styles.titleLine, { backgroundColor: 'rgb(16, 223, 224)' }]} />
                            <Text style={styles.sectionTitle}>{t('profile.sections.data')}</Text>
                            <View style={[styles.titleLine, { backgroundColor: 'rgb(16, 223, 224)' }]} />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>{t('profile.fields.playerNameLabel')}</Text>
                            <TextInput
                                style={styles.premiumInput}
                                value={username}
                                onChangeText={setUsername}
                                placeholder={t('profile.fields.playerNamePlaceholder')}
                                placeholderTextColor="#666"
                                autoCapitalize="words"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>{t('profile.fields.passwordLabel')}</Text>
                            <TextInput
                                style={styles.premiumInput}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder={t('profile.fields.passwordPlaceholder')}
                                placeholderTextColor="#666"
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.saveButton, loading && styles.disabledButton]}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#FFD700', '#FFA500']}
                                style={styles.saveButtonGradient}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#001B3A" />
                                ) : (
                                    <Text style={styles.saveButtonText}>{t('profile.saveChanges')}</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>

                {/* LANGUAGE SECTION */}
                <View style={[styles.editProfileCard, { marginBottom: 50, marginTop: 10 }]}>
                    <LinearGradient
                        colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                        style={styles.editProfileGradient}
                    >
                        <View style={styles.titleContainer}>
                            <View style={[styles.titleLine, { backgroundColor: 'rgb(16, 223, 224)' }]} />
                            <Text style={styles.sectionTitle}>🌐 {t('profile.sections.language', 'Idioma')}</Text>
                            <View style={[styles.titleLine, { backgroundColor: 'rgb(16, 223, 224)' }]} />
                        </View>

                        <View style={styles.languageGrid}>
                            {LANGUAGES.map((lang) => (
                                <TouchableOpacity
                                    key={lang.code}
                                    style={[
                                        styles.langButton,
                                        i18n.language === lang.code && styles.langButtonActive
                                    ]}
                                    onPress={() => changeLanguage(lang.code)}
                                >
                                    <Text style={styles.langFlag}>{lang.flag}</Text>
                                    <Text style={[
                                        styles.langLabel,
                                        i18n.language === lang.code && styles.langLabelActive
                                    ]}>{lang.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </LinearGradient>
                </View>

                <Footer />
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        backgroundColor: '#001B3A',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 20,
        paddingLeft: 0,
        paddingRight: 0,
        zIndex: 100, // Ensure menu stays on top of content
    },
    backButton: {
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
    },
    backButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontFamily: 'Mulish-Bold',
    },
    title: {
        color: 'rgb(15, 223, 223)', // User requested Cyan
        fontSize: 28, // Increased to 28px
        fontFamily: 'Anton',
        letterSpacing: 1,
    },
    content: {
        padding: 20,
        alignItems: 'center',
        paddingBottom: 50,
    },
    section: {
        width: '100%',
        maxWidth: 500,
        marginBottom: 30,
    },
    label: {
        color: '#FFF',
        fontSize: 18,
        marginBottom: 10,
        fontFamily: 'Mulish-Bold',
    },
    // ... New Styles for Redesign ...
    editProfileCard: {
        width: '100%',
        maxWidth: 500,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 3, // Updated to 3px
        borderColor: '#13c2c27d', // Updated to requested color
        marginTop: 10,
        marginBottom: 10,
        backgroundColor: 'rgba(0, 27, 58, 0.9)', // Solid background to prevent bleed-through
    },
    editProfileGradient: {
        padding: 20,
        alignItems: 'center',
    },
    sectionTitle: {
        color: 'rgb(16, 223, 224)', // Updated to requested Cyan
        fontSize: 18,
        fontFamily: 'Anton',
        letterSpacing: 1,
        textAlign: 'center',
        marginHorizontal: 15,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        width: '100%',
    },
    titleLine: {
        flex: 1,
        height: 1,
        opacity: 0.6,
    },
    avatarPreviewContainer: {
        marginBottom: 20,
        alignItems: 'center',
    },
    avatarPreviewGlow: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,215,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3, // Updated to 3px
        borderColor: '#13c2c27d', // Updated to requested color
        shadowColor: '#13c2c2', // Updated shadow to match
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
    avatarPreviewEmoji: {
        fontSize: 60,
    },
    avatarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 20,
    },
    avatarGridItem: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3, // Updated to 3px
        borderColor: '#13c2c27d', // Updated to requested color
    },
    avatarGridItemSelected: {
        backgroundColor: 'rgba(255,215,0,0.2)',
        borderColor: '#FFD700',
        transform: [{ scale: 1.1 }],
    },
    avatarGridText: {
        fontSize: 24,
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 20,
    },
    languageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 15,
        width: '100%',
    },
    langButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        gap: 10,
        minWidth: 120,
    },
    langButtonActive: {
        backgroundColor: 'rgba(255,215,0,0.15)',
        borderColor: '#FFD700',
    },
    langFlag: {
        fontSize: 24,
    },
    langLabel: {
        fontSize: 16,
        color: '#BBB',
        fontFamily: 'Mulish-Bold',
    },
    langLabelActive: {
        color: '#FFF',
    },
    inputContainer: {
        width: '100%',
        marginBottom: 15,
    },
    inputLabel: {
        color: '#AAA',
        fontSize: 10,
        fontFamily: 'Mulish-Bold',
        marginBottom: 5,
        letterSpacing: 0.5,
    },
    premiumInput: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 8,
        padding: 12,
        color: '#FFF',
        fontSize: 16,
        fontFamily: 'Mulish-Regular',
        borderWidth: 2,
        borderColor: 'rgba(255,215,0,0.3)',
    },
    saveButton: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 10,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 3,
    },
    saveButtonGradient: {
        paddingVertical: 15,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#001B3A',
        fontSize: 16,
        fontFamily: 'Anton',
        letterSpacing: 1,
    },
    disabledButton: {
        opacity: 0.7,
    },
    // ... Existing Styles Check ...
    logoutButton: {
        padding: 10,
        backgroundColor: 'rgba(255, 59, 48, 0.2)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 59, 48, 0.5)',
    },
    logoutText: {
        fontSize: 18,
    },
    // ... New Stats Card Styles ...
    statsCard: {
        width: '100%',
        maxWidth: 500,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#FFD700',
        marginBottom: 10,
        backgroundColor: 'rgba(0,0,0,0.3)',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    statsGradient: {
        padding: 20,
    },
    statsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFD700',
        marginRight: 15,
    },
    statsAvatar: {
        fontSize: 40,
    },
    statsInfo: {
        flex: 1,
    },
    statsUsername: {
        color: '#FFF',
        fontSize: 24,
        fontFamily: 'Anton',
        letterSpacing: 1,
        marginBottom: 5,
    },
    statsRankTitle: {
        color: '#FFD700',
        fontSize: 16,
        fontFamily: 'Mulish-Bold',
    },
    rankIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankIconSmall: {
        fontSize: 32,
    },
    xpContainer: {
        marginBottom: 20,
    },
    xpLabel: {
        color: '#AAA',
        fontSize: 10,
        fontFamily: 'Mulish-Bold',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    xpValue: {
        color: '#FFF',
        fontSize: 14,
        fontFamily: 'Mulish-Bold',
    },
    progressBarContainer: {
        width: '100%',
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 5,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#FFD700',
        borderRadius: 4,
    },
    progressText: {
        color: '#888',
        fontSize: 10,
        alignSelf: 'flex-end',
        fontFamily: 'Mulish-Regular',
    },
    miniStatsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingTop: 15,
    },
    miniStatItem: {
        alignItems: 'center',
        flex: 1,
    },
    miniStatValue: {
        color: '#FFF',
        fontSize: 18,
        fontFamily: 'Anton',
        marginBottom: 2,
    },
    miniStatLabel: {
        color: '#AAA',
        fontSize: 10,
        fontFamily: 'Mulish-Regular',
    },
    inviteCard: {
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    inviteText: {
        color: '#FFF',
        fontSize: 16,
        marginBottom: 10,
        fontFamily: 'Mulish-Regular',
    },
    inviteActions: {
        flexDirection: 'row',
        gap: 10,
    },
    inviteBtn: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
    },
    acceptBtn: {
        backgroundColor: '#4CAF50',
    },
    rejectBtn: {
        backgroundColor: '#F44336',
    },
    inviteBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    wideSection: {
        maxWidth: 1000,
    },
    gamesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 15,
    },
    gameCardWrapper: {
        width: '100%',
        minWidth: 300,
        maxWidth: 500,
        flexBasis: 350,
        flexGrow: 1,
    },
    gameCard: {
        backgroundColor: 'rgba(0, 0, 0, 0.27)', // Updated to requested dark transparent color
        padding: 15,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#FFD700',
        marginBottom: 15,
        // height: '100%', // Removed to prevent layout issues
    },
    gameDate: {
        color: '#AAA',
        fontSize: 12,
        marginBottom: 5,
        fontFamily: 'Mulish-Regular',
    },
    gameVs: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
        fontFamily: 'Mulish-Bold',
    },
    resumeText: {
        color: '#FFD700',
        fontSize: 12,
        textAlign: 'right',
        fontWeight: 'bold',
    },
    helperText: {
        color: '#AAA',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 10,
    },
    gameModeBadge: {
        fontSize: 10,
        fontFamily: 'Mulish-Bold',
        borderWidth: 2,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginBottom: 4,
        alignSelf: 'flex-start',
    },
    // ... Gamification Stats (Styles already defined above, preventing duplicates)
});
