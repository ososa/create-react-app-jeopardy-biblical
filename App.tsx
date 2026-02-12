import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity, Image, Platform, ScrollView, LogBox } from 'react-native';

// Suppress known web warnings
if (Platform.OS === 'web') {
  LogBox.ignoreLogs([
    'Expo AV has been deprecated',
    'Animated: `useNativeDriver` is not supported',
    'style props are deprecated',
    'has been deprecated'
  ]);
}
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { LinearGradient } from 'expo-linear-gradient';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import './src/i18n'; // Initialize i18n
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { GameProvider } from './src/context/GameContext';
import { AdminProvider } from './src/context/AdminContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { SoundProvider } from './src/context/SoundContext';
import { SessionProvider } from './src/context/SessionContext';
import {
  InstructionsScreen,
  TeamConfigScreen,
  GameScreen,
  GameOverScreen,
  LoginScreen,
} from './src/screens';
// import { AdminNavigator } from './src/screens/admin'; // Statically imported removed
const AdminNavigator = React.lazy(() => import('./src/screens/admin').then(module => ({ default: module.AdminNavigator })));
import * as serviceWorkerRegistration from './src/serviceWorkerRegistration';

// Keep splash screen visible while we load resources
// SplashScreen.preventAutoHideAsync(); // Commented out to debug white screen

export type RootStackParamList = {
  Login: undefined;
  Instructions: undefined;
  TeamConfig: { isEditing?: boolean } | undefined;
  Game: undefined;
  GameOver: { returnTo?: string } | undefined;
  Admin: undefined;
  Join: undefined;
  Controller: undefined;
  Profile: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined; // Added
  WaitingRoom: { sessionId: string };
  AboutUs: undefined;
  PrivacyPolicy: undefined;
  TermsOfUse: undefined;
  CookiesPolicy: undefined;
  MyGames: undefined;
};

import { JoinScreen } from './src/screens/JoinScreen';
import { ControllerScreen } from './src/screens/ControllerScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from './src/screens/ResetPasswordScreen'; // Added
import { WaitingRoomScreen } from './src/screens/WaitingRoomScreen';
import { AboutUsScreen } from './src/screens/AboutUsScreen';
import { PrivacyPolicyScreen } from './src/screens/PrivacyPolicyScreen';
import { TermsOfUseScreen } from './src/screens/TermsOfUseScreen';
import { CookiesPolicyScreen } from './src/screens/CookiesPolicyScreen';
import { MyGamesScreen } from './src/screens/MyGamesScreen';
import { GlobalPresenceProvider } from './src/context/GlobalPresenceContext';


const Stack = createNativeStackNavigator<RootStackParamList>();



// Root Component with Auth Check and Navigation Logic
const RootNavigator: React.FC = () => {
  const { user, isLoading, isPasswordRecovery } = useAuth();
  console.log("[DEBUG] RootNavigator render:", { user: user?.email, isLoading, isPasswordRecovery });

  if (isLoading) {
    return (
      <LinearGradient colors={['#001B3A', '#0D3B66']} style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </LinearGradient>
    );
  }

  // Priority Check: If password recovery is active, FORCE Reset Password screen
  // This applies even if 'user' is momentarily null while the session is established from the URL token
  if (isPasswordRecovery) {
    return (
      <AdminProvider>
        <GameProvider>
          <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
              options={{ title: 'Restablecer Contraseña' }}
            />
          </Stack.Navigator>
        </GameProvider>
      </AdminProvider>
    );
  }

  const LoadingFallback = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#001B3A' }}>
      <ActivityIndicator size="large" color="#FFD700" />
    </View>
  );

  return (
    <AdminProvider>
      <GameProvider>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          {user ? (
            <>
              <Stack.Screen
                name="Instructions"
                component={InstructionsScreen}
                options={{ title: 'Instrucciones - Tribiblia' }}
              />
              <Stack.Screen
                name="TeamConfig"
                component={TeamConfigScreen}
                options={{ title: 'Equipos - Tribiblia' }}
              />
              <Stack.Screen
                name="Game"
                component={GameScreen}
                options={{ title: 'Juego - Tribiblia' }}
              />
              <Stack.Screen
                name="GameOver"
                component={GameOverScreen}
                options={{ title: 'Fin del Juego - Tribiblia' }}
              />
              <Stack.Screen
                name="Admin"
                options={{ title: 'Admin - Tribiblia' }}
              >
                {(props) => (
                  <Suspense fallback={
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#001B3A' }}>
                      <ActivityIndicator size="large" color="#FFD700" />
                    </View>
                  }>
                    <AdminNavigator />
                  </Suspense>
                )}
              </Stack.Screen>
              <Stack.Screen name="Join" component={JoinScreen} options={{ title: 'Unirse' }} />
              <Stack.Screen name="Controller" component={ControllerScreen} options={{ title: 'Control' }} />
              <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Mi Perfil' }} />
              <Stack.Screen name="MyGames" component={MyGamesScreen} options={{ title: 'Mis Partidas' }} />
              <Stack.Screen name="WaitingRoom" component={WaitingRoomScreen} options={{ title: 'Sala de Espera' }} />
              <Stack.Screen name="AboutUs" component={AboutUsScreen} options={{ title: 'Sobre Nosotros' }} />
              <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Privacidad - Tribiblia' }} />
              <Stack.Screen name="TermsOfUse" component={TermsOfUseScreen} options={{ title: 'Términos - Tribiblia' }} />
              <Stack.Screen name="CookiesPolicy" component={CookiesPolicyScreen} options={{ title: 'Cookies - Tribiblia' }} />
            </>
          ) : (
            <>
              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{ title: 'Login - Tribiblia' }}
              />
              <Stack.Screen
                name="ForgotPassword"
                component={ForgotPasswordScreen}
                options={{ title: 'Recuperar Contraseña' }}
              />
              <Stack.Screen name="Join" component={JoinScreen} options={{ title: 'Unirse' }} />
              <Stack.Screen name="Controller" component={ControllerScreen} options={{ title: 'Control' }} />
              <Stack.Screen name="AboutUs" component={AboutUsScreen} options={{ title: 'Sobre Nosotros' }} />
              <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Privacidad - Tribiblia' }} />
              <Stack.Screen name="TermsOfUse" component={TermsOfUseScreen} options={{ title: 'Términos - Tribiblia' }} />
              <Stack.Screen name="CookiesPolicy" component={CookiesPolicyScreen} options={{ title: 'Cookies - Tribiblia' }} />
            </>
          )}
        </Stack.Navigator>
      </GameProvider>
    </AdminProvider>
  );
};

// Linking Configuration
const linking = {
  prefixes: [],
  config: {
    screens: {
      Login: '',
      Instructions: 'instructions',
      TeamConfig: 'setup',
      Game: 'game',
      GameOver: 'game-over',
      Admin: 'admin',
      Join: 'join',
      ForgotPassword: 'forgot-password',
      ResetPassword: 'reset-password',
    },
  },
};

// Simple Error Boundary
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#000' }}>
          <Text style={{ color: 'red', fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Algo salió mal (Error):</Text>
          <Text style={{ color: '#fff' }}>{this.state.error?.toString()}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

import { Footer } from './src/components/Footer';

// Helper to get active route name
const getActiveRouteName = (state: any): string => {
  if (!state || !state.routes) return '';
  const route = state.routes[state.index];
  if (route.state) {
    return getActiveRouteName(route.state);
  }
  return route.name;
};

// App Component
export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<string>('Login');

  useEffect(() => {
    async function prepare() {
      try {
        console.log("[DEBUG] App preparing...");
        // Load custom fonts
        // Load custom fonts with display: swap for better LCP
        await Font.loadAsync({
          'Anton': { uri: require('./assets/fonts/Anton-Regular.ttf'), display: Font.FontDisplay.SWAP },
          'Mulish-Regular': { uri: require('./assets/fonts/Mulish-Regular.ttf'), display: Font.FontDisplay.SWAP },
          'Mulish-Bold': { uri: require('./assets/fonts/Mulish-Bold.ttf'), display: Font.FontDisplay.SWAP },
          'Mulish-ExtraBold': { uri: require('./assets/fonts/Mulish-ExtraBold.ttf'), display: Font.FontDisplay.SWAP },
        });
        console.log("Fonts loaded.");
      } catch (e) {
        console.warn('Font loading error:', e);
      } finally {
        setAppIsReady(true);
        console.log("App ready set to true.");
      }
    }

    prepare();
  }, []);

  // Register Service Worker for PWA
  useEffect(() => {
    // serviceWorkerRegistration.register();
    serviceWorkerRegistration.unregister(); // Force unregister to clear cache issues
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#001B3A' }}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={{ color: '#fff', marginTop: 20 }}>Iniciando aplicación...</Text>
      </View>
    );
  }

  console.log("[DEBUG] App rendering main view. appIsReady:", appIsReady);
  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <ErrorBoundary>
        <HelmetProvider>
          <Helmet>
            <title>Tribiblia - Juego Bíblico de Preguntas</title>
            <meta name="description" content="Tribiblia es un emocionante juego de preguntas bíblicas tipo Jeopardy. Juega con amigos, crea equipos y demuestra tus conocimientos bíblicos." />
          </Helmet>
          <ThemeProvider>
            <SoundProvider>
              <AuthProvider>
                <SessionProvider>
                  <GlobalPresenceProvider>
                    {/* Re-enabled linking with minimal config to test */}
                    <NavigationContainer
                      linking={linking}
                      documentTitle={{ enabled: false }}
                      onStateChange={(state) => {
                        const routeName = getActiveRouteName(state);
                        setCurrentRoute(routeName);
                      }}
                    >
                      <StatusBar style="light" />
                      <RootNavigator />
                    </NavigationContainer>
                  </GlobalPresenceProvider>
                </SessionProvider>
              </AuthProvider>
            </SoundProvider>
          </ThemeProvider>
        </HelmetProvider>
      </ErrorBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
