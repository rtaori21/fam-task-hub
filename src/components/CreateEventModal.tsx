import { useState, useEffect } from 'react'
import { Calendar, Clock, Users, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarEvent, TimeBlock } from '@/types/calendar'

interface CreateEventModalProps {
  isOpen: boolean
  onClose: () => void
  onSaveEvent: (event: Omit<CalendarEvent, 'id'>) => void
  onSaveTimeBlock: (timeBlock: Omit<TimeBlock, 'id'>) => void
  initialStart?: Date
  initialEnd?: Date
}

const familyMembers = ['Alice', 'Bob', 'Charlie', 'Diana'] // In real app, from workspace

export function CreateEventModal({ 
  isOpen, 
  onClose, 
  onSaveEvent, 
  onSaveTimeBlock,
  initialStart,
  initialEnd 
}: CreateEventModalProps) {
  const [eventType, setEventType] = useState<'event' | 'blocked'>('event')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignee, setAssignee] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [blockType, setBlockType] = useState<'family' | 'personal' | 'focus'>('family')

  useEffect(() => {
    if (initialStart) {
      setStartDate(initialStart.toISOString().split('T')[0])
      setStartTime(initialStart.toTimeString().slice(0, 5))
    }
    if (initialEnd) {
      setEndDate(initialEnd.toISOString().split('T')[0])
      setEndTime(initialEnd.toTimeString().slice(0, 5))
    }
  }, [initialStart, initialEnd])

  const handleSave = () => {
    if (!title.trim() || !startDate || !startTime || !endDate || !endTime) return

    const start = new Date(`${startDate}T${startTime}`)
    const end = new Date(`${endDate}T${endTime}`)

    if (eventType === 'event') {
      onSaveEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        start,
        end,
        type: 'event',
        assignee: assignee || undefined,
        color: '#059669' // Green for events
      })
    } else {
      const colors = {
        family: '#3b82f6',    // Blue
        personal: '#8b5cf6',  // Purple  
        focus: '#f59e0b'      // Orange
      }
      
      onSaveTimeBlock({
        title: title.trim(),
        description: description.trim() || undefined,
        start,
        end,
        type: blockType,
        color: colors[blockType]
      })
    }

    // Reset form
    setTitle('')
    setDescription('')
    setAssignee('')
    setStartDate('')
    setStartTime('')
    setEndDate('')
    setEndTime('')
    setEventType('event')
    setBlockType('family')
    
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {eventType === 'event' ? (
              <>
                <Calendar className="h-5 w-5" />
                Create Family Event
              </>
            ) : (
              <>
                <Clock className="h-5 w-5" />
                Block Time
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Event Type Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={eventType === 'event' ? 'default' : 'outline'}
              onClick={() => setEventType('event')}
              className="flex-1"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Family Event
            </Button>
            <Button
              type="button"
              variant={eventType === 'blocked' ? 'default' : 'outline'}
              onClick={() => setEventType('blocked')}
              className="flex-1"
            >
              <Clock className="h-4 w-4 mr-2" />
              Block Time
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">
              {eventType === 'event' ? 'Event' : 'Time Block'} Title *
            </Label>
            <Input
              id="title"
              placeholder={eventType === 'event' ? "Family Movie Night" : "Focus Time"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-20"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date & Time</Label>
              <div className="space-y-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>End Date & Time</Label>
              <div className="space-y-2">
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Event-specific fields */}
          {eventType === 'event' && (
            <div className="space-y-2">
              <Label>Assign to Family Member</Label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose member (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  {familyMembers.map(member => (
                    <SelectItem key={member} value={member}>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {member}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Time Block specific fields */}
          {eventType === 'blocked' && (
            <div className="space-y-2">
              <Label>Block Type</Label>
              <Select value={blockType} onValueChange={(value: 'family' | 'personal' | 'focus') => setBlockType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="family">Family Time</SelectItem>
                  <SelectItem value="personal">Personal Time</SelectItem>
                  <SelectItem value="focus">Focus Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!title.trim() || !startDate || !startTime || !endDate || !endTime}
          >
            {eventType === 'event' ? 'Create Event' : 'Block Time'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}