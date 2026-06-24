# Build stage
FROM registry.redhat.io/ubi9/nodejs-20:latest AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the plugin
RUN npm run build

# Production stage
FROM registry.redhat.io/ubi9/nginx-122:latest

# Run as non-root user (OpenShift security requirement)
RUN chown 1001:0 /opt/app-root/src && \
    chmod 755 /opt/app-root/src

WORKDIR /opt/app-root/src

# Copy built files from builder
COPY --from=builder /app/dist /opt/app-root/src

# Copy nginx configuration
RUN echo 'server { \
    listen 8080; \
    server_name localhost; \
    root /opt/app-root/src; \
    index index.html; \
    \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    location /remoteEntry.js { \
        add_header Access-Control-Allow-Origin *; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 8080

# Run as non-root user (UID 1001+)
USER 1001

CMD ["nginx", "-g", "daemon off;"]
