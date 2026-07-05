import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    useWindowDimensions,
    KeyboardAvoidingView,
    Platform,
    Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAuth } from '../context/AuthContext';
import { HeaderBackground } from '../components/HeaderBackground';
import { BuyMeCoffee } from '../components/BuyMeCoffee';
import { Footer } from '../components/Footer';
import { ArcadeAlert } from '../components/ArcadeAlert';
{/* <HeaderBackground style={StyleSheet.absoluteFillObject} /> */ }

{/* <ArcadeAlert ... /> already commented */ }



type LoginScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

const AVATARS = ['🦁', '🕊️', '👑', '🔥', '⚔️', '🛡️', '🍇', '🐟', '⚓', '⛪', '📜', '🕯️'];

const LANGUAGES = [
    { code: 'es', flag: '🇪🇸' },
    { code: 'en', flag: '🇺🇸' },
    { code: 'pt', flag: '🇧🇷' },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
    const { signIn, signUp, signInAsGuest } = useAuth();
    const { t, i18n } = useTranslation();
    const { width, height } = useWindowDimensions();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const changeLanguage = async (lang: string) => {
        await i18n.changeLanguage(lang);
        await AsyncStorage.setItem('user-language', lang);
    };

    React.useEffect(() => {
        if (Platform.OS === 'web') {
            // Inject script if not present
            const scriptId = 'turnstile-script';
            if (!document.getElementById(scriptId)) {
                const script = document.createElement('script');
                script.id = scriptId;
                script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
                script.async = true;
                script.defer = true;
                document.body.appendChild(script);
            }

            // Check if script is loaded and render widget
            const interval = setInterval(() => {
                // @ts-ignore
                if (window.turnstile) {
                    const widgetElement = document.getElementById('turnstile-widget');
                    if (widgetElement) {
                        clearInterval(interval);
                        try {
                            // @ts-ignore
                            window.turnstile.render('#turnstile-widget', {
                                sitekey: '0x4AAAAAACOfnMtls4bn9m4n',
                                theme: 'dark',
                                callback: function (token: string) {
                                    console.log("Turnstile success token:", token);
                                    setCaptchaToken(token);
                                },
                            });
                        } catch (e) {
                            console.error("Turnstile render error", e);
                        }
                    }
                }
            }, 100);
            return () => clearInterval(interval);
        }
    }, []);

    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title?: string;
        message: string;
        type?: 'info' | 'success' | 'warning' | 'error' | 'confirm';
        onConfirm: () => void;
    }>({
        visible: false,
        message: '',
        onConfirm: () => { }
    });

    const handleAuth = async () => {
        if (!email || !password) {
            setError(t('auth.email') + ' & ' + t('auth.password') + ' required');
            return;
        }

        setLoading(true);
        setError('');

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Invalid Email');
            setLoading(false);
            return;
        }

        if (isSignUp && !username) {
            setError('Username required');
            setLoading(false);
            return;
        }

        if (isSignUp && !acceptedTerms) {
            setError(t('auth.errorTermsRequired'));
            setLoading(false);
            return;
        }

        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        // Enforce CAPTCHA on web (DISABLED for localhost testing)
        if (Platform.OS === 'web' && !captchaToken && !isLocal) {
            setError('Please complete the CAPTCHA check');
            setLoading(false);
            return;
        }

        // Always use valid token (Prod Key on localhost too)
        const tokenToSend = captchaToken ?? undefined;

        const result = isSignUp
            ? await signUp(email, password, username, selectedAvatar, tokenToSend)
            : await signIn(email, password, tokenToSend);

        if (result.error) {
            setError(result.error.message);
        } else {
            if (isSignUp) {
                const title = t('auth.registerSuccessTitle');
                const message = t('auth.registerSuccessMessage');

                setAlertConfig({
                    visible: true,
                    title: title,
                    message: message,
                    type: 'success',
                    onConfirm: () => {
                        setAlertConfig(prev => ({ ...prev, visible: false }));
                        setIsSignUp(false);
                    }
                });
            }
        }
        setLoading(false);
    };

    const isLargeScreen = width > 768;

    return (
        <LinearGradient
            colors={['#001B3A', '#0D3B66', '#1A5276']}
            style={styles.container}
        >
            <HeaderBackground style={StyleSheet.absoluteFillObject} />

            <ArcadeAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onConfirm={alertConfig.onConfirm}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[
                        styles.contentContainer,
                        { width: isLargeScreen ? 500 : '90%' }
                    ]}>
                        <Image
                            source={require('../../assets/images/logo_definitivo_v5.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />

                        <Text style={styles.subtitle}>
                            {isSignUp ? t('auth.titleRegister') : t('auth.titleLogin')}
                        </Text>

                        {isSignUp && (
                            <TextInput
                                testID="login-username-input"
                                style={styles.input}
                                placeholder={t('auth.username')}
                                placeholderTextColor="#999"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="words"
                            />
                        )}

                        <TextInput
                            testID="login-email-input"
                            style={styles.input}
                            placeholder={t('auth.email')}
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <View style={{ width: '100%', marginBottom: 15, position: 'relative' }}>
                            <TextInput
                                testID="login-password-input"
                                style={[styles.input, { marginBottom: 0, paddingRight: 50 }]}
                                placeholder={t('auth.password')}
                                placeholderTextColor="#999"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity
                                testID="login-show-password-button"
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
                                    color="#999"
                                />
                            </TouchableOpacity>
                        </View>

                        {!isSignUp && (
                            <TouchableOpacity
                                testID="login-forgot-password-link"
                                style={styles.forgotPassword}
                                onPress={() => navigation.navigate('ForgotPassword')}
                            >
                                <Text style={styles.forgotPasswordText}>
                                    {t('auth.forgotPassword')}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {isSignUp && (
                            <View style={styles.avatarSection}>
                                <Text style={styles.avatarLabel}>{t('auth.chooseAvatar')}</Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    style={!isLargeScreen ? styles.avatarListContainer : undefined}
                                    contentContainerStyle={styles.avatarList}
                                >
                                    {AVATARS.map((avatar) => (
                                        <TouchableOpacity
                                            key={avatar}
                                            testID={`register-avatar-${avatar}`}
                                            onPress={() => setSelectedAvatar(avatar)}
                                            style={[
                                                styles.avatarItem,
                                                selectedAvatar === avatar && styles.avatarSelected,
                                            ]}
                                        >
                                            <Text style={styles.avatarText}>{avatar}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {isSignUp && (
                            <View style={styles.checkboxContainer}>
                                <TouchableOpacity testID="register-terms-checkbox" onPress={() => setAcceptedTerms(!acceptedTerms)}>
                                    <MaterialIcons
                                        name={acceptedTerms ? "check-box" : "check-box-outline-blank"}
                                        size={24}
                                        color={acceptedTerms ? "#FFD700" : "#FFF"}
                                    />
                                </TouchableOpacity>
                                <Text style={styles.checkboxText}>
                                    {t('auth.acceptTermsPrefix')}
                                    <Text style={styles.linkText} onPress={() => navigation.navigate('PrivacyPolicy')}>
                                        {t('auth.privacyPolicyLink')}
                                    </Text>
                                    {t('auth.acceptTermsAnd')}
                                    <Text style={styles.linkText} onPress={() => navigation.navigate('TermsOfUse')}>
                                        {t('auth.termsOfUseLink')}
                                    </Text>
                                </Text>
                            </View>
                        )}

                        {Platform.OS === 'web' && (
                            <View
                                style={{
                                    marginBottom: 20,
                                    width: '100%',
                                    alignItems: 'center',
                                    minHeight: 80,
                                    justifyContent: 'center'
                                }}
                            >
                                {/* @ts-ignore */}
                                <div id="turnstile-widget" style={{ display: 'flex', justifyContent: 'center' }} />
                            </View>
                        )}

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <TouchableOpacity
                            testID="auth-submit-button"
                            style={styles.authButton}
                            onPress={handleAuth}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#FFD700', '#FFA500']}
                                style={styles.authButtonGradient}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#001B3A" />
                                ) : (
                                    <Text style={styles.authButtonText}>
                                        {isSignUp ? t('auth.registerButton').toUpperCase() : t('auth.loginButton').toUpperCase()}
                                    </Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity testID="auth-switch-mode-button" onPress={() => setIsSignUp(!isSignUp)}>
                            <Text style={styles.switchText}>
                                {isSignUp ? t('auth.switchToLogin') : t('auth.switchToRegister')}
                            </Text>
                        </TouchableOpacity>



                        {/* Language Switcher (Footer) */}
                        <View style={styles.langContainer}>
                            {LANGUAGES.map((lang) => (
                                <TouchableOpacity
                                    key={lang.code}
                                    style={[
                                        styles.langButton,
                                        i18n.language === lang.code && styles.langButtonActive
                                    ]}
                                    onPress={() => changeLanguage(lang.code)}
                                >
                                    <Text style={styles.langText}>{lang.flag}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <BuyMeCoffee style={{ marginTop: 30 }} />
                        <Footer />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    langContainer: {
        marginTop: 40,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        width: '100%',
    },
    langButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    langButtonActive: {
        borderColor: '#FFD700',
        backgroundColor: 'rgba(255,215,0,0.2)',
    },
    langText: {
        fontSize: 24,
    },
    keyboardView: {
        flex: 1,
        width: '100%',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    contentContainer: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    logo: {
        width: '100%',
        height: 160,
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 18,
        color: '#FFFFFF',
        marginBottom: 30,
        fontFamily: 'Mulish-Bold',
    },
    input: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        paddingVertical: 15,
        paddingHorizontal: 20,
        fontSize: 16,
        color: '#FFFFFF',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
        fontFamily: 'Mulish-Regular',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 20,
    },
    forgotPasswordText: {
        color: '#FFD700',
        textDecorationLine: 'underline',
        fontFamily: 'Mulish-Regular',
    },
    avatarSection: {
        marginBottom: 20,
        width: '100%',
        alignItems: 'center',
    },
    avatarLabel: {
        color: '#DDD',
        marginBottom: 10,
        textAlign: 'center',
        fontFamily: 'Mulish-Regular',
    },
    avatarListContainer: {
        width: '100%',
        flexGrow: 0,
    },
    avatarList: {
        paddingHorizontal: 10,
        flexDirection: 'row',
        paddingVertical: 5,
        gap: 10,
    },
    avatarItem: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 2,
        borderColor: 'transparent',
        padding: 0,
    },
    avatarSelected: {
        backgroundColor: 'rgba(255,215,0,0.3)',
        borderColor: '#FFD700',
    },
    avatarText: {
        fontSize: 24,
    },
    errorText: {
        color: '#ff6b6b',
        marginBottom: 15,
        textAlign: 'center',
        fontFamily: 'Mulish-Bold',
    },
    authButton: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 20,
    },
    authButtonGradient: {
        paddingVertical: 15,
        alignItems: 'center',
    },
    authButtonText: {
        fontSize: 18,
        fontWeight: 'normal',
        color: '#001B3A',
        fontFamily: 'Anton',
        letterSpacing: 1,
    },
    switchText: {
        fontSize: 14,
        color: '#FFFFFF',
        marginBottom: 20,
        marginTop: 10,
        textDecorationLine: 'underline',
        textAlign: 'center',
        fontFamily: 'Mulish-Regular',
    },
    guestButton: {
        marginTop: 10,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFD700',
        backgroundColor: 'transparent',
    },
    guestButtonText: {
        color: '#FFD700',
        fontSize: 16,
        fontFamily: 'Mulish-Bold',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
        paddingHorizontal: 5,
        width: '100%',
    },
    checkboxText: {
        color: '#FFFFFF',
        marginLeft: 10,
        flex: 1,
        fontFamily: 'Mulish-Regular',
        fontSize: 14,
        lineHeight: 20,
    },
    linkText: {
        color: '#FFD700',
        fontFamily: 'Mulish-Bold',
        textDecorationLine: 'underline',
    },
});
