import { useState, useEffect } from 'react'
import { useTheme } from "next-themes"
import { Settings as SettingsIcon, User, Bell, Palette, Save, Moon, Sun } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useFamilyData } from '@/hooks/useFamilyData'
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences'
import { supabase } from '@/integrations/supabase/client'

interface SettingsProps {}

export function Settings({}: SettingsProps) {
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()
  const { profile, familyInfo } = useFamilyData()
  const { 
    preferences: notificationPreferences, 
    loading: notificationLoading, 
    saving: notificationSaving, 
    updatePreferences: updateNotificationPreferences 
  } = useNotificationPreferences()
  const [isDirty, setIsDirty] = useState(false)

  // User Profile Settings
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    role: 'Parent',
    avatar: ''
  })

  // Load user data when profile is available
  useEffect(() => {
    if (profile && user) {
      setUserProfile({
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        email: user.email || '',
        role: familyInfo?.role === 'family_admin' ? 'Admin' : 'Member',
        avatar: ''
      });
    }
  }, [profile, user, familyInfo]);

  // Notification Settings
  const [notifications, setNotifications] = useState({
    dailySummary: true,
    taskAssigned: true,
    taskDueSoon: true,
    taskOverdue: true,
    calendarReminders: true,
    summaryTime: '08:00',
    reminderMinutes: 15
  })

  // App Preferences
  const [preferences, setPreferences] = useState({
    theme: (theme as 'light' | 'dark' | 'system') || 'system',
    timeFormat: '12h' as '12h' | '24h',
    weekStart: 'monday' as 'sunday' | 'monday',
    defaultView: 'dashboard' as 'dashboard' | 'kanban' | 'calendar',
    autoSave: true,
    compactMode: false
  })

  // Update preferences.theme when theme changes
  useEffect(() => {
    if (theme && theme !== preferences.theme) {
      setPreferences(prev => ({ ...prev, theme: theme as 'light' | 'dark' | 'system' }))
    }
  }, [theme, preferences.theme])

  const handleSave = async () => {
    try {
      if (user) {
        const [firstName, ...lastNameParts] = userProfile.name.split(' ')
        const lastName = lastNameParts.join(' ')
        
        const { error } = await supabase
          .from('profiles')
          .update({
            first_name: firstName || '',
            last_name: lastName || '',
          })
          .eq('user_id', user.id)

        if (error) throw error

        toast({
          title: "Settings Saved",
          description: "Your preferences have been updated successfully.",
        })
        setIsDirty(false)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      })
    }
  }


  const updateUserProfile = (updates: Partial<typeof userProfile>) => {
    setUserProfile(prev => ({ ...prev, ...updates }))
    setIsDirty(true)
  }

  const updateNotifications = (updates: Partial<typeof notifications>) => {
    setNotifications(prev => ({ ...prev, ...updates }))
    setIsDirty(true)
  }

  const updatePreferences = (updates: Partial<typeof preferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }))
    setIsDirty(true)
    
    // Handle theme change specifically
    if (updates.theme) {
      setTheme(updates.theme)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-primary" />
              Settings
            </CardTitle>
            <div className="flex items-center gap-2">
              {isDirty && (
                <Badge variant="secondary" className="animate-pulse">
                  Unsaved Changes
                </Badge>
              )}
              <Button onClick={handleSave} disabled={!isDirty}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={userProfile.name}
                    onChange={(e) => updateUserProfile({ name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userProfile.email}
                    disabled={true}
                    className="bg-muted text-muted-foreground cursor-not-allowed"
                    placeholder="Email address (read-only)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed from here. Contact support if needed.
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role in Family</Label>
                <Select value={userProfile.role} onValueChange={(value) => updateUserProfile({ role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Parent">Parent</SelectItem>
                    <SelectItem value="Guardian">Guardian</SelectItem>
                    <SelectItem value="Teen">Teen</SelectItem>
                    <SelectItem value="Child">Child</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">Profile Picture</h4>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm">
                      Upload Photo
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Recommended: Square image, at least 128x128px
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {notificationLoading ? (
                <div className="text-center py-4">Loading notification preferences...</div>
              ) : notificationPreferences ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Task Notifications</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                          <Label htmlFor="task-assignments">When a task is assigned to me</Label>
                          <p className="text-sm text-muted-foreground">Get notified when someone assigns you a task</p>
                        </div>
                        <Switch
                          id="task-assignments"
                          checked={notificationPreferences.task_assignments}
                          onCheckedChange={(checked) =>
                            updateNotificationPreferences({ task_assignments: checked })
                          }
                          disabled={notificationSaving}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                          <Label htmlFor="task-due-soon">When tasks are due soon</Label>
                          <p className="text-sm text-muted-foreground">Reminders for upcoming deadlines</p>
                        </div>
                        <Switch
                          id="task-due-soon"
                          checked={notificationPreferences.task_due_reminders}
                          onCheckedChange={(checked) =>
                            updateNotificationPreferences({ task_due_reminders: checked })
                          }
                          disabled={notificationSaving}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Calendar Notifications</h4>
                    <div className="flex items-center justify-between space-x-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="event-reminders">Event reminders</Label>
                        <p className="text-sm text-muted-foreground">Get reminded before calendar events</p>
                      </div>
                      <Switch
                        id="event-reminders"
                        checked={notificationPreferences.event_reminders}
                        onCheckedChange={(checked) =>
                          updateNotificationPreferences({ event_reminders: checked })
                        }
                        disabled={notificationSaving}
                      />
                    </div>
                    
                    {notificationPreferences.event_reminders && (
                      <div className="space-y-2 ml-4">
                        <Label>Reminder timing</Label>
                        <Select 
                          value={notificationPreferences.reminder_advance_minutes.toString()} 
                          onValueChange={(value) => updateNotificationPreferences({ reminder_advance_minutes: parseInt(value) })}
                          disabled={notificationSaving}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 minutes before</SelectItem>
                            <SelectItem value="15">15 minutes before</SelectItem>
                            <SelectItem value="30">30 minutes before</SelectItem>
                            <SelectItem value="60">1 hour before</SelectItem>
                            <SelectItem value="120">2 hours before</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Daily Summary</h4>
                    <div className="flex items-center justify-between space-x-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="daily-summary">Send daily summary</Label>
                        <p className="text-sm text-muted-foreground">Daily overview of tasks and events</p>
                      </div>
                      <Switch
                        id="daily-summary"
                        checked={notificationPreferences.daily_summary}
                        onCheckedChange={(checked) =>
                          updateNotificationPreferences({ daily_summary: checked })
                        }
                        disabled={notificationSaving}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Advanced Options</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                          <Label htmlFor="email-notifications">Email notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive notifications via email (coming soon)</p>
                        </div>
                        <Switch
                          id="email-notifications"
                          checked={notificationPreferences.email_notifications}
                          onCheckedChange={(checked) =>
                            updateNotificationPreferences({ email_notifications: checked })
                          }
                          disabled={true} // Disabled for now
                        />
                      </div>
                      
                      <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                          <Label htmlFor="browser-notifications">Browser notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive browser push notifications (coming soon)</p>
                        </div>
                        <Switch
                          id="browser-notifications"
                          checked={notificationPreferences.browser_notifications}
                          onCheckedChange={(checked) =>
                            updateNotificationPreferences({ browser_notifications: checked })
                          }
                          disabled={true} // Disabled for now
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Failed to load notification preferences
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* App Preferences */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>App Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={preferences.theme} onValueChange={(value: 'light' | 'dark' | 'system') => updatePreferences({ theme: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          Light
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          Dark
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <SettingsIcon className="h-4 w-4" />
                          System
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Time Format</Label>
                  <Select value={preferences.timeFormat} onValueChange={(value: '12h' | '24h') => updatePreferences({ timeFormat: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12-hour (2:30 PM)</SelectItem>
                      <SelectItem value="24h">24-hour (14:30)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Week Starts On</Label>
                  <Select value={preferences.weekStart} onValueChange={(value: 'sunday' | 'monday') => updatePreferences({ weekStart: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sunday">Sunday</SelectItem>
                      <SelectItem value="monday">Monday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Default View</Label>
                  <Select value={preferences.defaultView} onValueChange={(value: 'dashboard' | 'kanban' | 'calendar') => updatePreferences({ defaultView: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dashboard">Dashboard</SelectItem>
                      <SelectItem value="kanban">Kanban Board</SelectItem>
                      <SelectItem value="calendar">Calendar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">General</h4>
                <div className="space-y-4">
                  {[
                    { key: 'autoSave' as const, label: 'Auto-save changes', description: 'Automatically save changes as you make them' },
                    { key: 'compactMode' as const, label: 'Compact mode', description: 'Show more content in less space' }
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between space-x-2">
                      <div className="space-y-0.5">
                        <Label htmlFor={key}>{label}</Label>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        id={key}
                        checked={preferences[key]}
                        onCheckedChange={(checked) => updatePreferences({ [key]: checked })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}