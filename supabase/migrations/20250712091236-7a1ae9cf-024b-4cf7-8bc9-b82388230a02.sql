-- Add trigger to automatically generate join codes for families
CREATE TRIGGER set_join_code_trigger 
  BEFORE INSERT ON public.families 
  FOR EACH ROW 
  EXECUTE FUNCTION public.set_join_code();

-- Update families table to set join_code as TEMP gets replaced
UPDATE public.families SET join_code = public.generate_join_code() WHERE join_code = 'TEMP';