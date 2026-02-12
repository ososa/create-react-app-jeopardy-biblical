-- SQL para configurar Admin Panel en Supabase
-- Ejecutar en el SQL Editor de Supabase

-- 1. Crear tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT '📖',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear tabla de perfiles (para admin flag)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Trigger para crear perfil automáticamente al registrarse
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

-- 4. Agregar category_id a questions si no existe
ALTER TABLE questions ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id);

-- 5. Insertar categorías iniciales
INSERT INTO categories (name, icon) VALUES 
  ('Génesis', '🌍'),
  ('Éxodo', '🔥'),
  ('Reyes', '👑'),
  ('Evangelios', '✝️'),
  ('Hechos', '📜'),
  ('Profetas', '📢')
ON CONFLICT (name) DO NOTHING;

-- 6. Habilitar RLS (Row Level Security)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 7. Políticas para categories (todos pueden leer, solo admin puede modificar)
DROP POLICY IF EXISTS "Everyone can view categories" ON categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Admins can update categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;

CREATE POLICY "Everyone can view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON categories FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins can update categories" ON categories FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins can delete categories" ON categories FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- 8. Políticas para profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- 9. Políticas para questions (todos pueden leer, solo admin puede modificar)
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view questions" ON questions;
DROP POLICY IF EXISTS "Admins can insert questions" ON questions;
DROP POLICY IF EXISTS "Admins can update questions" ON questions;
DROP POLICY IF EXISTS "Admins can delete questions" ON questions;

CREATE POLICY "Everyone can view questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Admins can insert questions" ON questions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins can update questions" ON questions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins can delete questions" ON questions FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- 10. Insertar preguntas de ejemplo (10+ por categoría)
INSERT INTO questions (category, question, options, answer, points) VALUES
-- GÉNESIS (10 preguntas)
('Génesis', '¿Quién construyó el arca?', '["Abraham", "Noé", "Moisés", "David"]', 'Noé', 100),
('Génesis', '¿Cuántos días tomó la creación?', '["5", "6", "7", "8"]', '6', 100),
('Génesis', '¿Quién fue el primer hombre?', '["Adán", "Noé", "Abraham", "Moisés"]', 'Adán', 100),
('Génesis', '¿Qué fruto prohibido comieron Adán y Eva?', '["Manzana", "Uva", "No se especifica", "Higo"]', 'No se especifica', 200),
('Génesis', '¿Cuántos hijos tuvo Jacob?', '["10", "11", "12", "13"]', '12', 200),
('Génesis', '¿Quién vendió a José como esclavo?', '["Sus hermanos", "Sus padres", "Los egipcios", "Los filisteos"]', 'Sus hermanos', 200),
('Génesis', '¿En qué día creó Dios al hombre?', '["Cuarto", "Quinto", "Sexto", "Séptimo"]', 'Sexto', 300),
('Génesis', '¿Cuántos años vivió Matusalén?', '["800", "900", "969", "999"]', '969', 300),
('Génesis', '¿Qué animal engañó a Eva?', '["León", "Serpiente", "Águila", "Lobo"]', 'Serpiente', 100),
('Génesis', '¿Cuál era el nombre de la esposa de Abraham?', '["Sara", "Rebeca", "Raquel", "Lea"]', 'Sara', 200),
('Génesis', '¿Quién fue Caín?', '["Primer hijo de Adán", "Hermano de Noé", "Padre de Abraham", "Esposo de Sara"]', 'Primer hijo de Adán', 100),

-- ÉXODO (10 preguntas)
('Éxodo', '¿Quién liberó a Israel de Egipto?', '["Abraham", "José", "Moisés", "Josué"]', 'Moisés', 100),
('Éxodo', '¿Cuántas plagas hubo en Egipto?', '["7", "8", "9", "10"]', '10', 100),
('Éxodo', '¿Qué mar dividió Moisés?', '["Mar Muerto", "Mar Rojo", "Mar Mediterráneo", "Mar de Galilea"]', 'Mar Rojo', 100),
('Éxodo', '¿En qué monte recibió Moisés los mandamientos?', '["Monte Carmelo", "Monte Sinaí", "Monte de los Olivos", "Monte Tabor"]', 'Monte Sinaí', 200),
('Éxodo', '¿Cuántos mandamientos recibió Moisés?', '["5", "7", "10", "12"]', '10', 100),
('Éxodo', '¿Quién era el hermano de Moisés?', '["Aarón", "José", "Leví", "Judá"]', 'Aarón', 200),
('Éxodo', '¿Qué comían los israelitas en el desierto?', '["Pan y vino", "Maná y codornices", "Frutas y verduras", "Pescado"]', 'Maná y codornices', 200),
('Éxodo', '¿Cuántos años vagaron en el desierto?', '["10", "20", "30", "40"]', '40', 200),
('Éxodo', '¿Qué adoraron los israelitas mientras Moisés estaba en el monte?', '["Un león de oro", "Un becerro de oro", "Una serpiente de bronce", "Un águila de plata"]', 'Un becerro de oro', 300),
('Éxodo', '¿Quién encontró a Moisés bebé en el río?', '["Una esclava", "La esposa de Faraón", "La hija de Faraón", "Su madre"]', 'La hija de Faraón', 200),

-- REYES (10 preguntas)
('Reyes', '¿Quién fue el rey más sabio?', '["David", "Salomón", "Saúl", "Josías"]', 'Salomón', 100),
('Reyes', '¿Quién derrotó a Goliat?', '["Saúl", "Jonatán", "David", "Samuel"]', 'David', 100),
('Reyes', '¿Quién fue el primer rey de Israel?', '["David", "Salomón", "Saúl", "Samuel"]', 'Saúl', 200),
('Reyes', '¿Qué construyó Salomón para Dios?', '["Un altar", "El templo", "Un palacio", "Una muralla"]', 'El templo', 200),
('Reyes', '¿Cuántas mujeres tuvo Salomón?', '["100", "300", "500", "700"]', '700', 300),
('Reyes', '¿Quién ungió a David como rey?', '["Elías", "Samuel", "Natán", "Saúl"]', 'Samuel', 200),
('Reyes', '¿Qué instrumento tocaba David?', '["Flauta", "Arpa", "Trompeta", "Tambor"]', 'Arpa', 100),
('Reyes', '¿Quién era Absalón?', '["Hijo de David", "Hijo de Salomón", "Hermano de David", "General del ejército"]', 'Hijo de David', 300),
('Reyes', '¿Qué profeta confrontó a David por su pecado?', '["Elías", "Eliseo", "Natán", "Isaías"]', 'Natán', 300),
('Reyes', '¿Con quién pecó David?', '["Raquel", "Betsabé", "Mical", "Abigaíl"]', 'Betsabé', 200),

-- EVANGELIOS (10 preguntas)
('Evangelios', '¿En qué ciudad nació Jesús?', '["Nazaret", "Jerusalén", "Belén", "Capernaum"]', 'Belén', 100),
('Evangelios', '¿Cuántos discípulos tuvo Jesús?', '["10", "11", "12", "13"]', '12', 100),
('Evangelios', '¿Quién bautizó a Jesús?', '["Pedro", "Juan el Bautista", "Pablo", "Santiago"]', 'Juan el Bautista', 100),
('Evangelios', '¿Cuál fue el primer milagro de Jesús?', '["Sanar un ciego", "Convertir agua en vino", "Multiplicar panes", "Caminar sobre el agua"]', 'Convertir agua en vino', 200),
('Evangelios', '¿Quién negó a Jesús tres veces?', '["Juan", "Pedro", "Judas", "Tomás"]', 'Pedro', 200),
('Evangelios', '¿Por cuántas monedas traicionó Judas a Jesús?', '["20", "30", "40", "50"]', '30', 200),
('Evangelios', '¿Cuántos días estuvo Jesús en el desierto?', '["30", "40", "50", "60"]', '40', 200),
('Evangelios', '¿Quién era el gobernador romano que juzgó a Jesús?', '["Herodes", "Pilato", "César", "Félix"]', 'Pilato', 300),
('Evangelios', '¿A quién resucitó Jesús en Betania?', '["Pedro", "Lázaro", "Juan", "Marta"]', 'Lázaro', 300),
('Evangelios', '¿Cuántos panes usó Jesús para alimentar a 5000?', '["3", "5", "7", "12"]', '5', 200),

-- HECHOS (10 preguntas)
('Hechos', '¿Quién escribió los Hechos?', '["Pablo", "Pedro", "Lucas", "Juan"]', 'Lucas', 100),
('Hechos', '¿En qué día descendió el Espíritu Santo?', '["Pascua", "Pentecostés", "Tabernáculos", "Día de Expiación"]', 'Pentecostés', 100),
('Hechos', '¿Cuántas personas se convirtieron en Pentecostés?', '["1000", "2000", "3000", "5000"]', '3000', 200),
('Hechos', '¿Cómo se llamaba Pablo antes de convertirse?', '["Simón", "Saulo", "Silas", "Bernabé"]', 'Saulo', 200),
('Hechos', '¿En qué camino tuvo Pablo su encuentro con Jesús?', '["Jerusalén", "Damasco", "Antioquía", "Roma"]', 'Damasco', 200),
('Hechos', '¿Quién fue el primer mártir cristiano?', '["Pedro", "Esteban", "Santiago", "Pablo"]', 'Esteban', 200),
('Hechos', '¿Quién liberó a Pedro de la cárcel?', '["Pablo", "Un terremoto", "Un ángel", "Los discípulos"]', 'Un ángel', 300),
('Hechos', '¿A dónde quería ir Pablo pero el Espíritu no le dejó?', '["Roma", "Asia", "Jerusalén", "Egipto"]', 'Asia', 300),
('Hechos', '¿Quién acompañó a Pablo en su primer viaje misionero?', '["Pedro", "Bernabé", "Silas", "Timoteo"]', 'Bernabé', 200),
('Hechos', '¿En qué ciudad se llamó cristianos por primera vez a los creyentes?', '["Jerusalén", "Roma", "Antioquía", "Corinto"]', 'Antioquía', 300),

-- PROFETAS (10 preguntas)
('Profetas', '¿Qué profeta fue tragado por un gran pez?', '["Elías", "Eliseo", "Jonás", "Isaías"]', 'Jonás', 100),
('Profetas', '¿Qué profeta fue llevado al cielo en un carro de fuego?', '["Eliseo", "Elías", "Moisés", "Enoc"]', 'Elías', 100),
('Profetas', '¿Qué profeta tuvo una visión de huesos secos?', '["Isaías", "Jeremías", "Ezequiel", "Daniel"]', 'Ezequiel', 200),
('Profetas', '¿En qué foso fue echado Daniel?', '["Foso de serpientes", "Foso de leones", "Foso de fuego", "Foso de agua"]', 'Foso de leones', 100),
('Profetas', '¿Cuántos amigos de Daniel fueron echados al horno?', '["2", "3", "4", "5"]', '3', 200),
('Profetas', '¿Qué profeta se casó con una mujer infiel por orden de Dios?', '["Isaías", "Jeremías", "Oseas", "Amós"]', 'Oseas', 300),
('Profetas', '¿Qué profeta lloró por Jerusalén?', '["Isaías", "Jeremías", "Ezequiel", "Daniel"]', 'Jeremías', 200),
('Profetas', '¿Qué profeta predijo el nacimiento de Jesús en Belén?', '["Isaías", "Miqueas", "Zacarías", "Malaquías"]', 'Miqueas', 300),
('Profetas', '¿A qué ciudad predicó Jonás?', '["Babilonia", "Nínive", "Sodoma", "Jerusalén"]', 'Nínive', 200),
('Profetas', '¿Qué profeta tuvo una visión del trono de Dios con serafines?', '["Ezequiel", "Isaías", "Jeremías", "Daniel"]', 'Isaías', 300);

-- 11. Para hacer tu usuario admin, ejecuta esto reemplazando con tu email:
-- UPDATE profiles SET is_admin = true WHERE email = 'TU_EMAIL@ejemplo.com';
