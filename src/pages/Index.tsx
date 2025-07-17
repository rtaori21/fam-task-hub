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
import { useTasks } from '@/hooks/useTasks'
import { useCalendar } from '@/hooks/useCalendar'

const Index = () => {
  const { tasks, createTask, updateTask, deleteTask, updateTaskStatus } = useTasks()
  const { events, timeBlocks, createEvent, createTimeBlock } = useCalendar()
  const [currentView, setCurrentView] = useState('dashboard')
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false)
  const [eventModalInitialStart, setEventModalInitialStart] = useState<Date | undefined>()
  const [eventModalInitialEnd, setEventModalInitialEnd] = useState<Date | undefined>()
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    dailySummary: true,
    taskAssigned: true,
    taskDueSoon: true,
    taskOverdue: true,
    summaryTime: '08:00'
  })

  const handleCreateTask = (status?: TaskStatus) => {
    setEditingTask(null)
    setIsCreateTaskOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsCreateTaskOpen(true)
  }

  const handleSaveTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingTask) {
      // Update existing task
      await updateTask(editingTask.id, taskData)
    } else {
      // Create new task
      await createTask(taskData)
    }
    setEditingTask(null)
  }

  const handleUpdateTask = async (updatedTask: Task) => {
    await updateTask(updatedTask.id, updatedTask)
  }

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId)
  }

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    await updateTaskStatus(taskId, newStatus)
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

  const handleSaveEvent = async (eventData: Omit<CalendarEvent, 'id'>) => {
    try {
      await createEvent(eventData)
      setIsCreateEventOpen(false)
      setEventModalInitialStart(undefined)
      setEventModalInitialEnd(undefined)
    } catch (error) {
      console.error('Failed to create event:', error)
    }
  }

  const handleSaveTimeBlock = async (timeBlockData: Omit<TimeBlock, 'id'>) => {
    try {
      await createTimeBlock(timeBlockData)
      setIsCreateEventOpen(false)
      setEventModalInitialStart(undefined)
      setEventModalInitialEnd(undefined)
    } catch (error) {
      console.error('Failed to create time block:', error)
    }
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
            onTaskUpdate={handleUpdateTask}
          />
        )
      case 'calendar':
        return (
          <CalendarView 
            tasks={tasks}
            events={events}
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
        editingTaskAssigneeId={editingTask?.assigneeId || undefined}
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