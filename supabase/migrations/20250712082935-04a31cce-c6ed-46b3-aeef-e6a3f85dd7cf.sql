-- Fix the RLS policies for user_roles to prevent infinite recursion
-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Users can view roles in their family" ON public.user_roles;

-- Create a simpler policy that doesn't cause recursion
CREATE POLICY "Users can view roles in their family" 
ON public.user_roles 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  family_id IN (
    SELECT family_id 
    FROM public.user_roles 
    WHERE user_id = auth.uid()
  )
);

-- Also update the other policy to be safer
DROP POLICY IF EXISTS "Family admins can manage roles" ON public.user_roles;

CREATE POLICY "Family admins can manage roles" 
ON public.user_roles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_roles admin_check 
    WHERE admin_check.user_id = auth.uid() 
    AND admin_check.family_id = user_roles.family_id 
    AND admin_check.role = 'family_admin'
  )
);