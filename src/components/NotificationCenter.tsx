import { useState } from 'react'
import { Bell, Clock, Settings, X, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Task } from '@/types'
import { NotificationSettings } from '@/types/calendar'

interface NotificationCenterProps {
  tasks: Task[]
  settings: NotificationSettings
  onSettingsChange: (settings: NotificationSettings) => void
}

interface Notification {
  id: string
  type: 'task_assigned' | 'task_due' | 'task_overdue' | 'daily_summary'
  title: string
  message: string
  time: Date
  read: boolean
  actionable?: boolean
}

export function NotificationCenter({ tasks, settings, onSettingsChange }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'task_due',
      title: 'Task Due Soon',
      message: 'Grocery Shopping is due in 2 hours',
      time: new Date(),
      read: false,
      actionable: true
    },
    {
      id: '2', 
      type: 'daily_summary',
      title: 'Daily Summary',
      message: 'You have 3 tasks scheduled for today',
      time: new Date(Date.now() - 60 * 60 * 1000),
      read: true
    }
  ])

  const [showSettings, setShowSettings] = useState(false)

  const unreadCount = notifications.filter(n => !n.read).length
  
  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task_due':
      case 'task_overdue':
        return <Clock className="h-4 w-4 text-priority-medium" />
      case 'task_assigned':
        return <Bell className="h-4 w-4 text-primary" />
      case 'daily_summary':
        return <Bell className="h-4 w-4 text-secondary-accent" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

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
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 max-h-96 overflow-y-auto">
        {showSettings ? (
          <div className="space-y-4">
            <h3 className="font-medium">Notification Settings</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="daily-summary">Daily Summary</Label>
                <Switch
                  id="daily-summary"
                  checked={settings.dailySummary}
                  onCheckedChange={(checked) =>
                    onSettingsChange({ ...settings, dailySummary: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="task-assigned">Task Assigned</Label>
                <Switch
                  id="task-assigned"
                  checked={settings.taskAssigned}
                  onCheckedChange={(checked) =>
                    onSettingsChange({ ...settings, taskAssigned: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="task-due">Task Due Soon</Label>
                <Switch
                  id="task-due"
                  checked={settings.taskDueSoon}
                  onCheckedChange={(checked) =>
                    onSettingsChange({ ...settings, taskDueSoon: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="task-overdue">Task Overdue</Label>
                <Switch
                  id="task-overdue"
                  checked={settings.taskOverdue}
                  onCheckedChange={(checked) =>
                    onSettingsChange({ ...settings, taskOverdue: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary-time">Daily Summary Time</Label>
                <Input
                  id="summary-time"
                  type="time"
                  value={settings.summaryTime}
                  onChange={(e) =>
                    onSettingsChange({ ...settings, summaryTime: e.target.value })
                  }
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
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-smooth cursor-pointer ${
                    notification.read 
                      ? 'bg-muted/30 border-border' 
                      : 'bg-background border-primary/30 shadow-sm'
                  }`}
                  onClick={() => markAsRead(notification.id)}
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
                          {formatTime(notification.time)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeNotification(notification.id)
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {notification.actionable && !notification.read && (
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline" className="text-xs h-6">
                          View Task
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs h-6">
                          Dismiss
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
  )
}