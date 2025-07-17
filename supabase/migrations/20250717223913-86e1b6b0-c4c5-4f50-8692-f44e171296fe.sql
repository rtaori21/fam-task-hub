-- Allow family members to view each other's profiles for assignee names
CREATE POLICY "Family members can view each other's profiles" 
ON public.profiles 
FOR SELECT 
USING (
  user_id IN (
    -- Allow viewing profiles of users in the same family
    SELECT ur.user_id 
    FROM user_roles ur 
    WHERE ur.family_id = get_user_family_id()
  )
);