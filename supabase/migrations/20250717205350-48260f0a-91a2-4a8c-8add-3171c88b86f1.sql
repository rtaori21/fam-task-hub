-- Enhance the process_user_draft function with logging and error handling
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