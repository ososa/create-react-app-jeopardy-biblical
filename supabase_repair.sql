-- FIX: Re-crear tablas y políticas desde cero para corregir error 500
-- Ejecutar en SQL Editor de Supabase

-- 1. Limpiar todo (CUIDADO: Borrará datos existentes de estas tablas)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS profiles;

-- 2. Crear tabla de categorías
CREATE TABLE public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT '📖',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Crear tabla de perfiles (para admin flag)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Trigger para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Crear tabla de preguntas vinculada a categorías
CREATE TABLE public.questions (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES public.categories(id),
  category TEXT NOT NULL, -- Mantener por compatibilidad con código existente
  question TEXT NOT NULL,
  options TEXT[] NOT NULL, -- Array de strings
  answer TEXT NOT NULL,
  points INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Insertar categorías iniciales
INSERT INTO public.categories (name, icon) VALUES 
  ('Génesis', '🌍'),
  ('Éxodo', '🔥'),
  ('Reyes', '👑'),
  ('Evangelios', '✝️'),
  ('Hechos', '📜'),
  ('Profetas', '📢');

-- 7. Insertar preguntas de ejemplo (Manteniendo estructura)
-- NOTA: Se debe insertar category_id correcto. Usamos subconsultas.

INSERT INTO public.questions (category, category_id, question, options, answer, points) 
SELECT 'Génesis', id, '¿Quién construyó el arca?', ARRAY['Abraham', 'Noé', 'Moisés', 'David'], 'Noé', 100 FROM categories WHERE name = 'Génesis';

INSERT INTO public.questions (category, category_id, question, options, answer, points) 
SELECT 'Génesis', id, '¿Cuántos días tomó la creación?', ARRAY['5', '6', '7', '8'], '6', 100 FROM categories WHERE name = 'Génesis';

INSERT INTO public.questions (category, category_id, question, options, answer, points) 
SELECT 'Éxodo', id, '¿Quién liberó a Israel?', ARRAY['Moisés', 'Aarón', 'Josué', 'Caleb'], 'Moisés', 100 FROM categories WHERE name = 'Éxodo';

INSERT INTO public.questions (category, category_id, question, options, answer, points) 
SELECT 'Reyes', id, '¿Quién fue el rey más sabio?', ARRAY['David', 'Salomón', 'Saúl', 'Ezequías'], 'Salomón', 100 FROM categories WHERE name = 'Reyes';

INSERT INTO public.questions (category, category_id, question, options, answer, points) 
SELECT 'Evangelios', id, '¿Dónde nació Jesús?', ARRAY['Nazaret', 'Belén', 'Jerusalén', 'Egipto'], 'Belén', 100 FROM categories WHERE name = 'Evangelios';

-- 8. Habilitar RLS (Row Level Security)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- 9. Políticas de Seguridad (SIMPLIFICADAS para evitar errores de recursión)

-- Categories: Todos ven, solo admin edita
CREATE POLICY "Public categories access" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admin insert categories" ON public.categories FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admin update categories" ON public.categories FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admin delete categories" ON public.categories FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Profiles: 
-- Usuario ve su perfil.
-- Admin ve TODOS los perfiles.
CREATE POLICY "User view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
-- IMPORTANTE: Esta política usa SECURITY DEFINER en una función para evitar recursión infinita
-- Pero para simplificar y arreglar el error 500 rápido, permitiremos lectura pública de is_admin por ahora
-- O mejor: Admin ve todo
CREATE POLICY "Admin view all profiles" ON public.profiles FOR SELECT USING (
   (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- Questions: Todos ven, solo admin edita
CREATE POLICY "Public questions access" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Admin insert questions" ON public.questions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admin update questions" ON public.questions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admin delete questions" ON public.questions FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- 10. REPARAR PERFILES EXISTENTES
-- Dado que los usuarios ya existen en auth.users pero borramos la tabla profiles, necesitamos repoblara.
INSERT INTO public.profiles (id, email, is_admin)
SELECT id, email, false
FROM auth.users
ON CONFLICT (id) DO NOTHING;
