import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSession } from '../context/SessionContext';
import { useTheme } from '../context/ThemeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type ControllerScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Controller'>;
};

import { useTranslation } from 'react-i18next';

// ...

export const ControllerScreen: React.FC<ControllerScreenProps> = ({ navigation }) => {
    const { buzzIn, submitAnswer, leaveSession, gameState, buzzWinner, username, connectedUsers } = useSession();
    const { theme } = useTheme();
    const { t } = useTranslation();
    const [buzzed, setBuzzed] = useState(false);

    // Cleanup session on unmount (back button or close)
    useEffect(() => {
        return () => {
            leaveSession();
        };
    }, []);

    // Get my avatar
    const myAvatar = connectedUsers.find(u => u.username === username)?.avatar || '👤';

    // Determine state
    // If buzzWinner is set and it's ME -> Show "WINNER" (Green)
    // If buzzWinner is set and it's NOT ME -> Show "LOCKED" (Gray/Dark Red)
    // If no winner -> Normal Buzzer

    const isSuccess = buzzWinner === username;
    const isLocked = buzzWinner !== null && !isSuccess;

    const handleBuzz = async () => {
        if (buzzWinner) return; // double check
        setBuzzed(true);
        Vibration.vibrate(100);
        await buzzIn();

        // Optimistic UI handled by state, but 'buzzed' just shows immediate feedback
        setTimeout(() => setBuzzed(false), 2000);
    };

    const isQuestionActive = gameState?.status === 'question_active';
    const currentQuestion = gameState?.question;

    // Dynamic Styles for Button
    let buttonStyle = styles.buzzerIdle;
    let buttonColor = '#D00000';
    let buttonText = t('controller.buzz');

    if (isSuccess) {
        buttonStyle = styles.buzzerSuccess;
        buttonColor = '#00D000';
        // If we have options, we hide the text "BUZZED" on the button to focus on options, or keep it?
        // Let's keep it but make it smaller or just say "WINNER"
        buttonText = currentQuestion?.options ? "🏆" : t('controller.buzzed');
    } else if (isLocked) {
        buttonStyle = styles.buzzerLocked;
        buttonColor = '#555';
        buttonText = t('controller.winner', { name: buzzWinner });
    } else if (buzzed) {
        buttonStyle = styles.buzzerActive;
        buttonText = t('controller.buzzed');
    }

    return (
        <LinearGradient colors={['#050510', '#000000']} style={styles.container}>
            <Text style={[styles.header, { fontFamily: theme.typography.fontFamily.display }]}>
                {isQuestionActive
                    ? `${currentQuestion.value} ${t('controller.points')}`
                    : t('controller.welcome', { avatar: myAvatar, name: username })}
            </Text>

            {isQuestionActive && (
                <View style={styles.questionInfo}>
                    <Text style={styles.categoryText}>{currentQuestion.category}</Text>
                    <Text style={styles.questionText}>{currentQuestion.question}</Text>
                    {/* Reference Display */}
                    {currentQuestion?.reference && (
                        <Text style={styles.referenceText}>
                            {currentQuestion.reference}
                        </Text>
                    )}
                </View>
            )}



            {!isSuccess && (
                <TouchableOpacity
                    style={[
                        styles.buzzerButton,
                        buttonStyle,
                        { shadowColor: isSuccess ? '#00FF00' : (isLocked ? '#000' : '#ff0000') }
                    ]}
                    activeOpacity={0.7}
                    onPress={handleBuzz}
                    disabled={!isQuestionActive || isLocked || isSuccess}
                >
                    <View style={[styles.buzzerInner, (!isQuestionActive || isLocked) && { borderColor: '#555' }]}>
                        <Text style={[styles.buzzerText, (isLocked) && { fontSize: 24 }]}>
                            {buttonText}
                        </Text>
                    </View>
                </TouchableOpacity>
            )}

            {/* Answer Options for Winner */}
            {isSuccess && isQuestionActive && currentQuestion?.options && (
                <View style={styles.optionsContainer}>
                    <Text style={styles.selectAnswerText}>{t('controller.selectAnswer')}</Text>
                    <View style={styles.optionsList}>
                        {currentQuestion.options.map((option: string, index: number) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.optionButton}
                                onPress={() => submitAnswer(option)}
                            >
                                <Text style={styles.optionText}>{option}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            <Text style={styles.instructions}>
                {isQuestionActive ? t('controller.instructionsActive') : t('controller.instructionsIdle')}
            </Text>

            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 40 }}>
                <Text style={{ color: '#aaa', fontFamily: 'Mulish-Regular' }}>{t('controller.exit')}</Text>
            </TouchableOpacity>

            {/* DEBUG INFO - REMOVE LATER */}
            <Text style={{ position: 'absolute', bottom: 10, left: 10, color: '#444', fontSize: 10 }}>
                Me: {username} | Winner: {String(buzzWinner)}
            </Text>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        fontSize: 48, // Increased size
        color: '#FFFFFF',
        marginBottom: 5, // Reduced space to bring category closer
        textAlign: 'center',
    },
    buzzerButton: {
        width: 260,
        height: 260,
        borderRadius: 130,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 15,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.6,
        shadowRadius: 15,
    },
    buzzerIdle: {
        backgroundColor: '#D00000',
        borderWidth: 6,
        borderColor: '#8B0000',
    },
    buzzerActive: {
        backgroundColor: '#00D000',
        borderWidth: 6,
        borderColor: '#fff',
        transform: [{ scale: 0.95 }],
    },
    buzzerSuccess: {
        backgroundColor: '#00cc00',
        borderWidth: 6,
        borderColor: '#FFD700',
        transform: [{ scale: 1.05 }],
        shadowColor: '#00FF00',
        shadowRadius: 20,
    },
    buzzerLocked: {
        backgroundColor: '#2a0000',
        borderWidth: 3,
        borderColor: '#500000',
        opacity: 0.5,
    },
    buzzerInner: {
        width: 210,
        height: 210,
        borderRadius: 105,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buzzerText: {
        fontSize: 42,
        color: '#fff',
        fontFamily: 'Anton',
        letterSpacing: 2,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    instructions: {
        position: 'absolute',
        bottom: 30,
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
        width: '80%',
        fontFamily: 'Mulish-Regular'
    },
    questionInfo: {
        marginBottom: 20,
        padding: 0,
        width: '100%',
        alignItems: 'center'
    },
    categoryText: {
        color: '#00FFFF', // Cyan Neon
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 5,
        marginTop: 0, // Ensure no extra top space
        fontFamily: 'Mulish-ExtraBold',
        letterSpacing: 2,
        textTransform: 'uppercase'
    },
    referenceText: {
        color: 'rgb(0, 255, 255)', // Cyan as requested
        fontSize: 16,
        fontFamily: 'Mulish-Regular',
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: 5
    },
    questionContainer: {
        marginBottom: 20,
        padding: 20,
        borderRadius: 15,
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    questionText: {
        color: '#fff',
        fontSize: 18,
        textAlign: 'center',
        fontFamily: 'Mulish-Bold',
        lineHeight: 24
    },
    optionsContainer: {
        width: '100%',
        alignItems: 'center',
        marginTop: 10,
        flex: 1, // Take available space
    },
    selectAnswerText: {
        color: '#FFD700',
        fontSize: 24,
        marginBottom: 10,
        fontFamily: 'Anton',
        textAlign: 'center',
        letterSpacing: 2,
        textShadowColor: 'rgba(255, 215, 0, 0.4)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    optionsList: {
        width: '100%',
        gap: 12,
        paddingBottom: 20
    },
    optionButton: {
        width: '100%',
        paddingVertical: 18,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(20, 20, 40, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#00FFFF', // Cyan Neon
        shadowColor: '#00FFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 8,
    },
    optionText: {
        color: '#fff',
        fontSize: 18,
        textAlign: 'center',
        fontFamily: 'Mulish-Bold'
    }
});
