-- Add translation columns for English and Portuguese
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS question_en TEXT,
ADD COLUMN IF NOT EXISTS answer_en TEXT,
ADD COLUMN IF NOT EXISTS options_en JSONB,
ADD COLUMN IF NOT EXISTS reference_en TEXT,
ADD COLUMN IF NOT EXISTS question_pt TEXT,
ADD COLUMN IF NOT EXISTS answer_pt TEXT,
ADD COLUMN IF NOT EXISTS options_pt JSONB,
ADD COLUMN IF NOT EXISTS reference_pt TEXT;
