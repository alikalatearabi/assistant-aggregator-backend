# Build stage
FROM node:20-bullseye-slim AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
# Ensure a modern npm is available and make npm installs more resilient to transient network issues
RUN corepack enable && \
	npm i -g npm@11.6.2 --no-progress --no-audit && \
	npm config set fetch-retries 5 && \
	npm config set fetch-retry-mintimeout 20000 && \
	npm config set fetch-retry-maxtimeout 120000 && \
	npm ci --no-audit --no-fund

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-bullseye-slim AS production

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN corepack enable && \
	npm i -g npm@11.6.2 --no-progress --no-audit && \
	npm config set fetch-retries 5 && \
	npm config set fetch-retry-mintimeout 20000 && \
	npm config set fetch-retry-maxtimeout 120000 && \
	npm ci --only=production --no-audit --no-fund && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/scripts ./scripts
# Create non-root user for security
RUN groupadd -g 1001 nodejs
RUN useradd -r -u 1001 -g nodejs nestjs

# Create logs directory and set permissions
RUN mkdir -p /usr/src/app/logs && \
    chown -R nestjs:nodejs /usr/src/app/logs

# Change ownership of the app directory
RUN chown -R nestjs:nodejs /usr/src/app
USER nestjs

EXPOSE 3000

CMD ["node", "dist/main"]
