FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy the rest of the application
COPY . .

# Ensure NEXT_PUBLIC environment variables are available during build
# Build the Next.js application
RUN npm run build

# Production image
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

# Copy necessary files from builder
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Start the Next.js application
CMD ["npm", "start"]
