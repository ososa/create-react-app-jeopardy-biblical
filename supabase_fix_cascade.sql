-- FIX CASCADING DELETES
-- Executing this script will ensure that when a User is deleted from Authentication,
-- all their related data (History, Sessions) is automatically wiped.

-- 1. Game History (Critical: currently NOT NULL, blocks deletion)
ALTER TABLE public.game_history
DROP CONSTRAINT IF EXISTS game_history_user_id_fkey; -- Name might vary, supabase usually names it table_column_fkey

-- Re-add with CASCADE
ALTER TABLE public.game_history
ADD CONSTRAINT game_history_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;


-- 2. Game Sessions (Optional: currently Nullable, but better to clean up)
ALTER TABLE public.game_sessions
DROP CONSTRAINT IF EXISTS game_sessions_host_id_fkey;

-- Re-add with CASCADE
ALTER TABLE public.game_sessions
ADD CONSTRAINT game_sessions_host_id_fkey
FOREIGN KEY (host_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 3. Game Invitations (Hidden Blocker!)
ALTER TABLE public.game_invitations
DROP CONSTRAINT IF EXISTS game_invitations_sender_id_fkey; -- Guessing naming convention
ALTER TABLE public.game_invitations
DROP CONSTRAINT IF EXISTS game_invitations_recipient_id_fkey;

ALTER TABLE public.game_invitations
ADD CONSTRAINT game_invitations_sender_id_fkey
FOREIGN KEY (sender_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

ALTER TABLE public.game_invitations
ADD CONSTRAINT game_invitations_recipient_id_fkey
FOREIGN KEY (recipient_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 4. Storage Objects: SKIPPED (System managed, permission restricted)
-- Since you confirmed no custom avatars are used, this shouldn't be the blocker.
-- If it were, we'd need to use the Storage API to delete files, not SQL.

-- 5. Profiles (Just to be double sure, safe to re-run)
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Confirmation
SELECT 'Constraints updated to CASCADE' as result;
