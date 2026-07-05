#!/usr/bin/env node

/**
 * Emergency Question Recovery Script
 * Verifies if questions were deleted or just hidden
 */

const { createClient } = require('@supabase/supabase-js');

// Load from env or hardcode temporarily
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://zokufijqqamiblhdxjxc.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // You need this!

if (!SUPABASE_SERVICE_KEY) {
    console.error('\n❌ ERROR: Se necesita la SERVICE KEY (no la anon key)');
    console.error('\n📝 Cómo obtenerla:');
    console.error('1. Ve a Supabase Dashboard');
    console.error('2. Settings → API');
    console.error('3. Copia "service_role" key (NO la "anon" key)');
    console.error('4. Ejecuta: SUPABASE_SERVICE_KEY="tu_key_aqui" node scripts/emergency_check.js\n');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkQuestions() {
    console.log('\n🔍 Verificando preguntas en la base de datos...\n');

    try {
        // Count total questions (bypassing RLS with service key)
        const { data: allQuestions, error: countError } = await supabase
            .from('questions')
            .select('*');

        if (countError) {
            console.error('❌ Error al contar:', countError.message);
            return;
        }

        console.log(`📊 Total de preguntas en DB: ${allQuestions.length}`);

        // Group by category
        const byCategory = {};
        allQuestions.forEach(q => {
            byCategory[q.category] = (byCategory[q.category] || 0) + 1;
        });

        console.log('\n📂 Preguntas por categoría:');
        Object.entries(byCategory)
            .sort((a, b) => b[1] - a[1])
            .forEach(([cat, count]) => {
                console.log(`   ${cat}: ${count}`);
            });

        // Check recent inserts
        const { data: recentQuestions, error: recentError } = await supabase
            .from('questions')
            .select('category, question, created_at')
            .order('created_at', { ascending: false })
            .limit(10);

        if (!recentError && recentQuestions.length > 0) {
            console.log('\n🕐 Últimas 10 preguntas insertadas:');
            recentQuestions.forEach((q, i) => {
                const date = new Date(q.created_at).toLocaleString();
                console.log(`   ${i + 1}. [${q.category}] ${q.question.substring(0, 50)}... (${date})`);
            });
        }

        // Verdict
        console.log('\n' + '='.repeat(60));
        if (allQuestions.length === 10) {
            console.log('❌ CONFIRMADO: Solo quedan 10 preguntas');
            console.log('💔 Las otras 110 se perdieron ');
        } else if (allQuestions.length >= 120) {
            console.log('✅ BUENAS NOTICIAS: Las preguntas siguen ahí!');
            console.log('⚠️  Problema: RLS está ocultando preguntas en el admin');
        } else {
            console.log(`⚠️  Situación mixta: Hay ${allQuestions.length} preguntas`);
            console.log(`📉 Faltan ${120 - allQuestions.length} preguntas`);
        }
        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.error('💥 Error general:', error);
    }
}

checkQuestions();
