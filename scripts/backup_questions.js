#!/usr/bin/env node

/**
 * Simple Database Backup - Post Import
 * Creates a JSON export of all questions for backup purposes
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://zokufijqqamiblhdxjxc.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ Error: SUPABASE_SERVICE_KEY environment variable is required');
    console.log('\nUsage:');
    console.log('  SUPABASE_SERVICE_KEY="your-service-key" node scripts/backup_questions.js');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function backupQuestions() {
    const fs = require('fs');
    const path = require('path');

    console.log('🔍 Fetching all questions from database...\n');

    const { data: questions, error } = await supabase
        .from('questions')
        .select('*')
        .order('category', { ascending: true })
        .order('created_at', { ascending: true });

    if (error) {
        console.error('❌ Error fetching questions:', error);
        process.exit(1);
    }

    console.log(`📊 Total questions: ${questions.length}`);

    // Create backup directory
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    // Create timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `questions_backup_${timestamp}.json`;
    const filepath = path.join(backupDir, filename);

    // Write backup
    fs.writeFileSync(filepath, JSON.stringify(questions, null, 2), 'utf8');

    console.log(`\n✅ Backup created successfully!`);
    console.log(`📁 File: ${filepath}`);
    console.log(`💾 Size: ${(fs.statSync(filepath).size / 1024).toFixed(2)} KB`);

    // Summary by category
    const byCategory = {};
    questions.forEach(q => {
        byCategory[q.category] = (byCategory[q.category] || 0) + 1;
    });

    console.log('\n📂 Questions by category:');
    Object.entries(byCategory).sort().forEach(([cat, count]) => {
        console.log(`   ${cat}: ${count}`);
    });
}

backupQuestions().catch(console.error);
