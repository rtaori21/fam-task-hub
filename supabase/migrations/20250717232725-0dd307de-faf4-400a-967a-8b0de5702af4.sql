-- Enable real-time updates for notifications table
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Add notifications table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Add notification preferences table to the realtime publication  
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_preferences;

-- Function to handle task assignment notifications
CREATE OR REPLACE FUNCTION public.notify_task_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  assignee_preferences RECORD;
  family_record RECORD;
  assigner_profile RECORD;
BEGIN
  -- Only process if assignee_id changed from NULL to a value or changed to a different user
  IF (OLD.assignee_id IS NULL AND NEW.assignee_id IS NOT NULL) OR 
     (OLD.assignee_id IS NOT NULL AND NEW.assignee_id IS NOT NULL AND OLD.assignee_id != NEW.assignee_id) THEN
    
    -- Get assignee's notification preferences
    SELECT * INTO assignee_preferences 
    FROM public.notification_preferences 
    WHERE user_id = NEW.assignee_id;
    
    -- Skip if user has disabled task assignment notifications
    IF assignee_preferences.task_assignments = false THEN
      RETURN NEW;
    END IF;
    
    -- Get assigner profile for the notification message
    SELECT first_name, last_name INTO assigner_profile
    FROM public.profiles 
    WHERE user_id = NEW.created_by;
    
    -- Create notification
    PERFORM public.create_notification(
      NEW.family_id,
      NEW.assignee_id,
      'task_assigned',
      'New Task Assigned',
      CASE 
        WHEN assigner_profile.first_name IS NOT NULL THEN
          assigner_profile.first_name || ' assigned you the task: ' || NEW.title
        ELSE
          'You have been assigned a new task: ' || NEW.title
      END,
      jsonb_build_object('taskId', NEW.id, 'assignedBy', NEW.created_by)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for task assignment notifications
DROP TRIGGER IF EXISTS trigger_task_assignment_notification ON public.tasks;
CREATE TRIGGER trigger_task_assignment_notification
  AFTER INSERT OR UPDATE OF assignee_id ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_task_assignment();

-- Function to create default notification preferences when user joins family
CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create default notification preferences for new user
  INSERT INTO public.notification_preferences (
    user_id,
    family_id,
    task_assignments,
    task_due_reminders,
    event_reminders,
    daily_summary,
    email_notifications,
    browser_notifications,
    reminder_advance_minutes
  ) VALUES (
    NEW.user_id,
    NEW.family_id,
    true,   -- task_assignments
    true,   -- task_due_reminders  
    true,   -- event_reminders
    false,  -- daily_summary
    false,  -- email_notifications
    false,  -- browser_notifications
    15      -- reminder_advance_minutes
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger for default notification preferences
DROP TRIGGER IF EXISTS trigger_default_notification_preferences ON public.user_roles;
CREATE TRIGGER trigger_default_notification_preferences
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_notification_preferences();