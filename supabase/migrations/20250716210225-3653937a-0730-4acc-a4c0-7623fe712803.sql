-- Clear unconfirmed users from auth.users table
DELETE FROM auth.users WHERE email_confirmed_at IS NULL;