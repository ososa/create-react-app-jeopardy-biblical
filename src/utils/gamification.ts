
export interface Rank {
    title: string;
    minXp: number;
    icon: string;
}

export const RANKS: Rank[] = [
    { title: 'gamification.ranks.explorer', minXp: 0, icon: '🕯️' },
    { title: 'gamification.ranks.shepherd', minXp: 200, icon: '🐑' },
    { title: 'gamification.ranks.disciple', minXp: 500, icon: '📜' },
    { title: 'gamification.ranks.master', minXp: 1000, icon: '👑' },
];

export const getRank = (xp: number) => {
    // Find the highest rank where minXp <= xp
    // We reverse to find the last matching one easily, or just use findLast if env supports, 
    // but standard array filter is safer for RN compatibility.
    const sortedRanks = [...RANKS].sort((a, b) => b.minXp - a.minXp);
    return sortedRanks.find(r => xp >= r.minXp) || RANKS[0];
};

export const getNextRank = (xp: number) => {
    const currentRank = getRank(xp);
    const currentIndex = RANKS.findIndex(r => r.title === currentRank.title);
    return RANKS[currentIndex + 1] || null; // Null if max rank
};

export const getProgress = (xp: number) => {
    const current = getRank(xp);
    const next = getNextRank(xp);

    if (!next) return 100; // Max level

    const totalRange = next.minXp - current.minXp;
    const progress = xp - current.minXp;

    return Math.min(Math.max((progress / totalRange) * 100, 0), 100);
};
