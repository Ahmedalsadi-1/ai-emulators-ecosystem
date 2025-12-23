/**
 * Origin Validator
 * Handles origin validation for secure postMessage communication
 */

export class OriginValidator {
  private allowedOrigins: string[];
  private trustedDomains: Set<string> = new Set();

  constructor(allowedOrigins: string[]) {
    this.allowedOrigins = allowedOrigins;
    this.updateTrustedDomains();
  }

  /**
   * Validate if an origin is allowed
   */
  validateOrigin(origin: string): boolean {
    try {
      // Exact match check
      if (this.allowedOrigins.includes(origin)) {
        return true;
      }

      // Domain pattern matching
      const originUrl = new URL(origin);
      const domain = originUrl.hostname;

      // Check trusted domains
      if (this.trustedDomains.has(domain)) {
        return true;
      }

      // Check wildcard patterns
      for (const allowedOrigin of this.allowedOrigins) {
        if (this.matchesPattern(origin, allowedOrigin)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      // Invalid URL format
      console.warn('Invalid origin format:', origin, error);
      return false;
    }
  }

  /**
   * Check if origin matches a pattern (supports wildcards)
   */
  private matchesPattern(origin: string, pattern: string): boolean {
    try {
      // Handle exact matches
      if (pattern === origin) {
        return true;
      }

      // Handle wildcard patterns like *.example.com
      if (pattern.startsWith('*.')) {
        const baseDomain = pattern.slice(2);
        const originUrl = new URL(origin);
        const hostname = originUrl.hostname;

        // Check if hostname ends with the base domain
        return hostname === baseDomain || hostname.endsWith('.' + baseDomain);
      }

      // Handle protocol wildcards like https://*
      if (pattern.endsWith('://*')) {
        const protocol = pattern.split('://')[0];
        const originUrl = new URL(origin);
        return originUrl.protocol === protocol + ':';
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Add an origin to the allowed list
   */
  addAllowedOrigin(origin: string): void {
    if (!this.allowedOrigins.includes(origin)) {
      this.allowedOrigins.push(origin);
      this.updateTrustedDomains();
    }
  }

  /**
   * Remove an origin from the allowed list
   */
  removeAllowedOrigin(origin: string): void {
    const index = this.allowedOrigins.indexOf(origin);
    if (index > -1) {
      this.allowedOrigins.splice(index, 1);
      this.updateTrustedDomains();
    }
  }

  /**
   * Get all allowed origins
   */
  getAllowedOrigins(): string[] {
    return [...this.allowedOrigins];
  }

  /**
   * Update the allowed origins list
   */
  updateAllowedOrigins(origins: string[]): void {
    this.allowedOrigins = [...origins];
    this.updateTrustedDomains();
  }

  /**
   * Update trusted domains cache
   */
  private updateTrustedDomains(): void {
    this.trustedDomains.clear();

    for (const origin of this.allowedOrigins) {
      try {
        const url = new URL(origin);
        this.trustedDomains.add(url.hostname);
      } catch {
        // Skip invalid origins
        continue;
      }
    }
  }

  /**
   * Check if a domain is trusted
   */
  isTrustedDomain(domain: string): boolean {
    return this.trustedDomains.has(domain);
  }

  /**
   * Validate origin for development (more permissive)
   */
  validateOriginDevelopment(origin: string): boolean {
    try {
      const url = new URL(origin);

      // Allow localhost and common development domains
      const devDomains = [
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        '::1'
      ];

      if (devDomains.includes(url.hostname)) {
        return true;
      }

      // Allow common development ports
      const devPorts = ['3000', '3001', '3002', '8080', '8081', '4000', '5000'];
      if (devPorts.includes(url.port)) {
        return true;
      }

      // Fall back to normal validation
      return this.validateOrigin(origin);
    } catch {
      return false;
    }
  }

  /**
   * Sanitize origin URL
   */
  sanitizeOrigin(origin: string): string | null {
    try {
      const url = new URL(origin);
      // Reconstruct clean origin
      return `${url.protocol}//${url.hostname}${url.port ? ':' + url.port : ''}`;
    } catch {
      return null;
    }
  }

  /**
   * Get origin metadata
   */
  getOriginMetadata(origin: string): { isValid: boolean; domain: string; protocol: string; port?: string } | null {
    try {
      const url = new URL(origin);
      return {
        isValid: this.validateOrigin(origin),
        domain: url.hostname,
        protocol: url.protocol,
        port: url.port || undefined
      };
    } catch {
      return null;
    }
  }
}