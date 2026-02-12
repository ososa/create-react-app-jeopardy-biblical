-- SECURITY HARDENING SCRIPT
-- Run this in Supabase SQL Editor

-- 1. Create a function to delete old game sessions (older than 24 hours)
CREATE OR REPLACE FUNCTION delete_old_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.game_sessions
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attempt to schedule this function (if pg_cron is enabled in your project)
-- If extensions are not enabled, you may need to run this function manually or via an external cron job.
-- SELECT cron.schedule('0 0 * * *', $$SELECT delete_old_sessions()$$);

-- 3. Add constraints to game_sessions table to validate input (prevent junk data)
ALTER TABLE public.game_sessions
ADD CONSTRAINT check_pin_length CHECK (char_length(pin_code) >= 4 AND char_length(pin_code) <= 6),
ADD CONSTRAINT check_status_valid CHECK (status IN ('waiting', 'active', 'finished'));

-- 4. Add constraints to game_sessions for max length of JSON to prevent DoS via massive payloads?
-- Difficult to enforce on JSONB column directly without complex triggers. 
-- Rely on application layer for payload size, but we can limit metadata.

-- 5. Ensure RLS is active on high-risk tables (Redundant but safe)
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Note: The implementation of true "Auto-cleanup" without pg_cron requires a Trigger on INSERT
-- that randomly cleans up, or an external worker. 
-- For simplicity in a serverless setup without extra extensions:
-- We can add a trigger that runs cleanup on every 100th insert (approx).

CREATE OR REPLACE FUNCTION trigger_cleanup_sessions()
RETURNS TRIGGER AS $$
BEGIN
  -- Run cleanup with 1% probability to avoid performance hit on every insert
  IF (random() < 0.01) THEN
     PERFORM delete_old_sessions();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cleanup_sessions_trigger ON public.game_sessions;
CREATE TRIGGER cleanup_sessions_trigger
  AFTER INSERT ON public.game_sessions
  FOR EACH STATEMENT EXECUTE FUNCTION trigger_cleanup_sessions();
