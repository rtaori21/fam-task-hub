import { useState, useCallback } from 'react'
import { Home, Kanban, Calendar, Settings, Users, Plus, Bell, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useFamilyData } from '@/hooks/useFamilyData'
import { FamilySetup } from '@/components/FamilySetup'
import { toast } from 'sonner'

interface LayoutProps {
  children: React.ReactNode
  currentView: string
  onViewChange: (view: string) => void
  onCreateTask: () => void
}

const navigation = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'kanban', label: 'Tasks', icon: Kanban },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'members', label: 'Family', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function Layout({ children, currentView, onViewChange, onCreateTask }: LayoutProps) {
  const { signOut, user } = useAuth();
  const { familyInfo, profile, loading, error } = useFamilyData();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign out");
    }
  };

  const handleFamilySetupComplete = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    // Force a page reload to ensure all data is refreshed
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }, []);

  // Show family setup if user has no family
  if (!loading && !familyInfo && !error) {
    return <FamilySetup onComplete={handleFamilySetupComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Home className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">FamPlan</h1>
                <p className="text-xs text-muted-foreground">
                  {familyInfo ? familyInfo.name : 'Welcome to FamPlan'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={onCreateTask} size="sm" variant="gradient">
                <Plus className="h-4 w-4 mr-1" />
                New Task
              </Button>
              <Button onClick={handleSignOut} size="sm" variant="outline">
                <LogOut className="h-4 w-4 mr-1" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <Card className="p-4">
              <nav className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = currentView === item.id
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => onViewChange(item.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-smooth',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-soft'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  )
                })}
              </nav>

              {/* Quick Stats */}
              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="text-sm font-medium text-foreground mb-3">Welcome</h3>
                <div className="text-sm text-muted-foreground">
                  <p>Welcome to your family dashboard! Start by creating tasks and inviting family members.</p>
                </div>
              </div>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}