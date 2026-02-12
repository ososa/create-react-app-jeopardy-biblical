
const { createClient } = require('@supabase/supabase-js');

// Config
const SUPABASE_URL = 'https://zokufijqqamiblhdxjxc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva3VmaWpxcWFtaWJsaGR4anhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczODQ1NTcsImV4cCI6MjA4Mjk2MDU1N30.qZZloaJRSMr2K-hxdw-_SILuDsORGezNQtPNUyjzvAI';

// Create Client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("Connecting to Supabase Presence 'game_lobby:global'...");

const channel = supabase.channel('game_lobby:global', {
    config: {
        presence: {
            key: 'debug-bot',
        },
    },
});

channel
    .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        console.log('\n--- CURRENT PLAYERS IN LOBBY ---');
        let count = 0;
        Object.values(newState).forEach((state) => {
            state.forEach((presence) => {
                count++;
                console.log(`- User: ${presence.username || 'Unknown'} (ID: ${presence.user_id}, Avatar: ${presence.avatar || '?'})`);
            });
        });
        console.log(`Total: ${count} players`);
        console.log('--------------------------------\n');
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('-> JOINED:', newPresences.map(p => p.username).join(', '));
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('<- LEFT:', leftPresences.map(p => p.username).join(', '));
    })
    .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
            console.log('✅ Connected! Watching for players...');
            channel.track({
                user_id: 'debug-bot',
                username: '🤖 DebugBot',
                avatar: '🤖',
                online_at: new Date().toISOString(),
            });
        }
    });

// Keep alive for 60 seconds then exit
setTimeout(() => {
    console.log('Debug session finished.');
    process.exit(0);
}, 15000); // 15 seconds should be enough to get initial sync
