import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { supabase, fetchRandomCategories } from '../utils/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useAuth } from './AuthContext';

export type UserPresence = {
    user_id: string;
    username: string;
    team: 1 | 2;
    avatar: string;
    online_at: string;
};

interface SessionContextType {
    sessionId: string | null;
    isHost: boolean;
    connectedUsers: UserPresence[];
    gameState: any; // Using any for flexibility now, define type later
    createSession: (categoryLimit?: number, questionsLimit?: number, hostId?: string) => Promise<{ id: string; questions: any[] } | null>;
    resumeSession: (id: string) => Promise<void>;
    joinSession: (id: string, username: string, team: 1 | 2, avatar: string) => Promise<void>;
    buzzIn: () => Promise<void>;
    leaveSession: () => Promise<void>;
    broadcastGameState: (state: any) => Promise<void>;
    lastBuzz: { user_id: string; timestamp: number } | null;
    buzzWinner: string | null;
    username: string;
    resetBuzzer: () => void;
    submitAnswer: (answer: string) => Promise<void>;
    lastAnswer: { user_id: string; answer: string } | null;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [connectedUsers, setConnectedUsers] = useState<UserPresence[]>([]);
    const [gameState, setGameState] = useState<any>(null);
    const [lastBuzz, setLastBuzz] = useState<{ user_id: string; timestamp: number } | null>(null);
    const [buzzWinner, setBuzzWinner] = useState<string | null>(null);
    const [lastAnswer, setLastAnswer] = useState<{ user_id: string; answer: string } | null>(null);
    const [currentUsername, setCurrentUsername] = useState<string>('');
    const channelRef = useRef<RealtimeChannel | null>(null);

    const buzzWinnerRef = useRef<string | null>(null);

    // Update ref when state changes
    useEffect(() => {
        buzzWinnerRef.current = buzzWinner;
    }, [buzzWinner]);

    const { user } = useAuth();

    const resumeSession = async (id: string) => {
        setSessionId(id);
        setIsHost(true);
        await subscribeToSession(id, 'HOST', 0, '👑');
    };

    const createSession = async (categoryLimit: number = 6, questionsLimit: number = 5, hostId?: string) => {
        try {
            // Use passed hostId or fall back to context user
            const finalHostId = hostId || user?.id || null;
            // 1. Fetch questions first
            const categories = await fetchRandomCategories(categoryLimit, questionsLimit);

            // 2. Prepare initial state
            const initialGameState = {
                questions: categories, // Hierarchical here
                currentTeam: 1,
                team1Score: 0,
                team2Score: 0,
                answeredQuestions: [],
                isGameOver: false,
                team1Name: 'Equipo 1',
                team2Name: 'Equipo 2',
                team1Roster: [],
                team2Roster: [],
                team1TurnIndex: 0,
                team2TurnIndex: 0
            };

            const pin = Math.floor(1000 + Math.random() * 9000).toString();

            if (!user) {
                console.warn("[WARN] SessionContext: createSession called but user is null. Game will be anonymous/offline.");
            }

            const { data, error } = await supabase
                .from('game_sessions')
                .insert([{
                    status: 'active', // Start active so state is valid
                    host_id: finalHostId, // Explicitly handle null
                    pin_code: pin,
                    is_active: true,
                    game_state: initialGameState
                }])
                .select()
                .single();

            if (error) {
                console.error("Supabase insert error:", error);
                throw error;
            }

            setSessionId(data.id);
            setIsHost(true);
            setGameState(initialGameState); // Update local context state
            await subscribeToSession(data.id, 'HOST', 0, '👑');

            // Return object with ID and questions (TeamConfigScreen needs questions to flatten)
            return { id: data.id, questions: categories };
        } catch (error) {
            console.error('Error creating session:', error);
            return null;
        }
    };

    const joinSession = async (id: string, username: string, team: 1 | 2, avatar: string) => {
        setSessionId(id);
        setIsHost(false);
        await subscribeToSession(id, username, team, avatar);
    };

    const subscribeToSession = async (id: string, username: string, team: number, avatar: string) => {
        setCurrentUsername(username);
        if (channelRef.current) {
            await channelRef.current.unsubscribe();
        }

        const channel = supabase.channel(`game:${id}`, {
            config: {
                presence: {
                    key: username,
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState<UserPresence>();
                const users: UserPresence[] = [];
                Object.keys(newState).forEach((key) => {
                    users.push(newState[key][0]);
                });
                setConnectedUsers(users);
            })
            .on('broadcast', { event: 'buzz' }, async (payload) => {
                // HOST LOGIC: Deterministic lock
                if (username === 'HOST') {
                    if (buzzWinnerRef.current === null) {
                        // We have a winner!
                        const winnerName = payload.payload.user_id;
                        console.log('Host detected winner:', winnerName);

                        // Update local ref immediately 
                        buzzWinnerRef.current = winnerName;
                        setBuzzWinner(winnerName);
                        setLastBuzz({ user_id: winnerName, timestamp: Date.now() });

                        // Broadcast the winner to everyone
                        await channel.send({
                            type: 'broadcast',
                            event: 'buzzer_winner',
                            payload: { username: winnerName }
                        });
                    } else {
                        console.log('Late buzz ignored:', payload.payload.user_id);
                    }
                }
            })
            .on('broadcast', { event: 'buzzer_winner' }, (payload) => {
                console.log('Winner broadcast received:', payload);
                const winner = payload.payload.username;
                setBuzzWinner(winner);
                setLastBuzz({ user_id: winner, timestamp: Date.now() });
            })
            .on('broadcast', { event: 'player_answer' }, (payload) => {
                // Host listens for answers
                if (username === 'HOST') {
                    console.log('Host received answer:', payload.payload);
                    setLastAnswer(payload.payload);
                }
            })
            .on('broadcast', { event: 'buzzer_reset' }, () => {
                setBuzzWinner(null);
                setLastBuzz(null);
                setLastAnswer(null);
                buzzWinnerRef.current = null;
            })
            .on('broadcast', { event: 'game_state' }, (payload) => {
                const newState = payload.payload;
                setGameState(newState);

                // Failsafe: If game goes idle (question closed), clear winner locally
                if (newState.status === 'idle' || newState.status === 'waiting') {
                    setBuzzWinner(null);
                    setLastBuzz(null);
                    setLastAnswer(null);
                }
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        user_id: username,
                        username,
                        team,
                        avatar,
                        online_at: new Date().toISOString(),
                    });
                }
            });

        channelRef.current = channel;
    };

    const buzzIn = async () => {
        if (!channelRef.current || isHost) return;

        const timestamp = Date.now();
        await channelRef.current.send({
            type: 'broadcast',
            event: 'buzz',
            payload: { user_id: currentUsername, timestamp },
        });
    };

    const submitAnswer = async (answer: string) => {
        if (!channelRef.current || isHost) return;
        await channelRef.current.send({
            type: 'broadcast',
            event: 'player_answer',
            payload: { user_id: currentUsername, answer }
        });
    };

    const broadcastGameState = async (state: any) => {
        if (!channelRef.current || !isHost) return;
        await channelRef.current.send({
            type: 'broadcast',
            event: 'game_state',
            payload: state,
        });
        setGameState(state); // Update local too

        // Host Local Cleanup: Ensure we clear variables if we are setting to idle
        // (Because the broadcast listener might not fire for the sender)
        if (state.status === 'idle' || state.status === 'waiting') {
            setBuzzWinner(null);
            setLastBuzz(null);
            setLastAnswer(null);
        }
    };

    const leaveSession = async () => {
        if (channelRef.current) {
            await channelRef.current.unsubscribe();
            channelRef.current = null;
        }
        setSessionId(null);
        setConnectedUsers([]);
        setIsHost(false);
    };

    return (
        <SessionContext.Provider
            value={{
                sessionId,
                isHost,
                connectedUsers,
                gameState,
                createSession,
                resumeSession,
                joinSession,
                buzzIn,
                submitAnswer,
                leaveSession,
                broadcastGameState,
                lastBuzz,
                lastAnswer,
                buzzWinner,
                username: currentUsername, // Expose for Controller comparison
                resetBuzzer: async () => {
                    if (channelRef.current && isHost) {
                        setBuzzWinner(null);
                        setLastBuzz(null);
                        setLastAnswer(null);
                        await channelRef.current.send({
                            type: 'broadcast',
                            event: 'buzzer_reset',
                            payload: {}
                        });
                    }
                }
            }}
        >
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = () => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
};
