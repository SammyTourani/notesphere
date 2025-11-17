# Multi-stage Dockerfile for NoteSphere
# Development stage with hot reload

FROM node:25-alpine AS development

# Install dependencies for development
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy application code
COPY . .

# Expose Vite dev server port
EXPOSE 3000

# Start development server with hot reload
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]


# Production build stage
FROM node:25-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy application code
COPY . .

# Build application
RUN npm run build


# Production runtime stage
FROM nginx:alpine AS production

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config (optional)
# COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
