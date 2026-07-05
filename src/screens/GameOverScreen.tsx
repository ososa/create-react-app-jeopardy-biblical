import React, { useEffect } from 'react';
import Animated, { FadeInDown, ZoomIn, BounceIn } from 'react-native-reanimated';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ImageBackground,
    useWindowDimensions,
} from 'react-native';
import { Helmet } from 'react-helmet-async';

import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform } from 'react-native';
import confetti from 'canvas-confetti';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import { ARCADE_THEME } from '../constants/theme';

import { RouteProp } from '@react-navigation/native';

type GameOverScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'GameOver'>;
    route: RouteProp<RootStackParamList, 'GameOver'>;
};

// Assets
const ASSETS = {
    background: require('../../assets/images/background_stars.png'),
    restartBtn: require('../../assets/images/button_green_restart.png'),
};

import { useTranslation } from 'react-i18next';

// ... (imports remain)

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ navigation, route }) => {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const dynamicStyles = {
        trophy: { fontSize: isMobile ? 60 : 80 },
        winnerLabel: { fontSize: isMobile ? 36 : 50 },
        winnerName: { fontSize: isMobile ? 42 : 60 },
        teamLabel: { fontSize: isMobile ? 20 : 28 },
        finalScore: { fontSize: isMobile ? 48 : 70 },
        containerPadding: { paddingHorizontal: isMobile ? 10 : 20 },
    };

    const { state, dispatch } = useGame();
    const { user, signOut, addExperience } = useAuth();
    const { t } = useTranslation(); // Hook
    const soundRef = React.useRef<Audio.Sound | null>(null);

    const winner = state.team1Score > state.team2Score
        ? state.team1Name
        : state.team2Score > state.team1Score
            ? state.team2Name
            : null;

    const handleRestart = () => {
        dispatch({ type: 'RESET_GAME' });
        navigation.replace('TeamConfig');
    };

    const handleExit = async () => {
        if (route.params?.returnTo === 'MyGames') {
            navigation.navigate('MyGames');
            return;
        }

        try {
            await signOut();
        } catch (error) {
            console.error("Error signing out:", error);
        }
        // AuthContext usually handles navigation on auth state change, 
        // but explicit replace helps ensure UI update if needed.
        // Assuming AuthStack picks it up, but for safety:
        // navigation.replace('Login'); // If purely stack based. 
        // If handled by MainNavigator conditional rendering, signOut() is enough.
        // Let's rely on signOut() triggering context update -> App.tsx re-render.
    };

    useEffect(() => {
        const playVictorySound = async () => {
            try {
                // Play fanfare
                const { sound } = await Audio.Sound.createAsync(
                    require('../../assets/sounds/streak_bonus.mp3') // Use waiting/victory sound
                );
                soundRef.current = sound;
                await sound.playAsync();


            } catch (error) {
                console.error("Error playing sound", error);
            }
        };

        playVictorySound();

        // Award XP for finishing the game
        if (user) {
            const xpReward = state.gameMode === 'TRAIN' ? 20 : 50; // Reduced XP for training
            addExperience(xpReward).catch(console.error);
        }

        // Fire Confetti
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            // since particles fall down, start a bit higher than random
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => {
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
            clearInterval(interval);
        };
    }, []);

    return (
        <LinearGradient
            colors={['rgb(0, 27, 58)', '#0D3B66', '#1A5276']}
            style={styles.container}
        >
            <Helmet>
                <title>{t('gameOver.title')} - Tribiblia</title>
                <meta name="description" content="Resultados finales de la partida de Tribiblia." />
            </Helmet>
            <View style={[styles.content, dynamicStyles.containerPadding]}>
                {/* Trophy */}
                <Animated.Text
                    entering={ZoomIn.duration(1000)}
                    style={[styles.trophy, dynamicStyles.trophy]}
                >
                    🏆
                </Animated.Text>

                {/* Winner Announcement */}
                <Animated.View entering={FadeInDown.delay(500).duration(800)}>
                    {state.gameMode === 'TRAIN' ? (
                        <>
                            <Text style={[styles.winnerLabel, dynamicStyles.winnerLabel]}>{t('teamConfig.trainMode', 'MODO ENTRENA')}</Text>
                            <Text style={[styles.winnerName, dynamicStyles.winnerName]}>{t('gameOver.trainingComplete', 'ENTRENAMIENTO COMPLETADO')}</Text>
                        </>
                    ) : winner ? (
                        <>
                            <Text style={[styles.winnerLabel, dynamicStyles.winnerLabel]}>{t('gameOver.title')}</Text>
                            <Text style={[styles.winnerName, dynamicStyles.winnerName]}>{t('gameOver.winner', { name: winner })}</Text>
                        </>
                    ) : (
                        <>
                            <Text style={[styles.winnerLabel, dynamicStyles.winnerLabel]}>{t('gameOver.title')}</Text>
                            <Text style={[styles.drawText, { fontSize: isMobile ? 30 : 40 }]}>{t('gameOver.draw')}</Text>
                        </>
                    )}
                </Animated.View>

                <Animated.View
                    entering={BounceIn.delay(1200)}
                    style={styles.xpContainer}
                >
                    <Text style={styles.xpText}>{t('gameOver.xpMessage')}</Text>
                </Animated.View>

                {/* Final Scores */}
                <Animated.View
                    entering={FadeInDown.delay(1600).springify()}
                    style={styles.scoresContainer}
                >
                    <View style={[
                        styles.scoreBox,
                        { borderColor: ARCADE_THEME.colors.neon.cyan },
                    ]}>
                        <Text style={[styles.teamLabel, dynamicStyles.teamLabel, { color: ARCADE_THEME.colors.neon.cyan }]}>{state.team1Name}</Text>
                        <Text style={[styles.finalScore, dynamicStyles.finalScore]}>{state.team1Score}</Text>
                    </View>

                    {state.gameMode !== 'TRAIN' && (
                        <>
                            <Text style={styles.versus}>VS</Text>

                            <View style={[
                                styles.scoreBox,
                                { borderColor: ARCADE_THEME.colors.neon.pink },
                            ]}>
                                <Text style={[styles.teamLabel, dynamicStyles.teamLabel, { color: ARCADE_THEME.colors.neon.pink }]}>{state.team2Name}</Text>
                                <Text style={[styles.finalScore, dynamicStyles.finalScore]}>{state.team2Score}</Text>
                            </View>
                        </>
                    )}
                </Animated.View>

                {/* Buttons */}
                <Animated.View
                    entering={FadeInDown.delay(2000)}
                    style={styles.buttonsContainer}
                >
                    <TouchableOpacity
                        style={{ width: '100%', borderRadius: 50, overflow: 'hidden' }}
                        onPress={handleRestart}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#4CAF50', '#2E7D32']}
                            style={{ paddingVertical: 15, alignItems: 'center' }}
                        >
                            <Text style={styles.exitText}>{t('gameOver.restart')}</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.exitButton}
                        onPress={handleExit}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.exitIcon}>X</Text>
                        <Text style={styles.exitText}>{t('game.exit')}</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    trophy: {
        fontSize: 80,
        marginBottom: 0,
        textShadowColor: ARCADE_THEME.colors.neon.yellow,
        textShadowRadius: 30,
    },
    winnerLabel: {
        fontFamily: 'Anton',
        fontSize: 50,
        color: ARCADE_THEME.colors.neon.yellow,
        textShadowColor: ARCADE_THEME.colors.neon.orange,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
        marginBottom: 0,
        textAlign: 'center',
    },
    winnerName: {
        fontFamily: 'Anton',
        fontSize: 60,
        color: '#ffa600ff',
        marginBottom: 0,
        textAlign: 'center',
        letterSpacing: 2,
    },
    drawText: {
        fontFamily: 'Anton',
        fontSize: 40,
        color: '#FFFFFF',
        marginBottom: 40,
        textAlign: 'center',
        letterSpacing: 2,
    },
    scoresContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        width: '100%',
        maxWidth: 800, // Constrain width on large screens
        gap: 20,
    },
    scoreBox: {
        alignItems: 'center',
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 15,
        padding: 15,
        borderWidth: 2,
    },
    teamLabel: {
        fontFamily: 'Anton',
        fontSize: 28, // Increased from 16
        marginBottom: 0,
        letterSpacing: 1,
    },
    finalScore: {
        fontFamily: 'Anton',
        fontSize: 70, // Increased from 40
        color: '#FFFFFF',
    },
    versus: {
        fontFamily: 'Anton',
        fontSize: 24,
        color: '#FFFFFF',
        fontStyle: 'italic',
    },
    buttonsContainer: {
        width: '100%',
        maxWidth: 350,
        alignItems: 'center',
        gap: 20,
    },
    imgButtonContainer: {
        width: '100%',
        height: 80,
    },
    imgButton: {
        width: '100%',
        height: '100%',
    },
    exitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 50,
        backgroundColor: '#FF9800',
        marginTop: 0,
        gap: 10,
    },
    exitIcon: {
        color: '#000000',
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'Anton', // Or system font for the X
    },
    exitText: {
        color: '#FFFFFF',
        fontFamily: 'Anton',
        fontSize: 24,
        letterSpacing: 2,
    },
    xpContainer: {
        backgroundColor: 'rgba(255, 215, 0, 0.2)',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FFD700',
        marginBottom: 30,
    },
    xpText: {
        color: '#FFD700',
        fontFamily: 'Anton',
        fontSize: 24,
        letterSpacing: 1,
    }
});
