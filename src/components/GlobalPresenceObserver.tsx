import React, { useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';

// This component renders nothing. It just maintains the user's presence in the 'global' channel.
export const GlobalPresenceObserver: React.FC = () => {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        // Generate a unique ID for this session/tab
        // We use sessionStorage (web) or memoize it to keep it stable if component re-renders
        // But since this is at Root, re-renders should be rare or controlled.
        // Let's generate one per mount.
        const connectionId = Math.random().toString(36).substring(7);
        const presenceKey = `${user.id}-${connectionId}`;

        console.log(`[GlobalPresence] Tracking user globally: ${presenceKey}`);

        const channel = supabase.channel('game_lobby:global', {
            config: {
                presence: {
                    key: presenceKey,
                },
            },
        });

        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({
                    user_id: user.id,
                    username: user.user_metadata?.username || 'Guest',
                    avatar: user.user_metadata?.avatar || '👤',
                    online_at: new Date().toISOString(),
                    status: 'online', // We can add more status info later (e.g. 'playing')
                });
            }
        });

        return () => {
            console.log(`[GlobalPresence] Unsubscribing global tracker.`);
            supabase.removeChannel(channel);
        };
    }, [user]);

    return null;
};
