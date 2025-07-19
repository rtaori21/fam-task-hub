
import React, { useState } from 'react';
import { Bell, Check, X, Settings, Clock, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatDateTime } from '@/utils/timeFormat';

export const NotificationCenter = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const { 
    notifications, 
    loading: notificationsLoading, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    dismissNotification 
  } = useNotifications();
  
  const { 
    preferences, 
    loading: preferencesLoading, 
    saving, 
    updatePreferences 
  } = useNotificationPreferences();

  // Manual trigger for testing event reminders
  const triggerNotificationCheck = async () => {
    setIsTriggering(true);
    try {
      const { data, error } = await supabase.functions.invoke('trigger-notifications');
      
      if (error) throw error;
      
      toast({
        title: "Notification Check Triggered",
        description: "Checking for due tasks and upcoming events...",
      });
      
      console.log('Manual notification trigger result:', data);
    } catch (error: any) {
      console.error('Error triggering notifications:', error);
      toast({
        title: "Error",
        description: "Failed to trigger notification check",
        variant: "destructive",
      });
    } finally {
      setIsTriggering(false);
    }
  };

  if (notificationsLoading || preferencesLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-pulse">Loading notifications...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return <Bell className="h-4 w-4 text-blue-500" />;
      case 'task_due_soon':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'task_overdue':
        return <Clock className="h-4 w-4 text-red-500" />;
      case 'event_reminder':
        return <Bell className="h-4 w-4 text-purple-500" />;
      case 'family_invite':
        return <Bell className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const formatTime = (dateString: string) => {
    return formatDateTime(dateString);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <Check className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={triggerNotificationCheck}
              disabled={isTriggering}
              title="Check for event reminders and due tasks"
            >
              <RefreshCw className={`h-4 w-4 ${isTriggering ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 max-h-96 overflow-y-auto">
        {showSettings && preferences ? (
          <div className="space-y-4">
            <h3 className="font-medium">Notification Settings</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="task-assignments" className="text-sm">
                  Task Assignments
                </Label>
                <Switch
                  id="task-assignments"
                  checked={preferences.task_assignments}
                  onCheckedChange={(checked) =>
                    updatePreferences({ task_assignments: checked })
                  }
                  disabled={saving}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="due-reminders" className="text-sm">
                  Due Date Reminders
                </Label>
                <Switch
                  id="due-reminders"
                  checked={preferences.task_due_reminders}
                  onCheckedChange={(checked) =>
                    updatePreferences({ task_due_reminders: checked })
                  }
                  disabled={saving}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="event-reminders" className="text-sm">
                  Event Reminders
                </Label>
                <Switch
                  id="event-reminders"
                  checked={preferences.event_reminders}
                  onCheckedChange={(checked) =>
                    updatePreferences({ event_reminders: checked })
                  }
                  disabled={saving}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="daily-summary" className="text-sm">
                  Daily Summary
                </Label>
                <Switch
                  id="daily-summary"
                  checked={preferences.daily_summary}
                  onCheckedChange={(checked) =>
                    updatePreferences({ daily_summary: checked })
                  }
                  disabled={saving}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reminder-time" className="text-sm">
                  Reminder Time (minutes before)
                </Label>
                <Input
                  id="reminder-time"
                  type="number"
                  min="5"
                  max="60"
                  value={preferences.reminder_advance_minutes}
                  onChange={(e) =>
                    updatePreferences({ reminder_advance_minutes: parseInt(e.target.value) || 15 })
                  }
                  className="w-20"
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No notifications
              </p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-smooth cursor-pointer ${
                    notification.status === 'read' 
                      ? 'bg-muted/30 border-border' 
                      : 'bg-background border-primary/30 shadow-sm'
                  }`}
                  onClick={() => notification.status === 'unread' && markAsRead(notification.id)}
                >
                  <div className="mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(notification.created_at)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            dismissNotification(notification.id)
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {notification.status === 'unread' && (
                      <div className="flex gap-2 mt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs h-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notification.id)
                          }}
                        >
                          Mark as Read
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
