const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

// Service Registry - centralized service discovery and management
const serviceRegistry = {
    // Core AI Services
    aios: {
        name: 'AIOS',
        description: 'Complete AI Agent Operating System',
        url: 'http://localhost:8010',
        status: 'unknown',
        type: 'ai',
        capabilities: ['chat', 'code-execution', 'file-system', 'web-automation'],
        healthEndpoint: '/health',
        lastHealthCheck: null,
        metadata: {
            version: '2.0',
            provider: 'AIOS Team',
            docs: 'http://localhost:8010/docs'
        }
    },

    bytebot: {
        name: 'Bytebot',
        description: 'Desktop automation and computer control',
        url: 'http://localhost:9991',
        status: 'unknown',
        type: 'automation',
        capabilities: ['screen-control', 'mouse-control', 'keyboard-control', 'desktop-automation'],
        healthEndpoint: '/health',
        lastHealthCheck: null,
        metadata: {
            version: '1.0',
            provider: 'Bytebot Team',
            docs: 'http://localhost:9991/docs'
        }
    },

    postiz: {
        name: 'Postiz',
        description: 'Social media scheduling and content management',
        url: 'http://localhost:9000',
        status: 'unknown',
        type: 'social',
        capabilities: ['social-posting', 'content-scheduling', 'multi-platform-publishing'],
        healthEndpoint: '/api/health',
        lastHealthCheck: null,
        metadata: {
            version: '1.0',
            provider: 'Gitroom',
            docs: 'https://docs.postiz.com'
        }
    },

    factif: {
        name: 'Factif-AI',
        description: 'AI-powered testing and quality assurance',
        url: 'http://factif-ai-minimal:3002',
        status: 'unknown',
        type: 'testing',
        capabilities: ['ui-testing', 'api-testing', 'visual-regression', 'accessibility-testing'],
        healthEndpoint: '/health',
        lastHealthCheck: null,
        metadata: {
            version: '1.0',
            provider: 'HAI Build',
            docs: 'https://github.com/presidio-oss/factif-ai'
        }
    },

    // Infrastructure Services
    postgres: {
        name: 'PostgreSQL',
        description: 'Primary database for all services',
        url: 'postgresql://admin:secure_password_2024!@postgres:5432/ai_ecosystem',
        status: 'unknown',
        type: 'database',
        capabilities: ['sql-queries', 'data-storage', 'transactions'],
        healthEndpoint: null,
        lastHealthCheck: null,
        metadata: {
            version: '15',
            provider: 'PostgreSQL',
            docs: 'https://www.postgresql.org/docs/'
        }
    },

    redis: {
        name: 'Redis',
        description: 'In-memory data store and cache',
        url: 'redis://redis:6379',
        status: 'unknown',
        type: 'cache',
        capabilities: ['key-value-storage', 'pub-sub', 'caching'],
        healthEndpoint: null,
        lastHealthCheck: null,
        metadata: {
            version: '7',
            provider: 'Redis Labs',
            docs: 'https://redis.io/documentation'
        }
    },

    // API Gateway (self)
    apiGateway: {
        name: 'API Gateway',
        description: 'Central service orchestration and routing',
        url: 'http://localhost:8083',
        status: 'healthy',
        type: 'gateway',
        capabilities: ['service-discovery', 'load-balancing', 'request-routing', 'websocket-streaming'],
        healthEndpoint: '/health',
        lastHealthCheck: new Date().toISOString(),
        metadata: {
            version: '1.0',
            provider: 'TuriX Team',
            docs: 'http://localhost:8083/docs'
        }
    }
};

// Service Registry API Routes

// Get all services
router.get('/services', (req, res) => {
    res.json({
        services: serviceRegistry,
        total: Object.keys(serviceRegistry).length,
        timestamp: new Date().toISOString()
    });
});

// Get service by name
router.get('/services/:name', (req, res) => {
    const serviceName = req.params.name.toLowerCase();
    const service = serviceRegistry[serviceName];

    if (!service) {
        return res.status(404).json({
            error: 'Service not found',
            availableServices: Object.keys(serviceRegistry)
        });
    }

    res.json({
        service: service,
        timestamp: new Date().toISOString()
    });
});

// Get services by type
router.get('/services/type/:type', (req, res) => {
    const serviceType = req.params.type.toLowerCase();
    const filteredServices = {};

    Object.keys(serviceRegistry).forEach(key => {
        if (serviceRegistry[key].type === serviceType) {
            filteredServices[key] = serviceRegistry[key];
        }
    });

    res.json({
        services: filteredServices,
        type: serviceType,
        count: Object.keys(filteredServices).length,
        timestamp: new Date().toISOString()
    });
});

// Get services by capability
router.get('/services/capability/:capability', (req, res) => {
    const capability = req.params.capability.toLowerCase();
    const filteredServices = {};

    Object.keys(serviceRegistry).forEach(key => {
        if (serviceRegistry[key].capabilities &&
            serviceRegistry[key].capabilities.some(cap => cap.toLowerCase().includes(capability))) {
            filteredServices[key] = serviceRegistry[key];
        }
    });

    res.json({
        services: filteredServices,
        capability: capability,
        count: Object.keys(filteredServices).length,
        timestamp: new Date().toISOString()
    });
});

// Update service status (internal API)
router.post('/services/:name/status', (req, res) => {
    const serviceName = req.params.name.toLowerCase();
    const { status, lastHealthCheck } = req.body;

    if (!serviceRegistry[serviceName]) {
        return res.status(404).json({ error: 'Service not found' });
    }

    serviceRegistry[serviceName].status = status;
    if (lastHealthCheck) {
        serviceRegistry[serviceName].lastHealthCheck = lastHealthCheck;
    }

    res.json({
        message: 'Service status updated',
        service: serviceName,
        status: status,
        timestamp: new Date().toISOString()
    });
});

// Service health check
router.get('/health/:service', async (req, res) => {
    const serviceName = req.params.name.toLowerCase();
    const service = serviceRegistry[serviceName];

    if (!service) {
        return res.status(404).json({ error: 'Service not found' });
    }

    if (!service.healthEndpoint) {
        return res.json({
            service: serviceName,
            status: 'unknown',
            message: 'No health endpoint configured',
            timestamp: new Date().toISOString()
        });
    }

    try {
        const healthUrl = `${service.url}${service.healthEndpoint}`;
        const response = await fetch(healthUrl, {
            timeout: 5000,
            headers: {
                'User-Agent': 'TuriX-Service-Registry/1.0'
            }
        });

        const status = response.ok ? 'healthy' : 'unhealthy';
        service.status = status;
        service.lastHealthCheck = new Date().toISOString();

        res.json({
            service: serviceName,
            status: status,
            responseTime: response.headers.get('x-response-time') || 'unknown',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        service.status = 'unhealthy';
        service.lastHealthCheck = new Date().toISOString();

        res.status(503).json({
            service: serviceName,
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Service discovery endpoint (for external services)
router.get('/discover', (req, res) => {
    const { type, capability, status } = req.query;
    let filteredServices = { ...serviceRegistry };

    // Filter by type
    if (type) {
        const typeFilter = type.toLowerCase();
        filteredServices = Object.keys(filteredServices)
            .filter(key => filteredServices[key].type === typeFilter)
            .reduce((obj, key) => {
                obj[key] = filteredServices[key];
                return obj;
            }, {});
    }

    // Filter by capability
    if (capability) {
        const capFilter = capability.toLowerCase();
        filteredServices = Object.keys(filteredServices)
            .filter(key => filteredServices[key].capabilities &&
                          filteredServices[key].capabilities.some(cap => cap.toLowerCase().includes(capFilter)))
            .reduce((obj, key) => {
                obj[key] = filteredServices[key];
                return obj;
            }, {});
    }

    // Filter by status
    if (status) {
        const statusFilter = status.toLowerCase();
        filteredServices = Object.keys(filteredServices)
            .filter(key => filteredServices[key].status === statusFilter)
            .reduce((obj, key) => {
                obj[key] = filteredServices[key];
                return obj;
            }, {});
    }

    res.json({
        discovery: {
            filters: { type, capability, status },
            results: filteredServices,
            count: Object.keys(filteredServices).length
        },
        timestamp: new Date().toISOString()
    });
});

module.exports = {
    router,
    serviceRegistry,
    updateServiceStatus: (serviceName, status, lastHealthCheck = null) => {
        if (serviceRegistry[serviceName]) {
            serviceRegistry[serviceName].status = status;
            if (lastHealthCheck) {
                serviceRegistry[serviceName].lastHealthCheck = lastHealthCheck;
            }
        }
    }
};