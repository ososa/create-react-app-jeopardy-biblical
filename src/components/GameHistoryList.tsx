import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../utils/supabase';

// Helper for dates
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Helper for game mode info
const getGameModeInfo = (game: any, t: any) => {
    const gameState = game?.game_state;
    const isMultiplayer = gameState?.gameMode === 'multiplayer' ||
        (gameState?.team1Roster?.length > 0 || gameState?.team2Roster?.length > 0);

    return {
        label: isMultiplayer ? t('common.multiplayer', 'MULTIJUGADOR') : t('common.classic', 'CLÁSICO'),
        color: isMultiplayer ? '#FF6B00' : '#FFD700', // Orange vs Gold
        borderColor: isMultiplayer ? 'rgba(255, 107, 0, 0.5)' : 'rgba(255, 215, 0, 0.5)'
    };
};

type GameHistoryListProps = {
    games: any[];
    onResume: (game: any) => void;
    onDelete: (gameId: string) => void;
};

export const GameHistoryList: React.FC<GameHistoryListProps> = ({ games, onResume, onDelete }) => {
    const { t } = useTranslation();

    const activeGames = games.filter(g => g.status !== 'finished');
    const finishedGames = games.filter(g => g.status === 'finished');

    return (
        <View style={styles.container}>
            {/* ACTIVE GAMES */}
            {activeGames.length > 0 && (
                <View style={{ marginBottom: 20 }}>
                    <View style={styles.titleContainer}>
                        <View style={[styles.titleLine, { backgroundColor: '#FFD700' }]} />
                        <Text style={[styles.sectionHeader, { color: '#FFD700' }]}>🎮 {t('profile.inProgress')}</Text>
                        <View style={[styles.titleLine, { backgroundColor: '#FFD700' }]} />
                    </View>
                    {activeGames.map(game => {
                        const modeInfo = getGameModeInfo(game, t);
                        return (
                            <View key={game.id} style={[styles.gameCard, { borderColor: modeInfo.color, borderWidth: 2 }]}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={[styles.gameModeBadge, { color: modeInfo.color, borderColor: modeInfo.color }]}>
                                        {modeInfo.label}
                                    </Text>
                                    <TouchableOpacity onPress={() => onDelete(game.id)}>
                                        <Text>🗑️</Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity onPress={() => onResume(game)}>
                                    <Text style={styles.gameDate}>{formatDate(game.created_at)}</Text>
                                    <Text style={styles.gameVs}>
                                        {game.game_state?.team1Name || 'Equipo 1'} vs {game.game_state?.team2Name || 'Equipo 2'}
                                    </Text>
                                    <Text style={[styles.resumeText, { color: modeInfo.color }]}>{t('profile.resume')}</Text>
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>
            )}

            {/* FINISHED GAMES */}
            {finishedGames.length > 0 && (
                <View>
                    <View style={styles.titleContainer}>
                        <View style={[styles.titleLine, { backgroundColor: '#AAA' }]} />
                        <Text style={[styles.sectionHeader, { color: '#AAA' }]}>🎮 {t('profile.finished')}</Text>
                        <View style={[styles.titleLine, { backgroundColor: '#AAA' }]} />
                    </View>
                    {finishedGames.map(game => {
                        const modeInfo = getGameModeInfo(game, t);
                        return (
                            <View key={game.id} style={[styles.gameCard, { borderColor: '#888', opacity: 0.8 }]}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={[styles.gameModeBadge, { color: '#AAA', borderColor: '#AAA' }]}>{modeInfo.label}</Text>
                                    <TouchableOpacity onPress={() => onDelete(game.id)}>
                                        <Text>🗑️</Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity onPress={() => onResume(game)}>
                                    <Text style={styles.gameDate}>{new Date(game.finished_at || game.created_at).toLocaleDateString()}</Text>
                                    <Text style={styles.gameVs}>
                                        {game.game_state?.team1Name} ({game.game_state?.team1Score}) - {game.game_state?.team2Name} ({game.game_state?.team2Score})
                                    </Text>
                                    <Text style={styles.resumeText}>{t('profile.viewResults')}</Text>
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>
            )}

            {games.length === 0 && (
                <Text style={styles.helperText}>{t('profile.noGames')}</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    sectionHeader: {
        fontSize: 24,
        fontFamily: 'Anton',
        textAlign: 'center',
        letterSpacing: 1,
        marginHorizontal: 15, // Space between text and lines
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        width: '100%',
    },
    titleLine: {
        flex: 1,
        height: 1,
        opacity: 0.6,
    },
    helperText: {
        color: '#666',
        fontSize: 14,
        fontFamily: 'Mulish-Regular',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    gameCard: {
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
    },
    gameDate: {
        color: '#BBB',
        fontSize: 12,
        marginBottom: 5,
        fontFamily: 'Mulish-Regular',
    },
    gameVs: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: 'Anton',
        marginBottom: 5,
    },
    resumeText: {
        fontSize: 14,
        fontFamily: 'Mulish-Bold',
        letterSpacing: 0.5,
        marginTop: 5,
        color: '#AAA', // Default for finished
    },
    gameModeBadge: {
        borderWidth: 1,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        fontSize: 10,
        fontFamily: 'Mulish-Bold',
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
});
