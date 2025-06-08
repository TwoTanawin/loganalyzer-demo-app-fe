# Dockerfile

# 1. Builder Stage: Build the Next.js app
FROM node:20-bullseye-slim AS base
WORKDIR /app

# Install all dependencies (including devDependencies) needed for the build
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Set the output mode in next.config.js instead of here
# ENV NEXT_TELEMETRY_DISABLED=1
# ENV NEXT_OUTPUT_MODE=standalone

# Build the Next.js app
RUN npm run build

# 2. Runner Stage: Create the final, small production image
FROM node:20-bullseye-slim AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Copy the public folder
COPY --from=base /app/public ./public

# Copy the standalone output
COPY --from=base --chown=nextjs:nodejs /app/.next/standalone ./

# Copy the static assets
COPY --from=base --chown=nextjs:nodejs /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000
ENV NODE_ENV=production

# Run the app
CMD ["node", "server.js"]