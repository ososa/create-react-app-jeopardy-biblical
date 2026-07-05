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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useGame, Question } from '../context/GameContext';
import { supabase } from '../utils/supabase';
import { ARCADE_THEME } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type GameScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Game'>;
};

const TIMER_DURATION = 30;
const STREAK_BONUS = 50;
const STREAK_THRESHOLD = 3;

export const GameScreen: React.FC<GameScreenProps> = ({ navigation }) => {
    const { state, dispatch, handleCorrectAnswer, handleWrongAnswer } = useGame();

    // Responsive Dimensions (Correct Placement)
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;
    const numColumns = isDesktop ? 4 : 2;
    const gap = 12;
    const padding = 20;

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

    // Sound refs
    const correctSoundRef = useRef<Audio.Sound | null>(null);
    const wrongSoundRef = useRef<Audio.Sound | null>(null);
    const bonusSoundRef = useRef<Audio.Sound | null>(null);

    // Load questions from Supabase
    useEffect(() => {
        const loadQuestions = async () => {
            try {
                const { data, error } = await supabase
                    .from('questions')
                    .select('*')
                    .order('id');

                if (error) throw error;

                if (data && data.length > 0) {
                    dispatch({ type: 'SET_QUESTIONS', payload: data });
                } else {
                    // Fallback: use sample questions
                    dispatch({ type: 'SET_QUESTIONS', payload: sampleQuestions });
                }
            } catch (error) {
                console.error('Error loading questions:', error);
                dispatch({ type: 'SET_QUESTIONS', payload: sampleQuestions });
            }
        };

        loadQuestions();
    }, []);

    // Keep screen awake
    useEffect(() => {
        activateKeepAwakeAsync();
        return () => {
            deactivateKeepAwake();
        };
    }, []);

    // Load sounds
    useEffect(() => {
        const loadSounds = async () => {
            try {
                const { sound: correctSound } = await Audio.Sound.createAsync(
                    require('../../assets/sounds/correct.mp3')
                );
                correctSoundRef.current = correctSound;

                const { sound: wrongSound } = await Audio.Sound.createAsync(
                    require('../../assets/sounds/incorrect.mp3')
                );
                wrongSoundRef.current = wrongSound;
            } catch (error) {
                console.log('Error loading sounds:', error);
            }
        };
        loadSounds();

        return () => {
            correctSoundRef.current?.unloadAsync();
            wrongSoundRef.current?.unloadAsync();
            bonusSoundRef.current?.unloadAsync();
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

    // Navigate to game over when finished
    useEffect(() => {
        if (state.isGameOver) {
            navigation.replace('GameOver');
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

    const openQuestion = (question: Question) => {
        if (state.answeredQuestions.has(question.id)) return;

        setSelectedQuestion(question);
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

        // Start timer
        timerRef.current = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    handleTimeOut();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const closeQuestionModal = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

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
        });
    };

    // Feedback State
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackEmoji, setFeedbackEmoji] = useState(require('../../assets/images/emoji_happy.png'));
    const feedbackScaleAnim = useRef(new Animated.Value(0)).current;

    // ... (existing timer logic)

    // Handle Feedback (Visual + Audio)
    const showFeedback = useCallback(async (isCorrect: boolean) => {
        // 1. Select Emoji
        const emoji = isCorrect
            ? require('../../assets/images/emoji_happy.png')
            : require('../../assets/images/emoji_sad.png');
        setFeedbackEmoji(emoji);
        setShowFeedbackModal(true);

        // 2. Play Sound (Placeholder)
        try {
            if (isCorrect) {
                // await correctSoundRef.current?.replayAsync();
                console.log('Playing Correct Sound');
            } else {
                // await wrongSoundRef.current?.replayAsync();
                console.log('Playing Wrong Sound');
            }
        } catch (error) {
            console.log('Error playing sound', error);
        }

        // 3. Animate Emoji
        Animated.spring(feedbackScaleAnim, {
            toValue: 1,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
        }).start();

        // 4. Close after delay
        setTimeout(() => {
            Animated.timing(feedbackScaleAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start(() => {
                setShowFeedbackModal(false);
            });
        }, 1500);
    }, [feedbackScaleAnim]);

    const handleAnswer = (selectedAnswer: string) => {
        if (!selectedQuestion) return;

        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        closeQuestionModal(); // Close question first to show feedback cleanly

        if (selectedAnswer === selectedQuestion.answer) {
            // Correct answer
            const result = handleCorrectAnswer(selectedQuestion.id, selectedQuestion.points);
            showFeedback(true); // Show Happy Emoji

            if (result.showBonus) {
                setBonusTeam(state.currentTeam);
                // Delay bonus slightly to let feedback show
                setTimeout(() => showBonus(), 1600);
            }
        } else {
            // Wrong answer
            handleWrongAnswer(selectedQuestion.id);
            showFeedback(false); // Show Sad Emoji
        }
    };

    const handleTimeOut = () => {
        if (!selectedQuestion) return;
        handleWrongAnswer(selectedQuestion.id);
        closeQuestionModal();
        showFeedback(false); // Show Sad Emoji on timeout
    };

    const showBonus = () => {
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

    if (state.isLoading) {
        return (
            <LinearGradient
                colors={[ARCADE_THEME.colors.background.primary, '#000000']}
                style={styles.loadingContainer}
            >
                <ActivityIndicator size="large" color={ARCADE_THEME.colors.neon.cyan} />
                <Text style={styles.loadingText}>INSERTING COIN...</Text>
            </LinearGradient>
        );
    }

    return (
        <ImageBackground
            source={require('../../assets/images/background_stars.png')}
            style={styles.container}
            resizeMode="cover"
        >
            {/* Exit Button */}
            <TouchableOpacity
                style={styles.exitButton}
                onPress={() => navigation.replace('TeamConfig')}
            >
                <Text style={styles.exitButtonText}>❌ EXIT</Text>
            </TouchableOpacity>

            {/* Score Header */}
            <View style={styles.header}>
                <View style={styles.teamScore}>
                    <Text style={[styles.teamName, { color: 'rgb(0, 255, 255)' }]}>{state.team1Name}</Text>
                    <View style={styles.scoreContainer}>
                        <Text style={styles.score}>{state.team1Score}</Text>
                    </View>
                    {state.team1Streak > 0 && (
                        <Text style={[styles.streak, { color: ARCADE_THEME.colors.neon.orange }]}>
                            🔥 STREAK: {state.team1Streak}
                        </Text>
                    )}
                </View>

                <View style={styles.vsContainer}>
                    <Text style={styles.vsText}>VS</Text>
                </View>

                <View style={styles.teamScore}>
                    <Text style={[styles.teamName, { color: 'rgb(255, 0, 255)' }]}>{state.team2Name}</Text>
                    <View style={[styles.scoreContainer, { borderColor: ARCADE_THEME.colors.neon.pink }]}>
                        <Text style={[styles.score, { color: ARCADE_THEME.colors.neon.pink }]}>{state.team2Score}</Text>
                    </View>
                    {state.team2Streak > 0 && (
                        <Text style={[styles.streak, { color: ARCADE_THEME.colors.neon.orange }]}>
                            🔥 STREAK: {state.team2Streak}
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
                        PLAYER {state.currentTeam}: {state.currentTeam === 1 ? state.team1Name : state.team2Name}
                    </Text>
                </LinearGradient>
            </Animated.View>

            {/* Question Board */}
            <ScrollView style={styles.boardContainer} contentContainerStyle={styles.boardContent}>
                {Object.entries(categorizedQuestions).map(([category, questions]) => (
                    <View key={category} style={styles.categoryRow}>
                        <View style={styles.categoryHeader}>
                            <Text style={styles.categoryText}>{category}</Text>
                        </View>
                        <View style={styles.questionsRow}>
                            {questions.map((question) => {
                                const isAnswered = state.answeredQuestions.has(question.id);
                                return (
                                    <TouchableOpacity
                                        key={question.id}
                                        style={[
                                            styles.questionCard,
                                            { width: cardWidth },
                                            isAnswered && styles.answeredCard
                                        ]}
                                        onPress={() => openQuestion(question)}
                                        disabled={isAnswered}
                                        activeOpacity={0.7}
                                    >
                                        <LinearGradient
                                            colors={isAnswered ? ['#1A1A1A', '#0D0D0D'] : ['#2A1B5E', '#191540']}
                                            style={styles.questionGradient}
                                        >
                                            <Text style={[styles.pointsText, isAnswered && styles.answeredText]}>
                                                {isAnswered ? 'DONE' : question.points}
                                            </Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
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

                                <Text style={styles.modalCategory}>{selectedQuestion.category}</Text>
                                <Text style={styles.modalQuestion}>{selectedQuestion.question}</Text>

                                <View style={styles.optionsContainer}>
                                    {selectedQuestion.options.map((option, index) => (
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
                                    ))}
                                </View>
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
                        <Text style={styles.bonusTitle}>COMBO X{STREAK_THRESHOLD}!</Text>
                        <Text style={styles.bonusTeam}>
                            {bonusTeam === 1 ? state.team1Name : state.team2Name}
                        </Text>
                        <Text style={styles.bonusPoints}>+{STREAK_BONUS} PTS</Text>
                    </View>
                </Animated.View>
            </Modal>

            {/* Feedback Modal */}
            <Modal visible={showFeedbackModal} transparent animationType="none">
                <Animated.View style={[styles.feedbackOverlay, { transform: [{ scale: feedbackScaleAnim }] }]}>
                    <Image source={feedbackEmoji} style={styles.feedbackEmoji} resizeMode="contain" />
                </Animated.View>
            </Modal>
        </ImageBackground>
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
    loadingText: {
        fontFamily: 'Anton',
        fontSize: 24,
        color: ARCADE_THEME.colors.neon.green,
        marginTop: 20,
        letterSpacing: 2,
    },
    exitButton: {
        position: 'absolute',
        top: 10,
        left: 20,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    exitButtonText: {
        color: '#FFF',
        fontFamily: 'Anton',
        fontSize: 14,
        letterSpacing: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 15,
        paddingTop: 50,
        paddingBottom: 10,
    },
    teamScore: {
        alignItems: 'center',
        flex: 1,
    },
    teamName: {
        fontFamily: 'Anton',
        fontSize: 30,
        color: '#FFF',
        marginBottom: 5,
        letterSpacing: 1,
    },
    scoreContainer: {
        borderWidth: 2,
        borderColor: ARCADE_THEME.colors.neon.cyan,
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 5,
        backgroundColor: 'rgba(0,0,0,0.5)',
        minWidth: 80,
        alignItems: 'center',
        ...ARCADE_THEME.shadows.neonGlow(ARCADE_THEME.colors.neon.cyan),
    },
    score: {
        fontFamily: 'Anton',
        fontSize: 32,
        color: ARCADE_THEME.colors.neon.cyan,
    },
    streak: {
        fontFamily: 'Anton',
        fontSize: 20,
        marginTop: 5,
        textShadowColor: ARCADE_THEME.colors.neon.orange,
        textShadowRadius: 5,
    },
    vsContainer: {
        paddingHorizontal: 10,
        paddingTop: 25,
    },
    vsText: {
        fontFamily: 'Anton',
        fontSize: 50,
        color: '#FFF',
        fontStyle: 'italic',
    },
    currentTeamIndicator: {
        marginHorizontal: 15,
        marginVertical: 10,
        borderRadius: 8,
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
        fontSize: 30,
        fontStyle: 'italic',
        color: '#fff',
        letterSpacing: 1,
    },

    boardContainer: {
        flex: 1,
        width: '100%',
        marginTop: 10,
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
        fontStyle: 'italic',
        color: ARCADE_THEME.colors.neon.yellow,
        textShadowColor: ARCADE_THEME.colors.neon.orange,
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
        textShadowColor: ARCADE_THEME.colors.neon.cyan,
        textShadowRadius: 10,
    },
    timerUrgent: {
        color: ARCADE_THEME.colors.neon.pink,
        textShadowColor: 'red',
    },
    modalCategory: {
        fontFamily: 'Anton',
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        marginBottom: 5,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    modalQuestion: {
        fontFamily: 'Mulish',
        fontSize: 24,
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 32,
        fontWeight: '600',
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
        width: 300,
        height: 300,
    },
});
