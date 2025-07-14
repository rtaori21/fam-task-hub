-- Make families table more permissive for initial creation
DROP POLICY IF EXISTS "Authenticated users can create families" ON public.families;

CREATE POLICY "Authenticated users can create families" 
ON public.families 
FOR INSERT 
TO authenticated 
WITH CHECK (true); -- Allow any authenticated user to create families

-- Make user_roles more permissive for initial role assignment  
DROP POLICY IF EXISTS "Users can insert when joining family" ON public.user_roles;

CREATE POLICY "Users can insert when joining family" 
ON public.user_roles 
FOR INSERT 
TO authenticated 
WITH CHECK (true); -- Allow any authenticated user to insert roles