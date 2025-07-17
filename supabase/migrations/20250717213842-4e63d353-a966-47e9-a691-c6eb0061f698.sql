-- Clean up stuck user state (user who confirmed email but still shows as unconfirmed)
-- Delete the problematic user record and associated draft
DELETE FROM public.user_profile_drafts WHERE user_id = '5d29ccd7-c3bd-4a60-abbe-03b457f67308';
DELETE FROM auth.users WHERE id = '5d29ccd7-c3bd-4a60-abbe-03b457f67308';

-- Ensure the app_role enum exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM ('family_admin', 'family_member');
    END IF;
END $$;

-- Recreate the trigger to process user drafts after email confirmation
DROP TRIGGER IF EXISTS process_user_draft_on_email_confirm ON auth.users;

CREATE TRIGGER process_user_draft_on_email_confirm
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.process_user_draft();

-- Ensure the user creation trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();