import React from 'react';
import { ExternalLink, Activity, Settings } from 'lucide-react';
import { EmbeddedApp } from '@/types';
import { useUnifiedAppStore } from '@/hooks/useAppStore';
import { cn } from '@/utils/cn';

interface AppGridProps {
  apps: EmbeddedApp[];
}

interface AppCardProps {
  app: EmbeddedApp;
}

function AppCard({ app }: AppCardProps) {
  const { setActiveApp, toggleDetailsPanel } = useUnifiedAppStore();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-status-success';
      case 'stopped': return 'text-text-muted';
      case 'error': return 'text-status-error';
      case 'maintenance': return 'text-status-warning';
      default: return 'text-text-muted';
    }
  };

  const handleCardClick = () => {
    setActiveApp(app.id);
    toggleDetailsPanel();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardClick();
    }
  };

  return (
    <article
      className="card group cursor-pointer focus-within:ring-2 focus-within:ring-accent-primary"
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Open ${app.name} application details`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-accent-primary/20 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-accent-primary" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary group-hover:text-accent-primary transition-colors">
              {app.name}
            </h3>
            <div
              className={cn(
                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2",
                getStatusColor(app.status)
              )}
              aria-label={`Status: ${app.status}`}
            >
              <div className={cn("w-2 h-2 rounded-full mr-2", getStatusColor(app.status))} aria-hidden="true" />
              {app.status}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-text-secondary text-sm mb-4 line-clamp-2">
        {app.description}
      </p>

      {/* Features */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-1" role="list" aria-label="Features">
          {app.features.slice(0, 3).map((feature, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-bg-secondary text-text-muted text-xs rounded-md"
              role="listitem"
            >
              {feature}
            </span>
          ))}
          {app.features.length > 3 && (
            <span className="px-2 py-1 bg-bg-secondary text-text-muted text-xs rounded-md" role="listitem">
              +{app.features.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-text-muted" aria-label={`Port: ${app.port}`}>
          Port: {app.port}
        </div>
        <div className="flex space-x-2" role="group" aria-label="Application actions">
          <a
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-text-secondary hover:text-accent-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary rounded"
            onClick={(e) => e.stopPropagation()}
            title="Open in new tab"
            aria-label={`Open ${app.name} in new tab`}
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
          <button
            className="p-2 text-text-secondary hover:text-accent-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary rounded"
            onClick={(e) => e.stopPropagation()}
            title="Settings"
            aria-label={`Open ${app.name} settings`}
          >
            <Settings className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

export function AppGrid({ apps }: AppGridProps) {
  if (apps.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted">
        <div className="text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
          <p>No applications found in this category</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" role="grid" aria-label="Applications grid">
      {apps.map((app) => (
        <AppCard key={app.id} app={app} />
      ))}
    </div>
  );
}