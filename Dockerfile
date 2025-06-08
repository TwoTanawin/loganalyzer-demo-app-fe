# 1. Use Bun official base image
FROM oven/bun:1.1.13 as base

# Set working directory
WORKDIR /app

# Copy dependency files
COPY bun.lockb package.json tsconfig.json ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the Next.js app
RUN bun run build

# 2. Use minimal runtime for production
FROM oven/bun:1.1.13-slim

WORKDIR /app

# Copy built app from previous stage
COPY --from=base /app ./

# Expose port (default for Next.js apps)
EXPOSE 3000

# Run the app in production mode
ENV NODE_ENV=production
CMD ["bun", "start"]
