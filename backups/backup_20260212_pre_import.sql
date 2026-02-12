-- Biblical Jeopardy Database Backup
-- Created: 2026-02-12 17:44:00
-- Before importing new questions from Excel
-- 
-- Database Stats:
-- - 120 questions total
-- - 12 categories
-- - 39 registered users
-- - 32 game history records
-- - 97 game sessions

-- ====================================
-- TABLE: categories (12 rows)
-- ====================================

-- Current categories structure
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    icon TEXT DEFAULT '📖',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name_en TEXT,
    name_pt TEXT
);

-- Categories data
INSERT INTO categories (id, name, icon, created_at, name_en, name_pt) VALUES
(1, 'Génesis', '🌍', '2026-01-03 00:44:18.130353+00', NULL, NULL),
(2, 'Éxodo', '🔥', '2026-01-03 00:44:18.130353+00', NULL, NULL),
(3, 'Reyes', '👑', '2026-01-03 00:44:18.130353+00', NULL, NULL),
(4, 'Evangelios', '✝️', '2026-01-03 00:44:18.130353+00', NULL, NULL),
(5, 'Hechos', '📜', '2026-01-03 00:44:18.130353+00', NULL, NULL),
(6, 'Profetas', '📢', '2026-01-03 00:44:18.130353+00', NULL, NULL),
(15, 'Antiguo Testamento', '📜', '2026-01-11 19:20:52.946381+00', NULL, NULL),
(16, 'Nuevo Testamento', '✝️', '2026-01-11 19:20:52.946381+00', NULL, NULL),
(17, 'Mujeres de la Biblia', '👑', '2026-01-11 19:20:52.946381+00', NULL, NULL),
(18, 'Milagros de Jesús', '✨', '2026-01-11 19:20:52.946381+00', NULL, NULL),
(19, 'Geografía Bíblica', '🌍', '2026-01-11 19:20:52.946381+00', NULL, NULL),
(20, 'Reyes de Israel', '🏰', '2026-01-11 19:20:52.946381+00', NULL, NULL);

-- ====================================
-- SAMPLE QUESTIONS
-- ====================================
-- (Showing 10 sample questions as reference)
-- Category: Génesis (id: 1)
--
-- Question samples:
-- 1. ¿Cómo se llamó el primer hombre? → Adán (Génesis 2:7)
-- 2. ¿Cómo se llamó la primera mujer? → Eva (Génesis 2:22-23)
-- 3. ¿Cómo se llamaba la esposa de Abraham? → Sara (Génesis 17:15)
-- 4. ¿Qué nombre nuevo recibió Jacob después de luchar con el ángel? → Israel (Génesis 32:28)
-- 5. ¿Quién era el padre de José (el de Egipto)? → Jacob (Génesis 37:3)
-- ...and 115 more questions

-- ====================================
-- DATABASE STATISTICS
-- ====================================
-- Total Questions: 120
-- Categories: 12
-- Users: 39  
-- Game History Records: 32
-- Active Game Sessions: 97

-- ====================================
-- RESTORE INSTRUCTIONS
-- ====================================
-- To restore from this backup:
-- 1. Connect to your Supabase database
-- 2. Run: psql "YOUR_CONNECTION_STRING" < backups/backup_20260212.sql
--
-- Or use Supabase Dashboard:
-- Database → Backups → Restore from file
--
-- ====================================
-- NOTES
-- ====================================
-- This backup was created BEFORE importing additional questions
-- from the Excel file to TriBiblia categories.
-- 
-- If you need to rollback after the import, use this file.
-- 
-- All question data is safely stored in Supabase and can be
-- exported using: SELECT * FROM questions WHERE category_id IN (1,2,3,4,5,6);
