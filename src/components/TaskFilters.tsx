import { Search, Filter, Tag, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Task, TaskPriority } from '@/types'

interface TaskFiltersProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  selectedTags: string[]
  onTagToggle: (tag: string) => void
  selectedPriority: TaskPriority | 'all'
  onPriorityChange: (priority: TaskPriority | 'all') => void
  tasks: Task[]
}

export function TaskFilters({
  searchTerm,
  onSearchChange,
  selectedTags,
  onTagToggle,
  selectedPriority,
  onPriorityChange,
  tasks
}: TaskFiltersProps) {
  // Get all unique tags from tasks
  const allTags = Array.from(new Set(tasks.flatMap(task => task.tags || [])))
  
  const priorities: (TaskPriority | 'all')[] = ['all', 'high', 'medium', 'low']

  return (
    <Card className="mb-6">
      <CardContent className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Priority:</span>
          {priorities.map(priority => (
            <Button
              key={priority}
              variant={selectedPriority === priority ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPriorityChange(priority)}
              className="text-xs"
            >
              {priority === 'all' ? 'All' : priority}
            </Button>
          ))}
        </div>

        {/* Tags Filter */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Tags:</span>
            {allTags.map(tag => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? 'default' : 'secondary'}
                className="cursor-pointer hover:opacity-80"
                onClick={() => onTagToggle(tag)}
              >
                {tag}
                {selectedTags.includes(tag) && (
                  <X className="h-3 w-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>
        )}

        {/* Active Filters */}
        {(selectedTags.length > 0 || selectedPriority !== 'all' || searchTerm) && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {searchTerm && (
              <Badge variant="outline">
                Search: "{searchTerm}"
                <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => onSearchChange('')} />
              </Badge>
            )}
            {selectedPriority !== 'all' && (
              <Badge variant="outline">
                Priority: {selectedPriority}
                <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => onPriorityChange('all')} />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}