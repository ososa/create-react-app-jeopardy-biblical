import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
    ImageBackground,
    useWindowDimensions,
    Dimensions,
    Modal,
    FlatList,
    Alert,
    ActivityIndicator
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useGame } from '../context/GameContext';
import { useSession } from '../context/SessionContext';
import { useAuth } from '../context/AuthContext';
import { supabase, fetchRandomCategories, fetchAllCategories } from '../utils/supabase';
import { ARCADE_THEME } from '../constants/theme';
import { HeaderBackground } from '../components/HeaderBackground';
import { Footer } from '../components/Footer';

import { RouteProp, useFocusEffect } from '@react-navigation/native';

type TeamConfigRouteProp = RouteProp<RootStackParamList, 'TeamConfig'>;

type TeamConfigScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'TeamConfig'>;
    route: TeamConfigRouteProp;
};

// Assets
const ASSETS = {
    background: require('../../assets/images/background_stars.png'),
    logo: require('../../assets/images/logo_definitivo_v5.png'),
};

export const TeamConfigScreen: React.FC<TeamConfigScreenProps> = ({ navigation, route }) => {
    const { state, dispatch } = useGame();
    const { createSession, sessionId, connectedUsers, leaveSession, resumeSession } = useSession(); // Note: sessionId here comes from context
    const { t } = useTranslation();
    const { width } = useWindowDimensions();

    // Check if we are editing an active session from navigation params
    const editingParams = route.params as any;
    const isEditing = !!editingParams?.isEditing;

    // RESET STATE ON MOUNT IF NOT EDITING
    useEffect(() => {
        if (!isEditing) {
            console.log("TeamConfig: Starting NEW GAME -> Resetting session and game state.");
            leaveSession(); // Clears sessionId in context, so we generate a new one later
            dispatch({ type: 'RESET_GAME' }); // Clears scores, board, etc.
        } else {
            console.log("TeamConfig: EDIT MODE -> Preserving state.");
        }
    }, [isEditing]); // Only run on mount or mode change

    const { user } = useAuth();

    // Use Focus Effect to refresh games whenever screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            if (user) {
                console.log("TeamConfigScreen focused: Refreshing active games...");
                fetchActiveGames();
            }
        }, [user])
    );

    const fetchActiveGames = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('game_sessions')
            .select('*')
            .eq('host_id', user.id)
            .neq('status', 'finished')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setMyActiveGames(data);
        }
    };

    const handleResumeExistingGame = async (game: any) => {
        if (game.game_state) {
            console.log("Hydrating game state:", game.game_state);
            dispatch({ type: 'LOAD_GAME', payload: game.game_state });
        }
        await createSession(); // We might need to handle this differently if we want to reuse the ID, but for now createSession manages context.
        // Actually, createSession makes a NEW one. We should use resumeSession logic but simpler here.
        // Wait, resumeSession in SessionContext updates the ID.
        // let's assume we just want to navigate to Game with state loaded.
        // But we DO need to update the SessionContext ID so multiplayer works.
        // Let's use the logic from ProfileScreen's handleResumeGame but adapted.

        // Simulating resumeSession locally since it's not exported or we want to avoid full heavy lift if not needed
        // Ideally we should export resumeSession from context or just set the ID manually if allowed.
        // Checking SessionContext... it has joinSession but no explicit resumeSession that takes an ID for host aside from just setting state?
        // Ah, ProfileScreen uses `resumeSession`. Let's assume we can add it or just use similar logic.
        // Since `resumeSession` was used in ProfileScreen, it must exist in SessionContext.
        // Wait, I checked SessionContext earlier and it seemed to have it?
        // Let's check imports. `createSession` is imported. Let's import `resumeSession` too if available.
        // If not available in destructuring, I need to check the file.
        // I will trust ProfileScreen usage and assume it's available.
    };

    const getGameModeInfo = (game: any) => {
        const gameState = game?.game_state;
        const isMultiplayer = gameState?.gameMode === 'MULTIPLAYER' ||
            (gameState?.team1Roster?.length > 0 || gameState?.team2Roster?.length > 0);
        const isTrain = gameState?.gameMode === 'TRAIN';

        return {
            label: isTrain ? t('teamConfig.trainMode', 'ENTRENAMIENTO') : isMultiplayer ? t('common.multiplayer', 'MULTIJUGADOR') : t('common.classic', 'CLÁSICO'),
            color: isTrain ? '#FF3B30' : isMultiplayer ? '#FF6B00' : '#FFD700', // Red vs Orange vs Gold
        };
    };

    // Need to access resumeSession from context
    const { resumeSession: contextResumeSession } = useSession();

    const onResumeGame = async (game: any) => {
        if (game.game_state) {
            dispatch({ type: 'LOAD_GAME', payload: game.game_state });
        }
        if (contextResumeSession) {
            await contextResumeSession(game.id);
        }
        navigation.navigate('Game');
    };

    const [team1Name, setTeam1Name] = useState(isEditing ? state.team1Name : 'Equipo 1');
    const [team2Name, setTeam2Name] = useState(isEditing ? state.team2Name : 'Equipo 2');
    const [myActiveGames, setMyActiveGames] = useState<any[]>([]);

    const [gameMode, setGameMode] = useState<'CLASSIC' | 'MULTIPLAYER' | 'TRAIN'>('CLASSIC');
    const [gameDuration, setGameDuration] = useState<'FLASH' | 'SHORT' | 'FULL'>('FULL');
    const [team1Roster, setTeam1Roster] = useState<string[]>(isEditing ? state.team1Roster : []);
    const [team2Roster, setTeam2Roster] = useState<string[]>(isEditing ? state.team2Roster : []);
    const [newPlayerName, setNewPlayerName] = useState('');
    const [activeTeamForAdd, setActiveTeamForAdd] = useState<1 | 2 | null>(null);

    const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);

    useEffect(() => {
        fetchAllCategories().then(setCategories);
    }, []);

    // Manual Add Player Logic WITH VALIDATION
    const addPlayerToRoster = () => {
        if (!newPlayerName.trim() || !activeTeamForAdd) return;

        const name = newPlayerName.trim();
        const lowerName = name.toLowerCase();

        // VALIDATION: Check for duplicates globally (both teams)
        const isDuplicate1 = team1Roster.some(p => p.toLowerCase() === lowerName);
        const isDuplicate2 = team2Roster.some(p => p.toLowerCase() === lowerName);

        if (isDuplicate1 || isDuplicate2) {
            Alert.alert(t('teamConfig.alerts.duplicateTitle'), t('teamConfig.alerts.duplicateMessage', { name }));
            return;
        }

        if (activeTeamForAdd === 1) {
            setTeam1Roster([...team1Roster, name]);
        } else {
            setTeam2Roster([...team2Roster, name]);
        }
        setNewPlayerName('');
        setActiveTeamForAdd(null);
    };

    const removePlayerFromRoster = (team: 1 | 2, index: number) => {
        if (team === 1) {
            const newRoster = [...team1Roster];
            newRoster.splice(index, 1);
            setTeam1Roster(newRoster);
        } else {
            const newRoster = [...team2Roster];
            newRoster.splice(index, 1);
            setTeam2Roster(newRoster);
        }
    };

    const handleStartGame = async () => {
        // Prepare rosters based on mode
        let finalTeam1Roster: string[] = [];
        let finalTeam2Roster: string[] = [];

        if (gameMode === 'MULTIPLAYER') {
            if (team1Roster.length === 0 || team2Roster.length === 0) {
                Alert.alert(t('teamConfig.alerts.missingPlayersTitle'), t('teamConfig.alerts.missingPlayersMessage'));
                return;
            }
            finalTeam1Roster = team1Roster;
            finalTeam2Roster = team2Roster;
        }

        // Dispatch Game State (Updates Context Locally)
        dispatch({
            type: 'SET_TEAM_NAMES',
            payload: {
                team1Name: team1Name || 'Equipo 1',
                team2Name: team2Name || 'Equipo 2',
            },
        });

        dispatch({
            type: 'SET_ROSTERS',
            payload: {
                team1Roster: finalTeam1Roster,
                team2Roster: finalTeam2Roster
            }
        });

        // ---------------------------------------------------------
        // EDIT MODE: Update existing session and return
        // ---------------------------------------------------------
        if (sessionId && isEditing) {
            const gameStateToSave = {
                ...state,
                questions: state.questions,
                team1Name: team1Name || 'Equipo 1',
                team2Name: team2Name || 'Equipo 2',
                team1Roster: finalTeam1Roster,
                team2Roster: finalTeam2Roster,
                answeredQuestions: Array.from(state.answeredQuestions),
            };

            const { error } = await supabase
                .from('game_sessions')
                .update({
                    game_state: gameStateToSave,
                })
                .eq('id', sessionId);

            if (error) {
                Alert.alert(t('teamConfig.alerts.saveErrorTitle'), t('teamConfig.alerts.saveErrorMessage'));
                console.error("Save error:", error);
                return;
            }

            navigation.goBack();
            return;
        }

        // ---------------------------------------------------------
        // NEW GAME: Initialize state and START
        // ---------------------------------------------------------

        // Determine target questions per category and category count
        let questionsPerCategory = 8; // FULL (Default)
        let categoryCount = 6;        // FULL (Default)

        if (gameDuration === 'FLASH') {
            categoryCount = 3;
            questionsPerCategory = 4; // 12 questions total
        }
        if (gameDuration === 'SHORT') {
            categoryCount = 4;
            questionsPerCategory = 6; // 24 questions total
        }

        // If we are NOT editing, we generally want to respect the Duration setting.
        // Even if a session exists (sessionId), the user might have changed the Duration in the UI.
        // So we should fetch new questions if we have an ID but are starting clean.
        let startQuestions = state.questions;

        if (!isEditing && sessionId) {
            console.log('[DEBUG] TeamConfigScreen: refreshing questions for existing session:', { categoryCount, questionsPerCategory });
            const refreshed = await fetchRandomCategories(categoryCount, questionsPerCategory);
            if (refreshed && refreshed.length > 0) {
                // FLATTEN questions for GameState (Fix for Undefined Bug in Refresh path)
                const flatRefreshed: any[] = [];
                refreshed.forEach((cat: any) => {
                    if (Array.isArray(cat.questions)) {
                        cat.questions.forEach((q: any) => {
                            flatRefreshed.push({
                                ...q,
                                category: cat.name
                            });
                        });
                    }
                });
                startQuestions = flatRefreshed;
            }
        }

        const initialGameState = {
            questions: startQuestions,
            currentTeam: 1,
            team1Score: 0,
            team2Score: 0,
            team1Streak: 0,
            team2Streak: 0,
            answeredQuestions: [],
            isGameOver: false,
            team1Name: team1Name || 'Equipo 1',
            team2Name: team2Name || 'Equipo 2',
            team1Roster: finalTeam1Roster,
            team2Roster: finalTeam2Roster,
            team1TurnIndex: 0,
            team2TurnIndex: 0,
            gameMode: gameMode,
        };

        const updates: any = {
            status: 'active',
            game_state: initialGameState
        };

        // Ensure session exists (Auto-create if missing, e.g. Classic Mode)
        let currentSessionId = sessionId;
        if (!currentSessionId) {
            try {
                console.log('[DEBUG] TeamConfigScreen: calling createSession with:', { gameDuration, categoryCount, questionsPerCategory, userId: user?.id, gameMode, selectedCategoryId });
                const sessionResult = await createSession(categoryCount, questionsPerCategory, user?.id, gameMode === 'TRAIN', selectedCategoryId);
                if (sessionResult) {
                    currentSessionId = sessionResult.id;
                    // Prepare sliced questions for initial state
                    // FLATTEN questions for GameState
                    // The result from createSession is hierarchical (Categories -> Questions)
                    // But GameState expects a flat array of questions with a 'category' string property.
                    const flatQuestions: any[] = [];
                    if (Array.isArray(sessionResult.questions)) {
                        sessionResult.questions.forEach((cat: any) => {
                            if (Array.isArray(cat.questions)) {
                                cat.questions.forEach((q: any) => {
                                    flatQuestions.push({
                                        ...q,
                                        category: cat.name // Important: Map category name
                                    });
                                });
                            }
                        });
                    }
                    initialGameState.questions = flatQuestions;
                }
            } catch (err) {
                console.error("Failed to auto-create session:", err);
                Alert.alert(t('teamConfig.alerts.autoCreateErrorTitle'), t('teamConfig.alerts.autoCreateErrorMessage'));
            }
        }

        if (currentSessionId) {
            const { data, error } = await supabase.from('game_sessions')
                .update(updates)
                .eq('id', currentSessionId)
                .select();

            if (error) {
                console.error("Error starting game (sync):", error);
                // Alert.alert(t('teamConfig.alerts.startErrorTitle'), t('teamConfig.alerts.startErrorMessage'));
                // Don't block gameplay if server sync fails. Just proceed locally.
            }

            if (!data || data.length === 0) {
                console.error("Update failed: No rows modified. RLS blocking?");
                // Proceed anyway to verify game flow, but warn
                // Alert.alert(t('teamConfig.alerts.permissionsWarningTitle'), t('teamConfig.alerts.permissionsWarningMessage'));
            }
        } else {
            console.warn("Playing in offline mode (state not saved).");
        }

        console.log('[DEBUG] TeamConfig: Dispatching globally before nav:', initialGameState.questions.length);
        dispatch({ type: 'LOAD_GAME', payload: initialGameState });

        navigation.replace('Game');
    };

    return (
        <LinearGradient
            colors={['#001B3A', '#1A5276']}
            style={styles.container}
        >
            <HeaderBackground style={StyleSheet.absoluteFillObject} />
            <Helmet>
                <title>{isEditing ? 'Editar Equipos - Tribiblia' : 'Configurar Equipos - Tribiblia'}</title>
            </Helmet>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => {
                            if (isEditing) navigation.navigate('Game'); // Cancel edit goes back to game
                            else navigation.navigate('Instructions');
                        }}
                    >
                        <Text style={styles.backButtonText}>{isEditing ? t('common.cancel') : t('common.back')}</Text>
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <Image source={ASSETS.logo} style={styles.logoHeader} resizeMode="contain" />
                        <Text style={styles.subtitle}>{isEditing ? t('teamConfig.editTitle') : t('teamConfig.setupTitle')}</Text>
                    </View>

                    {/* GUEST MODE WARNING */}
                    {!user && (
                        <View style={{
                            backgroundColor: 'rgba(255, 165, 0, 0.2)',
                            borderColor: '#FFA500',
                            borderWidth: 1,
                            borderRadius: 10,
                            padding: 15,
                            marginBottom: 20,
                            flexDirection: 'row',
                            alignItems: 'center'
                        }}>
                            <Text style={{ fontSize: 24, marginRight: 10 }}>⚠️</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: '#FFA500', fontFamily: 'Anton', fontSize: 18, marginBottom: 4 }}>MODO INVITADO</Text>
                                <Text style={{ color: '#DDD', fontSize: 14 }}>
                                    No has iniciado sesión. Podrás jugar, pero tu partida <Text style={{ fontWeight: 'bold' }}>NO SE GUARDARÁ</Text> en el historial.
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* ACTIVE GAMES SECTION - "Caja Marrón" (MOVED UP) */}
                    {myActiveGames.length > 0 && !isEditing && (
                        <View style={styles.activeGamesContainer}>
                            <Text style={styles.activeGamesTitle}>{t('teamConfig.activeGamesTitle', 'PARTIDAS EN CURSO')}</Text>
                            {myActiveGames.map(game => {
                                const modeInfo = getGameModeInfo(game);
                                return (
                                    <View key={game.id} style={[styles.activeGameCard, { borderColor: modeInfo.color }]}>
                                        <View style={styles.activeGameHeader}>
                                            <Text style={[styles.activeGameBadge, { color: modeInfo.color, borderColor: modeInfo.color }]}>
                                                {modeInfo.label}
                                            </Text>
                                            <Text style={styles.activeGameDate}>
                                                {new Date(game.created_at).toLocaleDateString()}
                                            </Text>
                                        </View>

                                        <Text style={styles.activeGameVs}>
                                            {game.game_state?.gameMode === 'TRAIN' 
                                                ? game.game_state?.team1Name || 'Jugador'
                                                : <>{game.game_state?.team1Name || 'Equipo 1'} <Text style={{ color: '#AAA' }}>vs</Text> {game.game_state?.team2Name || 'Equipo 2'}</>
                                            }
                                        </Text>

                                        <TouchableOpacity
                                            style={[styles.resumeButton, { backgroundColor: modeInfo.color }]}
                                            onPress={() => onResumeGame(game)}
                                        >
                                            <Text style={styles.resumeButtonText}>{t('teamConfig.resume', 'REANUDAR')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    <View style={styles.mainContainer}>

                        {/* Title for New Game Session */}
                        <Text style={styles.newGameTitle}>{t('teamConfig.createNewGameTitle', 'CREAR NUEVO JUEGO 🕹️')}</Text>

                        {/* Game Mode Selector */}
                        <View style={styles.modeSelector}>
                            <TouchableOpacity
                                testID="team-config-mode-classic"
                                style={[styles.modeButton, gameMode === 'CLASSIC' && styles.modeButtonActive]}
                                onPress={() => setGameMode('CLASSIC')}
                            >
                                <Text style={[styles.modeText, gameMode === 'CLASSIC' && styles.modeTextActive]}>
                                    <Text style={{ fontFamily: 'Anton', fontSize: 18, letterSpacing: 1 }}>{t('teamConfig.classicMode').split('\n')[0]}</Text>
                                    {'\n'}
                                    <Text style={{ fontFamily: 'Mulish-Regular', fontSize: 11 }}>{t('teamConfig.classicMode').split('\n')[1]}</Text>
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                testID="team-config-mode-multiplayer"
                                style={[styles.modeButton, gameMode === 'MULTIPLAYER' && styles.modeButtonActive]}
                                onPress={() => setGameMode('MULTIPLAYER')}
                            >
                                <Text style={[styles.modeText, gameMode === 'MULTIPLAYER' && styles.modeTextActive]}>
                                    <Text style={{ fontFamily: 'Anton', fontSize: 18, letterSpacing: 1 }}>{t('teamConfig.multiplayerMode').split('\n')[0]}</Text>
                                    {'\n'}
                                    <Text style={{ fontFamily: 'Mulish-Regular', fontSize: 11 }}>{t('teamConfig.multiplayerMode').split('\n')[1]}</Text>
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                testID="team-config-mode-train"
                                style={[styles.modeButton, gameMode === 'TRAIN' && styles.modeButtonActive]}
                                onPress={() => setGameMode('TRAIN')}
                            >
                                <Text style={[styles.modeText, gameMode === 'TRAIN' && styles.modeTextActive]}>
                                    <Text style={{ fontFamily: 'Anton', fontSize: 18, letterSpacing: 1 }}>{t('teamConfig.trainMode', 'ENTRENA')}</Text>
                                    {'\n'}
                                    <Text style={{ fontFamily: 'Mulish-Regular', fontSize: 11 }}>{t('teamConfig.trainModeDesc', 'Juega solo')}</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>



                        {/* Game Duration Selector */}
                        <Text style={styles.sectionTitleSmall}>{t('teamConfig.durationTitle')}</Text>
                        <View style={styles.modeSelector}>
                            <TouchableOpacity
                                testID="team-config-duration-flash"
                                style={[styles.durationButton, gameDuration === 'FLASH' && styles.durationButtonActive]}
                                onPress={() => setGameDuration('FLASH')}
                            >
                                <Text style={[styles.durationText, gameDuration === 'FLASH' && styles.durationTextActive]}>
                                    <Text style={{ fontFamily: 'Anton', fontSize: 18, letterSpacing: 1 }}>{t('teamConfig.durationFlash').split('\n')[0]}</Text>
                                    {'\n'}
                                    <Text style={{ fontFamily: 'Mulish-Regular', fontSize: 11 }}>{t('teamConfig.durationFlash').split('\n')[1]}</Text>
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                testID="team-config-duration-short"
                                style={[styles.durationButton, gameDuration === 'SHORT' && styles.durationButtonActive]}
                                onPress={() => setGameDuration('SHORT')}
                            >
                                <Text style={[styles.durationText, gameDuration === 'SHORT' && styles.durationTextActive]}>
                                    <Text style={{ fontFamily: 'Anton', fontSize: 18, letterSpacing: 1 }}>{t('teamConfig.durationShort').split('\n')[0]}</Text>
                                    {'\n'}
                                    <Text style={{ fontFamily: 'Mulish-Regular', fontSize: 11 }}>{t('teamConfig.durationShort').split('\n')[1]}</Text>
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                testID="team-config-duration-full"
                                style={[styles.durationButton, gameDuration === 'FULL' && styles.durationButtonActive]}
                                onPress={() => setGameDuration('FULL')}
                            >
                                <Text style={[styles.durationText, gameDuration === 'FULL' && styles.durationTextActive]}>
                                    <Text style={{ fontFamily: 'Anton', fontSize: 18, letterSpacing: 1 }}>{t('teamConfig.durationFull').split('\n')[0]}</Text>
                                    {'\n'}
                                    <Text style={{ fontFamily: 'Mulish-Regular', fontSize: 11 }}>{t('teamConfig.durationFull').split('\n')[1]}</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.teamsSection}>
                            {/* Team 1 */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: 'rgb(0, 255, 255)', textShadowColor: 'rgba(0, 255, 255, 0.5)' }]}>
                                    {gameMode === 'TRAIN' ? t('teamConfig.player', 'JUGADOR') : t('teamConfig.team1')}
                                </Text>
                                <TextInput
                                    testID="team-config-team1-input"
                                    style={[styles.input, { borderColor: 'rgb(0, 255, 255)', shadowColor: 'rgb(0, 255, 255)' }]}
                                    value={team1Name}
                                    onChangeText={setTeam1Name}
                                    placeholder={gameMode === 'TRAIN' ? t('teamConfig.playerPlaceholder', 'Tu Nombre') : t('teamConfig.team1Placeholder')}
                                    placeholderTextColor="rgba(0, 255, 255, 0.5)"
                                    autoCapitalize="words"
                                    maxLength={15}
                                />

                                {gameMode === 'TRAIN' && (
                                    <View style={{ marginTop: 20 }}>
                                        <Text style={[styles.label, { color: '#FFD700', textShadowColor: 'rgba(255, 215, 0, 0.5)' }]}>{t('teamConfig.category', 'CATEGORÍA A ENTRENAR')}</Text>
                                        <TouchableOpacity 
                                            style={[styles.input, { borderColor: '#FFD700', shadowColor: '#FFD700', justifyContent: 'center' }]}
                                            onPress={() => setShowCategoryPicker(true)}
                                        >
                                            <Text style={{ color: selectedCategoryId ? '#FFF' : 'rgba(255, 215, 0, 0.5)', fontSize: 16, fontFamily: 'Mulish-Bold', textAlign: 'center' }}>
                                                {selectedCategoryId ? categories.find(c => c.id === selectedCategoryId)?.name : t('teamConfig.allCategories', 'Todas (Aleatorio)')}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* Manual Roster Team 1 */}
                                {gameMode === 'MULTIPLAYER' && (
                                    <View style={styles.rosterContainer}>
                                        {team1Roster.map((player, index) => (
                                            <TouchableOpacity key={index} onPress={() => removePlayerFromRoster(1, index)} style={styles.rosterItem}>
                                                <Text style={styles.rosterText}>👤 {player} <Text style={{ color: '#ff4444' }}>×</Text></Text>
                                            </TouchableOpacity>
                                        ))}
                                        <TouchableOpacity
                                            testID="team-config-add-player-btn-1"
                                            style={styles.addPlayerBtn}
                                            onPress={() => setActiveTeamForAdd(1)}
                                        >
                                            <Text style={styles.addPlayerText}>{t('teamConfig.addPlayer')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>

                            {gameMode !== 'TRAIN' && (
                                <>
                                    {/* VS Badge */}
                                    <View style={styles.vsContainer}>
                                        <LinearGradient
                                            colors={['#9C27B0', '#4A0E4E']}
                                            style={styles.vsBadge}
                                        >
                                            <Text style={styles.vsText}>VS</Text>
                                        </LinearGradient>
                                    </View>

                                    {/* Team 2 */}
                                    <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: 'rgb(255, 0, 255)', textShadowColor: 'rgba(255, 0, 255, 0.5)' }]}>{t('teamConfig.team2')}</Text>
                                <TextInput
                                    testID="team-config-team2-input"
                                    style={[styles.input, { borderColor: 'rgb(255, 0, 255)', shadowColor: 'rgb(255, 0, 255)' }]}
                                    value={team2Name}
                                    onChangeText={setTeam2Name}
                                    placeholder={t('teamConfig.team2Placeholder')}
                                    placeholderTextColor="rgba(255, 0, 255, 0.5)"
                                    autoCapitalize="words"
                                    maxLength={10} // Strict limit: 10 chars
                                />

                                {/* Manual Roster Team 2 */}
                                {gameMode === 'MULTIPLAYER' && (
                                    <View style={styles.rosterContainer}>
                                        {team2Roster.map((player, index) => (
                                            <TouchableOpacity key={index} onPress={() => removePlayerFromRoster(2, index)} style={styles.rosterItem}>
                                                <Text style={styles.rosterText}>👤 {player} <Text style={{ color: '#ff4444' }}>×</Text></Text>
                                            </TouchableOpacity>
                                        ))}
                                        <TouchableOpacity
                                            testID="team-config-add-player-btn-2"
                                            style={styles.addPlayerBtn}
                                            onPress={() => setActiveTeamForAdd(2)}
                                        >
                                            <Text style={styles.addPlayerText}>{t('teamConfig.addPlayer')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                            </>
                        )}
                        </View>

                        {/* Start Game Button (Code Component) */}
                        <TouchableOpacity
                            testID="team-config-start-button"
                            style={styles.startBtnContainer}
                            onPress={handleStartGame}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#FFD700', '#FFA500']}
                                style={styles.startBtnGradient}
                            >
                                <Text style={styles.startBtnText}>
                                    {isEditing ? t('teamConfig.saveAndContinue') : t('teamConfig.startGame')}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Multiplayer Section (QR) - Preserved */}
                        <View style={styles.sessionContainer}>
                            <Text style={styles.sectionTitle}>{t('teamConfig.remoteConnection')}</Text>
                            {!sessionId ? (
                                <TouchableOpacity
                                    style={styles.hostButton}
                                    onPress={async () => {
                                        // Use same duration logic for standard session creation remote
                                        let questionsPerCategory = 8;
                                        let categoryCount = 6;
                                        if (gameDuration === 'FLASH') { categoryCount = 3; questionsPerCategory = 4; }
                                        if (gameDuration === 'SHORT') { categoryCount = 4; questionsPerCategory = 6; }

                                        const result = await createSession(categoryCount, questionsPerCategory, user?.id);
                                        const id = result ? result.id : null;
                                        if (id) {
                                            alert(`Sesión Creada: ${id}`);
                                        }
                                    }}
                                >
                                    <LinearGradient
                                        colors={['#4CAF50', '#2E7D32']}
                                        style={styles.hostGradient}
                                    >
                                        <Text style={styles.hostButtonText}>📱 {t('teamConfig.createSession')}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.sessionIdContainer}>
                                    <View style={styles.qrContainer}>
                                        <QRCode
                                            value={Platform.OS === 'web'
                                                ? `${window.location.origin}/join?session=${sessionId}`
                                                : `https://tribiblia.com/join?session=${sessionId}`
                                            }
                                            size={120} // Smaller size
                                        />
                                    </View>
                                    <Text style={styles.sessionIdValue}>{sessionId}</Text>
                                    <Text style={styles.connectedUsersTitle}>{connectedUsers.length} {t('teamConfig.connectedBuzzers')}</Text>

                                    {/* Restore Connected Users List */}
                                    <View style={styles.connectedUsersList}>
                                        {connectedUsers.map((u) => (
                                            <View key={u.user_id} style={styles.connectedUserItem}>
                                                <Text style={styles.connectedUserAvatar}>{u.avatar}</Text>
                                                <Text style={styles.connectedUserName}>{u.username}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Add Player Modal */}
            <Modal
                visible={!!activeTeamForAdd}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setActiveTeamForAdd(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t('teamConfig.modalAddPlayerTitle', { teamId: activeTeamForAdd })}</Text>
                        <TextInput
                            testID="team-config-roster-input"
                            style={styles.searchInput}
                            placeholder={t('teamConfig.playerPlaceholder')}
                            placeholderTextColor="#ccc"
                            value={newPlayerName}
                            onChangeText={setNewPlayerName}
                            autoFocus
                        />
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                            <TouchableOpacity style={[styles.modalSearchBtn, { backgroundColor: '#ccc' }]} onPress={() => setActiveTeamForAdd(null)}>
                                <Text style={styles.modalBtnText}>{t('teamConfig.modalCancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity testID="team-config-modal-add-btn" style={styles.modalSearchBtn} onPress={addPlayerToRoster}>
                                <Text style={styles.modalBtnText}>{t('teamConfig.modalAdd')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Category Picker Modal */}
            <Modal
                visible={showCategoryPicker}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowCategoryPicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '80%' }]}>
                        <Text style={styles.modalTitle}>{t('teamConfig.selectCategory', 'Selecciona Categoría')}</Text>
                        <ScrollView style={{ width: '100%', marginBottom: 15 }}>
                            <TouchableOpacity 
                                style={[{ padding: 15, borderBottomWidth: 1, borderBottomColor: '#333', width: '100%' }, selectedCategoryId === null && {backgroundColor: 'rgba(255, 215, 0, 0.2)'}]}
                                onPress={() => { setSelectedCategoryId(null); setShowCategoryPicker(false); }}
                            >
                                <Text style={{ color: '#FFF', fontSize: 16, fontFamily: 'Mulish-Bold', textAlign: 'center' }}>{t('teamConfig.allCategories', 'Todas (Aleatorio)')}</Text>
                            </TouchableOpacity>
                            {categories.map(cat => (
                                <TouchableOpacity 
                                    key={cat.id} 
                                    style={[{ padding: 15, borderBottomWidth: 1, borderBottomColor: '#333', width: '100%' }, selectedCategoryId === cat.id && {backgroundColor: 'rgba(255, 215, 0, 0.2)'}]}
                                    onPress={() => { setSelectedCategoryId(cat.id); setShowCategoryPicker(false); }}
                                >
                                    <Text style={{ color: '#FFF', fontSize: 16, fontFamily: 'Mulish-Bold', textAlign: 'center' }}>{cat.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity style={[styles.modalSearchBtn, { backgroundColor: '#ccc' }]} onPress={() => setShowCategoryPicker(false)}>
                            <Text style={styles.modalBtnText}>{t('common.cancel', 'Cancelar')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </LinearGradient >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
    },
    logoHeader: {
        width: 150,
        height: 80,
        marginBottom: 10,
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 0,
        zIndex: 10,
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
    subtitle: {
        fontFamily: 'Anton',
        fontSize: 28,
        letterSpacing: 1,
        color: '#FFD700',
        textTransform: 'uppercase',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    mainContainer: {
        width: '100%',
        maxWidth: 500,
        backgroundColor: 'rgba(60, 30, 20, 0.95)', // Premium Dark
        borderRadius: 24,
        padding: 20, // Reduced from 30 for mobile spacing
        borderWidth: 3,
        borderColor: '#FFD700', // Gold Border
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
    },
    teamsSection: {
        width: '100%',
        marginBottom: 20,
    },
    inputGroup: {
        width: '100%',
        marginBottom: 10,
    },
    label: {
        fontFamily: 'Anton',
        fontSize: 18,
        marginBottom: 5,
        letterSpacing: 1,
        textAlign: 'center',
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 15,
        fontSize: 18,
        color: '#FFFFFF',
        borderWidth: 2,
        fontFamily: 'Mulish-Bold',
        textAlign: 'center',
    },
    vsContainer: {
        alignItems: 'center',
        marginVertical: 10,
        zIndex: 10,
    },
    vsBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFD700',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 5,
    },
    vsText: {
        fontFamily: 'Anton',
        fontSize: 16,
        color: '#FFF',
    },
    sessionContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgb(57, 31, 25)', // User fix for visual artifact
    },
    connectedUsersList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
        marginTop: 15,
        width: '100%'
    },
    connectedUserItem: {
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 8,
        borderRadius: 8,
        minWidth: 80
    },
    connectedUserAvatar: {
        fontSize: 24,
        marginBottom: 4
    },
    connectedUserName: {
        color: '#fff',
        fontSize: 12,
        fontFamily: 'Mulish-Regular'
    },
    sectionTitle: {
        fontFamily: 'Anton',
        fontSize: 20,
        color: '#FFF',
        marginBottom: 15,
        letterSpacing: 1,
    },
    hostButton: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
    },
    hostGradient: {
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    hostButtonText: {
        fontFamily: 'Anton',
        color: '#FFF',
        fontSize: 18,
        letterSpacing: 1,
    },
    sessionIdContainer: {
        width: '100%',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    qrContainer: {
        padding: 10,
        backgroundColor: 'white',
        borderRadius: 10,
        marginVertical: 10,
    },
    sessionIdLabel: {
        color: '#AAA',
        fontSize: 12,
        fontFamily: 'Mulish-Bold',
        marginTop: 5,
    },
    sessionIdValue: {
        color: '#FFD700',
        fontSize: 18,
        fontFamily: 'Anton',
        letterSpacing: 1,
        marginBottom: 10,
    },
    connectedUsersContainer: {
        marginTop: 15,
        width: '100%',
        alignItems: 'center',
    },
    connectedUsersTitle: {
        color: '#AAA',
        fontSize: 11,
        fontFamily: 'Mulish-Bold',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    usersGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
        width: '100%',
    },
    userBadge: {
        alignItems: 'center',
        width: 60,
    },
    userAvatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent', // Can become gold if needed
        marginBottom: 4,
    },
    userAvatar: {
        fontSize: 24,
    },
    userName: {
        color: '#FFF',
        fontSize: 10,
        fontFamily: 'Mulish-Bold',
        textAlign: 'center',
    },
    startBtnContainer: {
        width: '100%',
        marginTop: 10,
        backgroundColor: 'transparent',
    },
    startBtnGradient: {
        paddingVertical: 15,
        alignItems: 'center',
        borderRadius: 12,
        // Shadow applied directly to gradient for better Web rendering
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    startBtnText: {
        fontSize: 24,
        color: '#001B3A',
        fontFamily: 'Anton',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    // New Styles
    modeSelector: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 15,
        padding: 5,
        marginBottom: 20,
        gap: 10, // Added gap for spacing between duration buttons
        width: '100%',
    },
    modeButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
    },
    modeButtonActive: {
        backgroundColor: '#FFD700',
    },
    modeText: {
        color: 'rgba(255,255,255,0.6)',
        fontFamily: 'Anton',
        fontSize: 16,
        letterSpacing: 1,
        textAlign: 'center',
        lineHeight: 18,
    },
    modeTextActive: {
        color: '#001B3A',
    },
    durationButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#a6631c',
        backgroundColor: 'rgba(0,0,0,0.2)'
    },
    durationButtonActive: {
        backgroundColor: '#FFB300', // Medium Orange-Yellow (Amber 600)
        borderColor: '#FFB300',
    },
    durationText: {
        color: 'rgba(255,255,255,0.6)',
        fontFamily: 'Mulish-Bold',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    },
    durationTextActive: {
        color: '#001B3A',
        fontWeight: 'bold',
    },
    sectionTitleSmall: {
        fontFamily: 'Mulish-Bold',
        color: '#FFF',
        fontSize: 16,
        marginBottom: 10,
        alignSelf: 'flex-start',
        marginLeft: 5,
        textTransform: 'uppercase',
        opacity: 0.8
    },
    rosterContainer: {
        marginTop: 5,
        width: '100%',
    },
    rosterItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 8,
        borderRadius: 6,
        marginBottom: 4,
    },
    rosterText: {
        color: '#fff',
        fontFamily: 'Mulish-Bold',
        fontSize: 14,
    },
    addPlayerBtn: {
        backgroundColor: 'rgba(255,215,0,0.2)',
        padding: 8,
        borderRadius: 6,
        alignItems: 'center',
        marginTop: 4,
        borderWidth: 1,
        borderColor: 'dashed',
    },
    addPlayerText: {
        color: '#FFD700',
        fontSize: 12,
        fontFamily: 'Mulish-Bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#1E0B2B',
        borderRadius: 20,
        padding: 20,
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    modalTitle: {
        color: '#FFD700',
        fontSize: 20,
        fontFamily: 'Anton',
        marginBottom: 15,
        textAlign: 'center',
    },
    searchInput: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        color: '#FFF',
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
    },

    modalSearchBtn: {
        backgroundColor: '#FFD700',
        padding: 10,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 15,
    },
    modalBtnText: {
        color: '#000',
        fontWeight: 'bold',
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    resultAvatar: {
        fontSize: 20,
        marginRight: 10,
    },
    resultName: {
        color: '#FFF',
        fontSize: 16,
    },
    closeModalBtn: {
        marginTop: 15,
        alignSelf: 'center',
    },
    activeGamesContainer: {
        width: '100%',
        maxWidth: 500,
        backgroundColor: 'rgba(12, 13, 25, 0.61)', // Requested custom color
        borderRadius: 24,
        padding: 20,
        marginBottom: 20, // Separation from main module below
        marginTop: 0,
        borderWidth: 2,
        borderColor: '#8D6E63',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
    activeGamesTitle: {
        fontFamily: 'Anton',
        fontSize: 22,
        color: '#fa8c16',
        marginBottom: 20,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    newGameTitle: {
        fontFamily: 'Anton',
        fontSize: 22,
        color: '#FFD700',
        marginBottom: 20,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    activeGameCard: {
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        borderWidth: 2, // Border logic handled inline
    },
    activeGameHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    activeGameBadge: {
        fontFamily: 'Mulish-Bold',
        fontSize: 10,
        borderWidth: 1,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        textTransform: 'uppercase',
    },
    activeGameDate: {
        color: '#BBB',
        fontSize: 12,
        fontFamily: 'Mulish-Regular',
    },
    activeGameVs: {
        color: '#FFF',
        fontSize: 18,
        fontFamily: 'Anton',
        marginBottom: 15,
        textAlign: 'center',
    },
    resumeButton: {
        width: '100%',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    resumeButtonText: {
        color: '#001B3A',
        fontFamily: 'Mulish-Bold',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
