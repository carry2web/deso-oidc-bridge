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

# Remove devDependencies
RUN npm prune --production

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
