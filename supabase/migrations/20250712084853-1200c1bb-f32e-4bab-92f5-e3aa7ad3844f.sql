-- Create a security definer function to get user's family_id safely
CREATE OR REPLACE FUNCTION public.get_user_family_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT family_id 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create a security definer function to check if user is family admin
CREATE OR REPLACE FUNCTION public.is_family_admin(check_family_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND family_id = check_family_id 
    AND role = 'family_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop all existing policies for user_roles
DROP POLICY IF EXISTS "Users can view roles in their family" ON public.user_roles;
DROP POLICY IF EXISTS "Family admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role when joining" ON public.user_roles;

-- Create new safe policies using security definer functions
CREATE POLICY "Users can view their own role" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can view family roles" 
ON public.user_roles 
FOR SELECT 
USING (family_id = public.get_user_family_id());

CREATE POLICY "Users can insert when joining family" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Family admins can manage family roles" 
ON public.user_roles 
FOR ALL 
USING (public.is_family_admin(family_id));