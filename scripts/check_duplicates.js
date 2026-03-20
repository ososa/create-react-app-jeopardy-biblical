#!/usr/bin/env node

/**
 * Script to check for duplicate questions
 * - Checks duplicates within CSV files
 * - Checks duplicates against existing database
 * 
 * Usage:
 *   node scripts/check_duplicates.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CSV_FILES = [
    'preguntas/preguntas_parte1.csv',
    'preguntas/preguntas_parte2.csv',
    'preguntas/preguntas_parte3.csv',
    'preguntas/preguntas_parte4.csv'
];

/**
 * Parse CSV file manually (simple implementation)
 */
function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    // Skip header
    const rows = lines.slice(1);

    return rows.map((line, index) => {
        // Split by comma, but respect quoted fields
        const fields = [];
        let currentField = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
                currentField += char;
            } else if (char === ',' && !inQuotes) {
                fields.push(currentField.trim());
                currentField = '';
            } else {
                currentField += char;
            }
        }
        fields.push(currentField.trim());

        // Remove quotes from fields
        const cleanFields = fields.map(f => f.replace(/^"|"$/g, ''));

        return {
            file: path.basename(filePath),
            rowNumber: index + 2, // +2 because we skipped header and arrays are 0-indexed
            categoria: cleanFields[0],
            puntos: cleanFields[1],
            pregunta_es: cleanFields[2],
            correcta_es: cleanFields[3],
            referencia_es: cleanFields[8],
            pregunta_en: cleanFields[9],
            pregunta_pt: cleanFields[16]
        };
    });
}

/**
 * Normalize text for comparison (remove accents, lowercase, trim)
 */
function normalize(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[¿?¡!]/g, '') // Remove question marks
        .trim();
}

/**
 * Calculate similarity between two strings (Levenshtein-like)
 */
function calculateSimilarity(str1, str2) {
    const s1 = normalize(str1);
    const s2 = normalize(str2);

    if (s1 === s2) return 100;

    // Simple word-based comparison
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);

    const commonWords = words1.filter(w => words2.includes(w)).length;
    const totalWords = Math.max(words1.length, words2.length);

    return Math.round((commonWords / totalWords) * 100);
}

/**
 * Find duplicates within CSV files
 */
function findDuplicatesInCSVs() {
    console.log('\n🔍 Buscando duplicados DENTRO de los CSVs...\n');

    const allQuestions = [];

    // Load all questions
    CSV_FILES.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        if (fs.existsSync(filePath)) {
            const questions = parseCSV(filePath);
            allQuestions.push(...questions);
        }
    });

    console.log(`📊 Total de preguntas a revisar: ${allQuestions.length}\n`);

    const duplicates = [];

    // Compare each question with all others
    for (let i = 0; i < allQuestions.length; i++) {
        for (let j = i + 1; j < allQuestions.length; j++) {
            const q1 = allQuestions[i];
            const q2 = allQuestions[j];

            // Check similarity in Spanish questions
            const similarity = calculateSimilarity(q1.pregunta_es, q2.pregunta_es);

            if (similarity >= 80) { // 80% or more similar
                duplicates.push({
                    similarity,
                    q1: {
                        file: q1.file,
                        row: q1.rowNumber,
                        categoria: q1.categoria,
                        pregunta: q1.pregunta_es,
                        respuesta: q1.correcta_es
                    },
                    q2: {
                        file: q2.file,
                        row: q2.rowNumber,
                        categoria: q2.categoria,
                        pregunta: q2.pregunta_es,
                        respuesta: q2.correcta_es
                    }
                });
            }
        }
    }

    if (duplicates.length === 0) {
        console.log('✅ No se encontraron duplicados dentro de los CSVs\n');
    } else {
        console.log(`⚠️  Se encontraron ${duplicates.length} posibles duplicados:\n`);

        duplicates.forEach((dup, index) => {
            console.log(`${index + 1}. Similitud: ${dup.similarity}%`);
            console.log(`   [${dup.q1.file}:${dup.q1.row}] ${dup.q1.pregunta}`);
            console.log(`   [${dup.q2.file}:${dup.q2.row}] ${dup.q2.pregunta}`);
            console.log('');
        });
    }

    return duplicates;
}

/**
 * Check duplicates against database (requires Supabase connection)
 */
async function checkAgainstDatabase() {
    console.log('\n🔍 Para comparar contra la base de datos:\n');
    console.log('1. Ve al panel de Admin → Questions');
    console.log('2. Exporta las preguntas existentes a CSV');
    console.log('3. Coloca el archivo en: preguntas/existing_questions.csv');
    console.log('4. Vuelve a ejecutar este script\n');

    const existingFile = path.join(__dirname, '..', 'preguntas', 'existing_questions.csv');

    if (!fs.existsSync(existingFile)) {
        console.log('📝 Archivo existing_questions.csv no encontrado.\n');
        return;
    }

    console.log('✅ Archivo encontrado, comparando...\n');

    const existing = parseCSV(existingFile);
    const newQuestions = [];

    CSV_FILES.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        if (fs.existsSync(filePath)) {
            newQuestions.push(...parseCSV(filePath));
        }
    });

    const matches = [];

    newQuestions.forEach(newQ => {
        existing.forEach(existingQ => {
            const similarity = calculateSimilarity(newQ.pregunta_es, existingQ.pregunta_es);

            if (similarity >= 80) {
                matches.push({
                    similarity,
                    new: {
                        file: newQ.file,
                        row: newQ.rowNumber,
                        pregunta: newQ.pregunta_es
                    },
                    existing: {
                        pregunta: existingQ.pregunta_es,
                        categoria: existingQ.categoria
                    }
                });
            }
        });
    });

    if (matches.length === 0) {
        console.log('✅ No se encontraron duplicados contra la base de datos\n');
    } else {
        console.log(`⚠️  Se encontraron ${matches.length} posibles duplicados:\n`);
        matches.forEach((match, index) => {
            console.log(`${index + 1}. Similitud: ${match.similarity}%`);
            console.log(`   NUEVA: [${match.new.file}:${match.new.row}]`);
            console.log(`          ${match.new.pregunta}`);
            console.log(`   EXISTE: ${match.existing.pregunta}`);
            console.log('');
        });
    }
}

// Main execution
(async () => {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║  DETECTOR DE PREGUNTAS DUPLICADAS         ║');
    console.log('╚════════════════════════════════════════════╝');

    try {
        const csvDuplicates = findDuplicatesInCSVs();
        await checkAgainstDatabase();

        console.log('✅ Análisis completado\n');

        if (csvDuplicates.length > 0) {
            console.log('⚠️  IMPORTANTE: Revisa los duplicados antes de importar.\n');
            process.exit(1); // Exit with error code
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
})();
