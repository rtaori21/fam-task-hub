import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFamilyData } from '@/hooks/useFamilyData';
import { CalendarEvent, TimeBlock } from '@/types/calendar';

export function useCalendar() {
  const { user } = useAuth();
  const { familyInfo } = useFamilyData();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !familyInfo?.id) {
      setLoading(false);
      return;
    }

    loadCalendarData();

    // Set up real-time subscriptions
    const eventsChannel = supabase
      .channel('calendar-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events'
        },
        () => {
          loadCalendarData();
        }
      )
      .subscribe();

    const blocksChannel = supabase
      .channel('time-blocks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_blocks'
        },
        () => {
          loadCalendarData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(blocksChannel);
    };
  }, [user, familyInfo?.id]);

  const loadCalendarData = async () => {
    if (!user || !familyInfo?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Load calendar events
      const { data: eventsData, error: eventsError } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('family_id', familyInfo.id)
        .order('start_time', { ascending: true });

      if (eventsError) throw eventsError;

      // Load time blocks
      const { data: blocksData, error: blocksError } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('family_id', familyInfo.id)
        .order('start_time', { ascending: true });

      if (blocksError) throw blocksError;

      // Format events data
      const formattedEvents: CalendarEvent[] = (eventsData || []).map(event => ({
        id: event.id,
        title: event.title,
        description: event.description || undefined,
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        type: event.event_type as 'event',
        assignees: event.assignees || undefined,
        color: event.color || '#059669'
      }));

      // Format time blocks data
      const formattedBlocks: TimeBlock[] = (blocksData || []).map(block => ({
        id: block.id,
        title: block.title,
        description: block.description || undefined,
        start: new Date(block.start_time),
        end: new Date(block.end_time),
        type: block.block_type as 'family' | 'personal' | 'focus',
        color: block.color || '#3b82f6'
      }));

      setEvents(formattedEvents);
      setTimeBlocks(formattedBlocks);
    } catch (err: any) {
      console.error('Error loading calendar data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (eventData: Omit<CalendarEvent, 'id'>) => {
    if (!user || !familyInfo?.id) {
      throw new Error('User must be logged in and part of a family to create events');
    }

    setError(null);
    try {
      const eventToInsert = {
        title: eventData.title,
        description: eventData.description,
        start_time: eventData.start.toISOString(),
        end_time: eventData.end.toISOString(),
        event_type: eventData.type,
        assignees: eventData.assignees,
        color: eventData.color,
        family_id: familyInfo.id,
        created_by: user.id
      };

      const { error } = await supabase
        .from('calendar_events')
        .insert([eventToInsert]);

      if (error) throw error;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create event';
      console.error('Create event error:', err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const createTimeBlock = async (blockData: Omit<TimeBlock, 'id'>) => {
    if (!user || !familyInfo?.id) {
      throw new Error('User must be logged in and part of a family to create time blocks');
    }

    setError(null);
    try {
      const blockToInsert = {
        title: blockData.title,
        description: blockData.description,
        start_time: blockData.start.toISOString(),
        end_time: blockData.end.toISOString(),
        block_type: blockData.type,
        color: blockData.color,
        family_id: familyInfo.id,
        created_by: user.id
      };

      const { error } = await supabase
        .from('time_blocks')
        .insert([blockToInsert]);

      if (error) throw error;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create time block';
      console.error('Create time block error:', err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
    } catch (err: any) {
      console.error('Error deleting event:', err);
      setError(err.message);
    }
  };

  const deleteTimeBlock = async (blockId: string) => {
    try {
      const { error } = await supabase
        .from('time_blocks')
        .delete()
        .eq('id', blockId);

      if (error) throw error;
    } catch (err: any) {
      console.error('Error deleting time block:', err);
      setError(err.message);
    }
  };

  return {
    events,
    timeBlocks,
    loading,
    error,
    createEvent,
    createTimeBlock,
    deleteEvent,
    deleteTimeBlock,
    refetch: loadCalendarData
  };
}