-- Create the trigger to process user_profile_drafts automatically on email confirmation
-- First make sure we have the process_user_draft function
CREATE OR REPLACE FUNCTION public.process_user_draft()
RETURNS TRIGGER AS $$
DECLARE
  draft_record RECORD;
  new_family_id UUID;
  user_role app_role;
BEGIN
  -- Check if there's a draft for this user
  SELECT * INTO draft_record 
  FROM public.user_profile_drafts 
  WHERE user_id = NEW.id;
  
  -- If no draft found, nothing to process
  IF NOT FOUND THEN
    RAISE NOTICE 'No draft found for user: %', NEW.id;
    RETURN NEW;
  END IF;

  RAISE NOTICE 'Processing draft for user: %, signup_type: %', NEW.id, draft_record.signup_type;

  -- Process based on signup type
  IF draft_record.signup_type = 'create_family' THEN
    RAISE NOTICE 'Creating family: %', draft_record.family_name;
    
    -- Create new family
    INSERT INTO public.families (name, created_by, join_code)
    VALUES (draft_record.family_name, NEW.id, public.generate_join_code())
    RETURNING id INTO new_family_id;
    
    user_role := 'family_admin';
    
  ELSIF draft_record.signup_type = 'join_family' THEN
    RAISE NOTICE 'Joining family with code: %', draft_record.join_code;
    
    -- Find family by join code
    SELECT id INTO new_family_id 
    FROM public.families 
    WHERE join_code = draft_record.join_code;
    
    -- Check if join code is invalid
    IF new_family_id IS NULL THEN
      RAISE NOTICE 'Join code not found: %', draft_record.join_code;
      -- Clean up the draft even if join code is invalid
      DELETE FROM public.user_profile_drafts WHERE user_id = NEW.id;
      RETURN NEW;
    END IF;
    
    user_role := 'family_member';
  ELSE
    RAISE NOTICE 'Unknown signup_type: %', draft_record.signup_type;
    -- Clean up the draft for unknown signup types
    DELETE FROM public.user_profile_drafts WHERE user_id = NEW.id;
    RETURN NEW;
  END IF;

  -- Create user role (prevent duplicates with ON CONFLICT DO NOTHING)
  INSERT INTO public.user_roles (user_id, family_id, role)
  VALUES (NEW.id, new_family_id, user_role)
  ON CONFLICT (user_id, family_id) DO NOTHING;

  RAISE NOTICE 'User role created: user=%, family=%, role=%', NEW.id, new_family_id, user_role;

  -- Clean up the draft
  DELETE FROM public.user_profile_drafts WHERE user_id = NEW.id;
  
  RAISE NOTICE 'Draft processed and cleaned up for user: %', NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create the trigger if it doesn't already exist
-- This handles after a user confirms their email
DO $$ 
BEGIN
  -- Check if the trigger already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
    WHERE pg_class.relname = 'users'
    AND pg_trigger.tgname = 'process_user_draft_on_email_confirm'
  ) THEN
    -- Create the trigger
    EXECUTE '
      CREATE TRIGGER process_user_draft_on_email_confirm
      AFTER UPDATE OF email_confirmed_at ON auth.users
      FOR EACH ROW
      WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
      EXECUTE FUNCTION public.process_user_draft();
    ';
    RAISE NOTICE 'Created trigger process_user_draft_on_email_confirm';
  ELSE
    RAISE NOTICE 'Trigger process_user_draft_on_email_confirm already exists';
  END IF;
END $$;