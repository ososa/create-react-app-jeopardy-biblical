#!/usr/bin/env node

/**
 * Convert CSV files to ensure proper UTF-8 encoding
 * This script reads CSV files and re-saves them with explicit UTF-8 BOM
 */

const fs = require('fs');
const path = require('path');

const FILES = [
    'preguntas_parte1.csv',
    'preguntas_parte2.csv',
    'preguntas_parte3.csv',
    'preguntas_parte4.csv'
];

const INPUT_DIR = path.join(__dirname, '..', 'preguntas');
const OUTPUT_DIR = path.join(__dirname, '..', 'preguntas', 'utf8_fixed');

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

FILES.forEach(file => {
    const inputPath = path.join(INPUT_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, file);

    console.log(`Processing: ${file}`);

    // Read file
    const content = fs.readFileSync(inputPath, 'utf8');

    // Write with UTF-8 BOM (Byte Order Mark)
    // BOM helps Excel and XLSX library recognize UTF-8
    const BOM = '\uFEFF';
    fs.writeFileSync(outputPath, BOM + content, 'utf8');

    console.log(`✅ Saved: ${outputPath}`);
});

console.log('\n✅ All files converted with UTF-8 BOM');
console.log(`📁 Output directory: ${OUTPUT_DIR}`);
console.log('\n💡 Usa estos archivos para importar en lugar de los originales.');
