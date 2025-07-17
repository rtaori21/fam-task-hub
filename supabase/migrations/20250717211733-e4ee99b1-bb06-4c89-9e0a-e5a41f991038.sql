-- Fix the trigger that processes user_profile_drafts after email confirmation
-- First, drop the existing trigger if it exists
DROP TRIGGER IF EXISTS process_user_draft_on_email_confirm ON auth.users;

-- Create a new trigger that uses the correct app_role enum type
CREATE TRIGGER process_user_draft_on_email_confirm
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.process_user_draft();

-- Manually enable the handle_new_user trigger for user creation events
-- This ensures profiles are created automatically when users sign up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();