import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ImageBackground,
    Dimensions,
    ScrollView,
    useWindowDimensions,
    Linking,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAdmin } from '../context/AdminContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase'; // Added import
import { ARCADE_THEME } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { HeaderBackground } from '../components/HeaderBackground'; // Added import
import { BuyMeCoffee } from '../components/BuyMeCoffee';
import { styles, LAYOUT_CONFIG } from './InstructionsScreen.styles';
import { DropdownMenu } from '../components/DropdownMenu';
import { Leaderboard } from '../components/Leaderboard';
import { InstructionFlipCard } from '../components/InstructionFlipCard';
import { Footer } from '../components/Footer';
import { ArcadeAlert } from '../components/ArcadeAlert'; // Added

// Assets
const ASSETS = {
    background: require('../../assets/images/background_stars.png'),
    logo: require('../../assets/images/logo_definitivo_v5.png'),
    // headerBtn removed as it's now part of the board
    startBtn: require('../../assets/images/button_orange_start.png'),
};

type InstructionsScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Instructions' | 'Profile' | 'Admin' | 'TeamConfig' | 'Join'>;
};

export const InstructionsScreen: React.FC<InstructionsScreenProps> = ({ navigation }) => {
    const { isAdmin } = useAdmin();
    const { signOut, user, authError, clearAuthError } = useAuth(); // Consolidated
    const { width } = useWindowDimensions();
    const { t, i18n } = useTranslation();

    const [alertConfig, setAlertConfig] = React.useState<{
        visible: boolean;
        title?: string;
        message: string;
        type?: 'success' | 'error' | 'warning' | 'info';
        onConfirm?: () => void;
    }>({
        visible: false,
        message: '',
        type: 'info'
    });

    React.useEffect(() => {
        if (authError) {
            let title = 'Error de Autenticación';
            let message = authError.message;

            // Translate common Supabase errors
            if (authError.code === 'otp_expired') {
                title = 'Enlace Expirado';
                message = 'El enlace de confirmación ha expirado o ya fue utilizado. Si estás viendo una sesión anterior (como Admin), es porque el inicio de sesión falló.';
            }

            setAlertConfig({
                visible: true,
                title,
                message,
                type: 'error',
                onConfirm: () => {
                    setAlertConfig(prev => ({ ...prev, visible: false }));
                    clearAuthError();
                }
            });
        }
    }, [authError]);

    const [invitationCount, setInvitationCount] = React.useState(0);

    React.useEffect(() => {
        if (!user) return;

        const fetchCount = async () => {
            const { count } = await supabase
                .from('game_invitations')
                .select('*', { count: 'exact', head: true })
                .eq('recipient_id', user.id)
                .eq('status', 'pending');
            setInvitationCount(count || 0);
        };

        fetchCount();

        const channel = supabase
            .channel(`badges:${user.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'game_invitations',
                filter: `recipient_id=eq.${user.id}`
            }, () => fetchCount())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user]);

    return (
        <LinearGradient
            colors={['#001B3A', '#0D3B66', '#1A5276']}
            style={styles.container}
        >
            <HeaderBackground style={StyleSheet.absoluteFillObject} />
            <Helmet>
                <title>{t('welcome.title')} - Tribiblia</title>
                <meta name="description" content={t('welcome.subtitle')} />

                {/* Open Graph / Facebook */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://tribiblia.com/" />
                <meta property="og:title" content={`${t('welcome.title')} - Tribiblia`} />
                <meta property="og:description" content={t('welcome.subtitle')} />
                <meta property="og:image" content="https://tribiblia.com/assets/icon.png" />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:url" content="https://tribiblia.com/" />
                <meta name="twitter:title" content={`${t('welcome.title')} - Tribiblia`} />
                <meta name="twitter:description" content={t('welcome.subtitle')} />
                <meta name="twitter:image" content="https://tribiblia.com/assets/icon.png" />
            </Helmet>

            {/* Header Menu (Fixed) */}
            <DropdownMenu
                style={styles.topButtons}
                onProfile={() => navigation.navigate('Profile')}
                onMyGames={() => navigation.navigate('MyGames')}
                onLogout={signOut}
                onAdmin={() => navigation.navigate('Admin')}
                isAdmin={isAdmin}
                invitationCount={invitationCount}
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>





                {/* Logo Section */}
                <View style={[styles.logoContainer]}>
                    <Image
                        source={ASSETS.logo}
                        style={[styles.logo, {
                            width: `${LAYOUT_CONFIG.LOGO_WIDTH_PERCENT * 100}%`,
                            maxWidth: LAYOUT_CONFIG.LOGO_MAX_WIDTH,
                            height: LAYOUT_CONFIG.LOGO_HEIGHT,
                        }]}
                        resizeMode="contain"
                    />
                </View>

                {/* Welcome Message */}
                {user && (
                    <Text style={localStyles.welcomeText}>
                        {t('welcome.welcomeUser')} <Text style={localStyles.usernameText}>{user.user_metadata?.username || user.email?.split('@')[0]}!</Text>
                    </Text>
                )}

                {/* Instructions Section (Flip Card) */}
                <InstructionFlipCard />

                {/* Start Game Button (Embedded in layout, bottom of board) */}
                <TouchableOpacity
                    style={[styles.startBtnContainer, {
                        width: `${LAYOUT_CONFIG.BUTTON_WIDTH_PERCENT * 100}%`,
                        maxWidth: LAYOUT_CONFIG.BUTTON_MAX_WIDTH,
                    }]}
                    onPress={() => navigation.navigate('TeamConfig')}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#FFD700', '#FFA500']}
                        style={styles.startBtnGradient}
                    >
                        <Text style={styles.startBtnText}>
                            {t('welcome.startGame', 'COMENZAR PARTIDA')}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Join Game Button (For Mobile Controllers) - ONLY VISIBLE ON MOBILE */}
                {width < 768 && (
                    <TouchableOpacity
                        style={[styles.joinBtnContainer, {
                            width: `${LAYOUT_CONFIG.BUTTON_WIDTH_PERCENT * 100}%`,
                            maxWidth: LAYOUT_CONFIG.BUTTON_MAX_WIDTH,
                            marginTop: 10,
                        }]}
                        onPress={() => navigation.navigate('Join')}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#4CAF50', '#45A049']}
                            style={styles.joinBtnGradient}
                        >
                            <Text style={styles.joinBtnText}>📱 {t('welcome.joinGame')}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}
                {/* Start Game Button (Embedded in layout, bottom of board) */}

                {/* Leaderboard Section */}
                <View style={{ width: width < 768 ? '90%' : '100%', maxWidth: 600, marginTop: 20, alignItems: 'center' }}>
                    <Leaderboard
                        limit={5}
                        variant="cyan"
                    />
                </View>

                {/* Buy Me a Coffee Button */}
                {/* Buy Me a Coffee Button */}
                <BuyMeCoffee style={{ marginTop: 0, marginBottom: 40 }} />

                <Footer />

                <ArcadeAlert
                    visible={alertConfig.visible}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    type={alertConfig.type}
                    onConfirm={() => {
                        alertConfig.onConfirm?.();
                    }}
                />
            </ScrollView>
        </LinearGradient >
    );
};

const localStyles = StyleSheet.create({
    langContainer: {
        position: 'absolute',
        top: 20,
        left: 20,
        flexDirection: 'row',
        zIndex: 20,
        gap: 10,
    },
    langButton: {
        padding: 5,
        borderRadius: 20,
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
    textContainer: {
        width: '100%', // Full width of container
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    scrollTextContainer: {
        width: '100%',
        alignItems: 'center',
    },
    titleText: {
        fontFamily: 'Anton',
        fontSize: 40,
        color: '#FFFFFF',
        marginBottom: 8,
        textTransform: 'uppercase',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    bodyText: {
        fontFamily: 'Mulish-Bold',
        fontSize: 16,
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 4,
        width: '100%',
        lineHeight: 20,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    numberText: {
        color: '#FFD700', // Gold/Yellow
        fontWeight: 'bold', // Extra bold override if needed, though Mulish-Bold handles it
        fontSize: 18, // Slightly larger
    },
    badge: {
        position: 'absolute',
        right: -5,
        top: -5,
        backgroundColor: '#FF3B30', // System Red
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#FFF',
    },
    badgeText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: 'bold',
    },
    welcomeText: {
        fontFamily: 'Mulish-Regular',
        fontSize: 18,
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 20,
        marginTop: 0,
        paddingHorizontal: 20,
    },
    usernameText: {
        fontFamily: 'Mulish-Bold',
        color: '#FFD700', // Gold
        fontSize: 20,
        fontWeight: 'bold',
    },
});
