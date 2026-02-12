import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../utils/supabase';
import { useSession } from '../context/SessionContext';
import { useAuth } from '../context/AuthContext';
import { useGlobalPresence } from '../context/GlobalPresenceContext';

type Player = {
    user_id: string;
    username: string;
    avatar: string;
    online_at: string;
};

type ActivePlayersProps = {
    sessionId: string;
};

export const ActivePlayers: React.FC<ActivePlayersProps> = ({ sessionId }) => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [players, setPlayers] = useState<Player[]>([]);

    // If global, use context
    const { onlinePlayers: globalPlayers } = useGlobalPresence();

    useEffect(() => {
        if (!user) return;

        // If using global lobby, strictly consume from Context (which is maintained at Root)
        if (sessionId === 'global') {
            setPlayers(globalPlayers);
            return;
        }

        // --- PRIVATE CHANNEL LOGIC (Waiting Room / Game Session) ---
        // If we are here, sessionId is NOT 'global', so we act as a normal presence component specific to this session.

        const connectionId = Math.random().toString(36).substring(7);
        const presenceKey = `${user.id}-${connectionId}`;

        // console.log(`[ActivePlayers] Connecting to PRIVATE channel: game_lobby:${sessionId}`);

        const channel = supabase.channel(`game_lobby:${sessionId}`, {
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
                setPlayers(currentPlayers);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        user_id: user.id,
                        username: user.user_metadata?.username || 'Guest',
                        avatar: user.user_metadata?.avatar || '👤',
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionId, user, globalPlayers]); // Re-run when globalPlayers change ONLY if sessionId === 'global' (handled inside)

    const renderItem = ({ item }: { item: Player }) => (
        <View style={styles.playerContainer}>
            <Text style={styles.avatar}>{item.avatar}</Text>
            <Text style={styles.username} numberOfLines={1}>{item.username}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('common.onlinePlayers', 'JUGADORES EN LÍNEA')} ({players.length})</Text>
            <FlatList
                data={players}
                renderItem={renderItem}
                keyExtractor={(item, index) => `${item.user_id}-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={<Text style={styles.emptyText}>{t('game.waiting', 'Esperando jugadores...')}</Text>}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginTop: 20,
        marginBottom: 10,
        alignItems: 'center',
    },
    title: {
        fontFamily: 'Mulish-Bold',
        fontSize: 14,
        color: '#FFD700',
        marginBottom: 10,
        letterSpacing: 1,
    },
    listContent: {
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    playerContainer: {
        alignItems: 'center',
        marginHorizontal: 10,
        width: 70,
    },
    avatar: {
        fontSize: 30,
        marginBottom: 5,
    },
    username: {
        fontFamily: 'Mulish-Regular',
        fontSize: 12,
        color: '#FFF',
        textAlign: 'center',
    },
    emptyText: {
        color: 'rgba(255,255,255,0.5)',
        fontStyle: 'italic',
        fontFamily: 'Mulish-Regular',
    }
});
