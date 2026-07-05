
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HeaderBackground } from '../components/HeaderBackground';
import { Footer } from '../components/Footer';
import { RootStackParamList } from '../../App';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext'; // Import Auth
import { useAdmin } from '../context/AdminContext'; // Import Admin
import { DropdownMenu } from '../components/DropdownMenu'; // Import Dropdown
import { BuyMeCoffee } from '../components/BuyMeCoffee'; // Import BuyMeCoffee

type AboutUsScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'AboutUs' | 'Login' | 'Instructions'>;
};

export const AboutUsScreen: React.FC<AboutUsScreenProps> = ({ navigation }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { width } = useWindowDimensions();
    const { user, signOut } = useAuth(); // Get user and signOut
    const { isAdmin } = useAdmin();

    const isLargeScreen = width > 768;

    return (
        <LinearGradient colors={['#001B3A', '#0D3B66', '#1A5276']} style={styles.container}>
            <HeaderBackground style={StyleSheet.absoluteFillObject} />
            <Helmet>
                <title>{t('footer.about')} - Tribiblia</title>
            </Helmet>

            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => {
                        if (user) {
                            navigation.navigate('Instructions');
                        } else {
                            navigation.navigate('Login');
                        }
                    }}
                    style={styles.backButton}
                >
                    <Text style={styles.backButtonText}>{t('common.home', 'Inicio')}</Text>
                </TouchableOpacity>

                {/* Dropdown Menu - Pass props only if user exists */}
                <DropdownMenu
                    onProfile={user ? () => navigation.navigate('Profile') : undefined}
                    onMyGames={user ? () => navigation.navigate('MyGames') : undefined}
                    onLogout={user ? signOut : undefined}
                    onAdmin={user ? () => navigation.navigate('Admin') : undefined}
                    isAdmin={!!isAdmin}
                    invitationCount={0}
                />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={[styles.contentContainer, { maxWidth: isLargeScreen ? 800 : '90%' }]}>

                    <Image
                        source={require('../../assets/images/logo_definitivo_v5.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />

                    <View style={styles.titleContainer}>
                        <View style={[styles.titleLine, { backgroundColor: 'rgb(16, 223, 224)' }]} />
                        <Text style={styles.sectionTitle}>{t('pages.about.title')}</Text>
                        <View style={[styles.titleLine, { backgroundColor: 'rgb(16, 223, 224)' }]} />
                    </View>

                    <View style={styles.bodyContainer}>
                        <Text style={[styles.bodyText, { textAlign: isLargeScreen ? 'justify' : 'left' }]}>
                            {t('pages.about.body')}
                        </Text>
                    </View>

                    {/* Buy Me a Coffee Button */}
                    <BuyMeCoffee style={{ marginBottom: 30 }} />

                    <Footer />
                </View>
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingVertical: 20,
        paddingLeft: 0,
        paddingRight: 0,
        backgroundColor: 'transparent',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 100,
    },
    backButton: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
    },
    backButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontFamily: 'Mulish-Bold',
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        paddingBottom: 40,
    },
    contentContainer: {
        width: '100%',
        alignItems: 'center',
    },
    logo: {
        width: 200,
        height: 100,
        marginBottom: 40,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
        width: '100%',
    },
    titleLine: {
        flex: 1,
        height: 1, // Decorative line height
        opacity: 0.8,
    },
    sectionTitle: {
        color: 'rgb(16, 223, 224)', // Cyan color
        fontSize: 24,
        fontFamily: 'Anton',
        letterSpacing: 2,
        textAlign: 'center',
        marginHorizontal: 20,
    },
    bodyContainer: {
        backgroundColor: 'rgba(0, 27, 58, 0.6)',
        padding: 30,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        width: '100%',
        marginBottom: 30,
    },
    bodyText: {
        color: '#E0E0E0',
        fontSize: 16,
        fontFamily: 'Mulish-Regular',
        lineHeight: 28,
        textAlign: 'justify',
    }
});
