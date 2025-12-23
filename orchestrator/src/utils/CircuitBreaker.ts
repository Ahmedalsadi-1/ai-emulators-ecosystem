export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private config: {
      failureThreshold: number;
      timeout: number; // milliseconds
      monitoringPeriod: number; // milliseconds
    }
  ) {}

  canExecute(): boolean {
    switch (this.state) {
      case 'CLOSED':
        return true;
      case 'OPEN':
        if (Date.now() - this.lastFailureTime > this.config.timeout) {
          this.state = 'HALF_OPEN';
          return true;
        }
        return false;
      case 'HALF_OPEN':
        return true;
      default:
        return false;
    }
  }

  recordSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.config.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  attemptReset(): void {
    if (this.state === 'OPEN' && Date.now() - this.lastFailureTime > this.config.timeout) {
      this.state = 'HALF_OPEN';
    }
  }

  getState(): string {
    return this.state;
  }
}