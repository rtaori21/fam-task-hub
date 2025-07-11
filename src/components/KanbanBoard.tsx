import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TaskCard } from './TaskCard'
import { TaskFilters } from './TaskFilters'
import { Task, TaskStatus, TaskPriority } from '@/types'
import { cn } from '@/lib/utils'

interface KanbanBoardProps {
  tasks: Task[]
  onTaskUpdate?: (task: Task) => void
  onCreateTask: (status?: TaskStatus) => void
  onEditTask?: (task: Task) => void
  onUpdateTaskStatus?: (taskId: string, newStatus: TaskStatus) => void
  onDeleteTask?: (taskId: string) => void
}

const statusConfig = {
  todo: {
    title: 'To Do',
    color: 'border-t-status-todo',
    bgColor: 'bg-primary-soft/20'
  },
  progress: {
    title: 'In Progress', 
    color: 'border-t-status-progress',
    bgColor: 'bg-status-progress/20'
  },
  done: {
    title: 'Done',
    color: 'border-t-status-done',
    bgColor: 'bg-status-done/20'
  }
}

export function KanbanBoard({ tasks, onTaskUpdate, onCreateTask, onEditTask, onUpdateTaskStatus, onDeleteTask }: KanbanBoardProps) {
  const [draggedOver, setDraggedOver] = useState<TaskStatus | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | 'all'>('all')

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    
    const matchesTags = selectedTags.length === 0 || 
                       (task.tags && selectedTags.some(tag => task.tags!.includes(tag)))
    
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority

    return matchesSearch && matchesTags && matchesPriority
  })

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    const task = tasks.find(t => t.id === taskId)
    
    if (task && task.status !== status) {
      if (onUpdateTaskStatus) {
        onUpdateTaskStatus(taskId, status)
      } else if (onTaskUpdate) {
        onTaskUpdate({ ...task, status, updatedAt: new Date().toISOString() })
      }
    }
    
    setDraggedOver(null)
  }

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault()
    setDraggedOver(status)
  }

  const handleDragLeave = () => {
    setDraggedOver(null)
  }

  const getTasksByStatus = (status: TaskStatus) => 
    filteredTasks.filter(task => task.status === status)

  return (
    <div className="space-y-6">
      <TaskFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedTags={selectedTags}
        onTagToggle={(tag) => {
          setSelectedTags(prev => 
            prev.includes(tag) 
              ? prev.filter(t => t !== tag)
              : [...prev, tag]
          )
        }}
        selectedPriority={selectedPriority}
        onPriorityChange={setSelectedPriority}
        tasks={tasks}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
      {(Object.keys(statusConfig) as TaskStatus[]).map(status => {
        const config = statusConfig[status]
        const statusTasks = getTasksByStatus(status)
        
        return (
          <Card 
            key={status}
            className={cn(
              'flex flex-col h-fit min-h-[400px] border-t-4 transition-smooth',
              config.color,
              draggedOver === status && 'ring-2 ring-primary/50 shadow-glow'
            )}
            onDrop={(e) => handleDrop(e, status)}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
          >
            <CardHeader className={cn('pb-3', config.bgColor)}>
              <CardTitle className="flex items-center justify-between text-lg">
                <span>{config.title}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground font-normal">
                    {statusTasks.length}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onCreateTask(status)}
                    className="h-6 w-6 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 p-4 space-y-3">
              {statusTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={(taskId, newStatus) => {
                    if (onUpdateTaskStatus) {
                      onUpdateTaskStatus(taskId, newStatus)
                    } else if (onTaskUpdate) {
                      const updatedTask = tasks.find(t => t.id === taskId)
                      if (updatedTask) {
                        onTaskUpdate({ ...updatedTask, status: newStatus, updatedAt: new Date().toISOString() })
                      }
                    }
                  }}
                  onEdit={(task) => {
                    if (onEditTask) {
                      onEditTask(task)
                    } else if (onTaskUpdate) {
                      onTaskUpdate(task)
                    }
                  }}
                />
              ))}
              
              {statusTasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No tasks yet</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCreateTask(status)}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add task
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
      </div>
    </div>
  )
}