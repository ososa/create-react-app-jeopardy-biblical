
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Mock AsyncStorage for node environment
const AsyncStorage = {
    getItem: () => Promise.resolve(null),
    setItem: () => Promise.resolve(),
    removeItem: () => Promise.resolve(),
};

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
    },
});

async function testFetchRandomCategories(limit) {
    console.log(`Testing with limit: ${limit}`);

    // Copy-pasting logic from supabase.ts to verify the logic itself in isolation
    // OR importing it if I can handle TS imports. 
    // Since the project is TS, running a JS script importing TS source is tricky without setup.
    // I will replicate the LOGIC here to test the slicing mechanism against the real DB RPC.

    const CATEGORY_COUNT = 6;
    let useFallback = false;

    // 1. Check count
    const { count, error: countError } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error('Count Error:', countError);
        return;
    }
    console.log('Total Categories Count:', count);

    let categories = [];

    if (!count || count < CATEGORY_COUNT) {
        console.log('Not enough categories (or count=0), forcing fallback');
        useFallback = true;
    } else {
        console.log('Trying RPC...');
        const { data, error } = await supabase
            .rpc('get_random_categories', { limit_count: CATEGORY_COUNT });

        if (error) {
            console.warn('[WARN] RPC Error, fallback to select:', error.message);
            useFallback = true;
        } else {
            categories = data;
        }
    }

    if (useFallback) {
        console.log('Fetching via fallback SELECT...');
        const { data, error } = await supabase
            .from('categories')
            .select(`
                id,
                name,
                questions (
                    id,
                    question,
                    answer,
                    points
                )
            `)
            .limit(CATEGORY_COUNT);
        if (error) { console.error('Select Error:', error); return; }
        categories = data || [];
    }

    console.log(`Fetched ${categories.length} categories.`);

    const processed = categories.map(cat => {
        const sorted = (cat.questions || []).sort((a, b) => a.points - b.points);
        const limited = sorted.slice(0, limit);
        return {
            name: cat.name,
            questionsCount: limited.length,
            points: limited.map(q => q.points)
        };
    });

    console.log('Processed Results:', JSON.stringify(processed, null, 2));
}

testFetchRandomCategories(1);
testFetchRandomCategories(3);
