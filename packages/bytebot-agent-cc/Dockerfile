# Base image
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy app source (build context is bytebot/)
COPY ./packages/shared ./shared
COPY ./packages/bytebot-agent-cc/ ./bytebot-agent-cc/

WORKDIR /app/bytebot-agent-cc

# Install dependencies
RUN npm install


RUN npm run build

# Run the application
CMD ["npm", "run", "start:prod"] 


