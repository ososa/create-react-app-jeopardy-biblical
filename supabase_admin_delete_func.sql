-- FUNCTION: delete_user_by_admin
-- Allows an Admin to delete another user given their ID.
-- SECURITY: This function is SECURITY DEFINER, meaning it runs with high privileges.
-- We must carefully check that the EXECUTING user is an admin.

CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- 1. Security Check: Is the caller an Admin?
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access Denied: You must be an administrator to perform this action.';
  END IF;

  -- 2. Prevent Suicide: Don't allow deleting yourself (optional safety)
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Action Denied: You cannot delete your own account from here.';
  END IF;

  -- 3. Perform Deletion
  -- Deleting from auth.users requires elevated privileges, which this function has via SECURITY DEFINER.
  DELETE FROM auth.users WHERE id = target_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;
