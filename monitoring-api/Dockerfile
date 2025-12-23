FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S monitoring -u 1001

# Change ownership
RUN chown -R monitoring:nodejs /app

# Switch to non-root user
USER monitoring

EXPOSE 8080

CMD ["npm", "start"]