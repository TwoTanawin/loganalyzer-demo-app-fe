# 1. Use Bun official base image
FROM oven/bun:1.1.13 AS base

# Set working directory
WORKDIR /app

# Copy dependency files (make bun.lockb optional)
COPY package.json tsconfig.json ./
COPY bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the Next.js app
RUN bun run build

# 2. Use minimal runtime for production
FROM oven/bun:1.1.13-slim

WORKDIR /app

# Copy only the necessary files from build stage
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public
COPY --from=base /app/package.json ./package.json

# Expose port (default for Next.js apps)
EXPOSE 3000

# Run the app in production mode
ENV NODE_ENV=production
CMD ["node", "server.js"]