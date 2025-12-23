import { Search, Settings, Menu } from 'lucide-react';
import { useUnifiedAppStore } from '@/hooks/useAppStore';
import { cn } from '@/utils/cn';

export function TopHeader() {
  const {
    searchQuery,
    setSearchQuery,
    sidebarCollapsed,
    toggleSidebar
  } = useUnifiedAppStore();

  return (
    <header
      className="h-16 bg-bg-secondary border-b border-border px-6 flex items-center justify-between"
      role="banner"
      aria-label="Application header"
    >
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-bg-card transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!sidebarCollapsed}
        >
          <Menu className="w-5 h-5 text-text-secondary" aria-hidden="true" />
        </button>

        <h1 className="text-xl font-semibold text-text-primary" id="app-title">
          Unified App Shell
        </h1>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search apps and features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full pl-10 pr-4 py-2 bg-bg-card border border-border rounded-md",
              "text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary",
              "transition-colors"
            )}
            aria-label="Search applications and features"
            aria-describedby="search-help"
          />
          <div id="search-help" className="sr-only">
            Type to search through available applications and features
          </div>
        </div>
      </div>

      {/* Right Section */}
      <nav className="flex items-center space-x-2" aria-label="Header actions">
        <button
          className="p-2 rounded-md hover:bg-bg-card transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary"
          aria-label="Open settings"
        >
          <Settings className="w-5 h-5 text-text-secondary" aria-hidden="true" />
        </button>
      </nav>
    </header>
  );
}