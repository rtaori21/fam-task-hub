-- Enable real-time updates for calendar_events table
ALTER TABLE public.calendar_events REPLICA IDENTITY FULL;

-- Enable real-time updates for time_blocks table  
ALTER TABLE public.time_blocks REPLICA IDENTITY FULL;

-- Add calendar_events table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;

-- Add time_blocks table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.time_blocks;