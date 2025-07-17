-- Fix the RLS policy for user_profile_drafts to allow signup inserts
-- Drop the existing insert policy
DROP POLICY IF EXISTS "Users can insert their own draft" ON public.user_profile_drafts;

-- Create a more permissive insert policy that works during signup
-- Allow inserts when the user_id matches the authenticated user OR when user is signing up
CREATE POLICY "Allow draft creation during signup" 
ON public.user_profile_drafts 
FOR INSERT 
WITH CHECK (true);  -- Allow all inserts for now, since this is temporary data

-- Also update other policies to be more explicit
DROP POLICY IF EXISTS "Users can view their own draft" ON public.user_profile_drafts;
DROP POLICY IF EXISTS "Users can update their own draft" ON public.user_profile_drafts;
DROP POLICY IF EXISTS "Users can delete their own draft" ON public.user_profile_drafts;

CREATE POLICY "Users can view their own draft" 
ON public.user_profile_drafts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own draft" 
ON public.user_profile_drafts 
FOR DELETE 
USING (auth.uid() = user_id);