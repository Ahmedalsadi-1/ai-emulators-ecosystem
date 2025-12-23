import { useParams } from 'react-router-dom';
import { useUnifiedAppStore } from '@/hooks/useAppStore';

export function AppViewer() {
  const { appId } = useParams<{ appId: string }>();
  const { apps } = useUnifiedAppStore();

  const app = apps.find(a => a.id === appId);

  if (!app) {
    return (
      <div className="h-full flex items-center justify-center text-text-muted">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">App Not Found</h2>
          <p>The requested application could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* App Header */}
      <div className="p-4 border-b border-border bg-bg-secondary">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">{app.name}</h1>
            <p className="text-text-secondary text-sm">{app.description}</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-text-muted">
              Port: {app.port}
            </span>
            <div className={`w-3 h-3 rounded-full ${
              app.status === 'running' ? 'bg-status-success' :
              app.status === 'error' ? 'bg-status-error' :
              'bg-text-muted'
            }`} />
          </div>
        </div>
      </div>

      {/* Embedded App */}
      <div className="flex-1 relative">
        <iframe
          src={app.url}
          className="w-full h-full border-0"
          title={`${app.name} - ${app.description}`}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
    </div>
  );
}