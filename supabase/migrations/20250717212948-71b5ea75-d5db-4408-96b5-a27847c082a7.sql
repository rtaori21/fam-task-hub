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