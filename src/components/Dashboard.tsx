import { useState } from 'react'
import { Plus, BarChart3, Clock, CheckCircle2, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Task } from '@/types'

interface DashboardProps {
  tasks: Task[]
  onCreateTask: () => void
}

export function Dashboard({ tasks, onCreateTask }: DashboardProps) {
  const todayTasks = tasks.filter(task => {
    if (!task.dueDate) return false
    const today = new Date().toDateString()
    return new Date(task.dueDate).toDateString() === today
  })

  const overdueTasks = tasks.filter(task => {
    if (!task.dueDate) return false
    return new Date(task.dueDate) < new Date() && task.status !== 'done'
  })

  const completedThisWeek = tasks.filter(task => {
    if (task.status !== 'done') return false
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return new Date(task.updatedAt) > weekAgo
  })

  const stats = [
    {
      title: "Today's Tasks",
      value: todayTasks.length,
      icon: Clock,
      color: 'text-status-todo',
      bgColor: 'bg-status-todo/10'
    },
    {
      title: 'Completed This Week',
      value: completedThisWeek.length,
      icon: CheckCircle2,
      color: 'text-status-done',
      bgColor: 'bg-status-done/10'
    },
    {
      title: 'Overdue',
      value: overdueTasks.length,
      icon: BarChart3,
      color: 'text-priority-high',
      bgColor: 'bg-priority-high/10'
    },
    {
      title: 'Total Active',
      value: tasks.filter(t => t.status !== 'done').length,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="text-center space-y-2 py-8">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome to Your Family Home
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Keep your family organized and coordinated with simple task management
        </p>
        <Button onClick={onCreateTask} className="mt-4" size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Create Your First Task
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="border border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Today's Tasks */}
      {todayTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-status-todo" />
              Today's Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayTasks.slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-md">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{task.title}</h4>
                  {task.assignee && (
                    <p className="text-sm text-muted-foreground">Assigned to {task.assignee}</p>
                  )}
                </div>
                <Badge 
                  variant="secondary"
                  className={`
                    ${task.priority === 'high' ? 'bg-priority-high text-white' : ''}
                    ${task.priority === 'medium' ? 'bg-priority-medium text-white' : ''}
                    ${task.priority === 'low' ? 'bg-priority-low text-white' : ''}
                  `}
                >
                  {task.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Overdue Tasks Alert */}
      {overdueTasks.length > 0 && (
        <Card className="border-priority-high/30 bg-priority-high/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-priority-high">
              <BarChart3 className="h-5 w-5" />
              Overdue Tasks ({overdueTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overdueTasks.slice(0, 3).map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-background rounded-md">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{task.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    Due: {new Date(task.dueDate!).toLocaleDateString()}
                  </p>
                </div>
                {task.assignee && (
                  <Badge variant="outline">{task.assignee}</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}