-- SECURITY AUDIT: Apply robust RLS policies
-- Ejecutar en SQL Editor de Supabase

-- 1. QUESTIONS Table Policies
-- Objetivo: Todo el mundo (autenticado) puede leer. Solo Admins pueden modificar.

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Limpieza de políticas antiguas
DROP POLICY IF EXISTS "Public read questions" ON public.questions;
DROP POLICY IF EXISTS "Authenticated users see questions" ON public.questions;
DROP POLICY IF EXISTS "Admin insert questions" ON public.questions;
DROP POLICY IF EXISTS "Admin update questions" ON public.questions;
DROP POLICY IF EXISTS "Admin delete questions" ON public.questions;

-- Política de Lectura: Usuarios autenticados (o anon si es necesario para invitados)
CREATE POLICY "Authenticated users can read questions" 
ON public.questions FOR SELECT 
TO authenticated 
USING (true);

-- Políticas de Escritura: Solo Admins (usando check_is_admin segura)
CREATE POLICY "Admin insert questions" 
ON public.questions FOR INSERT 
WITH CHECK (public.check_is_admin());

CREATE POLICY "Admin update questions" 
ON public.questions FOR UPDATE 
USING (public.check_is_admin());

CREATE POLICY "Admin delete questions" 
ON public.questions FOR DELETE 
USING (public.check_is_admin());


-- 2. GAME_SESSIONS Table Policies
-- Objetivo: Usuarios pueden crear sesiones. Lectura abierta para unirse.

ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read game_sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Users start game_sessions" ON public.game_sessions;

-- Lectura: Cualquiera autenticado (para unirse a la sala)
CREATE POLICY "Authenticated users can read sessions" 
ON public.game_sessions FOR SELECT 
TO authenticated 
USING (true);

-- Escritura (Insert): Cualquiera autenticado puede crear una partida
-- Nota: Si quisieras limitar a admins, cambia a check_is_admin()
CREATE POLICY "Authenticated users can create sessions" 
ON public.game_sessions FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = auth.uid()); -- Trivial check, just ensures auth

-- Actualización: Solo el creador o Admin (Opcional, si guardas owner_id)
-- Como game_sessions no parece tener owner_id explícito en el código visto, 
-- asumiremos que es pública de escritura para actualizar estado del juego o dejamos abierta a authenticated.
-- Para mayor seguridad, deberías agregar 'owner_id' a game_sessions.
-- Por ahora, permitimos update a authenticated para que el flujo de juego funcione.
CREATE POLICY "Authenticated users can update sessions" 
ON public.game_sessions FOR UPDATE 
TO authenticated 
USING (true);

-- 3. Verificaciones Finales (Opcional)
-- Asegura que categories esté protegido (ya debería estarlo por el script anterior)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
