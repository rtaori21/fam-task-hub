-- Clean up existing user data for fresh testing
-- Remove user roles
DELETE FROM public.user_roles WHERE user_id = '987e635b-54c4-4219-91f5-1fe4cfbbe922';

-- Remove families created by this user
DELETE FROM public.families WHERE created_by = '987e635b-54c4-4219-91f5-1fe4cfbbe922';

-- Remove user profile
DELETE FROM public.profiles WHERE user_id = '987e635b-54c4-4219-91f5-1fe4cfbbe922';