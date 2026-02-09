# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Install dependencies for Sharp (image processing library)
RUN apk add --no-cache \
    libc6-compat \
    vips-dev \
    build-base \
    python3

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

# Expose port
EXPOSE 4002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4002/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the service
CMD ["node", "server.js"]
