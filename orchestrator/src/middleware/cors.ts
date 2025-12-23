// orchestrator/src/middleware/cors.ts
import { Request, Response, NextFunction } from 'express';
import { EmbeddedApp } from '../types/iframe';

export class CORSMiddleware {
  private embeddedApps: Map<string, EmbeddedApp>;

  constructor(embeddedApps: EmbeddedApp[]) {
    this.embeddedApps = new Map(embeddedApps.map(app => [app.id, app]));
  }

  /**
   * Configure CORS for embedded applications
   */
  configureCORS(app: any): void {
    // Parent application CORS (unified UI)
    app.use('/api/v1/iframe', this.createIframeCORS());

    // Embedded application specific CORS
    for (const embeddedApp of this.embeddedApps.values()) {
      this.configureAppCORS(app, embeddedApp);
    }
  }

  /**
   * CORS middleware for iframe communication endpoints
   */
  private createIframeCORS() {
    return (req: Request, res: Response, next: NextFunction) => {
      const origin = req.headers.origin as string;

      // Allow all embedded app origins
      const allowedOrigins = Array.from(this.embeddedApps.values())
        .flatMap(app => app.allowedOrigins);

      if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers',
          'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Session-ID, X-App-ID');
        res.header('Access-Control-Max-Age', '86400'); // 24 hours

        // Handle preflight requests
        if (req.method === 'OPTIONS') {
          res.sendStatus(200);
          return;
        }
      }

      next();
    };
  }

  /**
   * Configure CORS for specific embedded application
   */
  private configureAppCORS(app: any, embeddedApp: EmbeddedApp): void {
    const appPath = `/api/v1/apps/${embeddedApp.id}`;

    app.use(appPath, (req: Request, res: Response, next: NextFunction) => {
      const origin = req.headers.origin as string;

      // Check if origin is allowed for this app
      if (embeddedApp.allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers',
          'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-App-ID, X-Message-ID');

        // Add security headers
        res.header('X-Frame-Options', 'ALLOWALL'); // Required for iframe embedding
        res.header('Content-Security-Policy',
          this.generateCSPHeader(embeddedApp, origin));

        // Handle preflight requests
        if (req.method === 'OPTIONS') {
          res.sendStatus(200);
          return;
        }
      } else {
        // Deny access from unauthorized origins
        res.status(403).json({
          error: 'CORS policy violation',
          message: `Origin ${origin} not allowed for app ${embeddedApp.id}`
        });
        return;
      }

      next();
    });
  }

  /**
   * Generate Content Security Policy header for embedded app
   */
  private generateCSPHeader(app: EmbeddedApp, origin: string): string {
    const directives = [
      `default-src 'self'`,
      `script-src 'self' 'unsafe-inline' https://trusted-cdn.com`,
      `style-src 'self' 'unsafe-inline'`,
      `img-src 'self' data: https:`,
      `font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com`,
      `connect-src 'self' ${origin} wss://${origin.replace('http://', '').replace('https://', '')}`,
      `frame-ancestors ${this.getParentOrigins().join(' ')}`,
      `object-src 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`
    ];

    // Add custom CSP directives if specified
    if (app.cspDirectives) {
      Object.entries(app.cspDirectives).forEach(([directive, values]) => {
        directives.push(`${directive} ${values.join(' ')}`);
      });
    }

    return directives.join('; ');
  }

  /**
   * Get allowed parent origins (typically the unified UI)
   */
  private getParentOrigins(): string[] {
    // In production, this should be configurable
    return [
      'http://localhost:9992',
      'https://future-app.com',
      'https://app.future-app.com'
    ];
  }

  /**
   * Validate CORS for postMessage communications
   */
  validatePostMessageOrigin(appId: string, origin: string): boolean {
    const app = this.embeddedApps.get(appId);
    return app ? app.allowedOrigins.includes(origin) : false;
  }

  /**
   * Get CORS configuration for an app
   */
  getAppCORSConfig(appId: string): { allowedOrigins: string[]; methods: string[]; headers: string[] } | null {
    const app = this.embeddedApps.get(appId);
    if (!app) return null;

    return {
      allowedOrigins: app.allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      headers: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-App-ID',
        'X-Message-ID',
        'X-Session-ID'
      ]
    };
  }
}