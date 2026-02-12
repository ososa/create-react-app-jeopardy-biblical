import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert, Platform, Modal, KeyboardAvoidingView, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Helmet } from 'react-helmet-async';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { HeaderBackground } from '../components/HeaderBackground';
import { Footer } from '../components/Footer';
import { MaterialIcons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

type ResetPasswordScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'ResetPassword'>;
};

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ navigation }) => {
    const { updatePassword, completePasswordRecovery, signOut } = useAuth();
    const { t } = useTranslation();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleUpdatePassword = async () => {
        if (!password || !confirmPassword) {
            showAlert(t('common.error'), t('auth.errors.missingFields'));
            return;
        }

        if (password !== confirmPassword) {
            showAlert(t('common.error'), t('auth.errors.passwordMismatch'));
            return;
        }

        if (password.length < 6) {
            showAlert(t('common.error'), t('auth.errors.passwordTooShort'));
            return;
        }

        setLoading(true);
        const { error } = await updatePassword(password);
        setLoading(false);

        if (error) {
            showAlert(t('common.error'), error.message || t('auth.errors.updateError'));
        } else {
            showAlert(t('common.success'), t('auth.success.passwordUpdated'), async () => {
                completePasswordRecovery();
            });
        }
    };

    const showAlert = (title: string, message: string, onPress?: () => void) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
            if (onPress) onPress();
        } else {
            Alert.alert(title, message, onPress ? [{ text: 'OK', onPress }] : undefined);
        }
    };

    return (
        <LinearGradient colors={['#001B3A', '#0D3B66', '#1A5276']} style={styles.container}>
            <HeaderBackground style={StyleSheet.absoluteFillObject} />
            <Helmet>
                <title>{t('auth.resetPasswordTitle')} - Tribiblia</title>
            </Helmet>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.card}>
                        <Image
                            source={require('../../assets/images/logo_definitivo_v5.png')}
                            style={styles.logo}
                        />

                        <Text style={styles.title}>{t('auth.resetPasswordTitle')}</Text>
                        <Text style={styles.subtitle}>
                            {t('auth.resetPasswordSubtitle')}
                        </Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>{t('auth.newPasswordPlaceholder')}</Text>
                            <View style={{ width: '100%', position: 'relative' }}>
                                <TextInput
                                    style={[styles.input, { paddingRight: 50 }]}
                                    placeholder="******"
                                    placeholderTextColor="#999"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: 15,
                                        top: 0,
                                        bottom: 0,
                                        justifyContent: 'center',
                                        height: '100%'
                                    }}
                                >
                                    <MaterialIcons
                                        name={showPassword ? "visibility" : "visibility-off"}
                                        size={24}
                                        color="#AAA"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>{t('auth.confirmPasswordPlaceholder')}</Text>
                            <View style={{ width: '100%', position: 'relative' }}>
                                <TextInput
                                    style={[styles.input, { paddingRight: 50 }]}
                                    placeholder="******"
                                    placeholderTextColor="#999"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: 15,
                                        top: 0,
                                        bottom: 0,
                                        justifyContent: 'center',
                                        height: '100%'
                                    }}
                                >
                                    <MaterialIcons
                                        name={showConfirmPassword ? "visibility" : "visibility-off"}
                                        size={24}
                                        color="#AAA"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleUpdatePassword}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#FFD700', '#FFA500']}
                                style={styles.gradientButton}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#001B3A" />
                                ) : (
                                    <Text style={styles.submitButtonText}>{t('auth.updateButton').toUpperCase()}</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelLink}
                            onPress={() => signOut()}
                        >
                            <Text style={styles.cancelLinkText}>{t('auth.cancelBackToLogin')}</Text>
                        </TouchableOpacity>
                    </View>
                    <Footer />
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.1)',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    logo: {
        width: 180,
        height: 90,
        resizeMode: 'contain',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        color: '#FFD700',
        marginBottom: 10,
        fontFamily: 'Anton',
        textAlign: 'center',
        letterSpacing: 1,
        textShadowColor: 'rgba(255, 215, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#E0E0E0',
        textAlign: 'center',
        marginBottom: 30,
        fontFamily: 'Mulish-Regular',
        lineHeight: 22,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 20,
    },
    inputLabel: {
        color: '#FFD700',
        fontSize: 14,
        fontFamily: 'Mulish-Bold',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 20,
        fontSize: 16,
        color: '#FFFFFF',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        fontFamily: 'Mulish-Regular',
    },
    submitButton: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 20,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    gradientButton: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        fontSize: 18,
        color: '#001B3A',
        fontFamily: 'Anton',
        letterSpacing: 1,
    },
    cancelLink: {
        padding: 10,
    },
    cancelLinkText: {
        color: '#AAA',
        fontSize: 16,
        fontFamily: 'Mulish-Regular',
        textDecorationLine: 'underline',
    },
});
