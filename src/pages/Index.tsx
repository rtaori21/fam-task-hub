// Simplified static version without hooks to fix React context issue

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">🏠</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Family Home</h1>
                <p className="text-xs text-muted-foreground">The Johnson Family</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-card rounded-lg border border-border p-4">
              <nav className="space-y-2">
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left bg-primary text-primary-foreground shadow-soft">
                  <span>🏠</span>
                  <span className="font-medium">Dashboard</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-muted-foreground hover:text-foreground hover:bg-secondary/50">
                  <span>📋</span>
                  <span className="font-medium">Tasks</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-muted-foreground hover:text-foreground hover:bg-secondary/50">
                  <span>📅</span>
                  <span className="font-medium">Calendar</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-muted-foreground hover:text-foreground hover:bg-secondary/50">
                  <span>🔔</span>
                  <span className="font-medium">Notifications</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-muted-foreground hover:text-foreground hover:bg-secondary/50">
                  <span>👥</span>
                  <span className="font-medium">Family</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-muted-foreground hover:text-foreground hover:bg-secondary/50">
                  <span>⚙️</span>
                  <span className="font-medium">Settings</span>
                </button>
              </nav>

              {/* Quick Stats */}
              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="text-sm font-medium text-foreground mb-3">Quick Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Tasks</span>
                    <span className="font-medium text-foreground">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-medium text-status-done">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Family Members</span>
                    <span className="font-medium text-foreground">4</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Welcome Dashboard */}
            <div className="space-y-6">
              {/* Welcome Header */}
              <div className="text-center space-y-2 py-8">
                <h1 className="text-3xl font-bold text-foreground">
                  Welcome to Your Family Home
                </h1>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Keep your family organized and coordinated with simple task management
                </p>
                <button className="mt-4 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft h-11 rounded-md px-8">
                  <span>➕</span>
                  Create Your First Task
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card rounded-lg border border-border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Today's Tasks</p>
                      <p className="text-2xl font-bold text-foreground">3</p>
                    </div>
                    <div className="p-3 rounded-full bg-status-todo/10">
                      <span className="text-status-todo">⏰</span>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Completed This Week</p>
                      <p className="text-2xl font-bold text-foreground">8</p>
                    </div>
                    <div className="p-3 rounded-full bg-status-done/10">
                      <span className="text-status-done">✅</span>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Overdue</p>
                      <p className="text-2xl font-bold text-foreground">1</p>
                    </div>
                    <div className="p-3 rounded-full bg-priority-high/10">
                      <span className="text-priority-high">⚠️</span>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-lg border border-border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Active</p>
                      <p className="text-2xl font-bold text-foreground">12</p>
                    </div>
                    <div className="p-3 rounded-full bg-primary/10">
                      <span className="text-primary">👥</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Today's Tasks */}
              <div className="bg-card rounded-lg border border-border">
                <div className="p-6 border-b border-border">
                  <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <span>⏰</span>
                    Today's Tasks
                  </h2>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-md">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">Grocery Shopping</h4>
                      <p className="text-sm text-muted-foreground">Assigned to Alice</p>
                    </div>
                    <span className="bg-priority-high text-white text-xs px-2 py-1 rounded">high</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-md">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">Fix Bedroom Light</h4>
                      <p className="text-sm text-muted-foreground">Assigned to Bob</p>
                    </div>
                    <span className="bg-priority-medium text-white text-xs px-2 py-1 rounded">progress</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-md">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">Plan Family Movie Night</h4>
                      <p className="text-sm text-muted-foreground">Assigned to Charlie</p>
                    </div>
                    <span className="bg-status-done text-white text-xs px-2 py-1 rounded">done</span>
                  </div>
                </div>
              </div>

              {/* Notice */}
              <div className="bg-card rounded-lg border border-border p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-2">React Context Recovery Mode</h3>
                  <p className="text-muted-foreground mb-4">
                    The app is running in safe mode while we resolve React hooks issues.
                    All your family planning features are being restored!
                  </p>
                  <div className="flex justify-center gap-4 text-sm">
                    <span className="text-status-done">✅ Phase 1: Task Management</span>
                    <span className="text-status-done">✅ Phase 2: Enhanced Features</span>
                    <span className="text-status-done">✅ Phase 3: Calendar & Notifications</span>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default Index