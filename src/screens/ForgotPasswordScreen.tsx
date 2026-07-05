import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Helmet } from 'react-helmet-async';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { HeaderBackground } from '../components/HeaderBackground';
import { Footer } from '../components/Footer';

import { useTranslation } from 'react-i18next';

type ForgotPasswordScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;
};

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
    const { resetPassword } = useAuth();
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleReset = async () => {
        if (!email) {
            Alert.alert(t('common.error'), t('auth.errors.missingEmail'));
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert(t('common.error'), t('auth.errors.invalidEmail'));
            return;
        }

        setLoading(true);
        const { error } = await resetPassword(email);
        setLoading(false);

        if (error) {
            Alert.alert(t('common.error'), error.message || t('auth.errors.sendError'));
        } else {
            setSubmitted(true);
        }
    };

    return (
        <LinearGradient colors={['#001B3A', '#0D3B66', '#1A5276']} style={styles.container}>
            <HeaderBackground style={StyleSheet.absoluteFillObject} />
            <Helmet>
                <title>{t('auth.forgotPasswordTitle')} - Tribiblia</title>
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

                        <Text style={styles.title}>{t('auth.forgotPasswordTitle')}</Text>

                        {submitted ? (
                            <View style={styles.successContainer}>
                                <View style={styles.iconCircle}>
                                    <Text style={styles.successIcon}>✉️</Text>
                                </View>
                                <Text style={styles.successTitle}>{t('common.success')}</Text>
                                <Text style={styles.successText}>
                                    {t('auth.passwordRecoverySent')}
                                </Text>
                                <TouchableOpacity
                                    style={styles.backButton}
                                    onPress={() => navigation.navigate('Login')}
                                >
                                    <LinearGradient
                                        colors={['#4CAF50', '#2E7D32']}
                                        style={styles.gradientButton}
                                    >
                                        <Text style={styles.backButtonText}>{t('auth.backToLogin')}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <Text style={styles.subtitle}>
                                    {t('auth.forgotPasswordSubtitle')}
                                </Text>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Email</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="ejemplo@correo.com"
                                        placeholderTextColor="#999"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                </View>

                                <TouchableOpacity
                                    style={styles.submitButton}
                                    onPress={handleReset}
                                    disabled={loading}
                                >
                                    <LinearGradient
                                        colors={['#FFD700', '#FFA500']}
                                        style={styles.gradientButton}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#001B3A" />
                                        ) : (
                                            <Text style={styles.submitButtonText}>{t('auth.sendLinkButton').toUpperCase()}</Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.cancelLink}
                                    onPress={() => navigation.goBack()}
                                >
                                    <Text style={styles.cancelLinkText}>{t('common.cancel')}</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                    <Footer />
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
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
        marginBottom: 25,
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
    successContainer: {
        alignItems: 'center',
        width: '100%',
        paddingTop: 10,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#4CAF50',
    },
    successIcon: {
        fontSize: 40,
    },
    successTitle: {
        fontSize: 24,
        color: '#FFF',
        fontFamily: 'Anton',
        marginBottom: 10,
    },
    successText: {
        color: '#E0E0E0',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 30,
        fontFamily: 'Mulish-Regular',
        lineHeight: 24,
    },
    backButton: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
    },
    backButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontFamily: 'Anton',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});
