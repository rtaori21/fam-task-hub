-- Create notification types enum
CREATE TYPE notification_type AS ENUM (
  'task_assigned',
  'task_due_soon', 
  'task_overdue',
  'event_reminder',
  'family_invite'
);

-- Create notification status enum  
CREATE TYPE notification_status AS ENUM (
  'unread',
  'read', 
  'dismissed'
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL,
  user_id UUID NOT NULL,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  status notification_status NOT NULL DEFAULT 'unread',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE
);

-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  family_id UUID NOT NULL,
  task_assignments BOOLEAN NOT NULL DEFAULT true,
  task_due_reminders BOOLEAN NOT NULL DEFAULT true,
  event_reminders BOOLEAN NOT NULL DEFAULT true,
  daily_summary BOOLEAN NOT NULL DEFAULT false,
  email_notifications BOOLEAN NOT NULL DEFAULT false,
  browser_notifications BOOLEAN NOT NULL DEFAULT false,
  reminder_advance_minutes INTEGER NOT NULL DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Enable RLS on notification preferences table  
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their family notifications"
ON public.notifications FOR SELECT
USING (family_id = get_user_family_id() AND user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- RLS policies for notification preferences
CREATE POLICY "Users can view their own notification preferences"
ON public.notification_preferences FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own notification preferences"
ON public.notification_preferences FOR INSERT
WITH CHECK (user_id = auth.uid() AND family_id = get_user_family_id());

CREATE POLICY "Users can update their own notification preferences"
ON public.notification_preferences FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_notifications_user_status ON public.notifications(user_id, status);
CREATE INDEX idx_notifications_family_created ON public.notifications(family_id, created_at);
CREATE INDEX idx_notifications_type_created ON public.notifications(type, created_at);

-- Create trigger for notification preferences updated_at
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_family_id UUID,
  p_user_id UUID,
  p_type notification_type,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    family_id,
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    p_family_id,
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_data
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Function to get user notification preferences
CREATE OR REPLACE FUNCTION public.get_user_notification_preferences(p_user_id UUID)
RETURNS TABLE(
  task_assignments BOOLEAN,
  task_due_reminders BOOLEAN,
  event_reminders BOOLEAN,
  daily_summary BOOLEAN,
  email_notifications BOOLEAN,
  browser_notifications BOOLEAN,
  reminder_advance_minutes INTEGER
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    np.task_assignments,
    np.task_due_reminders,
    np.event_reminders,
    np.daily_summary,
    np.email_notifications,
    np.browser_notifications,
    np.reminder_advance_minutes
  FROM public.notification_preferences np
  WHERE np.user_id = p_user_id;
$$;