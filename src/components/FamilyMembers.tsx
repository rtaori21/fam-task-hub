import { useState } from 'react'
import { Plus, User, Mail, MoreHorizontal, UserPlus, Settings } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface FamilyMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'member'
  avatar?: string
  joinedAt: string
  tasksAssigned: number
  tasksCompleted: number
}

const initialMembers: FamilyMember[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@family.com',
    role: 'admin',
    joinedAt: '2024-01-01',
    tasksAssigned: 5,
    tasksCompleted: 3,
  },
  {
    id: '2',
    name: 'Bob Johnson',
    email: 'bob@family.com',
    role: 'member',
    joinedAt: '2024-01-01',
    tasksAssigned: 4,
    tasksCompleted: 2,
  },
  {
    id: '3',
    name: 'Charlie Johnson',
    email: 'charlie@family.com',
    role: 'member',
    joinedAt: '2024-01-01',
    tasksAssigned: 3,
    tasksCompleted: 3,
  },
  {
    id: '4',
    name: 'Diana Johnson',
    email: 'diana@family.com',
    role: 'member',
    joinedAt: '2024-01-15',
    tasksAssigned: 2,
    tasksCompleted: 1,
  },
]

export function FamilyMembers() {
  const [members, setMembers] = useState<FamilyMember[]>(initialMembers)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')

  const handleInvite = () => {
    if (!inviteEmail.trim() || !inviteName.trim()) return

    const newMember: FamilyMember = {
      id: Math.random().toString(36).substr(2, 9),
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: 'member',
      joinedAt: new Date().toISOString().split('T')[0],
      tasksAssigned: 0,
      tasksCompleted: 0,
    }

    setMembers(prev => [...prev, newMember])
    setInviteEmail('')
    setInviteName('')
    setIsInviteOpen(false)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getCompletionRate = (member: FamilyMember) => {
    if (member.tasksAssigned === 0) return 0
    return Math.round((member.tasksCompleted / member.tasksAssigned) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Family Members</h1>
          <p className="text-muted-foreground">Manage your family workspace</p>
        </div>
        <Button onClick={() => setIsInviteOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Members</p>
                <p className="text-2xl font-bold text-foreground">{members.length}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Tasks</p>
                <p className="text-2xl font-bold text-foreground">
                  {members.reduce((sum, member) => sum + member.tasksAssigned, 0)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-status-todo/10">
                <Settings className="h-5 w-5 text-status-todo" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Completion Rate</p>
                <p className="text-2xl font-bold text-foreground">
                  {Math.round(
                    (members.reduce((sum, member) => sum + member.tasksCompleted, 0) /
                     Math.max(members.reduce((sum, member) => sum + member.tasksAssigned, 0), 1)) * 100
                  )}%
                </p>
              </div>
              <div className="p-3 rounded-full bg-status-done/10">
                <Settings className="h-5 w-5 text-status-done" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members.map((member) => (
          <Card key={member.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">{member.name}</h3>
                      <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                        {member.role}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {member.email}
                    </p>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => console.log('Manage member:', member.id)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Manage
                    </DropdownMenuItem>
                    {member.role !== 'admin' && (
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => {
                          setMembers(prev => prev.filter(m => m.id !== member.id))
                        }}
                      >
                        Remove
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tasks Progress</span>
                  <span className="text-foreground">
                    {member.tasksCompleted}/{member.tasksAssigned} ({getCompletionRate(member)}%)
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-status-done h-2 rounded-full transition-smooth"
                    style={{ width: `${getCompletionRate(member)}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 text-xs text-muted-foreground">
                Joined {new Date(member.joinedAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invite Modal */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Family Member</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter member name"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={!inviteEmail.trim() || !inviteName.trim()}>
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}