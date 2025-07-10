import { Calendar, Clock, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Task } from '@/types'
import { cn } from '@/lib/utils'

interface TaskCardProps {
  task: Task
  onStatusChange: (taskId: string, newStatus: Task['status']) => void
  onEdit: (task: Task) => void
}

export function TaskCard({ task, onStatusChange, onEdit }: TaskCardProps) {
  const priorityColors = {
    low: 'bg-priority-low text-white',
    medium: 'bg-priority-medium text-white',
    high: 'bg-priority-high text-white'
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('taskId', task.id)
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-soft transition-smooth bg-card border border-border"
      draggable
      onDragStart={handleDragStart}
      onClick={() => onEdit(task)}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-medium text-card-foreground leading-tight">
            {task.title}
          </h3>
          <Badge 
            className={cn('text-xs px-2 py-1', priorityColors[task.priority])}
          >
            {task.priority}
          </Badge>
        </div>

        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {task.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}
          
          {task.assignee && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{task.assignee}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs px-2 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{new Date(task.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}