-- Clean up all test data for fresh start
-- Delete all user roles
DELETE FROM public.user_roles;

-- Delete all families
DELETE FROM public.families;

-- Delete all profiles
DELETE FROM public.profiles;