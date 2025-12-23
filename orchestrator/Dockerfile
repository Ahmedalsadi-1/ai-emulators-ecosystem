# Backend Orchestrator Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY dist/ ./dist/
COPY src/ ./src/

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S orchestrator -u 1001

# Change ownership
RUN chown -R orchestrator:nodejs /app
USER orchestrator

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { \
    process.exit(res.statusCode === 200 ? 0 : 1) \
  }).on('error', () => process.exit(1))"

# Start application
CMD ["node", "dist/server.js"]