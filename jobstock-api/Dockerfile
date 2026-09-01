FROM node:22-alpine

WORKDIR /app

# Install dependencies for Prisma and native modules
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the NestJS application
RUN npm run build

# Expose the API port
EXPOSE 4000

# Start the application in production mode
CMD ["npm", "run", "start:prod"]
