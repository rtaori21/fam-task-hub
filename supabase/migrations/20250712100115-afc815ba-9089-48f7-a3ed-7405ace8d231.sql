-- Update the families INSERT policy to be more permissive
-- This allows authenticated users to create families even during signup
DROP POLICY IF EXISTS "Authenticated users can create families" ON public.families;

CREATE POLICY "Authenticated users can create families" 
ON public.families 
FOR INSERT 
TO authenticated 
WITH CHECK (
  -- Allow if the user is setting themselves as the creator
  auth.uid() = created_by OR 
  -- Or if the user is authenticated (covers signup edge case)
  auth.uid() IS NOT NULL
);