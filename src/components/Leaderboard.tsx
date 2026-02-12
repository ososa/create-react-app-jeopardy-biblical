import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { supabase } from '../utils/supabase';
import { useTranslation } from 'react-i18next';
import { getRank } from '../utils/gamification';

export const Leaderboard = ({ limit = 10, variant = 'gold' }: { limit?: number; variant?: 'gold' | 'cyan' }) => {
    const { t } = useTranslation();
    const [leaderboard, setLeaderboard] = useState<any[]>([]);

    useEffect(() => {
        fetchLeaderboard();
    }, [limit]);

    const fetchLeaderboard = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('username, avatar, xp')
            .order('xp', { ascending: false })
            .limit(limit);

        if (!error && data) {
            setLeaderboard(data);
        }
    };

    const isCyan = variant === 'cyan';
    const cardStyle = isCyan ? styles.cardCyan : styles.cardGold;
    const titleColor = isCyan ? 'rgb(15, 223, 223)' : '#FFD700';

    return (
        <View style={[styles.leaderboardCard, cardStyle]}>
            <View style={styles.titleContainer}>
                <View style={[styles.titleLine, { backgroundColor: titleColor }]} />
                <Text style={[styles.leaderboardTitle, { color: titleColor }]}>
                    {t('common.leaderboard.title', { count: limit, defaultValue: `🏆 TOP ${limit} JUGADORES` })}
                </Text>
                <View style={[styles.titleLine, { backgroundColor: titleColor }]} />
            </View>
            {leaderboard.map((player, index) => {
                const rank = index + 1;
                const isTop3 = rank <= 3;
                return (
                    <View key={index} style={styles.leaderboardItem}>
                        <View style={[styles.rankBadge, isTop3 && styles.topRankBadge]}>
                            <Text style={[styles.rankText, isTop3 && styles.topRankText]}>
                                {rank}
                            </Text>
                        </View>
                        <View style={styles.playerInfo}>
                            <Text style={styles.playerAvatar}>{player.avatar || '👤'}</Text>
                            <View>
                                <Text style={styles.playerName}>{player.username || t('common.leaderboard.defaultPlayer', 'Jugador')}</Text>
                                <Text style={styles.playerRank}>{t(getRank(player.xp || 0).title)}</Text>
                            </View>
                        </View>
                        <Text style={styles.playerXP}>{player.xp || 0} XP</Text>
                    </View>
                );
            })}
            {leaderboard.length === 0 && (
                <Text style={styles.emptyText}>{t('common.leaderboard.empty', 'No hay jugadores aún.')}</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    leaderboardCard: {
        width: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: 24, // Updated from 15
        padding: 20, // Updated to 20px per user request
        marginBottom: 30,
        // Shadow styles
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10, // Android fallback
    },
    cardGold: {
        borderWidth: 3,
        borderColor: '#FFD700',
    },
    cardCyan: {
        borderWidth: 3,
        borderColor: 'rgb(15, 223, 223)',
    },
    leaderboardTitle: {
        fontSize: 24,
        fontFamily: 'Anton',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginHorizontal: 15, // Space between text and lines
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        width: '100%',
    },
    titleLine: {
        flex: 1,
        height: 1,
        opacity: 0.6,
    },
    leaderboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    rankBadge: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    rankText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontFamily: 'Mulish-Bold',
    },
    topRankBadge: {
        backgroundColor: '#FFD700',
        transform: [{ scale: 1.1 }],
    },
    topRankText: {
        color: '#001B3A',
    },
    playerInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    playerAvatar: {
        fontSize: 24,
        marginRight: 15,
    },
    playerName: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: 'Mulish-Bold',
    },
    playerRank: {
        color: '#AAA',
        fontSize: 12,
        fontFamily: 'Mulish-Regular',
    },
    playerXP: {
        color: '#FFD700',
        fontSize: 16,
        fontFamily: 'Anton',
    },
    emptyText: {
        color: '#AAA',
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: 10,
    },
});
