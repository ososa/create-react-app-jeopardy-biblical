import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from './AuthContext';

type Player = {
    user_id: string;
    username: string;
    avatar: string;
    online_at: string;
};

type GlobalPresenceContextType = {
    onlinePlayers: Player[];
};

const GlobalPresenceContext = createContext<GlobalPresenceContextType>({
    onlinePlayers: [],
});

export const GlobalPresenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [onlinePlayers, setOnlinePlayers] = useState<Player[]>([]);

    useEffect(() => {
        if (!user) return;

        console.log(`[GlobalPresence] Initializing global channel...`);

        // Unique ID for this session (Root level, persists across screens)
        const connectionId = Math.random().toString(36).substring(7);
        const presenceKey = `${user.id}-${connectionId}`;

        const channel = supabase.channel('game_lobby:global', {
            config: {
                presence: {
                    key: presenceKey,
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                const currentPlayers: Player[] = [];
                Object.values(newState).forEach((state: any) => {
                    state.forEach((presence: any) => {
                        currentPlayers.push({
                            user_id: presence.user_id,
                            username: presence.username,
                            avatar: presence.avatar,
                            online_at: presence.online_at,
                        });
                    });
                });
                setOnlinePlayers(currentPlayers);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('[GlobalPresence] Tracking self in global lobby.');
                    await channel.track({
                        user_id: user.id,
                        username: user.user_metadata?.username || 'Guest',
                        avatar: user.user_metadata?.avatar || '👤',
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            console.log('[GlobalPresence] Cleaning up global channel.');
            supabase.removeChannel(channel);
        };
    }, [user]); // Re-run if user changes (login/logout)

    return (
        <GlobalPresenceContext.Provider value={{ onlinePlayers }}>
            {children}
        </GlobalPresenceContext.Provider>
    );
};

export const useGlobalPresence = () => useContext(GlobalPresenceContext);
