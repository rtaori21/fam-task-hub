import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFamilyData } from '@/hooks/useFamilyData';
import { toast } from '@/hooks/use-toast';

export interface NotificationPreferences {
  id?: string;
  user_id: string;
  family_id: string;
  task_assignments: boolean;
  task_due_reminders: boolean;
  event_reminders: boolean;
  daily_summary: boolean;
  email_notifications: boolean;
  browser_notifications: boolean;
  reminder_advance_minutes: number;
}

export const useNotificationPreferences = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { familyInfo } = useFamilyData();

  // Fetch user's notification preferences
  const fetchPreferences = async () => {
    if (!user || !familyInfo?.id) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences(data);
      } else {
        // Create default preferences if none exist
        const defaultPreferences: Omit<NotificationPreferences, 'id'> = {
          user_id: user.id,
          family_id: familyInfo.id,
          task_assignments: true,
          task_due_reminders: true,
          event_reminders: true,
          daily_summary: false,
          email_notifications: false,
          browser_notifications: false,
          reminder_advance_minutes: 15,
        };

        const { data: newPrefs, error: insertError } = await supabase
          .from('notification_preferences')
          .insert(defaultPreferences)
          .select()
          .single();

        if (insertError) throw insertError;
        setPreferences(newPrefs);
      }
    } catch (error: any) {
      console.error('Error fetching notification preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load notification preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update preferences
  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!user || !preferences) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setPreferences(data);
      toast({
        title: "Success",
        description: "Notification preferences updated",
      });
    } catch (error: any) {
      console.error('Error updating notification preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, [user, familyInfo?.id]);

  return {
    preferences,
    loading,
    saving,
    updatePreferences,
    refreshPreferences: fetchPreferences,
  };
};