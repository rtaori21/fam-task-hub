-- Update user_roles policies to be more permissive during signup
-- Add a more permissive policy for initial family creation
DROP POLICY IF EXISTS "Users can insert when joining family" ON public.user_roles;

CREATE POLICY "Users can insert when joining family" 
ON public.user_roles 
FOR INSERT 
TO authenticated 
WITH CHECK (
  -- Allow users to add themselves to any family during signup/join process
  user_id = auth.uid()
);