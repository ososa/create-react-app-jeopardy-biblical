import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Animated,
    Modal,
    Dimensions,
    ActivityIndicator,
    useWindowDimensions,
    ImageBackground,
    Image,
    Platform,
} from 'react-native';
import { Helmet } from 'react-helmet-async';
import { HeaderBackground } from '../components/HeaderBackground';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useGame, Question } from '../context/GameContext';
import { supabase, fetchRandomCategories } from '../utils/supabase';

import { ARCADE_THEME } from '../constants/theme'; // Still import for fallback if needed, or remove if fully replaced.
import { useTheme } from '../context/ThemeContext';
import { AnimatedCard } from '../components/AnimatedCard';
import { useSound } from '../context/SoundContext';
import { useSession } from '../context/SessionContext';
import { GameMenu } from '../components/GameMenu';
import { FullScreenToggle } from '../components/FullScreenToggle';
import { Alert } from 'react-native';
import { ArcadeAlert } from '../components/ArcadeAlert';


const { width: SCREEN_WIDTH } = Dimensions.get('window');

type GameScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Game'>;
};

const TIMER_DURATION = 30;
const STREAK_BONUS = 50;
const STREAK_THRESHOLD = 3;

export const GameScreen: React.FC<GameScreenProps> = ({ navigation }) => {

    const { state, dispatch, handleCorrectAnswer, handleWrongAnswer } = useGame();
    const { t, i18n } = useTranslation();
    const { theme } = useTheme();
    const { playSound } = useSound();
    const { lastBuzz, buzzWinner, resetBuzzer, broadcastGameState, leaveSession, lastAnswer } = useSession(); // Listen for buzzes and answers

    // Responsive Dimensions (Correct Placement)
    const width = useWindowDimensions().width;
    const isDesktop = width > 768;
    const numColumns = isDesktop ? 4 : 2;
    const gap = 12;
    const padding = 20;

    // Helper to get localized content
    const getLocalizedContent = useCallback((q: Question) => {
        const lang = i18n.language || 'es'; // Default to 'es'

        // Handle Portuguese variants
        if (lang.startsWith('pt')) {
            return {
                question: q.question_pt || q.question, // Fallback to ES
                answer: q.answer_pt || q.answer,
                options: (q.options_pt && q.options_pt.length > 0) ? q.options_pt : q.options,
                reference: q.reference_pt || q.reference
            };
        }

        // Handle English
        if (lang.startsWith('en')) {
            return {
                question: q.question_en || q.question,
                answer: q.answer_en || q.answer,
                options: (q.options_en && q.options_en.length > 0) ? q.options_en : q.options,
                reference: q.reference_en || q.reference
            };
        }

        // Default Spanish
        return {
            question: q.question,
            answer: q.answer,
            options: q.options,
            reference: q.reference
        };
    }, [i18n.language]);

    const getCategoryDisplay = (category: string) => {
        const lowerCat = category.toLowerCase();
        if (lowerCat.includes('evangelio') || lowerCat.includes('gospel')) return t('categories.gospels');
        if (lowerCat.includes('xodo') || lowerCat.includes('exodus')) return t('categories.exodus');
        if (lowerCat.includes('nesis')) return t('categories.genesis');
        if (lowerCat.includes('hechos') || lowerCat.includes('acts') || lowerCat.includes('atos')) return t('categories.acts');
        if (lowerCat.includes('profeta') || lowerCat.includes('prophet')) return t('categories.prophets');
        if (lowerCat.includes('antiguo') || lowerCat.includes('old') || lowerCat.includes('antigo')) return t('categories.old_testament');
        if (lowerCat.includes('nuevo') || lowerCat.includes('new') || lowerCat.includes('novo')) return t('categories.new_testament');
        if (lowerCat.includes('milagros') || lowerCat.includes('miracles') || lowerCat.includes('milagres')) return t('categories.miracles');
        if (lowerCat.includes('reyes') || lowerCat.includes('king') || lowerCat.includes('reis')) return t('categories.kings');
        if (lowerCat.includes('geograf') || lowerCat.includes('geography')) return t('categories.geography');
        if (lowerCat.includes('mujer') || lowerCat.includes('women') || lowerCat.includes('mulher')) return t('categories.women');
        return category;
    };

    // Constrain max width for better desktop experience
    const MAX_BOARD_WIDTH = 1000;
    const contentWidth = Math.min(width, MAX_BOARD_WIDTH);
    const availableWidth = contentWidth - padding;

    // Use Math.floor to avoid sub-pixel wrapping issues
    const cardWidth = Math.floor((availableWidth - (gap * (numColumns - 1))) / numColumns);

    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [showBonusModal, setShowBonusModal] = useState(false);
    const [bonusTeam, setBonusTeam] = useState<1 | 2>(1);
    const [timer, setTimer] = useState(TIMER_DURATION);

    // Animation refs
    const modalFadeAnim = useRef(new Animated.Value(0)).current;
    const modalScaleAnim = useRef(new Animated.Value(0.8)).current;
    const bonusFadeAnim = useRef(new Animated.Value(0)).current;
    const teamIndicatorScale = useRef(new Animated.Value(1)).current;

    // Timer ref
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const { sessionId } = useSession();

    const saveGame = async () => {
        if (!sessionId) return;

        const gameState = {
            questions: state.questions, // Store questions to keep consistency if they were shuffled/selected
            currentTeam: state.currentTeam,
            team1Score: state.team1Score,
            team2Score: state.team2Score,
            team1Streak: state.team1Streak,
            team2Streak: state.team2Streak,
            answeredQuestions: Array.from(state.answeredQuestions), // Convert Set to Array
            team1Name: state.team1Name,
            team2Name: state.team2Name,
            team1Roster: state.team1Roster,
            team2Roster: state.team2Roster,
            team1TurnIndex: state.team1TurnIndex,
            team2TurnIndex: state.team2TurnIndex,
        };

        try {
            await supabase.from('game_sessions').update({
                game_state: gameState,
                // optionally update updated_at if it exists
            }).eq('id', sessionId);
            console.log("Game Saved");
        } catch (e) {
            console.error("Error saving game", e);
        }
    };

    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title?: string;
        message: string;
        type?: 'info' | 'success' | 'warning' | 'error' | 'confirm';
        confirmText?: string;
        cancelText?: string;
        onConfirm: () => void;
        onCancel: () => void;
    }>({
        visible: false,
        message: '',
        onConfirm: () => { },
        onCancel: () => { }
    });

    const handleExit = async () => {
        const performExit = async () => {
            setAlertConfig(prev => ({ ...prev, visible: false })); // Close modal first
            // Save before exit
            await saveGame();
            await leaveSession();
            dispatch({ type: 'RESET_GAME' });
            navigation.replace('TeamConfig');
        };

        setAlertConfig({
            visible: true,
            title: t('game.exitConfirmTitle', '¿Salir del juego?'),
            message: t('game.exitConfirmMessage', '¿Estás seguro que quieres salir? Tu progreso se guardará automáticamente.'),
            type: 'confirm',
            confirmText: t('common.confirm', 'Confirmar'),
            cancelText: t('common.cancel', 'Cancelar'),
            onConfirm: performExit,
            onCancel: () => setAlertConfig(prev => ({ ...prev, visible: false }))
        });
    };

    const handleEditTeams = async () => {
        await saveGame(); // Save current state
        navigation.navigate('TeamConfig', { isEditing: true });
    };


    // Load questions from Supabase only if not already loaded (e.g. from session creation)
    useEffect(() => {
        if (state.questions.length > 0) return;

        const loadQuestions = async () => {
            try {
                // Use the shared fetchRandomCategories logic to ensure consistent structure and languages
                console.log("[GameScreen] Fetching fallback questions...");
                const categoryCount = 6;
                const questionsLimit = 5;
                const categories = await fetchRandomCategories(categoryCount, questionsLimit);

                if (categories && categories.length > 0) {
                    // Flatten questions for GameState
                    const flatQuestions: Question[] = [];
                    categories.forEach((cat: any) => {
                        if (Array.isArray(cat.questions)) {
                            cat.questions.forEach((q: any) => {
                                flatQuestions.push({
                                    ...q,
                                    category: cat.name // Ensure category name matches parent
                                });
                            });
                        }
                    });

                    if (flatQuestions.length > 0) {
                        dispatch({ type: 'SET_QUESTIONS', payload: flatQuestions });
                        return;
                    }
                }

                // Absolute fallback if above fails
                console.warn("[GameScreen] Fallback to sample/generic questions");
                dispatch({ type: 'SET_QUESTIONS', payload: [] }); // Or sampleQuestions if available

            } catch (error) {
                console.error('Error loading questions:', error);
            }
        };

        loadQuestions();
    }, [state.questions.length]);

    // Keep screen awake
    useEffect(() => {
        activateKeepAwakeAsync();
        return () => {
            deactivateKeepAwake();
        };
    }, []);



    // Team indicator animation
    useEffect(() => {
        Animated.sequence([
            Animated.timing(teamIndicatorScale, {
                toValue: 1.1,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(teamIndicatorScale, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    }, [state.currentTeam]);

    // Auto-save on game state changes (scores, turns, answered count)
    useEffect(() => {
        if (!sessionId) return;

        // Debounce save to avoid too many writes if rapid changes occur (though unlikely in this game pace)
        const timeout = setTimeout(() => {
            saveGame();
        }, 1000);

        return () => clearTimeout(timeout);
    }, [
        state.team1Score,
        state.team2Score,
        state.answeredQuestions.size,
        state.currentTeam,
        state.team1TurnIndex,
        state.team2TurnIndex
    ]);

    // Navigate to game over when finished
    useEffect(() => {
        if (state.isGameOver) {
            // Mark session as finished in DB
            if (sessionId) {
                // Ensure final state is saved
                saveGame().then(() => {
                    supabase.from('game_sessions')
                        .update({
                            status: 'finished',
                            finished_at: new Date().toISOString()
                        })
                        .eq('id', sessionId)
                        .then(() => navigation.replace('GameOver'));
                });
            } else {
                navigation.replace('GameOver');
            }
        }
    }, [state.isGameOver, navigation]);

    // Group questions by category
    const categorizedQuestions = useMemo(() => {
        const categories: { [key: string]: Question[] } = {};
        state.questions.forEach((q) => {
            if (!categories[q.category]) {
                categories[q.category] = [];
            }
            categories[q.category].push(q);
        });
        return categories;
    }, [state.questions]);

    // Helper to shuffle array
    const shuffleArray = (array: string[]) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };

    const [currentOptions, setCurrentOptions] = useState<string[]>([]);

    const openQuestion = (question: Question) => {
        if (state.answeredQuestions.has(question.id)) return;

        setSelectedQuestion(question);

        // Get localized content first
        const loc = getLocalizedContent(question);

        // Shuffle options and store in state
        const shuffled = shuffleArray(loc.options || []);
        setCurrentOptions(shuffled);

        setTimer(TIMER_DURATION);
        setShowQuestionModal(true);

        // Start modal animation
        Animated.parallel([
            Animated.timing(modalFadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(modalScaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();

        // Broadcast to mobile with SHUFFLED options
        broadcastGameState({
            status: 'question_active',
            question: {
                category: question.category,
                value: question.points,
                question: loc.question,
                options: shuffled, // Use the shuffled array
                reference: loc.reference || question.reference
            }
        });
    };

    const closeQuestionModal = () => {
        // Timer stops automatically because showQuestionModal becomes false

        Animated.parallel([
            Animated.timing(modalFadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(modalScaleAnim, {
                toValue: 0.8,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setShowQuestionModal(false);
            setSelectedQuestion(null);
            // Broadcast idle state with scores
            broadcastGameState({
                status: 'idle',
                scores: {
                    team1: state.team1Score,
                    team2: state.team2Score
                }
            });
        });
    };

    // Feedback State
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackEmoji, setFeedbackEmoji] = useState(require('../../assets/images/emoji_happy.png'));
    const feedbackScaleAnim = useRef(new Animated.Value(0)).current;
    const feedbackShakeAnim = useRef(new Animated.Value(0)).current;

    // Listen for buzzes (Placed here to access showQuestionModal state)
    useEffect(() => {
        if (lastBuzz && showQuestionModal) {
            // Show who buzzed
            playSound('timeout'); // Or a specific buzz sound
            Alert.alert(t('game.buzz'), t('game.buzzMessage', { id: lastBuzz.user_id }));
        }
    }, [lastBuzz, showQuestionModal]);

    // Handle Remote Answer
    useEffect(() => {
        if (lastAnswer && showQuestionModal && selectedQuestion) {
            if (lastAnswer.user_id === buzzWinner) {
                console.log("Receiving remote answer:", lastAnswer.answer);
                handleAnswer(lastAnswer.answer);
            }
        }
    }, [lastAnswer, showQuestionModal, selectedQuestion, buzzWinner]);

    // ... (existing timer logic)

    // Handle Feedback (Visual + Audio)
    const showFeedback = useCallback(async (type: 'correct' | 'incorrect' | 'timeout') => {
        // 1. Select Emoji and Sound
        let emoji;
        let soundFile;

        switch (type) {
            case 'correct':
                emoji = require('../../assets/images/emoji_happy.png');
                break;
            case 'timeout':
                emoji = require('../../assets/images/clock.png'); // Use custom clock image
                break;
            case 'incorrect':
            default:
                emoji = require('../../assets/images/emoji_sad.png');
                break;
        }

        setFeedbackEmoji(emoji);
        setShowFeedbackModal(true);

        // 2. Play Sound
        await playSound(type);

        // 3. Animate Emoji
        // Reset shake
        feedbackShakeAnim.setValue(0);

        // Standard Scale Animation
        Animated.spring(feedbackScaleAnim, {
            toValue: 1,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
        }).start();

        // Shake for Timeout
        if (type === 'timeout') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(feedbackShakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                    Animated.timing(feedbackShakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
                    Animated.timing(feedbackShakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
                ]),
                { iterations: 10 }
            ).start();
        }

        // 4. Close after delay
        setTimeout(() => {
            Animated.timing(feedbackScaleAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start(() => {
                setShowFeedbackModal(false);
            });
        }, 2000); // Slightly longer for reaction
    }, [feedbackScaleAnim, feedbackShakeAnim]);

    // Feedback Message State
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [feedbackSubMessage, setFeedbackSubMessage] = useState('');

    const handleAnswer = (selectedAnswer: string) => {
        if (!selectedQuestion) return;

        // stop timer on answer
        setTimer((prev) => {
            return prev;
        });

        closeQuestionModal(); // Close question first to show feedback cleanly

        const loc = getLocalizedContent(selectedQuestion);

        if (selectedAnswer === loc.answer) {
            // Correct answer
            const result = handleCorrectAnswer(selectedQuestion.id, selectedQuestion.points);
            setFeedbackMessage(t('game.feedback.correct', '¡CORRECTA!'));
            setFeedbackSubMessage('');
            showFeedback('correct'); // Show Happy Emoji

            if (result.showBonus) {
                setBonusTeam(state.currentTeam);
                // Delay bonus slightly to let feedback show
                setTimeout(() => showBonus(), 1600);
            }
        } else {
            // Wrong answer
            handleWrongAnswer(selectedQuestion.id);
            setFeedbackMessage(t('game.feedback.incorrect', '¡INCORRECTA!'));
            setFeedbackSubMessage(loc.answer);
            resetBuzzer(); // Unlock buzzer for other team/players (Jeopardy Rules)
            showFeedback('incorrect'); // Show Sad Emoji
        }
    };

    const handleTimeOut = () => {
        if (!selectedQuestion) return;
        const loc = getLocalizedContent(selectedQuestion);
        handleWrongAnswer(selectedQuestion.id);
        resetBuzzer(); // Unlock
        closeQuestionModal();
        setFeedbackMessage(t('game.feedback.timeUp', '¡TIEMPO AGOTADO!'));
        setFeedbackSubMessage(loc.answer);
        showFeedback('timeout'); // Show Clock logic
    };

    const showBonus = async () => {
        // Play Bonus Sound
        await playSound('bonus');

        setShowBonusModal(true);
        Animated.timing(bonusFadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();

        // Auto close after 2 seconds
        setTimeout(() => {
            Animated.timing(bonusFadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => setShowBonusModal(false));
        }, 2000);
    };

    // Timer Countdown Effect
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (showQuestionModal && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [showQuestionModal, timer]);

    // Timeout Check Effect
    useEffect(() => {
        if (showQuestionModal && timer === 0) {
            handleTimeOut();
        }
    }, [timer, showQuestionModal, handleTimeOut]);

    if (state.isLoading) {
        return (
            <LinearGradient
                colors={[ARCADE_THEME.colors.background.primary, '#000000']}
                style={styles.loadingContainer}
            >
                <ActivityIndicator size="large" color={ARCADE_THEME.colors.neon.cyan} />
                <Text style={styles.loadingText}>{t('game.insertingCoin')}</Text>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={['rgb(0, 27, 58)', '#0D3B66', '#1A5276']} // Updated to rgb(0, 27, 58) as requested
            style={styles.container}
        >
            <Helmet>
                <title>Juego en Progreso - Tribiblia</title>
                <meta name="description" content="Partida en curso de Tribiblia. ¡Demuestra qué equipo sabe más de la Biblia!" />
            </Helmet>


            {/* Game Menu (Replaces Exit/Edit buttons) */}
            <GameMenu
                onEdit={handleEditTeams}
                onExit={handleExit}
                style={styles.gameMenu}
            />

            <FullScreenToggle style={styles.fullScreenButton} />

            {/* Score Header */}
            <View style={[styles.header, { overflow: 'hidden' }]}>
                {/* Header Background */}
                <HeaderBackground style={{ ...StyleSheet.absoluteFillObject, opacity: 1 }} />
                <View style={styles.teamScore}>
                    <Text style={[styles.teamName, { color: 'rgb(0, 255, 255)' }]}>
                        {state.team1Name.length > 10 ? state.team1Name.substring(0, 10) + '...' : state.team1Name}
                    </Text>
                    <View style={styles.scoreContainer}>
                        <Text style={styles.score}>{state.team1Score}</Text>
                    </View>
                    {state.team1Streak > 0 && (
                        <Text style={[styles.streak, { color: ARCADE_THEME.colors.neon.orange }]}>
                            🔥 {t('game.streak')}: {state.team1Streak}
                        </Text>
                    )}
                </View>

                {/* VS is now implicitly handled by the layout or we can keep it if space permits, 
                    but the menu might take up the center space. 
                    Let's check the layout. The user image shows the menu in the middle top. 
                    The header has 'space-between' usually? 
                    I'll keep the VS container but the Menu needs to be positioned absolutely to not mess with flex layout 
                    OR integrated into the header. 
                    The specific request was to add the menu. 
                    I'll use absolute positioning for the menu as per plan to ensure it sits on top.
                */}
                <View style={styles.vsContainer}>
                    {/* Hidden VS to maintain spacing if needed, or just let the menu sit there.
                        Actually, let's just keep the header as is and put the menu above everything with absolute position.
                     */}
                    <Text style={styles.vsText}>VS</Text>
                </View>

                <View style={styles.teamScore}>
                    <Text style={[styles.teamName, { color: 'rgb(255, 0, 255)' }]}>
                        {state.team2Name.length > 10 ? state.team2Name.substring(0, 10) + '...' : state.team2Name}
                    </Text>
                    <View style={[styles.scoreContainer, { borderColor: 'rgb(255, 0, 255)', ...ARCADE_THEME.shadows.neonGlow('rgb(255, 0, 255)') }]}>
                        <Text style={[styles.score, { color: 'rgb(255, 0, 255)' }]}>{state.team2Score}</Text>
                    </View>
                    {state.team2Streak > 0 && (
                        <Text style={[styles.streak, { color: ARCADE_THEME.colors.neon.orange }]}>
                            🔥 {t('game.streak')}: {state.team2Streak}
                        </Text>
                    )}
                </View>
            </View>

            {/* Current Team Indicator */}
            <Animated.View
                style={[
                    styles.currentTeamIndicator,
                    { transform: [{ scale: teamIndicatorScale }] },
                ]}
            >
                <LinearGradient
                    colors={
                        state.currentTeam === 1
                            ? [ARCADE_THEME.colors.neon.cyan, '#008B8B']
                            : [ARCADE_THEME.colors.neon.pink, '#8B008B']
                    }
                    style={styles.currentTeamGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Text style={styles.currentTeamText}>
                        {t('game.turn')}: {state.currentTeam === 1 ? state.team1Name : state.team2Name}
                        {(state.currentTeam === 1 ? state.team1Roster[state.team1TurnIndex] : state.team2Roster[state.team2TurnIndex])
                            ? ` - 👤 ${(state.currentTeam === 1 ? state.team1Roster[state.team1TurnIndex] : state.team2Roster[state.team2TurnIndex])}`
                            : ''}
                    </Text>
                </LinearGradient>
            </Animated.View>

            {/* Question Board */}
            <ScrollView style={styles.boardContainer} contentContainerStyle={styles.boardContent}>
                {Object.entries(categorizedQuestions || {}).map(([category, questions]) => (
                    <View key={category} style={styles.categoryRow}>
                        <View style={styles.categoryHeader}>
                            <Text style={styles.categoryText}>{getCategoryDisplay(category)}</Text>
                        </View>
                        <View style={styles.questionsRow}>
                            {(questions && Array.isArray(questions) ? questions : []).map((question) => {
                                if (!question) return null;
                                const isAnswered = state.answeredQuestions.has(question.id);
                                return (
                                    <AnimatedCard
                                        key={question.id}
                                        width={cardWidth} // Pass calculated width
                                        style={{ aspectRatio: 1.6 }} // Removed marginBottom: gap to rely on flex gap
                                        isFlipped={isAnswered}
                                        onPress={() => openQuestion(question)}
                                        disabled={isAnswered}
                                        front={
                                            <View
                                                style={[
                                                    {
                                                        width: '100%',
                                                        height: '100%',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        borderRadius: 12,
                                                        borderWidth: 3,
                                                        borderColor: 'rgba(213, 0, 249, 0.6)', // Neon Purple 60%
                                                    },
                                                    Platform.OS === 'web' ? {
                                                        // @ts-ignore - CSS Custom Properties
                                                        '--s': '80px',
                                                        '--c1': '#2D1B4E', // Adjusted to deep purple to match
                                                        '--c2': '#1E0B2B', // The requested Dark Purple
                                                        '--_g': '#0000 calc(-650%/13) calc(50%/13),var(--c1) 0 calc(100%/13),#0000 0 calc(150%/13),var(--c1) 0 calc(200%/13),#0000 0 calc(250%/13),var(--c1) 0 calc(300%/13)',
                                                        '--_g0': 'repeating-linear-gradient( 45deg,var(--_g))',
                                                        '--_g1': 'repeating-linear-gradient(-45deg,var(--_g))',
                                                        background: 'var(--_g0),var(--_g0) var(--s) var(--s),var(--_g1),var(--_g1) var(--s) var(--s) var(--c2)',
                                                        backgroundSize: 'calc(2*var(--s)) calc(2*var(--s))',
                                                    } : {
                                                        backgroundColor: '#1E0B2B', // Fallback for native
                                                    }
                                                ]}
                                            >
                                                <Text style={{
                                                    fontFamily: theme.typography.fontFamily.display,
                                                    fontSize: 38,
                                                    color: '#FFFFFF',
                                                    textShadowColor: '#D500F9', // Neon glow
                                                    textShadowRadius: 10
                                                }}>
                                                    {question.points}
                                                </Text>
                                            </View>
                                        }
                                        back={
                                            <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0c0d19', borderRadius: 12, borderWidth: 3, borderColor: 'rgb(70, 70, 117)' }}>
                                                <Text style={{ fontFamily: 'Anton', color: 'rgb(70, 70, 117)', fontSize: 20, letterSpacing: 1.5 }}>{t('game.done')}</Text>
                                            </View>
                                        }
                                    />
                                );
                            })}
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Question Modal */}
            <Modal visible={showQuestionModal} transparent animationType="none">
                <Animated.View
                    style={[
                        styles.modalOverlay,
                        { opacity: modalFadeAnim },
                    ]}
                >
                    <Animated.View
                        style={[
                            styles.modalContent,
                            {
                                opacity: modalFadeAnim,
                                transform: [{ scale: modalScaleAnim }],
                            },
                        ]}
                    >
                        {selectedQuestion && (
                            <>
                                <View style={styles.timerContainer}>
                                    <Text style={[styles.timerText, timer <= 10 && styles.timerUrgent]}>
                                        {timer}
                                    </Text>

                                </View>

                                {/* Get Localized Data */}
                                {(() => {
                                    const loc = getLocalizedContent(selectedQuestion);
                                    return (
                                        <>
                                            <Text style={styles.modalCategory}>{getCategoryDisplay(selectedQuestion.category)}</Text>
                                            <Text style={styles.modalQuestion}>{loc.question}</Text>
                                            {loc.reference && (
                                                <Text style={styles.modalReference}>{loc.reference}</Text>
                                            )}

                                            <View style={styles.optionsContainer}>
                                                {currentOptions && Array.isArray(currentOptions) ? (
                                                    currentOptions.map((option, index) => (
                                                        <TouchableOpacity
                                                            key={index}
                                                            style={styles.optionButton}
                                                            onPress={() => handleAnswer(option)}
                                                            activeOpacity={0.7}
                                                        >
                                                            <LinearGradient
                                                                colors={[ARCADE_THEME.colors.background.secondary, ARCADE_THEME.colors.background.tertiary]}
                                                                style={styles.optionGradient}
                                                            >
                                                                <Text style={styles.optionText}>{option}</Text>
                                                            </LinearGradient>
                                                        </TouchableOpacity>
                                                    ))
                                                ) : (
                                                    <Text style={{ color: 'red' }}>Error: Options missing or invalid.</Text>
                                                )}
                                            </View>
                                        </>
                                    );
                                })()}
                            </>
                        )}
                    </Animated.View>
                </Animated.View>
            </Modal>

            {/* Bonus Modal */}
            <Modal visible={showBonusModal} transparent animationType="none">
                <Animated.View style={[styles.bonusOverlay, { opacity: bonusFadeAnim }]}>
                    <View style={styles.bonusContent}>
                        <Text style={styles.bonusStar}>⭐</Text>
                        <Text style={styles.bonusTitle}>{t('game.bonus')}</Text>
                        <Text style={styles.bonusTeam}>
                            {bonusTeam === 1 ? state.team1Name : state.team2Name}
                        </Text>
                        <Text style={styles.bonusPoints}>+{STREAK_BONUS} {t('game.points')}</Text>
                    </View>
                </Animated.View>
            </Modal>

            {/* Feedback Modal (Emojis) */}
            {/* Feedback Modal (Emojis) */}
            {/* Feedback Modal (Emojis) */}
            <Modal visible={showFeedbackModal} transparent animationType="none">
                <Animated.View
                    style={[
                        styles.feedbackOverlay,
                        {
                            transform: [
                                { scale: feedbackScaleAnim },
                                {
                                    rotate: feedbackShakeAnim.interpolate({
                                        inputRange: [-10, 10],
                                        outputRange: ['-10deg', '10deg']
                                    })
                                }
                            ]
                        }
                    ]}
                >
                    {/* If emoji is a string (like the clock), render Text, else Image */}
                    {typeof feedbackEmoji === 'string' ? (
                        <Text style={{ fontSize: 150 }}>{feedbackEmoji}</Text>
                    ) : (
                        <Image source={feedbackEmoji} style={styles.feedbackEmoji} />
                    )}

                    {feedbackMessage ? (
                        <Text style={styles.feedbackText}>{feedbackMessage}</Text>
                    ) : null}

                    {feedbackSubMessage ? (
                        <Text style={styles.feedbackSubText}>
                            {t('game.feedback.correctAnswerIs', 'La respuesta correcta es:')}{'\n'}
                            <Text style={{ color: 'rgb(85, 255, 254)' }}>{feedbackSubMessage}</Text>
                        </Text>
                    ) : null}
                </Animated.View>
            </Modal>

            {/* Custom Arcade Alert */}
            <ArcadeAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                confirmText={alertConfig.confirmText}
                cancelText={alertConfig.cancelText}
                onConfirm={alertConfig.onConfirm}
                onCancel={alertConfig.onCancel}
            />
        </LinearGradient>
    );
};

const sampleQuestions: Question[] = [
    {
        id: 1,
        category: 'Old Testament',
        question: 'Who led the Israelites out of Egypt?',
        options: ['Moses', 'Joshua', 'Aaron', 'David'],
        answer: 'Moses',
        points: 100,
    },
    {
        id: 2,
        category: 'Old Testament',
        question: 'What did God create on the first day?',
        options: ['Light', 'Animals', 'Man', 'Plants'],
        answer: 'Light',
        points: 200,
    },
    {
        id: 3,
        category: 'New Testament',
        question: 'Where was Jesus born?',
        options: ['Bethlehem', 'Nazareth', 'Jerusalem', 'Galilee'],
        answer: 'Bethlehem',
        points: 100,
    },
    {
        id: 4,
        category: 'New Testament',
        question: 'Who betrayed Jesus?',
        options: ['Judas', 'Peter', 'John', 'Matthew'],
        answer: 'Judas',
        points: 200,
    },
    {
        id: 5,
        category: 'Prophets',
        question: 'Who was swallowed by a great fish?',
        options: ['Jonah', 'Daniel', 'Elijah', 'Isaiah'],
        answer: 'Jonah',
        points: 100,
    },
    {
        id: 6,
        category: 'Prophets',
        question: 'Who challenged the prophets of Baal?',
        options: ['Elijah', 'Elisha', 'Samuel', 'Nathan'],
        answer: 'Elijah',
        points: 200,
    },
];

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fullScreenButton: {
        position: 'absolute',
        top: 20,
        right: 20, // Right aligned
        zIndex: 150, // Higher than menu if needed, though menu is center
    },
    // ... other styles
    loadingText: {
        fontFamily: 'Anton',
        fontSize: 24,
        color: ARCADE_THEME.colors.neon.green,
        marginTop: 20,
        letterSpacing: 2,
    },
    gameMenu: {
        position: 'absolute',
        top: 0, // Glued to top edge as requested
        height: 50, // Height to contain menu
        zIndex: 50,
        alignSelf: 'center', // Center horizontally
    },
    header: {
        backgroundColor: '#001B3A', // Assigned as requested
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 15,
        paddingTop: 45, // Increased to 45 as requested by user testing
        paddingBottom: 10,
    },
    teamScore: {
        alignItems: 'center',
        flex: 1,
    },
    teamName: {
        fontFamily: 'Anton',
        fontSize: 20,    // Reduced to 20 as requested
        color: '#FFF',
        marginBottom: 5,
        letterSpacing: 1,
    },
    scoreContainer: {
        borderWidth: 2,
        borderColor: 'rgb(0, 255, 255)',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 5,
        backgroundColor: 'rgba(0,0,0,0.5)',
        minWidth: 80,
        alignItems: 'center',
        ...ARCADE_THEME.shadows.neonGlow('rgb(0, 255, 255)'),
    },
    score: {
        fontFamily: 'Anton',
        fontSize: 32,
        color: 'rgb(0, 255, 255)',
    },
    streak: {
        fontFamily: 'Anton',
        fontSize: 20,
        marginTop: 5,
    },
    vsContainer: {
        paddingHorizontal: 10,
        paddingTop: 25,
        minWidth: 140, // Reverted to 140 for balanced spacing
        alignItems: 'center',
    },
    vsText: {
        fontFamily: 'Anton',
        fontSize: 50,
        color: '#FFF',
        fontStyle: 'italic',
    },
    currentTeamIndicator: {
        marginHorizontal: 0, // Removed horizontal margin as requested
        marginVertical: 0, // Removed vertical margin as requested
        borderRadius: 0, // Removed border radius as requested
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    currentTeamGradient: {
        paddingVertical: 10,
        alignItems: 'center',
    },
    currentTeamText: {
        fontFamily: 'Anton',
        fontSize: 25,
        fontStyle: 'italic',
        color: '#fff',
        letterSpacing: 1,
    },

    boardContainer: {
        flex: 1,
        width: '100%',
        marginTop: 0,
        flexGrow: 1, // Fix for Silk/Web flex sizing
        minHeight: 0, // Allow shrinking to fit available space
        ...Platform.select({
            web: {
                overflowY: 'auto', // Force scroll on web
            } as any
        }),
    },
    boardContent: {
        padding: 10,
        alignItems: 'center',
        width: '100%',
    },
    categoryRow: {
        marginBottom: 20,
        width: '100%',
        alignItems: 'center',
    },
    categoryHeader: {
        marginBottom: 10,
        alignItems: 'center',
    },
    categoryText: {
        fontFamily: 'Anton',
        fontSize: 25,
        // Removed italic to fix emoji rendering
        color: 'rgb(15, 223, 223)',
        textShadowColor: 'rgb(16, 44, 74)',
        textShadowRadius: 10,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    questionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
        maxWidth: 1000,
    },
    questionCard: {
        aspectRatio: 1.6,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: ARCADE_THEME.colors.neon.purple,
    },
    answeredCard: {
        borderColor: '#333',
        opacity: 0.6,
    },
    questionGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pointsText: {
        fontFamily: 'Anton',
        fontSize: 35, // Restored to 35
        color: '#FFF',
        textShadowColor: ARCADE_THEME.colors.neon.purple,
        textShadowRadius: 8,
    },
    answeredText: {
        color: '#666',
        fontSize: 16,
        textShadowRadius: 0,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1a1a2e',
        borderRadius: 20,
        padding: 25,
        width: '100%',
        maxWidth: 500,
        borderWidth: 2,
        borderColor: ARCADE_THEME.colors.neon.green,
        ...ARCADE_THEME.shadows.neonGlow(ARCADE_THEME.colors.neon.green),
    },
    timerContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    timerText: {
        fontFamily: 'Anton',
        fontSize: 48,
        color: '#FFF',
    },
    timerUrgent: {
        color: '#7ffc50', // User specific green
        textShadowColor: 'transparent',
        textShadowRadius: 0,
        textShadowOffset: { width: 0, height: 0 },
        elevation: 0,
    },
    modalCategory: {
        fontFamily: 'Anton',
        fontSize: 16,
        color: 'rgb(15, 223, 223)',
        textAlign: 'center',
        marginBottom: 5,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    modalQuestion: {
        fontFamily: 'Mulish-Bold',
        fontSize: 24,
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 5,
        lineHeight: 32,
        fontWeight: '600',
    },
    modalReference: {
        fontFamily: 'Mulish-Regular',
        fontSize: 16,
        color: ARCADE_THEME.colors.neon.cyan,
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: 25,
        opacity: 0.8,
    },
    optionsContainer: {
        gap: 15,
    },
    optionButton: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: ARCADE_THEME.colors.neon.cyan,
    },
    optionGradient: {
        paddingVertical: 18,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    optionText: {
        fontFamily: 'Mulish-Bold',
        fontSize: 18,
        color: '#FFF',
        textAlign: 'center',
    },
    bonusOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bonusContent: {
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderRadius: 30,
        padding: 50,
        borderWidth: 4,
        borderColor: ARCADE_THEME.colors.neon.yellow,
        ...ARCADE_THEME.shadows.neonGlow(ARCADE_THEME.colors.neon.yellow),
    },
    bonusStar: {
        fontSize: 80,
        marginBottom: 20,
    },
    bonusTitle: {
        fontFamily: 'Anton',
        fontSize: 36,
        color: ARCADE_THEME.colors.neon.yellow,
        marginBottom: 10,
        textShadowColor: ARCADE_THEME.colors.neon.orange,
        textShadowRadius: 15,
    },
    bonusTeam: {
        fontFamily: 'Anton',
        fontSize: 28,
        color: '#FFF',
        marginBottom: 15,
    },
    bonusPoints: {
        fontFamily: 'Anton',
        fontSize: 40,
        color: ARCADE_THEME.colors.neon.green,
        textShadowColor: '#00FF00',
        textShadowRadius: 20,
    },
    // Feedback Styles
    feedbackOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    feedbackEmoji: {
        width: 150,
        height: 150,
    },
    feedbackText: {
        fontFamily: 'Anton',
        fontSize: 32,
        color: '#FFF',
        marginTop: 20,
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowRadius: 5,
        textShadowOffset: { width: 2, height: 2 },
    },
    feedbackSubText: {
        fontFamily: 'Mulish-Bold',
        fontSize: 24,
        color: '#FFFFFF',
        marginTop: 10,
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowRadius: 4,
    },
});
