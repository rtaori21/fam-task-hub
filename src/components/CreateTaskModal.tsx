import { useState } from 'react'
import { Calendar, User, Flag, X } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Task, TaskStatus, TaskPriority } from '@/types'

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
  initialStatus?: TaskStatus
  editingTask?: Task
}

const familyMembers = [
  'Alice', 'Bob', 'Charlie', 'Diana'
] // In real app, this would come from workspace data

export function CreateTaskModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialStatus = 'todo',
  editingTask 
}: CreateTaskModalProps) {
  const [title, setTitle] = useState(editingTask?.title || '')
  const [description, setDescription] = useState(editingTask?.description || '')
  const [tags, setTags] = useState<string[]>(editingTask?.tags || [])
  const [newTag, setNewTag] = useState('')
  const [priority, setPriority] = useState<TaskPriority>(editingTask?.priority || 'medium')
  const [assignee, setAssignee] = useState(editingTask?.assignee || 'unassigned')
  const [dueDate, setDueDate] = useState(editingTask?.dueDate || '')
  const [status, setStatus] = useState<TaskStatus>(editingTask?.status || initialStatus)

  const handleSave = () => {
    if (!title.trim()) return

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      assignee: assignee !== 'unassigned' ? assignee : undefined,
      tags: tags.length > 0 ? tags : undefined,
      dueDate: dueDate || undefined,
      status,
    })

    // Reset form
    setTitle('')
    setDescription('')
    setPriority('medium')
    setAssignee('unassigned')
    setDueDate('')
    setStatus(initialStatus)
    
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add more details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(value: TaskPriority) => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4 text-priority-low" />
                      Low
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4 text-priority-medium" />
                      Medium
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4 text-priority-high" />
                      High
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(value: TaskStatus) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
          </div>

          {/* Tags Section */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="cursor-pointer">
                  {tag}
                  <X className="h-3 w-3 ml-1" onClick={() => setTags(tags.filter(t => t !== tag))} />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newTag.trim() && !tags.includes(newTag.trim())) {
                    setTags([...tags, newTag.trim()])
                    setNewTag('')
                  }
                }}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={() => {
                  if (newTag.trim() && !tags.includes(newTag.trim())) {
                    setTags([...tags, newTag.trim()])
                    setNewTag('')
                  }
                }}
                disabled={!newTag.trim() || tags.includes(newTag.trim())}
              >
                Add
              </Button>
            </div>
          </div>
        </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Assign to</Label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {familyMembers.map(member => (
                    <SelectItem key={member} value={member}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {member}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()}>
            {editingTask ? 'Update Task' : 'Create Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}