# Multi-stage Dockerfile for Postiz API Wrapper
FROM node:18-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development

ENV NODE_ENV=development

# Install dev dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Start development server
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS build

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

ENV NODE_ENV=production

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built application
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules

# Create logs directory
RUN mkdir -p logs && chown -R nextjs:nodejs logs

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "
    const http = require('http');
    const options = { hostname: 'localhost', port: 3001, path: '/api/health', method: 'GET' };
    const req = http.request(options, (res) => {
      if (res.statusCode === 200) process.exit(0);
      else process.exit(1);
    });
    req.on('error', () => process.exit(1));
    req.end();
  "

# Start the application
CMD ["npm", "start"]