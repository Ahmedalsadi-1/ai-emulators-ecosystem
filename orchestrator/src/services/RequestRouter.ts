import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { OrchestratorRequest, OrchestratorResponse, ServiceDefinition, ServiceStatus, EndpointDefinition } from '@/types';
import { CircuitBreaker } from '@/utils/CircuitBreaker';
import { LoadBalancer } from '@/utils/LoadBalancer';

export class RequestRouter {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private loadBalancer: LoadBalancer;

  constructor(
    private serviceRegistry: any,
    private authManager: any,
    private metricsCollector: any
  ) {
    this.loadBalancer = new LoadBalancer();
    this.initializeCircuitBreakers();
  }

  async route(request: OrchestratorRequest): Promise<OrchestratorResponse> {
    const startTime = Date.now();

    try {
      // Discover the target service
      const service = await this.discoverService(request);
      if (!service) {
        throw new Error(`Service not found for path: ${request.path}`);
      }

      // Check circuit breaker
      const circuitBreaker = this.circuitBreakers.get(service.id);
      if (circuitBreaker && !circuitBreaker.canExecute()) {
        throw new Error(`Circuit breaker open for service: ${service.id}`);
      }

      // Get service instance (with load balancing)
      const targetService = await this.loadBalancer.selectTarget([service]);

      // Prepare the request
      const axiosConfig = await this.prepareRequest(request, targetService);

      // Execute the request with retry logic
      const response = await this.executeWithRetry(axiosConfig, request.retries || 2);

      // Update circuit breaker on success
      circuitBreaker?.recordSuccess();

      // Record metrics
      await this.recordMetrics(request, response, startTime, service.id);

      // Transform and return response
      return this.transformResponse(request, response, service);

    } catch (error: any) {
      // Update circuit breaker on failure
      const serviceId = await this.extractServiceIdFromRequest(request);
      this.circuitBreakers.get(serviceId)?.recordFailure();

      // Record error metrics
      await this.recordErrorMetrics(request, error, startTime, serviceId);

      // Return error response
      return this.createErrorResponse(request, error);
    }
  }

  private async discoverService(request: OrchestratorRequest): Promise<ServiceDefinition | null> {
    // Extract service ID from path (e.g., /api/v1/projects/{serviceId}/...)
    const pathSegments = request.path.split('/').filter(Boolean);

    // Handle different routing patterns
    if (pathSegments[0] === 'api' && pathSegments[1] === 'v1') {
      if (pathSegments[2] === 'projects' && pathSegments[3]) {
        // Route to specific service: /api/v1/projects/{serviceId}/...
        const serviceId = pathSegments[3];
        return await this.serviceRegistry.discover(serviceId);
      }

      // Handle unified API routes by capability
      if (pathSegments[2] === 'ai') {
        return await this.routeByCapability('llm-inference');
      }
      if (pathSegments[2] === 'automation') {
        return await this.routeByCapability('computer-control');
      }
      if (pathSegments[2] === 'social') {
        return await this.routeByCapability('social-media');
      }
      if (pathSegments[2] === 'content') {
        return await this.routeByCapability('video-generation');
      }
    }

    // Fallback: try to match by path patterns
    return await this.matchServiceByPath(request.path);
  }

  private async routeByCapability(capability: string): Promise<ServiceDefinition | null> {
    const services = await this.serviceRegistry.getAllServices();
    const healthyServices = services.filter((s: ServiceDefinition) =>
      s.status === 'healthy' && s.capabilities.includes(capability)
    );

    if (healthyServices.length === 0) {
      return null;
    }

    // Use load balancer to select from healthy services
    return await this.loadBalancer.selectTarget(healthyServices);
  }

  private async matchServiceByPath(path: string): Promise<ServiceDefinition | null> {
    const services = await this.serviceRegistry.getAllServices();

    for (const service of services) {
      // Check if any endpoint matches the path
      const matchingEndpoint = service.endpoints.find((endpoint: EndpointDefinition) => {
        const pattern = endpoint.path.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(path);
      });

      if (matchingEndpoint) {
        return service;
      }
    }

    return null;
  }

  private async prepareRequest(
    request: OrchestratorRequest,
    service: ServiceDefinition
  ): Promise<AxiosRequestConfig> {
    // Build target URL
    const targetUrl = `${service.baseUrl}${request.path}`;

    // Prepare headers
    const headers = { ...request.headers };

    // Add authentication headers if needed
    if (request.auth) {
      if (request.auth.tokenType === 'service') {
        headers['X-API-Key'] = request.auth.metadata?.apiKey;
      } else if (request.auth.tokenType === 'user') {
        headers['Authorization'] = `Bearer ${request.auth.metadata?.token}`;
      }
    }

    // Remove hop-by-hop headers
    delete headers['host'];
    delete headers['connection'];
    delete headers['keep-alive'];
    delete headers['proxy-authenticate'];
    delete headers['proxy-authorization'];
    delete headers['te'];
    delete headers['trailers'];
    delete headers['transfer-encoding'];
    delete headers['upgrade'];

    return {
      method: request.method,
      url: targetUrl,
      headers,
      params: request.query,
      data: request.body,
      timeout: request.timeout || 30000,
      validateStatus: () => true, // Don't throw on any status code
    };
  }

  private async executeWithRetry(
    config: AxiosRequestConfig,
    maxRetries: number,
    currentRetry: number = 0
  ): Promise<AxiosResponse> {
    try {
      return await axios(config);
    } catch (error: any) {
      if (currentRetry < maxRetries && this.isRetryableError(error)) {
        const delay = Math.pow(2, currentRetry) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.executeWithRetry(config, maxRetries, currentRetry + 1);
      }
      throw error;
    }
  }

  private isRetryableError(error: any): boolean {
    // Retry on network errors, 5xx errors, and timeouts
    if (!error.response) return true; // Network error
    const status = error.response.status;
    return status >= 500 || status === 408 || status === 429;
  }

  private transformResponse(
    request: OrchestratorRequest,
    axiosResponse: AxiosResponse,
    service: ServiceDefinition
  ): OrchestratorResponse {
    const responseTime = Date.now() - (request as any).startTime;

    return {
      id: request.id,
      statusCode: axiosResponse.status,
      headers: axiosResponse.headers as Record<string, string>,
      data: axiosResponse.data,
      metadata: {
        serviceId: service.id,
        responseTime,
        cached: false,
        transformed: true
      }
    };
  }

  private createErrorResponse(request: OrchestratorRequest, error: any): OrchestratorResponse {
    const responseTime = Date.now() - (request as any).startTime;

    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error.response) {
      statusCode = error.response.status;
      errorMessage = error.response.data?.message || error.message;
    } else if (error.code === 'ECONNABORTED') {
      statusCode = 408;
      errorMessage = 'Request timeout';
    } else if (error.code === 'ENOTFOUND') {
      statusCode = 502;
      errorMessage = 'Service unavailable';
    }

    return {
      id: request.id,
      statusCode,
      headers: {},
      data: {
        error: {
          code: 'ROUTING_ERROR',
          message: errorMessage,
          details: error.message
        }
      },
      metadata: {
        serviceId: 'unknown',
        responseTime,
        cached: false,
        transformed: false
      }
    };
  }

  private async recordMetrics(
    request: OrchestratorRequest,
    response: AxiosResponse,
    startTime: number,
    serviceId: string
  ): Promise<void> {
    const responseTime = Date.now() - startTime;

    await this.metricsCollector.recordRequest({
      serviceId,
      method: request.method,
      path: request.path,
      statusCode: response.status,
      responseTime,
      success: response.status < 400
    });
  }

  private async recordErrorMetrics(
    request: OrchestratorRequest,
    error: any,
    startTime: number,
    serviceId: string
  ): Promise<void> {
    const responseTime = Date.now() - startTime;

    await this.metricsCollector.recordError({
      serviceId,
      method: request.method,
      path: request.path,
      errorType: error.code || 'UNKNOWN',
      responseTime
    });
  }

  private async extractServiceIdFromRequest(request: OrchestratorRequest): Promise<string> {
    const service = await this.discoverService(request);
    return service?.id || 'unknown';
  }

  private initializeCircuitBreakers(): void {
    // Initialize circuit breakers for all services
    // This would typically be done when services are registered
    setInterval(() => {
      this.circuitBreakers.forEach(cb => cb.attemptReset());
    }, 60000); // Check every minute
  }

  // Add circuit breaker for a service
  addCircuitBreaker(serviceId: string, config: any): void {
    this.circuitBreakers.set(serviceId, new CircuitBreaker(config));
  }
}