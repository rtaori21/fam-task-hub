import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Dashboard } from '@/components/Dashboard'
import { KanbanBoard } from '@/components/KanbanBoard'
import { CreateTaskModal } from '@/components/CreateTaskModal'
import { Task, TaskStatus } from '@/types'
import { useToast } from '@/hooks/use-toast'
import heroImage from '@/assets/hero-image.jpg'

// Sample data for development
const sampleTasks: Task[] = [
  {
    id: '1',
    title: 'Grocery Shopping',
    description: 'Buy fruits, vegetables, and milk for the week',
    status: 'todo',
    priority: 'high',
    assignee: 'Alice',
    tags: ['Shopping', 'Urgent'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Fix Bedroom Light',
    description: 'Replace the bulb in the master bedroom',
    status: 'progress',
    priority: 'medium',
    assignee: 'Bob',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Plan Family Movie Night',
    description: 'Choose movie and prepare snacks',
    status: 'done',
    priority: 'low',
    assignee: 'Charlie',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const Index = () => {
  const [currentView, setCurrentView] = useState('dashboard')
  const [tasks, setTasks] = useState<Task[]>(sampleTasks)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createTaskStatus, setCreateTaskStatus] = useState<TaskStatus>('todo')
  const { toast } = useToast()

  const handleCreateTask = (status: TaskStatus = 'todo') => {
    setCreateTaskStatus(status)
    setIsCreateModalOpen(true)
  }

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setTasks(prev => [...prev, newTask])
    toast({
      title: "Task Created",
      description: `"${newTask.title}" has been added to your tasks.`,
    })
  }

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === updatedTask.id ? { ...updatedTask, updatedAt: new Date().toISOString() } : task
      )
    )
    toast({
      title: "Task Updated",
      description: `"${updatedTask.title}" has been updated.`,
    })
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard tasks={tasks} onCreateTask={() => handleCreateTask()} />
      case 'kanban':
        return (
          <KanbanBoard
            tasks={tasks}
            onTaskUpdate={handleUpdateTask}
            onCreateTask={handleCreateTask}
          />
        )
      case 'calendar':
        return (
          <div className="text-center py-12">
            <img src={heroImage} alt="Calendar view" className="mx-auto max-w-md rounded-lg shadow-soft mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-4">Calendar View</h2>
            <p className="text-muted-foreground">Coming soon in Phase 3!</p>
          </div>
        )
      case 'members':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Family Members</h2>
            <p className="text-muted-foreground">Member management coming soon!</p>
          </div>
        )
      case 'settings':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Settings</h2>
            <p className="text-muted-foreground">Workspace settings coming soon!</p>
          </div>
        )
      default:
        return <Dashboard tasks={tasks} onCreateTask={() => handleCreateTask()} />
    }
  }

  return (
    <>
      <Layout
        currentView={currentView}
        onViewChange={setCurrentView}
        onCreateTask={() => handleCreateTask()}
      >
        {renderContent()}
      </Layout>

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveTask}
        initialStatus={createTaskStatus}
      />
    </>
  )
}

export default Index
