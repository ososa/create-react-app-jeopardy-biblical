-- FIX: Corregir error de "Infinite Recursion" en políticas RLS
-- Ejecutar en SQL Editor de Supabase

-- 1. Crear función segura para verificar admin sin recursión
-- SECURITY DEFINER hace que la función se ejecute con permisos de "superuser",
-- saltándose las políticas RLS y evitando el bucle infinito.
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Eliminar políticas actuales de perfiles para limpiarlas
DROP POLICY IF EXISTS "User view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public access to profiles" ON public.profiles; -- Por si acaso

-- 3. Crear políticas limpias y correctas

-- Política A: Cada usuario puede ver SUS PROPIOS datos (para que la app sepa si eres admin)
CREATE POLICY "Users can see own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- Política B: Solo los admins pueden ver TODOS los perfiles (usando la función segura)
-- Esto servirá para la pantalla de "Usuarios" del panel de admin.
CREATE POLICY "Admins can see all profiles" ON public.profiles
FOR SELECT USING (public.check_is_admin());

-- Política C: Solo admins pueden actualizar/borrar
CREATE POLICY "Admins can update profiles" ON public.profiles
FOR UPDATE USING (public.check_is_admin());

-- 4. Asegurar que las otras tablas usen también la verificación segura (opcional pero recomendado)
DROP POLICY IF EXISTS "Admin insert categories" ON public.categories;
CREATE POLICY "Admin insert categories" ON public.categories 
FOR INSERT WITH CHECK (public.check_is_admin());

DROP POLICY IF EXISTS "Admin update categories" ON public.categories;
CREATE POLICY "Admin update categories" ON public.categories 
FOR UPDATE USING (public.check_is_admin());

DROP POLICY IF EXISTS "Admin delete categories" ON public.categories;
CREATE POLICY "Admin delete categories" ON public.categories 
FOR DELETE USING (public.check_is_admin());

-- Nota: No olvides volver a asignarte el admin si se perdió, aunque este script NO borra datos.
-- UPDATE profiles SET is_admin = true WHERE email = 'tu_email@gmail.com';
