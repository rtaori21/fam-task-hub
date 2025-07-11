import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Dashboard } from '@/components/Dashboard'
import { CreateTaskModal } from '@/components/CreateTaskModal'
import { Task } from '@/types'

const Index = () => {
  const [currentView, setCurrentView] = useState('dashboard')
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
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

  const handleCreateTask = () => {
    setIsCreateTaskOpen(true)
  }

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setTasks(prev => [...prev, newTask])
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard tasks={tasks} onCreateTask={handleCreateTask} />
      case 'kanban':
        return <div className="text-center py-12 text-muted-foreground">Kanban Board - Coming Soon</div>
      case 'calendar':
        return <div className="text-center py-12 text-muted-foreground">Calendar View - Coming Soon</div>
      case 'notifications':
        return <div className="text-center py-12 text-muted-foreground">Notifications - Coming Soon</div>
      case 'members':
        return <div className="text-center py-12 text-muted-foreground">Family Members - Coming Soon</div>
      case 'settings':
        return <div className="text-center py-12 text-muted-foreground">Settings - Coming Soon</div>
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
        onClose={() => setIsCreateTaskOpen(false)}
        onSave={handleSaveTask}
      />
    </>
  )
}

export default Index