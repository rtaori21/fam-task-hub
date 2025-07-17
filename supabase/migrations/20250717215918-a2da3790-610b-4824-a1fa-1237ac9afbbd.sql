-- Create tasks table for family task management
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  tags TEXT[],
  assignee_id UUID,
  family_id UUID NOT NULL,
  created_by UUID NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for task access
CREATE POLICY "Family members can view family tasks" 
ON public.tasks 
FOR SELECT 
USING (family_id = get_user_family_id());

CREATE POLICY "Family members can create tasks in their family" 
ON public.tasks 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by AND 
  family_id = get_user_family_id()
);

CREATE POLICY "Family members can update tasks in their family" 
ON public.tasks 
FOR UPDATE 
USING (family_id = get_user_family_id());

CREATE POLICY "Family members can delete tasks in their family" 
ON public.tasks 
FOR DELETE 
USING (family_id = get_user_family_id());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_tasks_family_id ON public.tasks(family_id);
CREATE INDEX idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);