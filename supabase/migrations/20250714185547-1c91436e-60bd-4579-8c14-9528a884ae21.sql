-- Delete all data from tables
DELETE FROM public.user_roles;
DELETE FROM public.families; 
DELETE FROM public.profiles;

-- Delete all auth users (this will cascade to other tables due to foreign keys)
DELETE FROM auth.users;