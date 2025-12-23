// Unified App Types

export type ProjectCategory =
    | 'ai-automation'
    | 'automation'
    | 'social-media'
    | 'content-creation'
    | 'infrastructure'
    | 'visual-automation'
    | 'development-tools'
    | 'monitoring'
    | 'communication'
    | 'workflows'
    | 'desktop';

export interface EmbeddedApp {
  id: string;
  name: string;
  description: string;
  category: ProjectCategory;
  url: string;
  port: number;
  icon: string;
  status: 'running' | 'stopped' | 'error' | 'maintenance';
  healthEndpoint?: string;
  features: string[];
  technologies: string[];
}

export interface AppLayout {
  sidebarCollapsed: boolean;
  detailsPanelOpen: boolean;
  activeCategory: ProjectCategory | null;
  activeApp: string | null;
}

export interface NavigationItem {
  id: ProjectCategory;
  label: string;
  icon: string;
  count: number;
  description: string;
}

export interface SplitViewConfig {
  leftPanel: {
    width: number;
    minWidth: number;
    maxWidth: number;
  };
  rightPanel: {
    width: number;
    minWidth: number;
    maxWidth: number;
  };
  splitterPosition: number;
}