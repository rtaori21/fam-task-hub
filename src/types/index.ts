export type TaskStatus = 'todo' | 'progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  tags?: string[]
  assignee?: string
  assigneeId?: string // Store the actual user_id for editing
  dueDate?: string
  attachments?: { name: string; url: string; type: string }[]
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export interface Workspace {
  id: string
  name: string
  inviteCode: string
  members: User[]
  createdBy: string
  createdAt: string
}