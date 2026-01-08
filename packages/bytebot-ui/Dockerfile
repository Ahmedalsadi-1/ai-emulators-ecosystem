# Base image - using full Node.js image instead of alpine for better type support
FROM node:20-slim

# Declare build arguments
ARG BYTEBOT_AGENT_BASE_URL
ARG BYTEBOT_DESKTOP_VNC_URL

# Set environment variables for the build process
ENV BYTEBOT_AGENT_BASE_URL=${BYTEBOT_AGENT_BASE_URL}
ENV BYTEBOT_DESKTOP_VNC_URL=${BYTEBOT_DESKTOP_VNC_URL}

# Create app directory
WORKDIR /app

# Copy app source
COPY ./packages/shared ./packages/shared
COPY ./packages/bytebot-ui/ ./packages/bytebot-ui

WORKDIR /app/packages/bytebot-ui

# Install dependencies
RUN npm install

# Build the application
RUN npm run build

# Expose port
EXPOSE 9992

# Run the application (production mode with compiled output)
CMD ["npm", "run", "start:prod"] 


