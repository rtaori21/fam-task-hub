-- Fix RLS policies for families table to allow proper family creation
-- First, drop the existing problematic policy
DROP POLICY IF EXISTS "Authenticated users can create families" ON public.families;

-- Create a new policy that allows authenticated users to create families with proper ownership
CREATE POLICY "Authenticated users can create families" 
ON public.families 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Also ensure the trigger is working for join codes
-- Check if the trigger exists and create it if not
DROP TRIGGER IF EXISTS set_join_code_trigger ON public.families;
CREATE TRIGGER set_join_code_trigger
  BEFORE INSERT ON public.families
  FOR EACH ROW EXECUTE FUNCTION public.set_join_code();

-- Make sure updated_at trigger is also working
DROP TRIGGER IF EXISTS update_families_updated_at ON public.families;
CREATE TRIGGER update_families_updated_at
  BEFORE UPDATE ON public.families
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();