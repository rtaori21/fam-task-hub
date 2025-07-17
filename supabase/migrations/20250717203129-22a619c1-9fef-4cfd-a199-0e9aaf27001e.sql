-- Fix the families INSERT policy to be more explicit
DROP POLICY IF EXISTS "Authenticated users can create families" ON public.families;

CREATE POLICY "Authenticated users can create families" 
ON public.families 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);