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

      console.log('Loading tasks for family:', familyInfo.id);

      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('family_id', familyInfo.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      console.log('Raw tasks data:', data);

      // Get unique assignee IDs and filter out null/undefined values
      const assigneeIds = [...new Set((data || [])
        .map(task => task.assignee_id)
        .filter(id => id && typeof id === 'string' && id.trim() !== ''))];

      console.log('Assignee IDs found:', assigneeIds);

      // Fetch profiles for assignees with better error handling
      let assigneeProfiles: any[] = [];
      if (assigneeIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', assigneeIds);

        console.log('Profiles query result - data:', profiles, 'error:', profilesError);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          // Continue with empty profiles array instead of failing completely
        } else {
          assigneeProfiles = profiles || [];
        }
      }

      console.log('Final assignee profiles:', assigneeProfiles);

      const formattedTasks: Task[] = (data || []).map(task => {
        let assigneeName = '';
        if (task.assignee_id) {
          // More robust profile lookup
          const profile = assigneeProfiles.find(p => 
            p && p.user_id && p.user_id === task.assignee_id
          );
          
          console.log(`Task "${task.title}" - Looking for assignee ${task.assignee_id}:`, profile);
          
          if (profile && (profile.first_name || profile.last_name)) {
            const firstName = profile.first_name || '';
            const lastName = profile.last_name || '';
            assigneeName = `${firstName} ${lastName}`.trim();
            
            // If both names are empty, show Unknown User
            if (!assigneeName) {
              assigneeName = 'Unknown User';
            }
          } else {
            assigneeName = 'Unknown User';
            console.warn(`No profile found for assignee_id: ${task.assignee_id}`);
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

      console.log('Final formatted tasks:', formattedTasks);
      setTasks(formattedTasks);
    } catch (err: any) {
      console.error('Error loading tasks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user || !familyInfo?.id) {
      throw new Error('User must be logged in and part of a family to create tasks');
    }

    setError(null);
    try {
      // The assignee field in taskData should contain the user_id from profiles table
      // Validate that if assignee is provided, it's a valid UUID
      let assigneeId = null;
      if (taskData.assignee && taskData.assignee.trim() !== '') {
        assigneeId = taskData.assignee.trim();
        console.log('Creating task with assignee_id:', assigneeId);
      }

      const taskToInsert = {
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        tags: taskData.tags,
        assignee_id: assigneeId,
        family_id: familyInfo.id,
        created_by: user.id,
        due_date: taskData.dueDate ? new Date(taskData.dueDate).toISOString() : null
      };

      console.log('Creating task with data:', taskToInsert);

      const { data, error } = await supabase
        .from('tasks')
        .insert([taskToInsert])
        .select()
        .single();

      if (error) throw error;

      console.log('Task created successfully:', data);
      
      // Tasks will be updated via real-time subscription
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create task';
      console.error('Create task error:', err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      setError(null);
      const updateData: any = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate ? new Date(updates.dueDate).toISOString() : null;
      
      // Handle assignee updates properly
      if (updates.assignee !== undefined) {
        if (updates.assignee && updates.assignee.trim() !== '') {
          updateData.assignee_id = updates.assignee.trim();
          console.log('Updating task assignee to:', updateData.assignee_id);
        } else {
          updateData.assignee_id = null;
          console.log('Removing task assignee');
        }
      }

      console.log('Updating task with data:', updateData);

      const { error: updateError } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (updateError) throw updateError;

      console.log('Task updated successfully');
      // Tasks will be updated via real-time subscription
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update task';
      console.error('Error updating task:', err);
      setError(errorMessage);
      throw new Error(errorMessage);
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