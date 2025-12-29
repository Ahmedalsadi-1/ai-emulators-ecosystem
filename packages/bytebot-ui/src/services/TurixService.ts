import { EventEmitter } from 'events';

export type TurixHealthStatus = 'connected' | 'offline' | 'unknown' | 'checking';

interface TurixHealthResponse {
  status: 'ok' | 'error';
  message?: string;
  timestamp: string;
}

class TurixServiceSingleton extends EventEmitter {
  private apiUrl: string =
    process.env.NEXT_PUBLIC_TURIX_API_URL || 'http://localhost:3000';
  private healthStatus: TurixHealthStatus = 'unknown';
  private lastChecked: Date | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private isChecking = false;

  constructor() {
    super();
    this.loadFromStorage();
    // Don't start periodic checks automatically - let the consumer control this
  }

  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('turix:apiUrl');
      if (stored) {
        this.apiUrl = stored;
      }
    }
  }

  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('turix:apiUrl', this.apiUrl);
    }
  }

  private startPeriodicChecks(intervalMs: number = 12000): void {
    this.stopPeriodicChecks(); // Clear any existing interval
    // Check health every specified interval
    this.checkInterval = setInterval(() => {
      this.checkHealth();
    }, intervalMs);
  }

  private stopPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Public methods for manual control
  startHealthChecks(intervalMs: number = 12000): void {
    this.startPeriodicChecks(intervalMs);
  }

  stopHealthChecks(): void {
    this.stopPeriodicChecks();
  }

  getApiUrl(): string {
    return this.apiUrl;
  }

  setApiUrl(url: string): void {
    this.apiUrl = url;
    this.saveToStorage();
    this.emit('apiUrlChanged', url);
  }

  getHealthStatus(): TurixHealthStatus {
    return this.healthStatus;
  }

  getLastChecked(): Date | null {
    return this.lastChecked;
  }

  async checkHealth(): Promise<{ status: TurixHealthStatus; message?: string }> {
    if (this.isChecking) {
      return { status: this.healthStatus };
    }

    this.isChecking = true;
    // Emit checking status
    this.emit('healthStatusChanged', { status: 'checking', message: 'Checking connection...' });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${this.apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data: TurixHealthResponse = await response.json();
        if (data.status === 'ok') {
          this.healthStatus = 'connected';
          this.lastChecked = new Date();
          this.emit('healthStatusChanged', { status: 'connected', message: 'Connected to Turix' });
          return { status: 'connected', message: 'Connected to Turix' };
        } else {
          this.healthStatus = 'offline';
          this.lastChecked = new Date();
          this.emit('healthStatusChanged', { status: 'offline', message: data.message || 'Service error' });
          return { status: 'offline', message: data.message || 'Service error' };
        }
      } else {
        this.healthStatus = 'offline';
        this.lastChecked = new Date();
        this.emit('healthStatusChanged', { status: 'offline', message: `HTTP ${response.status}` });
        return { status: 'offline', message: `HTTP ${response.status}` };
      }
    } catch (error: any) {
      this.healthStatus = 'offline';
      this.lastChecked = new Date();

      let message = 'Connection failed';
      if (error.name === 'AbortError') {
        message = 'Request timeout';
      } else if (error.message) {
        message = error.message;
      }

      this.emit('healthStatusChanged', { status: 'offline', message });
      return { status: 'offline', message };
    } finally {
      this.isChecking = false;
    }
  }

  async manualHealthCheck(): Promise<{ status: TurixHealthStatus; message?: string }> {
    return this.checkHealth();
  }

  subscribe(callback: (result: { status: TurixHealthStatus; message?: string; timestamp: Date | null }) => void): () => void {
    const handler = (data: { status: TurixHealthStatus; message?: string }) => {
      callback({
        status: data.status,
        message: data.message,
        timestamp: this.lastChecked || null,
      });
    };

    this.on('healthStatusChanged', handler);

    // Return unsubscribe function
    return () => {
      this.off('healthStatusChanged', handler);
    };
  }

  destroy(): void {
    this.stopPeriodicChecks();
    this.removeAllListeners();
  }
}

// Export singleton instance
export const turixService = new TurixServiceSingleton();
