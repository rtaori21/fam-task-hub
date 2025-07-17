-- Create calendar_events table for family events
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'event',
  assignees TEXT[], -- Array of family member names
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create time_blocks table for time blocking
CREATE TABLE public.time_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  block_type TEXT NOT NULL DEFAULT 'family', -- 'family', 'personal', 'focus'
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_blocks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for calendar_events (same pattern as tasks)
CREATE POLICY "Family members can view family events" 
ON public.calendar_events 
FOR SELECT 
USING (family_id = get_user_family_id());

CREATE POLICY "Family members can create events in their family" 
ON public.calendar_events 
FOR INSERT 
WITH CHECK ((auth.uid() = created_by) AND (family_id = get_user_family_id()));

CREATE POLICY "Family members can update events in their family" 
ON public.calendar_events 
FOR UPDATE 
USING (family_id = get_user_family_id());

CREATE POLICY "Family members can delete events in their family" 
ON public.calendar_events 
FOR DELETE 
USING (family_id = get_user_family_id());

-- Create RLS policies for time_blocks (same pattern as tasks)
CREATE POLICY "Family members can view family time blocks" 
ON public.time_blocks 
FOR SELECT 
USING (family_id = get_user_family_id());

CREATE POLICY "Family members can create time blocks in their family" 
ON public.time_blocks 
FOR INSERT 
WITH CHECK ((auth.uid() = created_by) AND (family_id = get_user_family_id()));

CREATE POLICY "Family members can update time blocks in their family" 
ON public.time_blocks 
FOR UPDATE 
USING (family_id = get_user_family_id());

CREATE POLICY "Family members can delete time blocks in their family" 
ON public.time_blocks 
FOR DELETE 
USING (family_id = get_user_family_id());

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_calendar_events_updated_at
BEFORE UPDATE ON public.calendar_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_time_blocks_updated_at
BEFORE UPDATE ON public.time_blocks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key constraints
ALTER TABLE public.calendar_events 
ADD CONSTRAINT calendar_events_family_id_fkey 
FOREIGN KEY (family_id) REFERENCES public.families(id);

ALTER TABLE public.time_blocks 
ADD CONSTRAINT time_blocks_family_id_fkey 
FOREIGN KEY (family_id) REFERENCES public.families(id);