FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY factif-ai-minimal-package.json ./package.json
COPY factif-ai-minimal.js ./

# Install dependencies
RUN npm install --production

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3002/health || exit 1

# Start the service
CMD ["npm", "start"]