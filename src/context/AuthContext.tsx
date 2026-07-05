import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../utils/supabase';
import { Session, User } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    isPasswordRecovery: boolean;
    authError: { code: string; message: string } | null;
    clearAuthError: () => void;
    signIn: (email: string, password: string, captchaToken?: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string, username: string, avatar?: string, captchaToken?: string) => Promise<{ error: Error | null }>;
    updateProfile: (updates: { username?: string; avatar?: string }) => Promise<{ error: Error | null }>;
    addExperience: (amount: number) => Promise<void>;
    updatePassword: (password: string) => Promise<{ error: Error | null }>;
    resetPassword: (email: string) => Promise<{ error: Error | null }>;
    completePasswordRecovery: () => void;
    signOut: () => Promise<void>;
    signInAsGuest: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
    const [authError, setAuthError] = useState<{ code: string; message: string } | null>(null);

    useEffect(() => {
        console.log("[DEBUG] AuthProvider mounted");
        // Check for existing session
        const initSession = async () => {
            console.log("[DEBUG] AuthProvider: initSession starting...");

            try {
                // Check if we are in a recovery flow via URL (Web only robust check)
                // This must happen BEFORE getting the session to ensure we catch the intent
                let isRecovery = false;
                if (Platform.OS === 'web' && typeof window !== 'undefined') {
                    const hash = window.location.hash;

                    // 1. Detect Recovery Mode
                    // Check Hash (Implicit Flow) - e.g. #access_token=...&type=recovery
                    if (hash && hash.includes('type=recovery')) {
                        console.log('Detected recovery flow via hash');
                        isRecovery = true;
                        setIsPasswordRecovery(true);
                    }

                    // 2. Detect Auth Errors
                    // Check for Error in Hash (e.g. #error=access_denied&error_code=otp_expired...)
                    if (hash && hash.includes('error=')) {
                        console.log('Detected error in hash:', hash);
                        const params = new URLSearchParams(hash.replace('#', ''));
                        const errorCode = params.get('error_code');
                        const errorDescription = params.get('error_description') || 'Unknown auth error';

                        if (errorCode) {
                            setAuthError({ code: errorCode, message: errorDescription.replace(/\+/g, ' ') });
                        }
                    }

                    // 3. Clear the Hash to prevent loop/sticky session issues
                    // We do this AFTER capturing necessary info, but BEFORE session check completes to clean URL
                    if (hash && (hash.includes('access_token') || hash.includes('error=') || hash.includes('type=recovery'))) {
                        console.log('Clearing auth hash from URL...');
                        window.history.replaceState(null, '', window.location.pathname + window.location.search);
                    }

                    // Check Query Params (PKCE Flow)
                    const search = window.location.search;
                    if (search && search.includes('type=recovery')) {
                        console.log('Detected recovery flow via search');
                        isRecovery = true;
                        setIsPasswordRecovery(true);
                    }
                }

                const { data: { session } } = await supabase.auth.getSession();

                // If we found a session, make sure it's valid
                setSession(session);
                setUser(session?.user ?? null);
            } catch (error) {
                console.error('Error getting session:', error);
            } finally {
                console.log("[DEBUG] AuthProvider: initSession finished, isLoading setting to false");
                setIsLoading(false);
            }
        };

        initSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                console.log("[DEBUG] onAuthStateChange event:", _event);
                setSession(session);
                setUser(session?.user ?? null);

                // Clear loading state if auth state changes (e.g. late session recovery)
                setIsLoading(false);

                // Persist refresh token securely
                if (Platform.OS !== 'web') {
                    if (session?.refresh_token) {
                        await SecureStore.setItemAsync('refresh_token', session.refresh_token);
                    } else {
                        await SecureStore.deleteItemAsync('refresh_token');
                    }
                }

                if (_event === 'PASSWORD_RECOVERY') {
                    setIsPasswordRecovery(true);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string, captchaToken?: string) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
                options: captchaToken ? { captchaToken } : undefined
            });
            return { error: error as Error | null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const signInAsGuest = async () => {
        const guestUser = {
            id: 'guest-local-user',
            aud: 'authenticated',
            role: 'authenticated',
            email: 'guest@tribiblia.local',
            phone: '',
            app_metadata: { provider: 'local' },
            user_metadata: {
                username: 'Invitado Local',
                avatar: '👤',
                xp: 0
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            identities: [],
            factors: []
        } as User;

        setUser(guestUser);
        // We don't set a real session, but the app relies on 'user' object mostly
    };

    const signUp = async (email: string, password: string, username: string, avatar?: string, captchaToken?: string) => {
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    captchaToken: captchaToken ? captchaToken : undefined,
                    data: {
                        username,
                        avatar: avatar || '👤'
                    }
                }
            });
            // If success, we also need to update the profile table triggered by handle_new_user mechanism
            // But wait, the trigger only inserts id and email.
            // We need to manually update username and avatar in profiles OR update the trigger.
            // Since we don't want to modify the trigger logic extensively blindly, let's just update the profile after signup if session exists (which it won't if email confirmation is on).
            // Actually, Supabase copies metadata to user object, but not automatically to custom tables unless trigger does it.
            // For now, let's rely on metadata for immediate display, and update profile table if possible.

            // To ensure data consistency, let's try to update the profile immediately if we have a user
            // But wait, signUp might return session null if email confirm is required.

            return { error: error as Error | null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const updateProfile = async (updates: { username?: string; avatar?: string }) => {
        try {
            const { error } = await supabase.auth.updateUser({
                data: updates
            });

            if (error) throw error;

            // Also update the public profiles table
            if (user && user.id !== 'guest-local-user') {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        ...updates,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', user.id);

                // Non-fatal error log for profiles table sync
                if (profileError) {
                    console.warn('Profile table sync failed:', profileError);
                }
            }

            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const addExperience = async (amount: number) => {
        if (!user) return;

        // Handle guest user locally
        if (user.id === 'guest-local-user') {
            const currentXp = user.user_metadata?.xp || 0;
            const newXp = currentXp + amount;
            setUser({
                ...user,
                user_metadata: { ...user.user_metadata, xp: newXp }
            });
            return;
        }

        try {
            const currentXp = user.user_metadata?.xp || 0;
            const newXp = currentXp + amount;
            console.log(`Adding ${amount} XP. New Total: ${newXp}`);

            const { error: updateError } = await supabase.auth.updateUser({
                data: { xp: newXp }
            });

            if (updateError) throw updateError;

            // Try to sync with profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ xp: newXp, updated_at: new Date().toISOString() })
                .eq('id', user.id);

            if (profileError) {
                console.log('Note: profiles table update failed (maybe no xp column), but metadata updated.');
            }

            // Update local user object manually to reflect efficiently
            setUser(prev => prev ? {
                ...prev,
                user_metadata: { ...prev.user_metadata, xp: newXp }
            } : null);

        } catch (error) {
            console.error('Error adding XP:', error);
        }
    };

    const updatePassword = async (password: string) => {
        try {
            // Check if we have a session (should be true if logged in) or try to rescue from URL
            if (!session && Platform.OS === 'web' && typeof window !== 'undefined') {
                const hash = window.location.hash;
                if (hash && hash.includes('access_token')) {
                    console.log('Attempting to recover session from URL hash before updating password...');

                    // Manually parse hash (it's #key=val&key2=val2...)
                    const params = new URLSearchParams(hash.replace('#', ''));
                    const accessToken = params.get('access_token');
                    const refreshToken = params.get('refresh_token');

                    if (accessToken && refreshToken) {
                        const { data, error } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        });
                        if (error) throw error;
                        console.log('Session manually recovered from hash.');
                        // Wait a tick for state updates? No, direct call should work with new session context internally or we rely on setSession promise resolution.
                    }
                }
            }

            const { error } = await supabase.auth.updateUser({ password });
            return { error: error as Error | null };
        } catch (error) {
            console.error('Update password failed:', error);
            return { error: error as Error };
        }
    };

    const resetPassword = async (email: string) => {
        try {
            // Note: This requires the redirect URL to be configured in Supabase dashboard
            // For web, it should point to the hosted URL/reset-password or similar
            // But usually simply redirecting to the app root is enough if we handle the recovery token
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined,
            });
            return { error: error as Error | null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const completePasswordRecovery = () => {
        setIsPasswordRecovery(false);
    };

    const clearAuthError = () => {
        setAuthError(null);
    };

    const signOut = async () => {
        try {
            if (user?.id === 'guest-local-user') {
                setUser(null);
                setSession(null);
                return;
            }

            // 1. Sign out from Supabase
            const { error } = await supabase.auth.signOut();
            if (error) console.error("Error signing out:", error);

            // 2. Clear local storage explicitly (redundant but safe)
            if (Platform.OS === 'web') {
                window.localStorage.removeItem('sb-access-token');
                window.localStorage.removeItem('sb-refresh-token');
                // Also clear any stuck hash
                window.history.replaceState(null, '', window.location.pathname);
            } else {
                await SecureStore.deleteItemAsync('refresh_token');
            }

            // 3. Update state
            setSession(null);
            setUser(null);
            setIsPasswordRecovery(false);

            // 4. Force reload on web to clear memory state if needed? 
            // Better to let state update handle it, but if stuck, maybe necessary.
            // For now, let's rely on state update.

        } catch (e) {
            console.error("SignOut Exception:", e);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            session,
            isLoading,
            isPasswordRecovery,
            signIn,
            signUp,
            signOut,
            updateProfile,
            updatePassword,
            resetPassword,
            completePasswordRecovery,
            addExperience,
            signInAsGuest,
            authError,
            clearAuthError
        }}>
            {children}
        </AuthContext.Provider>
    );
};
