import React from 'react';
import { NavigationSidebar } from '@/components/NavigationSidebar';
import { DetailsPanel } from '@/components/DetailsPanel';
import { TopHeader } from '@/components/TopHeader';
import { useUnifiedAppStore } from '@/hooks/useAppStore';
import { cn } from '@/utils/cn';

interface UnifiedLayoutProps {
  children: React.ReactNode;
}

export function UnifiedLayout({ children }: UnifiedLayoutProps) {
  const {
    sidebarCollapsed,
    detailsPanelOpen,
    toggleSidebar,
    toggleDetailsPanel
  } = useUnifiedAppStore();

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+B to toggle sidebar
      if (event.ctrlKey && event.key === 'b') {
        event.preventDefault();
        toggleSidebar();
      }

      // Ctrl+D to toggle details panel
      if (event.ctrlKey && event.key === 'd') {
        event.preventDefault();
        toggleDetailsPanel();
      }

      // Escape to close details panel
      if (event.key === 'Escape' && detailsPanelOpen) {
        toggleDetailsPanel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, toggleDetailsPanel, detailsPanelOpen]);

  return (
    <div
      className="h-screen bg-bg-primary text-text-primary flex flex-col overflow-hidden"
      role="application"
      aria-label="Unified App Shell"
    >
      {/* Top Header */}
      <TopHeader />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Navigation */}
        <aside
          className={cn(
            "h-full bg-bg-secondary border-r border-border transition-all duration-300",
            sidebarCollapsed ? "w-16" : "w-80"
          )}
          aria-label="Navigation sidebar"
          aria-expanded={!sidebarCollapsed}
        >
          <NavigationSidebar />
        </aside>

        {/* Main Content */}
        <main
          className="flex-1 flex flex-col overflow-hidden bg-bg-primary"
          role="main"
          aria-label="Main content area"
        >
          {children}
        </main>

        {/* Right Details Panel */}
        <aside
          className={cn(
            "h-full bg-bg-secondary border-l border-border transition-all duration-300",
            detailsPanelOpen ? "w-96" : "w-0"
          )}
          aria-label="Details panel"
          aria-expanded={detailsPanelOpen}
        >
          {detailsPanelOpen && <DetailsPanel />}
        </aside>
      </div>
    </div>
  );
}