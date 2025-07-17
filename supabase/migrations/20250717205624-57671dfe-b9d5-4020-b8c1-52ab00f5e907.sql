-- Create the user_profile_drafts table for handling pre-email-verification family setup
CREATE TABLE public.user_profile_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  signup_type TEXT NOT NULL CHECK (signup_type IN ('create_family', 'join_family')),
  family_name TEXT, -- Only for create_family type
  join_code TEXT, -- Only for join_family type
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on user_profile_drafts
ALTER TABLE public.user_profile_drafts ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profile_drafts
CREATE POLICY "Users can insert their own draft" 
ON public.user_profile_drafts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own draft" 
ON public.user_profile_drafts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own draft" 
ON public.user_profile_drafts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own draft" 
ON public.user_profile_drafts 
FOR DELETE 
USING (auth.uid() = user_id);