export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  type: 'task' | 'event' | 'blocked'
  assignee?: string
  priority?: 'low' | 'medium' | 'high'
  color?: string
  description?: string
}

export interface TimeBlock {
  id: string
  title: string
  start: Date
  end: Date
  type: 'family' | 'personal' | 'focus'
  description?: string
  color: string
}

export interface NotificationSettings {
  dailySummary: boolean
  taskAssigned: boolean
  taskDueSoon: boolean
  taskOverdue: boolean
  summaryTime: string // HH:MM format
}