import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Dashboard } from '@/components/Dashboard'
import { KanbanBoard } from '@/components/KanbanBoard'
import { FamilyMembers } from '@/components/FamilyMembers'
import { CreateTaskModal } from '@/components/CreateTaskModal'
import { Settings } from '@/components/Settings'
import { CalendarView } from '@/components/CalendarView'
import { CreateEventModal } from '@/components/CreateEventModal'
import { NotificationCenter } from '@/components/NotificationCenter'
import { Task, TaskStatus } from '@/types'
import { CalendarEvent, TimeBlock, NotificationSettings } from '@/types/calendar'

const Index = () => {
  const [currentView, setCurrentView] = useState('dashboard')
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false)
  const [eventModalInitialStart, setEventModalInitialStart] = useState<Date | undefined>()
  const [eventModalInitialEnd, setEventModalInitialEnd] = useState<Date | undefined>()
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([])
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    dailySummary: true,
    taskAssigned: true,
    taskDueSoon: true,
    taskOverdue: true,
    summaryTime: '08:00'
  })
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Grocery Shopping',
      description: 'Buy groceries for the week',
      status: 'todo',
      priority: 'high',
      assignee: 'Alice',
      dueDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Fix Bedroom Light',
      description: 'Replace the broken light bulb in the bedroom',
      status: 'progress',
      priority: 'medium',
      assignee: 'Bob',
      dueDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'Plan Family Movie Night',
      description: 'Choose a movie and prepare snacks',
      status: 'done',
      priority: 'low',
      assignee: 'Charlie',
      dueDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ])

  const handleCreateTask = (status?: TaskStatus) => {
    setEditingTask(null)
    setIsCreateTaskOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsCreateTaskOpen(true)
  }

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingTask) {
      // Update existing task
      setTasks(prev => prev.map(task => 
        task.id === editingTask.id 
          ? { ...taskData, id: editingTask.id, createdAt: editingTask.createdAt, updatedAt: new Date().toISOString() }
          : task
      ))
    } else {
      // Create new task
      const newTask: Task = {
        ...taskData,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setTasks(prev => [...prev, newTask])
    }
    setEditingTask(null)
  }

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ))
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId))
  }

  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: newStatus, updatedAt: new Date().toISOString() }
        : task
    ))
  }

  // Calendar handlers
  const handleCreateEvent = (start: Date, end: Date) => {
    setEventModalInitialStart(start)
    setEventModalInitialEnd(end)
    setIsCreateEventOpen(true)
  }

  const handleCreateTimeBlock = () => {
    const now = new Date()
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
    setEventModalInitialStart(now)
    setEventModalInitialEnd(oneHourLater)
    setIsCreateEventOpen(true)
  }

  const handleSaveEvent = (eventData: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: Math.random().toString(36).substr(2, 9),
    }
    setCalendarEvents(prev => [...prev, newEvent])
    setIsCreateEventOpen(false)
    setEventModalInitialStart(undefined)
    setEventModalInitialEnd(undefined)
  }

  const handleSaveTimeBlock = (timeBlockData: Omit<TimeBlock, 'id'>) => {
    const newTimeBlock: TimeBlock = {
      ...timeBlockData,
      id: Math.random().toString(36).substr(2, 9),
    }
    setTimeBlocks(prev => [...prev, newTimeBlock])
    setIsCreateEventOpen(false)
    setEventModalInitialStart(undefined)
    setEventModalInitialEnd(undefined)
  }

  const handleEventSelect = (event: CalendarEvent) => {
    // Handle event selection - could open an edit modal in the future
    console.log('Selected event:', event)
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard tasks={tasks} onCreateTask={handleCreateTask} />
      case 'kanban':
        return (
          <KanbanBoard 
            tasks={tasks} 
            onCreateTask={handleCreateTask}
            onEditTask={handleEditTask}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onDeleteTask={handleDeleteTask}
          />
        )
      case 'calendar':
        return (
          <CalendarView 
            tasks={tasks}
            events={calendarEvents}
            timeBlocks={timeBlocks}
            onEventSelect={handleEventSelect}
            onCreateEvent={handleCreateEvent}
            onCreateTimeBlock={handleCreateTimeBlock}
          />
        )
      case 'notifications':
        return (
          <div className="max-w-md mx-auto">
            <NotificationCenter 
              tasks={tasks}
              settings={notificationSettings}
              onSettingsChange={setNotificationSettings}
            />
          </div>
        )
      case 'members':
        return <FamilyMembers />
      case 'settings':
        return <Settings />
      default:
        return <Dashboard tasks={tasks} onCreateTask={handleCreateTask} />
    }
  }

  return (
    <>
      <Layout 
        currentView={currentView} 
        onViewChange={setCurrentView}
        onCreateTask={handleCreateTask}
      >
        {renderView()}
      </Layout>

      <CreateTaskModal 
        isOpen={isCreateTaskOpen}
        onClose={() => {
          setIsCreateTaskOpen(false)
          setEditingTask(null)
        }}
        onSave={handleSaveTask}
        editingTask={editingTask || undefined}
      />

      <CreateEventModal
        isOpen={isCreateEventOpen}
        onClose={() => {
          setIsCreateEventOpen(false)
          setEventModalInitialStart(undefined)
          setEventModalInitialEnd(undefined)
        }}
        onSaveEvent={handleSaveEvent}
        onSaveTimeBlock={handleSaveTimeBlock}
        initialStart={eventModalInitialStart}
        initialEnd={eventModalInitialEnd}
      />
    </>
  )
}

export default Index