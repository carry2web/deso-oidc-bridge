FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy application files
COPY . .

# Build the DeSo SDK bundle
RUN npm run build

# Inject build timestamp into HTML files
RUN BUILD_TIME=$(date -u +"%Y-%m-%d %H:%M:%S UTC") && \
    find /app/public -name "*.html" -type f -exec sed -i "s/BUILD_TIMESTAMP/$BUILD_TIME/g" {} \;

# Remove devDependencies
RUN npm prune --production

# Expose port
EXPOSE 8080

# Start server
CMD ["node", "server.js"]
