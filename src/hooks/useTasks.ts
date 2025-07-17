import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFamilyData } from '@/hooks/useFamilyData';
import { Task, TaskStatus } from '@/types';

export function useTasks() {
  const { user } = useAuth();
  const { familyInfo } = useFamilyData();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !familyInfo?.id) {
      setLoading(false);
      return;
    }

    loadTasks();

    // Set up real-time subscription
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        () => {
          loadTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, familyInfo?.id]);

  const loadTasks = async () => {
    if (!user || !familyInfo?.id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('family_id', familyInfo.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Get unique assignee IDs
      const assigneeIds = [...new Set((data || [])
        .map(task => task.assignee_id)
        .filter(id => id))];

      // Fetch profiles for assignees
      let assigneeProfiles: any[] = [];
      if (assigneeIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', assigneeIds);

        if (!profilesError) {
          assigneeProfiles = profiles || [];
        }
      }

      const formattedTasks: Task[] = (data || []).map(task => {
        let assigneeName = '';
        if (task.assignee_id) {
          const profile = assigneeProfiles.find(p => p.user_id === task.assignee_id);
          if (profile) {
            assigneeName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User';
          } else {
            assigneeName = 'Unknown User';
          }
        }

        return {
          id: task.id,
          title: task.title,
          description: task.description || '',
          status: task.status as TaskStatus,
          priority: task.priority as 'low' | 'medium' | 'high',
          tags: task.tags || [],
          assignee: assigneeName,
          dueDate: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
          createdAt: task.created_at,
          updatedAt: task.updated_at
        };
      });

      setTasks(formattedTasks);
    } catch (err: any) {
      console.error('Error loading tasks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user || !familyInfo?.id) return;

    try {
      const { error: insertError } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          priority: taskData.priority,
          tags: taskData.tags,
          assignee_id: taskData.assignee || null,
          family_id: familyInfo.id,
          created_by: user.id,
          due_date: taskData.dueDate ? new Date(taskData.dueDate).toISOString() : null
        });

      if (insertError) throw insertError;
      
      // Tasks will be updated via real-time subscription
    } catch (err: any) {
      console.error('Error creating task:', err);
      setError(err.message);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const updateData: any = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.assignee !== undefined) updateData.assignee_id = updates.assignee || null;
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate ? new Date(updates.dueDate).toISOString() : null;

      const { error: updateError } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (updateError) throw updateError;

      // Tasks will be updated via real-time subscription
    } catch (err: any) {
      console.error('Error updating task:', err);
      setError(err.message);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (deleteError) throw deleteError;

      // Tasks will be updated via real-time subscription
    } catch (err: any) {
      console.error('Error deleting task:', err);
      setError(err.message);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    await updateTask(taskId, { status: newStatus });
  };

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    refetch: loadTasks
  };
}