# ==================================
# STAGE 1: Build the React App
# ==================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build arguments for environment variables
# Note: These are PUBLIC keys (client-side), not secrets
# VITE_ prefix means they are embedded in the frontend bundle
ARG VITE_API_URL
ARG VITE_GOOGLE_MAPS_API_KEY
ARG VITE_DEBUG_MODE
ARG VITE_ENVIRONMENT

# Set environment variables for build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_STRIPE_PUBLIC_KEY=${VITE_STRIPE_PUBLIC_KEY}
ENV VITE_GOOGLE_MAPS_API_KEY=${VITE_GOOGLE_MAPS_API_KEY}
ENV VITE_DEBUG_MODE=${VITE_DEBUG_MODE}
ENV VITE_ENVIRONMENT=${VITE_ENVIRONMENT}

# Build the app
RUN npm run build

# ==================================
# STAGE 2: Serve with Nginx
# ==================================
FROM nginx:stable-alpine

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY ./nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

