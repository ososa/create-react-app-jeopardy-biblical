-- 1. Helper Function for Admin Check (Prevent Recursion)
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Categories Table
DROP TABLE IF EXISTS public.categories CASCADE;
CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT '📖',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Profiles Table
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Questions Table
DROP TABLE IF EXISTS public.questions CASCADE;
CREATE TABLE IF NOT EXISTS public.questions (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  answer TEXT NOT NULL,
  points INTEGER DEFAULT 100,
  category_id INTEGER REFERENCES public.categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Trigger for New User Profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- 7. Policies for Categories
DROP POLICY IF EXISTS "Public view categories" ON categories;
DROP POLICY IF EXISTS "Admin modify categories" ON categories;

CREATE POLICY "Public view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Admin insert categories" ON categories FOR INSERT WITH CHECK (public.check_is_admin());
CREATE POLICY "Admin update categories" ON categories FOR UPDATE USING (public.check_is_admin());
CREATE POLICY "Admin delete categories" ON categories FOR DELETE USING (public.check_is_admin());

-- 8. Policies for Profiles
DROP POLICY IF EXISTS "Users view own profile" ON profiles;
DROP POLICY IF EXISTS "Admin view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin modify profiles" ON profiles;

CREATE POLICY "Users view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admin view all profiles" ON profiles FOR SELECT USING (public.check_is_admin());
CREATE POLICY "Admin update profiles" ON profiles FOR UPDATE USING (public.check_is_admin());

-- 9. Policies for Questions
DROP POLICY IF EXISTS "Public view questions" ON questions;
DROP POLICY IF EXISTS "Admin modify questions" ON questions;

CREATE POLICY "Public view questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Admin insert questions" ON questions FOR INSERT WITH CHECK (public.check_is_admin());
CREATE POLICY "Admin update questions" ON questions FOR UPDATE USING (public.check_is_admin());
CREATE POLICY "Admin delete questions" ON questions FOR DELETE USING (public.check_is_admin());

-- 10. Insert Initial Data
INSERT INTO categories (name, icon) VALUES 
  ('Génesis', '🌍'),
  ('Éxodo', '🔥'),
  ('Reyes', '👑'),
  ('Evangelios', '✝️'),
  ('Hechos', '📜'),
  ('Profetas', '📢')
ON CONFLICT (name) DO NOTHING;

-- Insert Questions (using JSONB array syntax)
INSERT INTO questions (category, question, options, answer, points) VALUES
-- GÉNESIS
('Génesis', '¿Quién construyó el arca?', '["Abraham", "Noé", "Moisés", "David"]', 'Noé', 100),
('Génesis', '¿Cuántos días tomó la creación?', '["5", "6", "7", "8"]', '6', 100),
('Génesis', '¿Quién fue el primer hombre?', '["Adán", "Noé", "Abraham", "Moisés"]', 'Adán', 200),
-- ÉXODO
('Éxodo', '¿Quién liberó a Israel de Egipto?', '["Abraham", "José", "Moisés", "Josué"]', 'Moisés', 100),
('Éxodo', '¿Cuántas plagas hubo en Egipto?', '["7", "8", "9", "10"]', '10', 100),
-- REYES
('Reyes', '¿Quién fue el rey más sabio?', '["David", "Salomón", "Saúl", "Josías"]', 'Salomón', 100),
-- EVANGELIOS
('Evangelios', '¿En qué ciudad nació Jesús?', '["Nazaret", "Jerusalén", "Belén", "Capernaum"]', 'Belén', 100),
-- HECHOS
('Hechos', '¿Quién escribió los Hechos?', '["Pablo", "Pedro", "Lucas", "Juan"]', 'Lucas', 100),
-- PROFETAS
('Profetas', '¿Qué profeta fue tragado por un gran pez?', '["Elías", "Eliseo", "Jonás", "Isaías"]', 'Jonás', 100);
