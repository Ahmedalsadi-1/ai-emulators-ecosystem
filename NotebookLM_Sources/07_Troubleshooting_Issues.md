# Troubleshooting Guide & Known Issues

## Common Issues & Solutions

---

## 1. Service Startup Issues

### Issue: Container Fails to Start

**Symptoms**:
- Container exits immediately
- "Exited (1)" status in `docker-compose ps`

**Diagnosis**:
```bash
# Check logs
docker-compose logs <service-name>

# Check container status
docker-compose ps

# Inspect container
docker inspect <container-id>
```

**Solutions**:

1. **Port Already in Use**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
ports:
  - "3001:3000"  # Use different host port
```

2. **Missing Environment Variables**
```bash
# Check if .env file exists
ls -la .env

# Verify required variables
cat .env | grep DATABASE_URL

# Copy from example
cp .env.example .env
```

3. **Dependency Issues**
```bash
# Rebuild without cache
docker-compose build --no-cache <service>

# Remove and recreate
docker-compose rm -f <service>
docker-compose up -d <service>
```

---

## 2. Database Connection Issues

### Issue: "Connection Refused" Error

**Symptoms**:
- Backend can't connect to database
- "ECONNREFUSED" errors in logs

**Diagnosis**:
```bash
# Check if database is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres pg_isready
```

**Solutions**:

1. **Database Not Ready**
```yaml
# Add healthcheck in docker-compose.yml
backend:
  depends_on:
    postgres:
      condition: service_healthy

postgres:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U postgres"]
    interval: 10s
    timeout: 5s
    retries: 5
```

2. **Wrong Connection String**
```bash
# Verify connection string format
# PostgreSQL: postgresql://user:password@host:port/database
DATABASE_URL=postgresql://postgres:password@postgres:5432/futureapp

# MongoDB: mongodb://user:password@host:port/database?authSource=admin
MONGO_URL=mongodb://admin:password@mongodb:27017/futureapp?authSource=admin
```

3. **Network Issues**
```bash
# Check if services are on same network
docker network inspect future-app_database-network

# Recreate network
docker-compose down
docker-compose up -d
```

### Issue: "Too Many Connections"

**Symptoms**:
- "FATAL: sorry, too many clients already" error

**Solutions**:

1. **Increase Connection Limit**
```yaml
# docker-compose.yml
postgres:
  command: postgres -c max_connections=200
```

2. **Implement Connection Pooling**
```typescript
// Backend connection pool
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,  // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## 3. Performance Issues

### Issue: Slow API Response Times

**Symptoms**:
- Requests taking >2 seconds
- Timeout errors

**Diagnosis**:
```bash
# Check resource usage
docker stats

# Profile slow queries
docker-compose exec postgres psql -U postgres -d futureapp
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;

# Check API metrics
curl http://localhost:9090/api/v1/query?query=http_request_duration_seconds
```

**Solutions**:

1. **Add Database Indexes**
```sql
-- Find missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct > 100
AND correlation < 0.1;

-- Add indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
```

2. **Implement Caching**
```typescript
// Redis caching
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  // Try cache first
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Fetch and cache
  const data = await fetchFn();
  await redis.setex(key, ttl, JSON.stringify(data));
  return data;
}
```

3. **Optimize Queries**
```typescript
// ❌ Bad: N+1 query problem
const users = await User.findAll();
for (const user of users) {
  user.posts = await Post.findAll({ where: { userId: user.id } });
}

// ✅ Good: Use eager loading
const users = await User.findAll({
  include: [{ model: Post }],
});
```

### Issue: High Memory Usage

**Symptoms**:
- Container using >90% memory
- Out of memory errors

**Diagnosis**:
```bash
# Check memory usage
docker stats --no-stream

# Check for memory leaks
docker-compose exec backend node --inspect
# Then use Chrome DevTools to profile
```

**Solutions**:

1. **Increase Memory Limit**
```yaml
# docker-compose.yml
backend:
  deploy:
    resources:
      limits:
        memory: 2G
      reservations:
        memory: 1G
```

2. **Fix Memory Leaks**
```typescript
// ❌ Bad: Event listener leak
setInterval(() => {
  eventEmitter.on('data', handler);  // Adds new listener every time
}, 1000);

// ✅ Good: Remove listeners
const interval = setInterval(() => {
  // Do work
}, 1000);

// Clean up
process.on('SIGTERM', () => {
  clearInterval(interval);
});
```

3. **Optimize Data Processing**
```typescript
// ❌ Bad: Load all data into memory
const allUsers = await User.findAll();  // Could be millions
const processed = allUsers.map(processUser);

// ✅ Good: Stream processing
const stream = User.findAll({ stream: true });
for await (const user of stream) {
  await processUser(user);
}
```

---

## 4. AI Service Issues

### Issue: Ollama Model Not Found

**Symptoms**:
- "model not found" error
- 404 response from Ollama

**Diagnosis**:
```bash
# List available models
docker-compose exec ollama ollama list

# Check Ollama logs
docker-compose logs ollama
```

**Solutions**:

1. **Pull Missing Model**
```bash
# Pull Llama 3.2
docker-compose exec ollama ollama pull llama3.2:3b

# Verify
docker-compose exec ollama ollama list
```

2. **Use Correct Model Name**
```typescript
// ❌ Wrong
const response = await ollama.generate({
  model: 'llama3.2',  // Missing size tag
  prompt: 'Hello',
});

// ✅ Correct
const response = await ollama.generate({
  model: 'llama3.2:3b',  // Include size tag
  prompt: 'Hello',
});
```

### Issue: Slow AI Inference

**Symptoms**:
- AI requests taking >30 seconds
- Timeout errors

**Solutions**:

1. **Use Smaller Models**
```bash
# Instead of 7B model, use 3B or 1B
docker-compose exec ollama ollama pull llama3.2:1b
```

2. **Optimize Prompt**
```typescript
// ❌ Bad: Verbose prompt
const prompt = `Please analyze this text and provide a detailed summary 
with all the key points and important details...`;

// ✅ Good: Concise prompt
const prompt = `Summarize in 3 bullet points:\n${text}`;
```

3. **Implement Streaming**
```typescript
// Stream responses for better UX
const stream = await ollama.generate({
  model: 'llama3.2:3b',
  prompt: 'Write a story',
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.response);
}
```

---

## 5. n8n Workflow Issues

### Issue: Workflow Execution Fails

**Symptoms**:
- Workflow shows error status
- "Execution failed" message

**Diagnosis**:
```bash
# Check n8n logs
docker-compose logs n8n

# Check execution details in n8n UI
# http://localhost:5678 -> Executions
```

**Solutions**:

1. **Check Credentials**
```
1. Open n8n UI
2. Go to Credentials
3. Test each credential
4. Update if expired
```

2. **Add Error Handling**
```json
// Add "Error Trigger" node
{
  "nodes": [
    {
      "type": "n8n-nodes-base.errorTrigger",
      "name": "Error Handler"
    },
    {
      "type": "n8n-nodes-base.sendEmail",
      "name": "Notify Admin"
    }
  ]
}
```

3. **Increase Timeout**
```yaml
# docker-compose.yml
n8n:
  environment:
    - EXECUTIONS_TIMEOUT=300  # 5 minutes
    - EXECUTIONS_TIMEOUT_MAX=600  # 10 minutes max
```

### Issue: Webhook Not Triggering

**Symptoms**:
- Webhook URL returns 404
- Workflow not executing on webhook call

**Solutions**:

1. **Activate Workflow**
```
1. Open workflow in n8n
2. Click "Active" toggle (top right)
3. Verify webhook URL is shown
```

2. **Check Webhook URL**
```bash
# Test webhook
curl -X POST http://localhost:5678/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

3. **Check Firewall**
```bash
# Ensure port 5678 is accessible
sudo ufw allow 5678
```

---

## 6. Frontend Issues

### Issue: "Module Not Found" Error

**Symptoms**:
- Build fails with module error
- Import statements not working

**Solutions**:

1. **Clear Cache and Reinstall**
```bash
cd frontend
rm -rf node_modules package-lock.json .next
npm install
npm run dev
```

2. **Check Import Paths**
```typescript
// ❌ Wrong
import { Button } from 'components/Button';

// ✅ Correct (with path alias)
import { Button } from '@/components/Button';
```

3. **Verify tsconfig.json**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue: Hydration Mismatch

**Symptoms**:
- "Hydration failed" error in console
- Content flashing on page load

**Solutions**:

1. **Use Client Component**
```typescript
// Add 'use client' directive
'use client';

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

2. **Avoid Date/Random in SSR**
```typescript
// ❌ Bad: Different on server and client
export function Component() {
  return <div>{new Date().toString()}</div>;
}

// ✅ Good: Use useEffect
export function Component() {
  const [date, setDate] = useState('');
  
  useEffect(() => {
    setDate(new Date().toString());
  }, []);
  
  return <div>{date}</div>;
}
```

---

## 7. Docker Issues

### Issue: "No Space Left on Device"

**Symptoms**:
- Build fails with disk space error
- Container won't start

**Solutions**:

1. **Clean Up Docker**
```bash
# Remove unused containers, images, networks
docker system prune -a

# Remove unused volumes
docker volume prune

# Check disk usage
docker system df
```

2. **Increase Docker Disk Space**
```
1. Open Docker Desktop
2. Settings -> Resources -> Disk image size
3. Increase to 100GB+
4. Apply & Restart
```

### Issue: "Cannot Connect to Docker Daemon"

**Symptoms**:
- docker-compose commands fail
- "Cannot connect to the Docker daemon" error

**Solutions**:

1. **Start Docker**
```bash
# macOS
open -a Docker

# Linux
sudo systemctl start docker
```

2. **Check Docker Status**
```bash
docker info

# If permission denied
sudo usermod -aG docker $USER
newgrp docker
```

---

## 8. Network Issues

### Issue: Services Can't Communicate

**Symptoms**:
- "Connection refused" between services
- Services can't resolve hostnames

**Solutions**:

1. **Check Network Configuration**
```bash
# List networks
docker network ls

# Inspect network
docker network inspect future-app_backend-network

# Verify services are on correct networks
docker-compose ps
```

2. **Recreate Networks**
```bash
# Stop services
docker-compose down

# Remove networks
docker network prune

# Restart
docker-compose up -d
```

3. **Use Service Names**
```typescript
// ❌ Wrong: Use localhost
const response = await fetch('http://localhost:5000/api/users');

// ✅ Correct: Use service name
const response = await fetch('http://backend:5000/api/users');
```

---

## 9. Critical Issues & Blockers

### Priority 1: High

#### 1. Database Migration Conflicts
**Status**: 🔴 Blocking
**Impact**: Can't deploy new features

**Issue**:
- Multiple developers creating migrations
- Conflicts when merging

**Solution**:
```bash
# Use timestamp-based migration names
# Format: YYYYMMDDHHMMSS_description.sql
20241223120000_add_user_roles.sql

# Coordinate migrations in team
# Use migration lock table
```

#### 2. Memory Leaks in Python Services
**Status**: 🔴 Critical
**Impact**: Service crashes after 24 hours

**Issue**:
- Memory usage grows over time
- Eventually causes OOM

**Solution**:
```python
# Profile memory usage
import tracemalloc
tracemalloc.start()

# Find leaks
import gc
gc.collect()
print(gc.garbage)

# Implement proper cleanup
@app.on_event("shutdown")
async def shutdown():
    await cleanup_resources()
```

### Priority 2: Medium

#### 3. Slow Ollama Inference
**Status**: 🟡 In Progress
**Impact**: Poor user experience

**Workaround**:
- Use smaller models (1B instead of 7B)
- Implement response streaming
- Add loading indicators

#### 4. n8n Workflow Timeouts
**Status**: 🟡 Investigating
**Impact**: Some automations fail

**Workaround**:
- Increase timeout settings
- Break long workflows into smaller ones
- Use webhook callbacks

### Priority 3: Low

#### 5. Missing API Documentation
**Status**: 🟢 Planned
**Impact**: Developer experience

**Plan**:
- Generate OpenAPI spec
- Set up Swagger UI
- Add code examples

---

## Emergency Procedures

### Service Down
```bash
# 1. Check status
docker-compose ps

# 2. View logs
docker-compose logs <service>

# 3. Restart service
docker-compose restart <service>

# 4. If still down, rebuild
docker-compose up -d --build <service>

# 5. Check health
curl http://localhost:<port>/health
```

### Database Corruption
```bash
# 1. Stop services
docker-compose down

# 2. Backup current state
docker run --rm -v future-app_postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .

# 3. Restore from backup
cat backup.sql | docker-compose exec -T postgres psql -U postgres futureapp

# 4. Restart services
docker-compose up -d
```

### Complete System Reset
```bash
# WARNING: This will delete all data!

# 1. Stop everything
docker-compose down -v

# 2. Remove all containers and images
docker system prune -a --volumes

# 3. Rebuild from scratch
docker-compose up -d --build

# 4. Run migrations
docker-compose exec backend npm run migrate

# 5. Seed database
docker-compose exec backend npm run seed
```

---

## Getting Help

### Internal Resources
- Documentation: `/docs`
- Architecture diagrams: `/docs/architecture`
- API docs: `http://localhost:5000/api-docs`

### External Resources
- Docker docs: https://docs.docker.com
- n8n docs: https://docs.n8n.io
- Ollama docs: https://ollama.ai/docs
- Next.js docs: https://nextjs.org/docs

### Support Channels
- GitHub Issues: For bugs and feature requests
- Team Chat: For quick questions
- Weekly Sync: For complex issues
