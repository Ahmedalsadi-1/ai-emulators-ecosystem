# Security & Monitoring

## Security Overview

This document outlines security measures, vulnerabilities, and monitoring strategies for the future-app system.

---

## Security Architecture

### Defense in Depth Strategy

```
Layer 1: Network Security (Firewall, VPN)
  ↓
Layer 2: Application Gateway (Nginx, Rate Limiting)
  ↓
Layer 3: Authentication (JWT, OAuth)
  ↓
Layer 4: Authorization (RBAC, Permissions)
  ↓
Layer 5: Input Validation (Sanitization, Type Checking)
  ↓
Layer 6: Data Encryption (TLS, Database Encryption)
  ↓
Layer 7: Audit Logging (Activity Tracking)
```

---

## Authentication & Authorization

### JWT Implementation

```typescript
// Backend: Generate JWT
import jwt from 'jsonwebtoken';

function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: '7d',
      issuer: 'future-app',
      audience: 'future-app-users',
    }
  );
}

// Verify JWT
function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
  } catch (error) {
    throw new UnauthorizedError('Invalid token');
  }
}
```

### Authentication Middleware

```typescript
// Protect routes
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw new UnauthorizedError('No token provided');
    }
    
    const payload = verifyToken(token);
    req.user = await User.findById(payload.id);
    
    if (!req.user) {
      throw new UnauthorizedError('User not found');
    }
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};
```

### Role-Based Access Control (RBAC)

```typescript
// Define roles and permissions
enum Role {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}

const permissions = {
  admin: ['read', 'write', 'delete', 'manage_users'],
  user: ['read', 'write'],
  guest: ['read'],
};

// Authorization middleware
export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  };
};

// Usage
router.delete('/users/:id', authenticate, authorize(Role.ADMIN), deleteUser);
```

---

## Input Validation & Sanitization

### Zod Schema Validation

```typescript
import { z } from 'zod';

// Define schema
const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(2).max(50),
  age: z.number().int().min(18).max(120).optional(),
});

// Validate input
export const validateUser = (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body = userSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
    next(error);
  }
};
```

### SQL Injection Prevention

```typescript
// ✅ DO: Use parameterized queries
const user = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// ❌ DON'T: String concatenation
const user = await db.query(
  `SELECT * FROM users WHERE email = '${email}'`
);

// ✅ DO: Use ORM/Query Builder
const user = await User.findOne({ where: { email } });
```

### XSS Prevention

```typescript
// Frontend: Sanitize HTML
import DOMPurify from 'dompurify';

function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href'],
  });
}

// Backend: Set security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));
```

### CSRF Protection

```typescript
import csrf from 'csurf';

// Enable CSRF protection
const csrfProtection = csrf({ cookie: true });

app.use(csrfProtection);

// Send token to frontend
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Frontend: Include token in requests
fetch('/api/data', {
  method: 'POST',
  headers: {
    'CSRF-Token': csrfToken,
  },
  body: JSON.stringify(data),
});
```

---

## Rate Limiting

### Express Rate Limit

```typescript
import rateLimit from 'express-rate-limit';

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per window
  skipSuccessfulRequests: true,
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
```

### Redis-Based Rate Limiting

```typescript
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT!),
});

const rateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rate_limit',
  points: 10, // Number of requests
  duration: 1, // Per second
});

export const rateLimitMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (error) {
    res.status(429).json({ error: 'Too many requests' });
  }
};
```

---

## Data Encryption

### Password Hashing

```typescript
import bcrypt from 'bcrypt';

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Verify password
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### Data Encryption at Rest

```typescript
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### TLS/SSL Configuration

```nginx
# Nginx SSL configuration
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL certificates
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # SSL protocols and ciphers
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Other security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

---

## Security Vulnerabilities & Mitigations

### Known Vulnerabilities

#### 1. Exposed API Keys
**Risk**: High
**Status**: ⚠️ Needs attention

**Issue**:
- API keys stored in environment files
- Risk of accidental commit to Git

**Mitigation**:
```bash
# Use secret management
- AWS Secrets Manager
- HashiCorp Vault
- Docker Secrets

# Rotate keys regularly
# Use .gitignore for .env files
echo ".env" >> .gitignore
echo ".env.*" >> .gitignore
```

#### 2. Insufficient Input Validation
**Risk**: Medium
**Status**: ⚠️ Partial implementation

**Issue**:
- Some endpoints lack validation
- File upload size not limited

**Mitigation**:
```typescript
// Add validation to all endpoints
router.post('/upload', 
  validateFileUpload,  // Add this
  upload.single('file'),
  handleUpload
);

// Limit file size
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});
```

#### 3. Missing Rate Limiting on Some Endpoints
**Risk**: Medium
**Status**: ⚠️ In progress

**Issue**:
- AI endpoints can be abused
- No rate limiting on file uploads

**Mitigation**:
```typescript
// Add rate limiting to AI endpoints
router.post('/ai/generate',
  rateLimitMiddleware,  // Add this
  authenticate,
  generateContent
);
```

#### 4. Weak Password Policy
**Risk**: Medium
**Status**: ⚠️ Needs improvement

**Current**: Minimum 8 characters
**Recommended**: 
- Minimum 12 characters
- Require uppercase, lowercase, number, special char
- Check against common passwords

**Mitigation**:
```typescript
const passwordSchema = z.string()
  .min(12)
  .regex(/[A-Z]/, 'Must contain uppercase')
  .regex(/[a-z]/, 'Must contain lowercase')
  .regex(/[0-9]/, 'Must contain number')
  .regex(/[^A-Za-z0-9]/, 'Must contain special character')
  .refine(
    (password) => !commonPasswords.includes(password),
    'Password too common'
  );
```

#### 5. No Request Signing for Internal APIs
**Risk**: Low
**Status**: ⚠️ Future enhancement

**Issue**:
- Internal service communication not signed
- Risk of man-in-the-middle attacks

**Mitigation**:
```typescript
// Implement HMAC signing
import crypto from 'crypto';

function signRequest(body: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
}

function verifySignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expected = signRequest(body, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

---

## Monitoring & Observability

### Prometheus Metrics

```typescript
import { Counter, Histogram, Gauge } from 'prom-client';

// Request counter
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

// Response time histogram
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

// Active connections gauge
const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
});

// Middleware to track metrics
export const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    
    httpRequestsTotal.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status: res.statusCode,
    });
    
    httpRequestDuration.observe(
      {
        method: req.method,
        route: req.route?.path || req.path,
        status: res.statusCode,
      },
      duration
    );
  });
  
  next();
};
```

### Grafana Dashboards

#### System Overview Dashboard
```json
{
  "dashboard": {
    "title": "System Overview",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])"
          }
        ]
      },
      {
        "title": "Response Time (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      }
    ]
  }
}
```

### Alert Rules

```yaml
# prometheus/alerts.yml
groups:
  - name: api_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: |
          rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} (threshold: 0.05)"

      # Slow response time
      - alert: SlowResponseTime
        expr: |
          histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow response time detected"
          description: "P95 response time is {{ $value }}s (threshold: 2s)"

      # Service down
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.instance }} is down"

      # High memory usage
      - alert: HighMemoryUsage
        expr: |
          (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is {{ $value | humanizePercentage }}"
```

### Logging Strategy

```typescript
import winston from 'winston';

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'backend-api' },
  transports: [
    // Write to files
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
  ],
});

// Console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// Usage
logger.info('User logged in', { userId: user.id });
logger.error('Database connection failed', { error: err.message });
logger.warn('Rate limit exceeded', { ip: req.ip });
```

### Audit Logging

```typescript
// Log all sensitive operations
export async function auditLog(
  action: string,
  userId: string,
  resource: string,
  details?: any
) {
  await AuditLog.create({
    action,
    userId,
    resource,
    details,
    timestamp: new Date(),
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
}

// Usage
await auditLog('user.delete', req.user.id, 'users', { deletedUserId: userId });
await auditLog('data.export', req.user.id, 'reports', { reportId });
```

---

## Security Checklist

### Pre-deployment
- [ ] All dependencies updated
- [ ] Security audit completed (npm audit, pip-audit)
- [ ] Secrets removed from code
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Firewall rules configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] CORS configured correctly
- [ ] Security headers set

### Regular Maintenance
- [ ] Weekly: Review logs for suspicious activity
- [ ] Weekly: Check for dependency updates
- [ ] Monthly: Rotate API keys and secrets
- [ ] Monthly: Review and update firewall rules
- [ ] Quarterly: Security audit
- [ ] Quarterly: Penetration testing
- [ ] Yearly: Full security review
