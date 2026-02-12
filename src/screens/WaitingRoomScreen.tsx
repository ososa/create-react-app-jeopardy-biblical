import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Image, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { supabase } from '../utils/supabase';
import { useSession } from '../context/SessionContext';
import { Helmet } from 'react-helmet-async';
import { ActivePlayers } from '../components/ActivePlayers';
import { Footer } from '../components/Footer';

type WaitingRoomScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'WaitingRoom'>;
    route: RouteProp<RootStackParamList, 'WaitingRoom'>;
};

// Assets
const ASSETS = {
    logo: require('../../assets/images/logo_definitivo_v5.png'),
};

export const WaitingRoomScreen: React.FC<WaitingRoomScreenProps> = ({ navigation, route }) => {
    const { t } = useTranslation();
    const { leaveSession } = useSession();
    const { sessionId } = route.params;
    const [status, setStatus] = useState('waiting'); // waiting, active

    useEffect(() => {
        if (!sessionId) {
            navigation.replace('Instructions');
            return;
        }

        // Initial fetch
        const checkStatus = async () => {
            const { data } = await supabase
                .from('game_sessions')
                .select('status')
                .eq('id', sessionId)
                .single();

            if (data?.status === 'active') {
                navigation.replace('Game');
            }
        };

        checkStatus();

        // Realtime Subscription
        const channel = supabase
            .channel(`waiting_room:${sessionId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'game_sessions',
                filter: `id=eq.${sessionId}`
            }, (payload: any) => {
                if (payload.new.status === 'active') {
                    navigation.replace('Game');
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [sessionId]);

    const handleBack = () => {
        // Optionally handle leaving the session logic here if needed
        navigation.navigate('Instructions');
    };

    return (
        <LinearGradient
            colors={['#001B3A', '#1A5276']}
            style={styles.container}
        >
            <Helmet>
                <title>Sala de Espera - Tribiblia</title>
            </Helmet>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Image source={ASSETS.logo} style={styles.logo} resizeMode="contain" />

                <View style={styles.card}>
                    <ActivityIndicator size="large" color="#FFD700" style={styles.spinner} />
                    <Text style={styles.title}>¡LISTO PARA JUGAR!</Text>
                    <Text style={styles.subtitle}>
                        Esperando a que el anfitrión inicie la partida...
                    </Text>
                    <Text style={styles.sessionInfo}>Sesión: {sessionId.slice(0, 8)}...</Text>
                </View>

                <ActivePlayers sessionId={sessionId} />

                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Text style={styles.backButtonText}>SALIR</Text>
                </TouchableOpacity>

                <Footer />
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        width: '100%',
    },
    content: {
        // Removed as replaced by scrollContent
        width: '90%',
        maxWidth: 400,
        alignItems: 'center',
    },
    logo: {
        width: 200,
        height: 100,
        marginBottom: 30,
    },
    card: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 30,
        borderRadius: 20,
        width: '100%',
        maxWidth: 400, // Moved width constraint to card
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    spinner: {
        marginBottom: 20,
    },
    title: {
        fontFamily: 'Anton',
        fontSize: 28,
        color: '#FFD700',
        marginBottom: 10,
        textAlign: 'center',
        letterSpacing: 1,
    },
    subtitle: {
        fontFamily: 'Mulish-Bold',
        fontSize: 16,
        color: '#FFF',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 20,
    },
    sessionInfo: {
        fontFamily: 'Mulish-Regular',
        fontSize: 12,
        color: '#AAA',
    },
    backButton: {
        marginTop: 30,
        padding: 10,
    },
    backButtonText: {
        color: 'rgba(255,255,255,0.7)',
        fontFamily: 'Mulish-Bold',
    },
});
