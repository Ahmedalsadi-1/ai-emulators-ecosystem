# Unified Embedded UI System - User Manual

## Table of Contents

- [Overview](#overview)
- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Getting Started](#getting-started)
- [Navigation Guide](#navigation-guide)
- [Application Categories](#application-categories)
- [Advanced Features](#advanced-features)
- [User Interface](#user-interface)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Troubleshooting](#troubleshooting)

## Overview

The Unified Embedded UI System is a comprehensive orchestration platform that provides a unified interface for managing and accessing multiple AI-powered applications and automation tools. Built with React and TypeScript, it features a three-panel layout that allows seamless integration and cross-communication between different specialized applications.

### Key Features

- **Unified Interface**: Single access point for multiple AI and automation applications
- **Embedded Applications**: Direct integration via iframes with cross-communication capabilities
- **Real-time Monitoring**: Live status updates and health monitoring
- **Workflow Orchestration**: Chain operations across multiple tools
- **Responsive Design**: Works on desktop and mobile devices
- **Keyboard Shortcuts**: Efficient navigation and control
- **Dark Theme**: Modern, eye-friendly interface
- **Multi-category Organization**: Applications organized by functionality

### Architecture

The system uses a three-panel layout:

1. **Navigation Sidebar**: Category-based navigation with application counts
2. **Main Content Area**: Embedded applications and specialized views
3. **Details Panel**: Application information, settings, and controls

## System Requirements

### Minimum Requirements

- **Operating System**: Linux, macOS, or Windows with Docker support
- **CPU**: 2-core processor (4+ cores recommended)
- **RAM**: 8GB minimum (16GB+ recommended)
- **Storage**: 20GB free space
- **Browser**: Modern browser with iframe support (Chrome 90+, Firefox 88+, Safari 14+)

### Recommended Requirements

- **CPU**: 4+ cores
- **RAM**: 32GB+
- **Storage**: 100GB+ SSD
- **GPU**: NVIDIA GPU (optional, for AI/ML applications)
- **Network**: Stable internet connection for cloud services

## Installation

### Quick Start with Docker (Recommended)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ai-ecosystem/future-app.git
   cd future-app
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   nano .env
   ```

3. **Start the unified UI**:
   ```bash
   docker-compose -f docker-compose.yml up -d unified-app
   ```

4. **Access the application**:
   - Open http://localhost:5173 in your browser
   - The unified UI will be available at the root path

### Manual Installation

1. **Install Node.js 18+**:
   ```bash
   # Using nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   nvm use 18
   ```

2. **Install dependencies**:
   ```bash
   cd unified-app
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your settings
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

### Production Build

```bash
# Build for production
npm run build

# Serve with nginx or any static file server
# The built files will be in the 'dist' directory
```

## Configuration

### Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Application Configuration
VITE_APP_TITLE="Unified AI Ecosystem"
VITE_APP_VERSION="1.0.0"
VITE_API_BASE_URL="http://localhost:8000"

# Theme Configuration
VITE_DEFAULT_THEME="dark"
VITE_ENABLE_THEME_SWITCHER="true"

# Feature Flags
VITE_ENABLE_REAL_TIME_UPDATES="true"
VITE_ENABLE_CROSS_COMMUNICATION="true"
VITE_ENABLE_WORKFLOW_CHAINING="true"

# Embedded Applications
VITE_APPS_CONFIG_PATH="/config/apps.json"
VITE_DEFAULT_APP_TIMEOUT="30000"
```

### Application Configuration

The system loads application configurations from the Zustand store. Applications are defined with:

```typescript
interface EmbeddedApp {
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
```

### Network Configuration

For production deployments, configure the following:

```nginx
# nginx.conf for reverse proxy
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API proxy for backend services
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Getting Started

### First Time Setup

1. **Launch the application** following the installation steps above
2. **Wait for initialization**: The system will load and display available applications
3. **Check application status**: Green indicators show running applications
4. **Navigate categories**: Use the sidebar to explore different application categories

### Initial Configuration

1. **Review settings**: Click the settings icon in the top header
2. **Configure preferences**: Set theme, notification preferences, and display options
3. **Check connectivity**: Ensure all embedded applications are accessible
4. **Test cross-communication**: Try workflow chaining features

### Basic Navigation

- **Sidebar**: Click category names to filter applications
- **Main Grid**: Click application cards to open details or launch
- **Details Panel**: View application information and controls
- **Top Header**: Access global settings and search

## Navigation Guide

### Sidebar Navigation

The left sidebar provides category-based navigation:

- **Automation**: Unified automation platform with Turix, OpenInterface, and Factif
- **AI Automation**: AI-powered automation tools and interfaces
- **Social Media**: Social media management and posting tools
- **Content Creation**: Content creation and media processing tools
- **Visual Automation**: No-code visual workflow automation
- **Monitoring**: Infrastructure monitoring and observability
- **Development**: Development and debugging tools
- **Communication**: Communication and collaboration tools
- **Infrastructure**: Infrastructure management and deployment
- **Workflows**: Vy workflows and AIOS agent orchestration
- **Desktop**: Desktop environments with VNC access

### Application Grid

Applications are displayed as cards with:

- **Status Indicator**: Color-coded status (green=running, red=error, gray=stopped)
- **Application Icon**: Visual representation of the application
- **Name and Description**: Basic information about the application
- **Features List**: Key capabilities (first 3 shown)
- **Action Buttons**: External link and settings access

### Details Panel

The right panel shows detailed information:

- **Application Status**: Current running state and health
- **Technical Details**: Port, technologies, and dependencies
- **Features List**: Complete list of capabilities
- **Quick Actions**: Launch, restart, configure options
- **Logs**: Recent activity and error messages

### Search and Filtering

- **Global Search**: Use the search bar in the top header
- **Category Filtering**: Click sidebar categories to filter
- **Status Filtering**: Filter by running, stopped, or error states
- **Technology Filtering**: Filter by technology stack

## Application Categories

### Automation Category

**Unified Automation Platform**
- Combines Turix cards, OpenInterface computer control, and Factif visual testing
- Features workflow chaining and cross-tool communication
- Supports real-time collaboration between automation tools

**Key Applications**:
- Turix Automation Cards: Modular automation services
- OpenInterface: LLM-driven computer control
- Factif AI: Advanced browser automation with visual testing

### AI Automation Category

**AI-Powered Automation Tools**
- ByteBot UI: Unified interface for AI automation and device management
- Factif AI: Advanced web automation and browser control
- Integration with major AI providers (OpenAI, Anthropic, etc.)

### Social Media Category

**Social Media Management**
- Postiz: Social media scheduling and content management
- Multi-platform posting capabilities
- Analytics and engagement tracking

### Content Creation Category

**Media Processing and Creation**
- Wan2GP Video Generation: AI-powered video creation from text/images
- OnlySnarf: Content management and automation tools
- Reels Clips Automator: Instagram Reels and video clip automation

### Visual Automation Category

**No-Code Visual Workflows**
- Drag-and-drop workflow builder
- Element detection and screenshot automation
- Visual programming interface

### Monitoring Category

**Infrastructure Observability**
- Grafana dashboards for metrics visualization
- Prometheus integration for comprehensive monitoring
- Alert management and notification systems

### Desktop Category

**Virtual Desktop Environments**
- ByteBot VNC Desktop: Remote device management
- GBox Sandbox Environment: Isolated testing environments
- WebRTC streaming and control automation

### Infrastructure Category

**System Management**
- Docker Ecosystem Management: Container orchestration
- Grafana Monitoring: System metrics and performance
- Centralized logging and health checks

## Advanced Features

### Workflow Chaining

1. **Access Automation Page**: Navigate to Automation category
2. **Select Tools**: Choose applications to chain together
3. **Configure Workflow**: Set up data flow between applications
4. **Execute Chain**: Run the complete workflow sequence
5. **Monitor Progress**: Track execution in real-time

### Cross-Application Communication

- **Iframe Bridges**: Secure communication between embedded applications
- **Shared State**: Synchronized data across applications
- **Event System**: Real-time updates and notifications
- **API Integration**: RESTful and WebSocket communication

### Real-Time Monitoring

- **Health Checks**: Automatic status monitoring
- **Performance Metrics**: Resource usage and response times
- **Error Tracking**: Centralized error logging and alerting
- **Status Updates**: Live status indicators and notifications

### Keyboard Shortcuts

- `Ctrl+B`: Toggle sidebar
- `Ctrl+D`: Toggle details panel
- `Ctrl+K`: Focus search bar
- `Escape`: Close details panel
- `Ctrl+R`: Refresh current view
- `Ctrl+,`: Open settings

## User Interface

### Layout Components

#### Top Header
- **Logo/Title**: Application branding
- **Search Bar**: Global application search
- **User Menu**: Profile and settings access
- **Notification Center**: System alerts and updates
- **Theme Toggle**: Light/dark mode switching

#### Navigation Sidebar
- **Category List**: Expandable category navigation
- **Application Counts**: Number of apps per category
- **Collapse/Expand**: Toggle sidebar visibility
- **Status Indicators**: Category-wide status overview

#### Main Content Area
- **Application Grid**: Card-based application display
- **Empty States**: Helpful messages when no apps match filters
- **Loading States**: Progress indicators during data fetching
- **Error States**: User-friendly error messages

#### Details Panel
- **Application Info**: Detailed application information
- **Status Controls**: Start/stop/restart functionality
- **Configuration**: Application-specific settings
- **Logs**: Recent activity and error logs

### Responsive Design

#### Desktop Layout (>1024px)
- Full three-panel layout
- All panels visible simultaneously
- Optimized for mouse and keyboard interaction

#### Tablet Layout (768px-1023px)
- Collapsible panels
- Adjusted panel widths
- Touch-friendly interactions

#### Mobile Layout (<768px)
- Single panel view with overlays
- Swipe gestures for navigation
- Simplified interface elements

### Theme System

#### Dark Theme (Default)
- Background: `#1a1a1a`
- Secondary: `#2a2a2a`
- Accent: `#00d4aa`
- Text: `#ffffff`

#### Light Theme
- Background: `#ffffff`
- Secondary: `#f5f5f5`
- Accent: `#00b896`
- Text: `#1a1a1a`

## Keyboard Shortcuts

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+B` | Toggle Sidebar | Show/hide navigation sidebar |
| `Ctrl+D` | Toggle Details | Show/hide details panel |
| `Ctrl+K` | Focus Search | Focus search input |
| `Escape` | Close Panel | Close details panel |
| `Ctrl+R` | Refresh | Refresh current view |
| `Ctrl+,` | Settings | Open settings dialog |
| `Ctrl+F` | Full Screen | Toggle full screen mode |
| `Ctrl+H` | Help | Show keyboard shortcuts |

## Troubleshooting

### Common Issues

#### Application Won't Load
- **Check network connectivity**: Ensure the application URL is accessible
- **Verify port availability**: Check if the port is in use by another service
- **Review CORS settings**: Ensure proper cross-origin resource sharing
- **Check browser console**: Look for JavaScript errors or network issues

#### Sidebar Not Responding
- **Refresh the page**: Clear any temporary state issues
- **Check browser compatibility**: Ensure using a supported browser
- **Clear browser cache**: Remove cached JavaScript and CSS files
- **Check JavaScript errors**: Review console for runtime errors

#### Details Panel Empty
- **Select an application**: Click on an application card first
- **Check application status**: Ensure the application is running
- **Refresh application data**: Use Ctrl+R to reload data
- **Check permissions**: Verify access to application details

#### Search Not Working
- **Clear search filters**: Reset all active filters
- **Check search syntax**: Use simple keywords without special characters
- **Refresh search index**: Reload the page to rebuild search data
- **Check network**: Ensure API endpoints are responding

### Performance Issues

#### Slow Loading
- **Check network speed**: Verify internet connection quality
- **Reduce concurrent applications**: Close unused application iframes
- **Enable caching**: Configure browser caching for static assets
- **Update browser**: Use latest browser version

#### High Memory Usage
- **Close unused applications**: Reduce number of open iframes
- **Clear browser cache**: Remove accumulated cached data
- **Restart browser**: Clear memory leaks from long sessions
- **Check system resources**: Monitor CPU and memory usage

#### Freezing or Crashing
- **Check browser compatibility**: Ensure supported browser version
- **Disable extensions**: Temporarily disable browser extensions
- **Update graphics drivers**: Ensure latest GPU drivers
- **Check system requirements**: Verify hardware meets minimum specs

### Network Issues

#### Connection Refused
- **Check service status**: Verify backend services are running
- **Review firewall settings**: Ensure ports are open
- **Check proxy configuration**: Verify proxy settings if applicable
- **Test direct access**: Try accessing services directly via URL

#### CORS Errors
- **Configure CORS headers**: Set appropriate cross-origin policies
- **Use HTTPS**: Enable SSL/TLS for secure communication
- **Check domain whitelist**: Add allowed domains to CORS configuration
- **Test with different browser**: Verify browser-specific issues

#### Timeout Errors
- **Increase timeout values**: Adjust timeout settings in configuration
- **Check network latency**: Monitor connection quality
- **Optimize requests**: Reduce payload sizes and frequency
- **Implement retry logic**: Add automatic retry for failed requests

### Getting Help

1. **Check documentation**: Review this user manual thoroughly
2. **Search issues**: Look for similar problems in project repositories
3. **Collect logs**: Gather browser console logs and error messages
4. **Contact support**: Reach out to the development team with detailed information

---

For more advanced configuration options and developer documentation, see the [Technical Documentation](./TECHNICAL.md).