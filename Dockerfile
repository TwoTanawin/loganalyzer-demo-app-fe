# Build stage using Node.js (better Next.js compatibility)
FROM node:20-alpine AS base

WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json* ./

# Install dependencies with npm
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the Next.js app
RUN npm run build

# Production stage using Bun for runtime
FROM oven/bun:1.1.13-slim

WORKDIR /app

# Copy built application from build stage
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public
COPY --from=base /app/package.json ./package.json

# Expose port
EXPOSE 3000

# Run the app in production mode
ENV NODE_ENV=production
CMD ["node", "server.js"]