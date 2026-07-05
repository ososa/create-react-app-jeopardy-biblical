import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native';
import { CameraView, BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Helmet } from 'react-helmet-async';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useSession } from '../context/SessionContext';
import { useTheme } from '../context/ThemeContext';
import { HeaderBackground } from '../components/HeaderBackground';
import { Footer } from '../components/Footer';

import { RouteProp } from '@react-navigation/native';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase'; // Added for checking presence
import { useTranslation } from 'react-i18next';

type JoinScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Join'>;
    route: RouteProp<RootStackParamList, 'Join'>;
};

const AVATARS = ['🦁', '🕊️', '👑', '🔥', '⚔️', '🛡️', '🍇', '🐟', '⚓', '⛪', '📜', '🕯️'];

export const JoinScreen: React.FC<JoinScreenProps> = ({ navigation, route }) => {
    const { joinSession } = useSession();
    const { theme } = useTheme();
    const { user } = useAuth(); // Get user from AuthContext

    // Pre-fill from user metadata if available
    const [username, setUsername] = useState(user?.user_metadata?.username || '');
    const [selectedAvatar, setSelectedAvatar] = useState(user?.user_metadata?.avatar || AVATARS[0]);

    const [sessionId, setSessionId] = useState('');
    // Modern permission hook
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [showCamera, setShowCamera] = useState(false);

    const { t } = useTranslation();

    // ... (existing state)

    // Auth Protection & Pre-fill
    useEffect(() => {
        if (!user) {
            Alert.alert(t('join.accessRestricted'), t('join.accessRestrictedMessage'));
            navigation.replace('Login');
            return;
        }
        // ...
    }, [user, navigation]);

    // ...

    const handleCameraToggle = async () => {
        if (!permission) {
            // Permission not loaded yet
            return;
        }
        if (!permission.granted) {
            const result = await requestPermission();
            if (result.granted) {
                setShowCamera(true);
                setScanned(false);
            } else {
                Alert.alert(t('join.permissionDenied'), t('join.permissionDeniedMessage'));
            }
        } else {
            setShowCamera(true);
            setScanned(false);
        }
    };

    const handleJoin = async () => {
        if (!username || !sessionId) {
            Alert.alert(t('join.error'), t('join.enterNameAndSession'));
            return;
        }

        // --- LIMIT CHECK: MAX 9 CONNECTIONS (1 HOST + 8 PLAYERS) ---
        try {
            // We need to peek into the channel presence state
            // Since we aren't subscribed yet, we can't reliably get state without joining or using an API if available.
            // However, Supabase Realtime doesn't expose a simple "get count" API without being in the channel or trusting checking logic.
            // WORKAROUND: We will rely on the `joinSession` in context to handle this OR check via a temporary subscription/lookup if possible.
            // But checking via subscription takes time. 
            // SIMPLER APPROACH: Let the user join, and the SessionContext logic *could* kick them, but that's harsh.
            // BETTER APPROACH: Use the new `supabase_game_sessions` logic? No, presence is ephemeral.

            // Let's do a quick check by briefly subscribing or asking Supabase.
            // Actually, since presence is ephemeral, we can't query it via REST easily without an Edge Function.
            // BUT, if we assume the user is trying to join a valid session, let's just proceed for now if we can't easily check.

            // WAIT! The user explicitly asked for this. We MUST implement it.
            // We can't query presence without joining the channel.
            // So we will modify this to: 
            // 1. Join logic in SessionContext is where the subscription happens.
            // BUT we want to block it HERE.

            // Let's try to infer from a database column if we were tracking it there? 
            // We are NOT consistently tracking online_count in DB currently.

            // OK, let's do a fast "peek" subscription?
            // "I will create a temporary channel, wait for sync, count, then leave."

            // Optimization: Maybe we trust the client logic. 
            // Let's implement the 'Peek' logic.

            const checkChannel = supabase.channel(`game:${sessionId}`);
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    checkChannel.unsubscribe();
                    resolve(); // Proceed if timeout (fail open) or block? Let's fail open to avoid bugs.
                }, 3000);

                checkChannel
                    .on('presence', { event: 'sync' }, () => {
                        const state = checkChannel.presenceState();
                        const users = Object.keys(state).length;
                        clearTimeout(timeout);
                        checkChannel.unsubscribe();

                        if (users >= 9) { // 9 limit
                            reject(new Error("Room Full"));
                        } else {
                            resolve();
                        }
                    })
                    .subscribe(async (status) => {
                        if (status === 'SUBSCRIBED') {
                            // We don't track ourselves yet, just listening
                        }
                    });
            });

        } catch (err: any) {
            if (err.message === "Room Full") {
                Alert.alert("Sala Llena", "Ya hay 9 dispositivos conectados a esta partida (Límite alcanzado).");
                return;
            }
            // Ignore other errors (fail open)
        }

        await joinSession(sessionId, username, 1, selectedAvatar); // Defaulting to team 1 for now
        // Navigate to controller screen
        navigation.replace('Controller');
    };

    const handleBarCodeScanned = ({ type, data }: BarcodeScanningResult) => {
        setScanned(true);
        setShowCamera(false);

        let extractedId = data;
        // Check if it's a URL with session param
        if (data.includes('session=')) {
            try {
                const url = new URL(data);
                const id = url.searchParams.get('session');
                if (id) extractedId = id;
            } catch (e) {
                // Fallback regex if URL parsing fails (e.g. if partial string)
                const match = data.match(/session=([^&]*)/);
                if (match && match[1]) extractedId = match[1];
            }
        }

        setSessionId(extractedId);
        Alert.alert(t('join.scanned'), t('join.idDetected', { id: extractedId }));
    };

    if (showCamera) {
        if (!permission || !permission.granted) {
            return (
                <View style={styles.container}>
                    <Text style={{ color: 'white' }}>{t('join.cameraPermission')}</Text>
                </View>
            );
        }

        return (
            <View style={styles.cameraContainer}>
                <CameraView
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ["qr"],
                    }}
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                />
                <TouchableOpacity style={styles.closeCamera} onPress={() => setShowCamera(false)}>
                    <Text style={styles.closeCameraText}>{t('join.closeCamera')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <LinearGradient colors={['#001B3A', '#1A5276']} style={styles.container}>
            <HeaderBackground style={StyleSheet.absoluteFillObject} />
            <Helmet>
                <title>{t('join.title')} - Tribiblia</title>
                <meta name="description" content="Únete a una partida de Tribiblia usando un código de sesión o escaneando un código QR." />
            </Helmet>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={[styles.title, { fontFamily: theme.typography.fontFamily.display }]}>
                    {t('join.title')}
                </Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>{t('join.nameLabel')}</Text>
                    <TextInput
                        style={styles.input}
                        value={username}
                        onChangeText={setUsername}
                        placeholder={t('join.namePlaceholder')}
                        placeholderTextColor="#aaa"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>{t('join.avatarLabel')}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarList}>
                        {AVATARS.map((avatar) => (
                            <TouchableOpacity
                                key={avatar}
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

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>{t('join.sessionLabel')}</Text>
                    <TextInput
                        style={styles.input}
                        value={sessionId}
                        onChangeText={setSessionId}
                        placeholder={t('join.sessionPlaceholder')}
                        placeholderTextColor="#aaa"
                    />
                </View>

                {/* Scan QR Button -> Matches "COMENZAR PARTIDA" Style (Gold, Anton, Uppercase) */}
                <TouchableOpacity
                    onPress={handleCameraToggle}
                    activeOpacity={0.8}
                    style={[styles.buttonWrapper, styles.goldButtonWrapper]}
                >
                    <LinearGradient
                        colors={['#FFEC00', '#FFB700']} // Brighter Gold/Yellow gradient
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }} // Vertical gradient matches the button look better usually
                        style={[styles.gradientButton, { paddingVertical: 18 }]} // Slightly taller
                    >
                        <Text style={[styles.buttonText, styles.goldButtonText]}>{t('join.scanButton').toUpperCase()}</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Join Button -> Matches "Unirse desde Móvil" Style (Green, Icon, Mulish) */}
                <TouchableOpacity
                    onPress={handleJoin}
                    activeOpacity={0.8}
                    style={[
                        styles.buttonWrapper,
                        { marginTop: 20 },
                        styles.greenButtonWrapper
                    ]}
                >
                    <LinearGradient
                        colors={['#66BB6A', '#43A047']} // Fresh Green Gradient
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={[styles.gradientButton, { flexDirection: 'row', gap: 10 }]}
                    >
                        <Text style={{ fontSize: 24, marginBottom: 2 }}>📱</Text>
                        <Text style={[styles.buttonText, styles.greenButtonText]}>{t('join.joinButton')}</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
                    <Text style={{ color: '#fff' }}>{t('join.backButton')}</Text>
                </TouchableOpacity>

                <View style={{ width: '100%', marginTop: 20 }}>
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
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 40,
        color: '#FFD700',
        marginBottom: 40,
        textAlign: 'center',
    },
    inputContainer: {
        width: '100%',
        maxWidth: 400,
        marginBottom: 20,
    },
    label: {
        color: '#fff',
        marginBottom: 5,
        fontSize: 16,
        fontFamily: 'Mulish-Bold',
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        padding: 15,
        color: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        fontSize: 18,
    },
    buttonWrapper: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 16, // More rounded as per image
        overflow: 'hidden',
    },
    goldButtonWrapper: {
        shadowColor: '#FFB700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 8,
    },
    greenButtonWrapper: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#81C784', // Lighter green border
        shadowColor: '#2E7D32',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 8,
    },
    gradientButton: {
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 22,
        letterSpacing: 1,
    },
    goldButtonText: {
        color: '#001B3A',
        fontFamily: 'Anton',
        textTransform: 'uppercase',
    },
    greenButtonText: {
        color: '#FFFFFF',
        fontFamily: 'Mulish-Bold', // Sans-serif bold
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
        fontWeight: 'bold', // Ensure bold
    },
    buttonTextWhite: {
        color: '#FFFFFF',
    },
    cameraContainer: {
        flex: 1,
        backgroundColor: 'black',
    },
    closeCamera: {
        position: 'absolute',
        bottom: 50,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 15,
        borderRadius: 8,
    },
    closeCameraText: {
        color: '#fff',
        fontSize: 16,
    },
    avatarList: {
        flexDirection: 'row',
        paddingVertical: 10,
        gap: 10,
    },
    avatarItem: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 30,
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
        fontSize: 32,
    },
});
