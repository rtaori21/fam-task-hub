import { useState } from 'react'
import { Settings as SettingsIcon, User, Bell, Palette, Download, Upload, Save, Moon, Sun } from 'lucide-react'
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

interface SettingsProps {
  onThemeChange?: (theme: 'light' | 'dark' | 'system') => void
}

export function Settings({ onThemeChange }: SettingsProps) {
  const { toast } = useToast()
  const [isDirty, setIsDirty] = useState(false)

  // User Profile Settings
  const [userProfile, setUserProfile] = useState({
    name: 'John Doe',
    email: 'john.doe@email.com',
    role: 'Parent',
    avatar: ''
  })

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
    theme: 'system' as 'light' | 'dark' | 'system',
    timeFormat: '12h' as '12h' | '24h',
    weekStart: 'monday' as 'sunday' | 'monday',
    defaultView: 'dashboard' as 'dashboard' | 'kanban' | 'calendar',
    autoSave: true,
    compactMode: false
  })

  const handleSave = () => {
    // In a real app, this would save to backend/localStorage
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
    })
    setIsDirty(false)
  }

  const handleExportData = () => {
    // In a real app, this would export all user data
    const data = {
      userProfile,
      notifications,
      preferences,
      exportDate: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'family-planner-settings.json'
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Data Exported",
      description: "Your settings have been exported successfully.",
    })
  }

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (data.userProfile) setUserProfile(data.userProfile)
        if (data.notifications) setNotifications(data.notifications)
        if (data.preferences) setPreferences(data.preferences)
        
        toast({
          title: "Data Imported",
          description: "Your settings have been imported successfully.",
        })
        setIsDirty(true)
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Failed to import settings. Please check the file format.",
          variant: "destructive"
        })
      }
    }
    reader.readAsText(file)
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
    
    if (updates.theme && onThemeChange) {
      onThemeChange(updates.theme)
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
        <TabsList className="grid w-full grid-cols-4">
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
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Data
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
                    onChange={(e) => updateUserProfile({ email: e.target.value })}
                    placeholder="Enter your email"
                  />
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
              <div className="space-y-4">
                <h4 className="font-medium">Task Notifications</h4>
                <div className="space-y-4">
                  {[
                    { key: 'taskAssigned' as const, label: 'When a task is assigned to me', description: 'Get notified when someone assigns you a task' },
                    { key: 'taskDueSoon' as const, label: 'When tasks are due soon', description: 'Reminders for upcoming deadlines' },
                    { key: 'taskOverdue' as const, label: 'When tasks are overdue', description: 'Alerts for missed deadlines' }
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between space-x-2">
                      <div className="space-y-0.5">
                        <Label htmlFor={key}>{label}</Label>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <Switch
                        id={key}
                        checked={notifications[key]}
                        onCheckedChange={(checked) => updateNotifications({ [key]: checked })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Calendar Notifications</h4>
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="calendarReminders">Event reminders</Label>
                    <p className="text-sm text-muted-foreground">Get reminded before calendar events</p>
                  </div>
                  <Switch
                    id="calendarReminders"
                    checked={notifications.calendarReminders}
                    onCheckedChange={(checked) => updateNotifications({ calendarReminders: checked })}
                  />
                </div>
                
                {notifications.calendarReminders && (
                  <div className="space-y-2 ml-4">
                    <Label>Reminder timing</Label>
                    <Select 
                      value={notifications.reminderMinutes.toString()} 
                      onValueChange={(value) => updateNotifications({ reminderMinutes: parseInt(value) })}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 minutes before</SelectItem>
                        <SelectItem value="15">15 minutes before</SelectItem>
                        <SelectItem value="30">30 minutes before</SelectItem>
                        <SelectItem value="60">1 hour before</SelectItem>
                        <SelectItem value="1440">1 day before</SelectItem>
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
                    <Label htmlFor="dailySummary">Send daily summary</Label>
                    <p className="text-sm text-muted-foreground">Daily overview of tasks and events</p>
                  </div>
                  <Switch
                    id="dailySummary"
                    checked={notifications.dailySummary}
                    onCheckedChange={(checked) => updateNotifications({ dailySummary: checked })}
                  />
                </div>
                
                {notifications.dailySummary && (
                  <div className="space-y-2 ml-4">
                    <Label htmlFor="summaryTime">Summary time</Label>
                    <Input
                      id="summaryTime"
                      type="time"
                      value={notifications.summaryTime}
                      onChange={(e) => updateNotifications({ summaryTime: e.target.value })}
                      className="w-32"
                    />
                  </div>
                )}
              </div>
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

        {/* Data Management */}
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Export Data</h4>
                <p className="text-sm text-muted-foreground">
                  Download your settings, tasks, and calendar data as a backup
                </p>
                <Button onClick={handleExportData} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Settings
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Import Data</h4>
                <p className="text-sm text-muted-foreground">
                  Restore your settings from a previously exported file
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                    id="import-file"
                  />
                  <Button asChild variant="outline">
                    <label htmlFor="import-file" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Settings
                    </label>
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-destructive">Danger Zone</h4>
                <div className="p-4 border border-destructive/20 rounded-lg space-y-4">
                  <div>
                    <h5 className="font-medium">Reset All Settings</h5>
                    <p className="text-sm text-muted-foreground">
                      This will reset all your preferences to default values
                    </p>
                  </div>
                  <Button variant="destructive" size="sm">
                    Reset Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}