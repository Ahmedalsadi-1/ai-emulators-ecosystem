FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY api-gateway-package.json ./package.json

# Install dependencies
RUN npm install --production

# Copy source code
COPY api-gateway.js ./
COPY service-registry.js ./

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start the API Gateway
CMD ["npm", "start"]