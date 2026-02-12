import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { useSession } from '../context/SessionContext';
import { supabase } from '../utils/supabase';
import { GameHistoryList } from '../components/GameHistoryList';
import { getRank } from '../utils/gamification';
import { DropdownMenu } from '../components/DropdownMenu';
import { Leaderboard } from '../components/Leaderboard';
import { useAdmin } from '../context/AdminContext';
import { HeaderBackground } from '../components/HeaderBackground';
import { ActivePlayers } from '../components/ActivePlayers';
import { Footer } from '../components/Footer';

type MyGamesScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'MyGames'>;
};

export const MyGamesScreen: React.FC<MyGamesScreenProps> = ({ navigation }) => {
    const { user, signOut } = useAuth();
    const { isAdmin } = useAdmin();
    const { t } = useTranslation();
    const { dispatch } = useGame();
    const { resumeSession } = useSession();

    const [myGames, setMyGames] = useState<any[]>([]);
    useEffect(() => {
        if (user) {
            if (user) {
                fetchMyGames();
            }
        }
    }, [user]);

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

    const handleResumeGame = async (game: any) => {
        if (game.game_state) {
            dispatch({ type: 'LOAD_GAME', payload: game.game_state });
        }
        await resumeSession(game.id);

        if (game.status === 'finished') {
            navigation.navigate('GameOver', { returnTo: 'MyGames' });
        } else {
            navigation.navigate('Game');
        }
    };

    const handleDeleteGame = async (gameId: string) => {
        const deleteAction = async () => {
            const { error } = await supabase
                .from('game_sessions')
                .delete()
                .eq('id', gameId);

            if (error) {
                Alert.alert("Error", "No se pudo eliminar la partida.");
            } else {
                setMyGames(prev => prev.filter(g => g.id !== gameId));
            }
        };

        if (Platform.OS === 'web') {
            const confirmed = window.confirm("¿Estás seguro? Esta acción no se puede deshacer.");
            if (confirmed) deleteAction();
        } else {
            Alert.alert(
                "Eliminar Partida",
                "¿Estás seguro? Esta acción no se puede deshacer.",
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Eliminar", style: 'destructive', onPress: deleteAction }
                ]
            );
        }
    };

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

    return (
        <LinearGradient colors={['#001B3A', '#0D3B66', '#1A5276']} style={styles.container}>
            <HeaderBackground style={StyleSheet.absoluteFillObject} />
            <Helmet>
                <title>{t('common.myGames', 'Mis Partidas')} - Tribiblia</title>
            </Helmet>

            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => {
                        if (navigation.canGoBack()) {
                            navigation.goBack();
                        } else {
                            // Fallback to Setup screen if no history (Web refresh)
                            navigation.navigate('TeamConfig');
                        }
                    }}
                    style={styles.backButton}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                    <Text style={styles.backButtonText}>{t('common.back', 'Volver')}</Text>
                </TouchableOpacity>
                <Text style={[styles.title, { fontSize: useWindowDimensions().width < 768 ? 22 : 28 }]}>🕹️ {t('common.myGames', 'MIS PARTIDAS').toUpperCase()}</Text>
                <DropdownMenu
                    onProfile={() => navigation.navigate('Profile')}
                    onMyGames={() => { }} // Already on MyGames
                    onLogout={handleLogout}
                    onAdmin={() => navigation.navigate('Admin')}
                    isAdmin={isAdmin}
                    invitationCount={0} // We can wire this if needed later
                />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* LEADERBOARD SECTION */}
                <View style={styles.section}>
                    <Leaderboard limit={10} variant="cyan" />
                </View>

                <View style={styles.section}>
                    <GameHistoryList
                        games={myGames}
                        onResume={handleResumeGame}
                        onDelete={handleDeleteGame}
                    />
                </View>

                {/* START GAME BUTTON */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.startGameBtn}
                        onPress={() => navigation.navigate('TeamConfig', { isEditing: false })}
                    >
                        <LinearGradient
                            colors={['#FFEC00', '#FFB700']} // Brighter Gold/Yellow gradient
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={styles.startGameGradient}
                        >
                            <Text style={styles.startGameText}>{t('common.startGame', 'COMENZAR PARTIDA')}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* ACTIVE PLAYERS SECTION */}
                <View style={styles.section}>
                    <ActivePlayers sessionId="global" />
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
        zIndex: 100, // Ensure menu stays on top
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
        maxWidth: 600,
    },
    startGameBtn: {
        width: '100%',
        marginTop: 20, // Spacing from history list
        borderRadius: 16, // More rounded as per image
        overflow: 'hidden',
        shadowColor: '#FFB700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 8,
    },
    startGameGradient: {
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        // Removed borderWidth/borderColor to match JoinScreen cleaner look
    },
    startGameText: {
        color: '#001B3A',
        fontFamily: 'Anton',
        fontSize: 22,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});
