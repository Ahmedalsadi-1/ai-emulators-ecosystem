import {
  Bot,
  Share2,
  Image,
  Workflow,
  BarChart3,
  Code,
  MessageCircle,
  Server,
  ChevronRight,
  GitBranch,
  Monitor,
  Zap
} from 'lucide-react';
import { useUnifiedAppStore } from '@/hooks/useAppStore';
import { cn } from '@/utils/cn';

const iconMap = {
  'automation': Zap,
  'ai-automation': Bot,
  'social-media': Share2,
  'content-creation': Image,
  'visual-automation': Workflow,
  'monitoring': BarChart3,
  'development-tools': Code,
  'communication': MessageCircle,
  'infrastructure': Server,
  'workflows': GitBranch,
  'desktop': Monitor,
};

export function NavigationSidebar() {
  const {
    sidebarCollapsed,
    activeCategory,
    setActiveCategory,
    getNavigationItems
  } = useUnifiedAppStore();

  const navigationItems = getNavigationItems();

  return (
    <nav className="h-full flex flex-col">
      {/* Navigation Items */}
      <div className="flex-1 py-4">
        {navigationItems.map((item) => {
          const Icon = iconMap[item.id];
          const isActive = activeCategory === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveCategory(item.id)}
              className={cn(
                "w-full flex items-center px-4 py-3 text-left transition-colors",
                "hover:bg-bg-card",
                isActive && "bg-accent-primary text-bg-primary",
                sidebarCollapsed ? "justify-center" : "justify-between"
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="font-medium truncate">{item.label}</span>
                )}
              </div>

              {!sidebarCollapsed && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-text-muted">{item.count}</span>
                  {isActive && <ChevronRight className="w-4 h-4" />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      {!sidebarCollapsed && (
        <div className="p-4 border-t border-border">
          <div className="text-xs text-text-muted">
            Unified App Shell v1.0.0
          </div>
        </div>
      )}
    </nav>
  );
}