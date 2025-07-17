-- Create the missing app_role enum type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('family_admin', 'family_member');
    RAISE NOTICE 'Created app_role enum type';
  ELSE
    RAISE NOTICE 'app_role enum type already exists';
  END IF;
END $$;