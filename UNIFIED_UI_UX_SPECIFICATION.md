# Unified UI/UX Specification
## Website + Application + Widget Implementation Guide

## Core Design Philosophy
Transform Factif-AI into a unified orchestration hub that serves as both a standalone web application and an embeddable widget, while maintaining the sophisticated workflow automation interface from the concept screenshots.

## Visual Design System

### Color Palette (From Concept Screenshots)
```css
:root {
  /* Primary Backgrounds */
  --bg-primary: #1a1a1a;
  --bg-secondary: #2a2a2a;
  --bg-card: #333333;
  
  /* Accent Colors */
  --accent-primary: #00d4aa;
  --accent-secondary: #00b896;
  --accent-hover: #00a085;
  
  /* Text Colors */
  --text-primary: #ffffff;
  --text-secondary: #cccccc;
  --text-muted: #999999;
  
  /* Status Colors */
  --status-success: #00d4aa;
  --status-warning: #ffa500;
  --status-error: #ff4444;
  --status-running: #0099cc;
  
  /* Border & Effects */
  --border-color: #444444;
  --border-hover: #00d4aa;
  --shadow-glow: 0 0 20px rgba(0, 212, 170, 0.3);
}
```

### Typography System
```css
/* Primary Font Stack */
--font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

## Layout Architecture

### Three-Panel Layout System
```typescript
interface PanelLayout {
  sidebar: {
    width: '280px';
    collapsible: true;
    position: 'left';
    background: 'var(--bg-secondary)';
  };
  main: {
    flex: 1;
    background: 'var(--bg-primary)';
    padding: '24px';
    min-width: '0'; // Allow shrinking
  };
  details: {
    width: '320px';
    collapsible: true;
    position: 'right';
    background: 'var(--bg-secondary)';
  };
}
```

### Embedded Panel System (Project Tabs)
```typescript
interface ProjectPanel {
  tabs: {
    orientation: 'horizontal';
    height: '48px';
    background: 'var(--bg-secondary)';
    border: '1px solid var(--border-color)';
    border-radius: '8px';
    padding: '4px';
  };
  tab: {
    height: '40px';
    padding: '0 16px';
    border-radius: '6px';
    font-size: 'var(--text-sm)';
    font-weight: 'var(--font-medium)';
    transition: 'all 0.2s ease';
  };
  activeTab: {
    background: 'var(--accent-primary)';
    color: 'var(--bg-primary)';
    box-shadow: 'var(--shadow-glow)';
  };
}
```

## Component Specifications

### Workflow Card Component
```typescript
interface WorkflowCard {
  container: {
    background: 'var(--bg-card)';
    border: '1px solid var(--border-color)';
    border-radius: '12px';
    padding: '20px';
    transition: 'all 0.3s ease';
    hover: {
      border: 'var(--border-hover)';
      boxShadow: 'var(--shadow-glow)';
      transform: 'translateY(-2px)';
    };
  };
  header: {
    display: 'flex';
    alignItems: 'center';
    gap: '12px';
    marginBottom: '16px';
  };
  statusIndicator: {
    width: '8px';
    height: '8px';
    borderRadius: '50%';
    animation: 'pulse 2s infinite';
  };
  title: {
    fontSize: 'var(--text-lg)';
    fontWeight: 'var(--font-semibold)';
    color: 'var(--text-primary)';
    flex: 1;
  };
  progress: {
    height: '4px';
    background: 'var(--bg-secondary)';
    borderRadius: '2px';
    overflow: 'hidden';
    margin: '12px 0';
  };
  progressBar: {
    height: '100%';
    background: 'var(--accent-primary)';
    transition: 'width 0.3s ease';
  };
  actions: {
    display: 'flex';
    gap: '8px';
    marginTop: '16px';
  };
}
```

### Device Control Panel
```typescript
interface DeviceControlPanel {
  container: {
    background: 'var(--bg-card)';
    borderRadius: '12px';
    padding: '20px';
    marginBottom: '16px';
  };
  header: {
    display: 'flex';
    justifyContent: 'space-between';
    alignItems: 'center';
    marginBottom: '16px';
  };
  statusBadge: {
    padding: '4px 12px';
    borderRadius: '16px';
    fontSize: 'var(--text-xs)';
    fontWeight: 'var(--font-medium)';
  };
  controls: {
    display: 'grid';
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))';
    gap: '12px';
  };
  controlButton: {
    padding: '8px 16px';
    border: '1px solid var(--border-color)';
    borderRadius: '6px';
    background: 'var(--bg-secondary)';
    color: 'var(--text-primary)';
    cursor: 'pointer';
    transition: 'all 0.2s ease';
  };
}
```

## Responsive Design System

### Breakpoints
```typescript
const breakpoints = {
  mobile: '320px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1440px',
  ultra: '1920px'
};
```

### Layout Adaptations
```css
/* Mobile (< 768px) */
@media (max-width: 767px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: -280px;
    height: 100vh;
    z-index: 1000;
    transition: left 0.3s ease;
  }
  
  .sidebar.open {
    left: 0;
  }
  
  .main {
    padding: 16px;
  }
  
  .details {
    display: none;
  }
  
  .workflow-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

/* Tablet (768px - 1023px) */
@media (min-width: 768px) and (max-width: 1023px) {
  .sidebar {
    width: 240px;
  }
  
  .details {
    width: 280px;
  }
  
  .workflow-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .workflow-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
}
```

## Widget Embedding System

### Widget Wrapper
```typescript
interface WidgetConfig {
  container: {
    width: '100%';
    height: '100%';
    minHeight: '400px';
    background: 'var(--bg-primary)';
    borderRadius: '8px';
    overflow: 'hidden';
  };
  compact: {
    height: '200px';
    display: 'workflow-summary';
  };
  standard: {
    height: '400px';
    display: 'workflow-list';
  };
  expanded: {
    height: '600px';
    display: 'full-interface';
  };
}
```

### Embedding API
```typescript
interface UnifiedWidget {
  mount(container: HTMLElement, config: WidgetConfig): void;
  update(data: any): void;
  resize(width: number, height: number): void;
  destroy(): void;
  
  // Events
  on(event: string, callback: Function): void;
  emit(event: string, data: any): void;
}

// Usage Example
const widget = new UnifiedWidget();
widget.mount(document.getElementById('container'), {
  mode: 'standard',
  projects: ['bytebot', 'aios', 'factif-ai'],
  theme: 'dark'
});
```

## Interaction Patterns

### Navigation Flow
```typescript
interface NavigationFlow {
  sidebar: {
    sections: [
      { id: 'projects', label: 'Projects', icon: 'folder' },
      { id: 'workflows', label: 'Workflows', icon: 'workflow' },
      { id: 'devices', label: 'Devices', icon: 'monitor' },
      { id: 'settings', label: 'Settings', icon: 'settings' }
    ];
    behavior: 'accordion';
  };
  breadcrumbs: {
    show: true;
    separator: '›';
    truncate: true;
  };
}
```

### State Management
```typescript
interface AppState {
  activeProject: string;
  sidebarCollapsed: boolean;
  detailsPanelCollapsed: boolean;
  selectedWorkflow: string | null;
  deviceStates: Record<string, DeviceState>;
  realTimeUpdates: boolean;
}

// State Persistence
localStorage.setItem('unified-app-state', JSON.stringify(state));
```

## Animation & Transitions

### Micro-Interactions
```css
/* Button Hover Effects */
.btn-primary {
  background: var(--accent-primary);
  color: var(--bg-primary);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 212, 170, 0.4);
}

/* Card Animations */
.workflow-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.workflow-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0, 212, 170, 0.2);
}

/* Panel Transitions */
.panel {
  transition: width 0.3s ease, transform 0.3s ease;
}

.panel.collapsing {
  transform: translateX(-100%);
}

/* Loading States */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.loading {
  animation: pulse 2s infinite;
}
```

## Implementation Priority

### Phase 1: Core Layout (Week 1)
1. Three-panel responsive layout
2. Project tab system
3. Basic workflow cards
4. Dark theme implementation

### Phase 2: Interactions (Week 2)
1. Real-time updates via WebSocket
2. Workflow execution interface
3. Device control panels
4. Chat interface integration

### Phase 3: Advanced Features (Week 3)
1. Widget embedding system
2. Mobile optimization
3. Accessibility features
4. Performance optimization

### Phase 4: Polish (Week 4)
1. Animation refinements
2. Error states
3. Loading states
4. Documentation

This specification ensures the unified interface matches the concept screenshots while providing a flexible foundation for both web application and widget deployment modes.