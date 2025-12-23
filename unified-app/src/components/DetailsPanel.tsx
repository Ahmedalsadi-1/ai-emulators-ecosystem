import { X, ExternalLink, Activity, Settings } from 'lucide-react';
import { useUnifiedAppStore } from '@/hooks/useAppStore';
import { cn } from '@/utils/cn';

export function DetailsPanel() {
  const { toggleDetailsPanel, getActiveApp } = useUnifiedAppStore();
  const app = getActiveApp();

  if (!app) {
    return (
      <div className="h-full flex items-center justify-center text-text-muted">
        <div className="text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select an app to view details</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-status-success';
      case 'stopped': return 'text-text-muted';
      case 'error': return 'text-status-error';
      case 'maintenance': return 'text-status-warning';
      default: return 'text-text-muted';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'running': return 'bg-status-success/20';
      case 'stopped': return 'bg-text-muted/20';
      case 'error': return 'bg-status-error/20';
      case 'maintenance': return 'bg-status-warning/20';
      default: return 'bg-text-muted/20';
    }
  };

  return (
    <div className="h-full flex flex-col bg-bg-secondary">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">App Details</h2>
        <button
          onClick={toggleDetailsPanel}
          className="p-1 rounded-md hover:bg-bg-card transition-colors"
          aria-label="Close details panel"
        >
          <X className="w-5 h-5 text-text-secondary" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-text-primary">{app.name}</h3>
            <div className={cn(
              "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2",
              getStatusBg(app.status)
            )}>
              <div className={cn("w-2 h-2 rounded-full mr-2", getStatusColor(app.status))} />
              {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
            </div>
          </div>

          <p className="text-text-secondary">{app.description}</p>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h4 className="font-medium text-text-primary">Quick Actions</h4>
          <div className="space-y-2">
            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center px-4 py-2 bg-accent-primary text-bg-primary rounded-md hover:bg-accent-hover transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open App
            </a>
            <button className="w-full flex items-center justify-center px-4 py-2 border border-border text-text-primary rounded-md hover:bg-bg-card transition-colors">
              <Settings className="w-4 h-4 mr-2" />
              Configure
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-3">
          <h4 className="font-medium text-text-primary">Features</h4>
          <div className="space-y-2">
            {app.features.map((feature, index) => (
              <div key={index} className="flex items-center text-sm text-text-secondary">
                <div className="w-1.5 h-1.5 bg-accent-primary rounded-full mr-3 flex-shrink-0" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Technologies */}
        <div className="space-y-3">
          <h4 className="font-medium text-text-primary">Technologies</h4>
          <div className="flex flex-wrap gap-2">
            {app.technologies.map((tech, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-bg-card text-text-secondary text-xs rounded-md border border-border"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Connection Info */}
        <div className="space-y-3">
          <h4 className="font-medium text-text-primary">Connection</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">URL:</span>
              <span className="text-text-primary font-mono">{app.url}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Port:</span>
              <span className="text-text-primary font-mono">{app.port}</span>
            </div>
            {app.healthEndpoint && (
              <div className="flex justify-between">
                <span className="text-text-secondary">Health Check:</span>
                <span className="text-text-primary font-mono">{app.healthEndpoint}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}