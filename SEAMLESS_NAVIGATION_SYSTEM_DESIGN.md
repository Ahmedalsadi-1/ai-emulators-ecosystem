# Seamless Navigation System Design

## Overview

This document outlines a comprehensive navigation system for the unified project ecosystem, enabling seamless context preservation, state synchronization, and unified search/command interface across all project panels.

## Architecture Overview

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    FACTIF-AI ORCHESTRATOR                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ NavigationMgr   │  │  StateSyncMgr   │  │ Search&Cmd  │ │
│  │                 │  │                 │  │  Engine     │ │
│  │ • Panel Reg     │  │ • CRDT Sync     │  │ • Indexing  │ │
│  │ • Context Pres  │  │ • Conflict Res  │  │ • Commands  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────┬─────────────────┬─────────────────┬─────┘
                  │                 │                 │
                  ▼                 ▼                 ▼
┌─────────────────┼─────────────────┼─────────────────┼─────┐
│         UNIFIED UI FRAMEWORK (bytebot-ui)                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │
│  │  PanelTabs  │ │  Omnibar    │ │ Navigation │         │
│  │             │ │             │ │  Sidebar   │         │
│  │ • Switching │ │ • Search    │ │ • Context  │         │
│  │ • State     │ │ • Commands  │ │ • Breadcrumbs│        │
│  └─────────────┘ └─────────────┘ └─────────────┘         │
└─────────────────┬─────────────────┬─────────────────┬─────┘
                  │                 │                 │
                  ▼                 ▼                 ▼
┌─────────────────┼─────────────────┼─────────────────┼─────┐
│              PROJECT PANELS                             │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐        │
│  │AIOS │ │BYTE │ │FACTIF│ │POST │ │REEL │ │WAN2 │        │
│  │     │ │ BOT │ │ AI   │ │ IZ  │ │CLIP │ │ GP  │        │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘        │
└───────────────────────────────────────────────────────────┘
```

## Core Interfaces

### NavigationContext
```typescript
interface NavigationContext {
  activePanel: string;
  panelStates: Record<string, PanelState>;
  globalSearch: SearchState;
  breadcrumbs: Breadcrumb[];
  commandHistory: Command[];
  crossPanelData: Record<string, any>;
}
```

### PanelState
```typescript
interface PanelState {
  id: string;
  name: string;
  type: 'project' | 'service' | 'device' | 'workflow';
  url: string;
  context: any;
  lastAccessed: Date;
  isActive: boolean;
  syncEnabled: boolean;
}
```

### SearchState
```typescript
interface SearchState {
  query: string;
  results: SearchResult[];
  scope: 'global' | 'panel' | 'project';
  filters: SearchFilter[];
}
```

## Navigation Manager

The NavigationManager is the central orchestrator that manages:

### Key Methods
- `registerPanel(panel: PanelConfig): void`
- `switchToPanel(panelId: string, preserveContext: boolean): Promise<void>`
- `search(query: string, scope: SearchScope): Promise<SearchResult[]>`
- `executeCommand(command: string, panelId?: string): Promise<CommandResult>`
- `syncState(panelId: string, state: any): void`
- `getBreadcrumbs(): Breadcrumb[]`
- `communicateWithPanel(sourcePanel: string, targetPanel: string, message: any): void`

### Context Preservation Levels
```typescript
enum ContextLevel {
  MINIMAL = 'minimal',    // Basic navigation state
  STANDARD = 'standard',  // Include selections and filters
  FULL = 'full',          // Complete state including forms
  CUSTOM = 'custom'       // Panel-specific context
}
```

## Panel Switching Mechanism

### Process Flow
1. **Initiation**: User clicks tab, uses keyboard shortcut, or executes command
2. **Context Capture**: Current panel's context is serialized and stored
3. **Persistence**: Context saved to localStorage and server-side storage
4. **Activation**: New panel becomes active
5. **Context Restoration**: Previous context restored if applicable
6. **Synchronization**: State sync begins between panels
7. **UI Update**: Smooth transition with loading states

### Context Preservation Scope
- Current route/page within panel
- Form data, selections, filters
- Scroll positions and UI state
- User preferences and settings
- Temporary state (notifications, modals)
- Panel-specific custom context

## State Synchronization

### Synchronization Architecture
```
Real-time Sync (WebSocket)
├── panel.state.updated
├── panel.context.changed
├── global.search.updated
└── navigation.switched

CRDT-based Conflict Resolution
├── Vector clocks for each panel
├── Timestamp-based conflict resolution
├── Automatic merge strategies
└── Manual conflict resolution UI

Selective Synchronization
├── Global state → All panels
├── Panel-specific state → Local only
├── Shared resources → Relevant panels
└── User preferences → All panels
```

### Sync Modes
- **Real-time**: Immediate sync via WebSocket events
- **Batched**: Periodic bulk updates for efficiency
- **On-demand**: Sync when panel becomes active
- **Lazy**: Sync only when data is accessed

## Unified Search & Command Interface

### Omnibar Design
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Search or type a command...                           ⌘K │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ /switch ai          Switch to AIOS panel                     │
│ /run workflow       Execute workflow                        │
│ /start device       Start device in AIOS                    │
├─────────────────────────────────────────────────────────────┤
│ 📁 Projects                                                     │
│   AIOS Kernel              ⌘1                                 │
│   ByteBot Agent            ⌘2                                 │
│   Factif AI Browser        ⌘3                                 │
├─────────────────────────────────────────────────────────────┤
│ 🔍 Search Results                                              │
│   Workflow: "User Automation" in ByteBot                      │
│   Device: "iPhone 13" in AIOS                                  │
│   Service: "Post Scheduler" in Postiz                         │
└─────────────────────────────────────────────────────────────┘
```

### Command System
```typescript
interface Command {
  id: string;
  command: string;
  timestamp: Date;
  panel: string;
  result?: any;
}

// Slash Commands
/switch <panel>     // Switch to panel
/run <workflow>     // Execute workflow
/start <device>     // Start device
/search <query>     // Global search
/help               // Show help

// Natural Language Commands (LLM-processed)
/"show me all running workflows"
/"start the iPhone simulator"
/"find posts scheduled for tomorrow"
```

### Search Capabilities
- **Global Search**: Across all panels and projects
- **Panel-scoped**: Search within current panel
- **Project-scoped**: Search within specific project
- **Type Filtering**: Workflows, devices, services, files
- **Fuzzy Matching**: Typo-tolerant search
- **Real-time Results**: Streaming search results
- **Recent & Favorites**: Quick access to frequent searches

## Cross-Panel Communication

### Communication Patterns
```typescript
interface PanelMessage {
  id: string;
  sourcePanel: string;
  targetPanel: string | 'broadcast';
  type: 'request' | 'response' | 'event' | 'data';
  payload: any;
  timestamp: Date;
}

// Message Types
enum MessageType {
  WORKFLOW_STARTED = 'workflow.started',
  DEVICE_ALLOCATED = 'device.allocated',
  SEARCH_RESULTS = 'search.results',
  CONTEXT_SHARED = 'context.shared',
  NOTIFICATION = 'notification'
}
```

### Shared Resource Coordination
- **Device Allocation**: AIOS panel allocates devices to bytebot workflows
- **Workflow Handoffs**: Seamless transitions between panel workflows
- **Data Pipelines**: Streaming data between panels
- **Notification Forwarding**: Unified notification system

### Security Model
- **Panel Permissions**: Access control between panels
- **Message Validation**: Sanitization and validation
- **Rate Limiting**: Prevent abuse
- **Audit Logging**: Complete communication history

## UI Components

### PanelTabs Component
```typescript
interface PanelTabsProps {
  panels: PanelState[];
  activePanel: string;
  onSwitch: (panelId: string) => void;
  onClose: (panelId: string) => void;
}

// Features
- Drag to reorder tabs
- Status indicators (active, loading, error)
- Close buttons for temporary panels
- Right-click context menu
- Keyboard navigation (1-9 shortcuts)
```

### Omnibar Component
```typescript
interface OmnibarProps {
  isOpen: boolean;
  onClose: () => void;
  onExecute: (command: string) => void;
}

// Features
- Global keyboard shortcut (⌘K)
- Type-ahead suggestions
- Command mode vs search mode
- Scope selector (global/panel/project)
- Recent commands history
```

### NavigationSidebar Enhancement
```typescript
interface NavigationSidebarProps {
  panels: PanelState[];
  recentItems: RecentItem[];
  favorites: FavoriteItem[];
  onNavigate: (target: NavigationTarget) => void;
}

// Features
- Panel shortcuts section
- Quick actions (new workflow, start device)
- Recent items across all panels
- Favorites/bookmarks system
- Search history integration
```

## Keyboard Shortcuts

### Global Shortcuts
```
⌘K / Ctrl+K    Activate omnibar
⌘1-9           Switch to panel by number
⌘⇧[ / ⌘⇧]     Previous/next panel
⌘W             Close current panel
⌘R             Refresh current panel
⌘F             Focus search in current panel
Escape          Close modals, clear search
```

### Panel-Specific Shortcuts
- Each panel can register custom shortcuts
- Context-aware suggestions
- Conflict resolution system
- User-customizable mappings

## Backend Architecture

### NavigationService (Factif-AI)
```typescript
class NavigationService {
  private panelRegistry: Map<string, PanelConfig>;
  private contextStorage: ContextStorage;
  private stateSyncManager: StateSyncManager;
  private searchEngine: SearchEngine;

  async registerPanel(config: PanelConfig): Promise<void>
  async switchPanel(panelId: string, preserveContext: boolean): Promise<void>
  async search(query: string, scope: SearchScope): Promise<SearchResult[]>
  async executeCommand(command: string): Promise<CommandResult>
}
```

### WebSocket Events
```typescript
enum NavigationEvent {
  PANEL_SWITCHED = 'navigation.panel.switched',
  CONTEXT_PRESERVED = 'navigation.context.preserved',
  STATE_SYNCED = 'navigation.state.synced',
  SEARCH_RESULTS = 'navigation.search.results',
  COMMAND_EXECUTED = 'navigation.command.executed'
}
```

### Storage Architecture
```
Context Storage
├── Redis (fast access, caching)
├── PostgreSQL (persistent storage)
└── File System (large contexts)

Search Index
├── Elasticsearch (full-text search)
├── Redis (autocomplete, suggestions)
└── In-memory cache (recent results)
```

## Integration Strategy

### Panel Adapter Interface
```typescript
interface PanelAdapter {
  id: string;
  name: string;
  type: PanelType;

  // Context management
  serializeContext(): Promise<any>;
  restoreContext(context: any): Promise<void>;

  // Search integration
  getSearchableContent(): Promise<SearchableItem[]>;

  // Command handling
  handleCommand(command: string): Promise<CommandResult>;

  // State sync
  getSyncState(): any;
  applySyncState(state: any): void;
}
```

### Integration Phases
1. **Core Projects**: Factif-AI, bytebot, AIOS (full integration)
2. **Major Projects**: postiz-app, factif-ai frontend (standard integration)
3. **Utility Projects**: All others (minimal adapter)

### Backward Compatibility
- Existing panels continue to work
- Navigation features are opt-in
- Graceful degradation when features unavailable
- Migration path for legacy panels

## Error Handling & Recovery

### Error Scenarios
- **Panel Loading Failures**: Fallback UI, retry mechanisms
- **Context Corruption**: Validation, repair, backup recovery
- **Sync Conflicts**: Manual resolution UI, automatic strategies
- **Network Issues**: Offline mode, queued operations
- **Performance Degradation**: Lazy loading, throttling

### Recovery Mechanisms
```typescript
interface ErrorRecovery {
  retryWithBackoff(operation: () => Promise<any>): Promise<any>;
  fallbackToCached(panelId: string): Promise<void>;
  validateAndRepair(context: any): Promise<any>;
  notifyUser(error: NavigationError): void;
}
```

## Testing Strategy

### Test Coverage
- **Unit Tests**: Core logic, algorithms, utilities
- **Integration Tests**: Panel switching, state sync, cross-panel communication
- **E2E Tests**: Complete user workflows, error scenarios
- **Performance Tests**: Load testing, memory usage, response times

### Monitoring & Observability
```typescript
interface NavigationMetrics {
  panelSwitchLatency: number;
  contextSaveTime: number;
  searchResponseTime: number;
  syncThroughput: number;
  errorRate: number;
  userEngagement: number;
}
```

## Implementation Timeline

### Phase 1: Core Infrastructure (Weeks 1-2)
- NavigationManager service in Factif-AI
- NavigationContext and panel registry
- Basic panel switching
- WebSocket event infrastructure

### Phase 2: Context Preservation (Weeks 3-4)
- ContextPreservationService
- Context serialization/deserialization
- Panel state persistence
- Context restoration testing

### Phase 3: State Synchronization (Weeks 5-6)
- StateSyncManager with CRDT
- Real-time sync via WebSocket
- Conflict resolution UI
- Multi-panel consistency testing

### Phase 4: Search & Command (Weeks 7-8)
- Omnibar component
- Search backend with indexing
- Command processing system
- Search UI and keyboard navigation

### Phase 5: Cross-Panel Communication (Weeks 9-10)
- Message passing system
- Shared resource coordination
- Communication security
- Multi-panel workflow testing

### Phase 6: Polish & Integration (Weeks 11-12)
- Keyboard shortcuts and accessibility
- Project integration completion
- Performance optimization
- Comprehensive testing and documentation

## Security Considerations

### Access Control
- Panel-to-panel permission matrix
- User authentication integration
- Command execution authorization
- Context data sanitization

### Data Protection
- Context encryption at rest
- Secure WebSocket communication
- Audit logging for all operations
- Data retention policies

### Threat Mitigation
- Rate limiting for search/commands
- Input validation and sanitization
- XSS prevention in search results
- CSRF protection for panel operations

## Performance Optimizations

### Lazy Loading
- Panels loaded on demand
- Context restoration in background
- Search results pagination
- Memory management for inactive panels

### Caching Strategy
- Context cache in Redis
- Search result caching
- Static asset caching
- CDN integration for UI components

### Optimization Techniques
- Debounced search queries
- Batched state updates
- Virtual scrolling for large lists
- Code splitting for panel components

This navigation system provides a seamless, efficient, and powerful way to navigate across the complex multi-project ecosystem while maintaining context and enabling powerful cross-panel workflows.</content>
<parameter name="filePath">SEAMLESS_NAVIGATION_SYSTEM_DESIGN.md