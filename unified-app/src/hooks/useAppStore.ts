import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { AppLayout, EmbeddedApp, ProjectCategory } from '@/types';

interface UnifiedAppState extends AppLayout {
  apps: EmbeddedApp[];
  searchQuery: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  setActiveCategory: (category: ProjectCategory | null) => void;
  setActiveApp: (appId: string | null) => void;
  toggleSidebar: () => void;
  toggleDetailsPanel: () => void;
  setSearchQuery: (query: string) => void;
  updateAppStatus: (appId: string, status: EmbeddedApp['status']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed getters
  getAppsByCategory: (category: ProjectCategory) => EmbeddedApp[];
  getActiveApp: () => EmbeddedApp | null;
  getNavigationItems: () => Array<{
    id: ProjectCategory;
    label: string;
    icon: string;
    count: number;
    description: string;
  }>;
}

const initialApps: EmbeddedApp[] = [
   {
     id: 'unified-automation',
     name: 'Unified Automation',
     description: 'Integrated automation platform combining Turix cards, OpenInterface computer control, and Factif visual testing',
     category: 'automation',
     url: 'http://localhost:5173', // This will be the unified-app itself
     port: 5173,
     icon: 'Zap',
     status: 'running',
     features: ['Turix automation cards', 'OpenInterface computer control', 'Factif visual testing', 'Workflow chaining', 'Cross-tool communication'],
     technologies: ['React', 'TypeScript', 'WebSocket', 'PostMessage API'],
   },
   {
     id: 'bytebot-ui',
     name: 'ByteBot UI',
     description: 'Unified interface for AI automation and device management',
     category: 'ai-automation',
     url: 'http://localhost:3000',
     port: 3000,
     icon: 'Bot',
     status: 'running',
     healthEndpoint: '/api/health',
     features: ['Workflow management', 'Device control', 'Real-time monitoring'],
     technologies: ['React', 'TypeScript', 'WebSocket'],
   },
   {
     id: 'factif-ai',
     name: 'Factif AI',
     description: 'Advanced web automation and browser control',
     category: 'ai-automation',
     url: 'http://localhost:3001',
     port: 3001,
     icon: 'Globe',
     status: 'running',
     healthEndpoint: '/health',
     features: ['Web scraping', 'Browser automation', 'GUI interaction'],
     technologies: ['React', 'Python', 'Puppeteer'],
   },
   {
     id: 'aios-service',
     name: 'AIOS Service',
     description: 'AI Operating System providing LLM operations, memory management, and MCP tool discovery',
     category: 'ai-automation',
     url: 'http://localhost:8000',
     port: 8000,
     icon: 'Brain',
     status: 'running',
     healthEndpoint: '/health',
     features: ['LLM operations', 'Memory management', 'MCP tool discovery', 'Agent execution', 'Service orchestration'],
     technologies: ['Python', 'FastAPI', 'Cerebrum', 'WebSocket', 'Docker'],
   },
  {
    id: 'postiz-app',
    name: 'Postiz',
    description: 'Social media management and content scheduling',
    category: 'social-media',
    url: 'http://localhost:3002',
    port: 3002,
    icon: 'Share2',
    status: 'running',
    features: ['Multi-platform posting', 'Content scheduling', 'Analytics'],
    technologies: ['Next.js', 'PostgreSQL', 'Social APIs'],
  },
  {
    id: 'unified-visual-automation',
    name: 'Visual Automation',
    description: 'No-code visual workflow automation',
    category: 'visual-automation',
    url: 'http://localhost:3003',
    port: 3003,
    icon: 'Workflow',
    status: 'running',
    features: ['Visual workflow builder', 'Element detection', 'Screenshot automation'],
    technologies: ['React', 'Python', 'Computer Vision'],
  },
  {
    id: 'grafana',
    name: 'Monitoring Dashboard',
    description: 'Infrastructure monitoring and observability',
    category: 'monitoring',
    url: 'http://localhost:3001',
    port: 3001,
    icon: 'BarChart3',
    status: 'running',
    features: ['Metrics visualization', 'Alerting', 'Log aggregation'],
    technologies: ['Grafana', 'Prometheus', 'Elasticsearch'],
  },
  {
    id: 'onlysnarf',
    name: 'OnlySnarf',
    description: 'Content management and automation tools',
    category: 'content-creation',
    url: 'http://localhost:3004',
    port: 3004,
    icon: 'Image',
    status: 'stopped',
    features: ['Content processing', 'Automation scripts', 'Media management'],
    technologies: ['Python', 'Shell scripts', 'Docker'],
  },
  {
    id: 'wan2gp-video-generation',
    name: 'Wan2GP Video Generation',
    description: 'Advanced AI video generation from text and images using Wan2GP',
    category: 'content-creation',
    url: 'http://localhost:7860',
    port: 7860,
    icon: 'Video',
    status: 'running',
    features: ['Text-to-video', 'Image-to-video', 'Advanced video editing', 'Multiple model support'],
    technologies: ['Python', 'Gradio', 'PyTorch', 'CUDA'],
  },
  {
    id: 'postiz-social-media',
    name: 'Postiz Social Media Dashboard',
    description: 'Comprehensive social media management and content scheduling platform',
    category: 'content-creation',
    url: 'http://localhost:3002',
    port: 3002,
    icon: 'Share2',
    status: 'running',
    features: ['Multi-platform posting', 'Content scheduling', 'Analytics dashboard', 'Team collaboration'],
    technologies: ['Next.js', 'PostgreSQL', 'Social APIs', 'TypeScript'],
  },
   {
     id: 'workflows-integration',
     name: 'Vy + AIOS Workflows',
     description: 'Integrated Vy workflows and AIOS terminal for agent orchestration',
     category: 'workflows',
     url: 'http://localhost:3005',
     port: 3005,
     icon: 'GitBranch',
     status: 'running',
     healthEndpoint: '/api/workflows/health',
     features: ['Vy workflow creation', 'AIOS terminal integration', 'Agent management', 'Task execution'],
     technologies: ['React', 'TypeScript', 'WebSocket', 'Python'],
   },
   {
     id: 'bytebot-vnc-desktop',
     name: 'ByteBot VNC Desktop',
     description: 'Virtual desktop environment with VNC access for remote device management and automation',
     category: 'desktop',
     url: 'http://localhost:3000/vnc',
     port: 3000,
     icon: 'Monitor',
     status: 'running',
     healthEndpoint: '/api/health',
     features: ['VNC remote access', 'Device management', 'Desktop automation', 'Real-time monitoring', 'Input capture'],
     technologies: ['React', 'TypeScript', 'WebSocket', 'VNC', 'NoVNC'],
   },
   {
      id: 'gbox-sandbox-environment',
      name: 'GBox Sandbox Environment',
      description: 'Isolated sandbox environment for testing and development with device simulation',
      category: 'desktop',
      url: 'http://localhost:4000',
      port: 4000,
      icon: 'Smartphone',
      status: 'running',
      healthEndpoint: '/api/health',
      features: ['Device simulation', 'Sandbox isolation', 'WebRTC streaming', 'Control automation', 'Cross-platform testing'],
      technologies: ['React', 'WebRTC', 'Docker', 'Android emulation', 'TypeScript'],
    },
    {
      id: 'grafana-monitoring',
      name: 'Grafana Monitoring Dashboard',
      description: 'Comprehensive monitoring and observability dashboard for system metrics, application performance, and infrastructure health',
      category: 'infrastructure',
      url: 'http://localhost:3020',
      port: 3020,
      icon: 'BarChart3',
      status: 'running',
      healthEndpoint: '/api/health',
      features: ['System metrics visualization', 'Application performance monitoring', 'Alert management', 'Custom dashboards', 'Log aggregation'],
      technologies: ['Grafana', 'Prometheus', 'Loki', 'Node Exporter', 'PostgreSQL Exporter'],
    },
    {
      id: 'docker-management',
      name: 'Docker Ecosystem Management',
      description: 'Container orchestration and management interface for the AI ecosystem with real-time monitoring and control',
      category: 'infrastructure',
      url: 'http://localhost:8080',
      port: 8080,
      icon: 'Server',
      status: 'running',
      healthEndpoint: '/health',
      features: ['Container management', 'Service orchestration', 'Resource monitoring', 'Log streaming', 'Health checks'],
      technologies: ['Docker', 'Node.js', 'WebSocket', 'Express', 'Docker API'],
    },
  ];

const navigationItems = [
   {
     id: 'automation' as ProjectCategory,
     label: 'Automation',
     icon: 'Zap',
     count: 0,
     description: 'Unified automation platform with Turix, OpenInterface, and Factif',
   },
   {
     id: 'ai-automation' as ProjectCategory,
     label: 'AI Automation',
     icon: 'Bot',
     count: 0,
     description: 'AI-powered automation tools and interfaces',
   },
  {
    id: 'social-media' as ProjectCategory,
    label: 'Social Media',
    icon: 'Share2',
    count: 0,
    description: 'Social media management and posting tools',
  },
  {
    id: 'content-creation' as ProjectCategory,
    label: 'Content Creation',
    icon: 'Image',
    count: 0,
    description: 'Content creation and media processing tools',
  },
  {
    id: 'visual-automation' as ProjectCategory,
    label: 'Visual Automation',
    icon: 'Workflow',
    count: 0,
    description: 'No-code visual workflow automation',
  },
  {
    id: 'monitoring' as ProjectCategory,
    label: 'Monitoring',
    icon: 'BarChart3',
    count: 0,
    description: 'Infrastructure monitoring and observability',
  },
  {
    id: 'development-tools' as ProjectCategory,
    label: 'Development',
    icon: 'Code',
    count: 0,
    description: 'Development and debugging tools',
  },
  {
    id: 'communication' as ProjectCategory,
    label: 'Communication',
    icon: 'MessageCircle',
    count: 0,
    description: 'Communication and collaboration tools',
  },
  {
    id: 'infrastructure' as ProjectCategory,
    label: 'Infrastructure',
    icon: 'Server',
    count: 0,
    description: 'Infrastructure management and deployment',
  },
   {
     id: 'workflows' as ProjectCategory,
     label: 'Workflows',
     icon: 'GitBranch',
     count: 0,
     description: 'Vy workflows and AIOS agent orchestration',
   },
   {
     id: 'desktop' as ProjectCategory,
     label: 'Desktop',
     icon: 'Monitor',
     count: 0,
     description: 'Desktop environments with VNC access and sandbox controls',
   },
 ];

export const useUnifiedAppStore = create<UnifiedAppState>()(
  devtools(
    (set, get) => ({
      // Initial state
      apps: initialApps,
      sidebarCollapsed: false,
      detailsPanelOpen: false,
      activeCategory: null,
      activeApp: null,
      searchQuery: '',
      isLoading: false,
      error: null,

      // Actions
      setActiveCategory: (category) => set({ activeCategory: category }),
      setActiveApp: (appId) => set({ activeApp: appId }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      toggleDetailsPanel: () => set((state) => ({ detailsPanelOpen: !state.detailsPanelOpen })),
      setSearchQuery: (query) => set({ searchQuery: query }),
      updateAppStatus: (appId, status) =>
        set((state) => ({
          apps: state.apps.map((app) =>
            app.id === appId ? { ...app, status } : app
          ),
        })),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // Computed getters
      getAppsByCategory: (category) => {
        const { apps, searchQuery } = get();
        let filteredApps = apps.filter((app) => app.category === category);

        if (searchQuery) {
          filteredApps = filteredApps.filter((app) =>
            app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.features.some((feature) =>
              feature.toLowerCase().includes(searchQuery.toLowerCase())
            )
          );
        }

        return filteredApps;
      },

      getActiveApp: () => {
        const { apps, activeApp } = get();
        return apps.find((app) => app.id === activeApp) || null;
      },

      getNavigationItems: () => {
        const { apps } = get();
        return navigationItems.map((item) => ({
          ...item,
          count: apps.filter((app) => app.category === item.id).length,
        }));
      },
    }),
    {
      name: 'unified-app-store',
    }
  )
);