-- Clear unverified users and their related data
-- First, get all unverified users (those without email_confirmed_at)
-- Note: We can't directly access auth.users, but we can clean up related data

-- Clear all draft data (since these are from unverified signups)
DELETE FROM public.user_profile_drafts;

-- Clear any role data from unverified users
-- We'll let the system handle cleanup of auth.users through Supabase dashboard