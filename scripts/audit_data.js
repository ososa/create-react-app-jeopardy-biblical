const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Missing Supabase env vars");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkData() {
    console.log("Starting Full Data Audit...");

    // Fetch ALL questions (using pagination if needed, but for <1000 items, 1 fetch is okay)
    const { data: questions, error } = await supabase
        .from('questions')
        .select('id, question, question_en, category, category_id');

    if (error) {
        console.error("Error fetching questions:", error);
        return;
    }

    console.log(`Analyzing ${questions.length} questions...`);

    // 1. Translation Check
    const missingEn = questions.filter(q => !q.question_en || q.question_en.trim() === '');
    console.log(`\n[TRANSLATION] Missing English: ${missingEn.length}`);
    if (missingEn.length > 0) {
        console.log("IDs missing EN:", missingEn.map(q => q.id).join(', '));
    }

    // 2. Category Link Check
    const { data: categories } = await supabase.from('categories').select('id, name');

    if (categories) {
        let mismatchCount = 0;
        let orphanCount = 0;
        let wrongLinkLikelihood = 0; // Guessing if text implies one cat but link is another

        questions.forEach(q => {
            const cat = categories.find(c => c.id === q.category_id);
            if (cat) {
                // Check if string matches name
                const strMatch = cat.name === q.category;
                if (!strMatch) {
                    mismatchCount++;
                    console.log(`[MISMATCH] QID: ${q.id} ("${q.question.substring(0, 15)}...") | stored_cat: "${q.category}" != linked_cat: "${cat.name}"`);
                }

                // Heuristic: Check if question text mentions current Category? (Probaly too hard)
            } else {
                orphanCount++;
                console.log(`[ORPHAN] QID: ${q.id}`);
            }
        });
        console.log(`\n[CATEGORY] Mismatches (String vs Link): ${mismatchCount}`);
        console.log(`[CATEGORY] Orphans: ${orphanCount}`);
    }
}

checkData();
