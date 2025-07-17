import { useState, useMemo } from 'react'
import { Calendar, momentLocalizer, View } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Clock, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { Task } from '@/types'
import { CalendarEvent, TimeBlock } from '@/types/calendar'
import { cn } from '@/lib/utils'

const localizer = momentLocalizer(moment)

interface CalendarViewProps {
  tasks: Task[]
  events: CalendarEvent[]
  timeBlocks: TimeBlock[]
  onEventSelect: (event: CalendarEvent) => void
  onCreateEvent: (start: Date, end: Date) => void
  onCreateTimeBlock: () => void
}

export function CalendarView({ 
  tasks, 
  events, 
  timeBlocks, 
  onEventSelect, 
  onCreateEvent,
  onCreateTimeBlock 
}: CalendarViewProps) {
  const [currentView, setCurrentView] = useState<View>('week')
  const [currentDate, setCurrentDate] = useState(new Date())

  // Convert tasks to calendar events
  const taskEvents = useMemo(() => {
    return tasks
      .filter(task => task.dueDate)
      .map(task => {
        const dueDate = new Date(task.dueDate!)
        
        // If the due date doesn't have a specific time (i.e., it's set to midnight), 
        // set it to 5 PM (17:00) as the default time
        if (dueDate.getHours() === 0 && dueDate.getMinutes() === 0 && dueDate.getSeconds() === 0) {
          dueDate.setHours(17, 0, 0, 0) // Set to 5:00 PM
        }
        
        return {
          id: `task-${task.id}`,
          title: `📋 ${task.title}`,
          start: dueDate,
          end: new Date(dueDate.getTime() + 60 * 60 * 1000), // 1 hour duration
          type: 'task' as const,
          assignee: task.assignee,
          priority: task.priority,
          color: task.priority === 'high' ? '#ef4444' : 
                 task.priority === 'medium' ? '#f59e0b' : '#10b981',
          resource: { originalTask: task }
        }
      })
  }, [tasks])

  // Combine all events
  const allEvents = useMemo(() => [
    ...taskEvents,
    ...events,
    ...timeBlocks.map(block => ({
      ...block,
      title: `🚫 ${block.title}`,
      type: 'blocked' as const
    }))
  ], [taskEvents, events, timeBlocks])

  const eventStyleGetter = (event: any) => {
    let backgroundColor = '#3174ad'
    
    if (event.type === 'task') {
      backgroundColor = event.color || '#3174ad'
    } else if (event.type === 'blocked') {
      backgroundColor = '#6b7280'
    } else if (event.type === 'event') {
      backgroundColor = '#059669'
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '12px',
        padding: '2px 4px'
      }
    }
  }

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    onCreateEvent(start, end)
  }

  const handleSelectEvent = (event: any) => {
    onEventSelect(event)
  }

  const navigateToToday = () => {
    setCurrentDate(new Date())
  }

  const navigateBack = () => {
    let newDate = new Date(currentDate)
    if (currentView === 'month') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setDate(newDate.getDate() - 1)
    }
    setCurrentDate(newDate)
  }

  const navigateForward = () => {
    let newDate = new Date(currentDate)
    if (currentView === 'month') {
      newDate.setMonth(newDate.getMonth() + 1)
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setDate(newDate.getDate() + 1)
    }
    setCurrentDate(newDate)
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Family Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={onCreateTimeBlock} size="sm" variant="outline">
                <Clock className="h-4 w-4 mr-1" />
                Block Time
              </Button>
              <Button onClick={() => onCreateEvent(new Date(), new Date())} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Event
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={navigateBack}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={navigateToToday}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={navigateForward}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold ml-4">
                {moment(currentDate).format('MMMM YYYY')}
              </h2>
            </div>
            
            <div className="flex gap-2">
              {(['month', 'week', 'day'] as View[]).map(view => (
                <Button
                  key={view}
                  variant={currentView === view ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentView(view)}
                  className="capitalize"
                >
                  {view}
                </Button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-priority-high rounded"></div>
              <span>High Priority Tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-priority-medium rounded"></div>
              <span>Medium Priority Tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-priority-low rounded"></div>
              <span>Low Priority Tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-secondary-accent rounded"></div>
              <span>Family Events</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-muted-foreground rounded"></div>
              <span>Blocked Time</span>
            </div>
          </div>

          {/* Calendar */}
          <div className="h-[600px] bg-background rounded-lg border">
            <Calendar
              localizer={localizer}
              events={allEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              view={currentView}
              onView={setCurrentView}
              date={currentDate}
              onNavigate={setCurrentDate}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              eventPropGetter={eventStyleGetter}
              className="p-4"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}