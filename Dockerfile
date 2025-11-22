# ---------------------------
# Stage 1: Build
# ---------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy the full source code
COPY shared ./shared
COPY server ./server
COPY client ./client

# Copy config files
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY drizzle.config.ts ./

# Build both server and client (assuming scripts handle it)
RUN npm run build

# ---------------------------
# Stage 2: Production
# ---------------------------
FROM node:20-alpine AS production

WORKDIR /app

# Copy only package files
COPY package*.json ./

# Install production dependencies only
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi && npm cache clean --force

# Copy build output and necessary files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/shared ./shared

# Create and use non-root user
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs
USER nodejs

# Expose backend port (commonly 3000, adjust if needed)
EXPOSE 5173

# Health check for backend API
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "const http=require('http');http.get('http://localhost:3000/api/health',(r)=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

# Start the application
CMD ["node", "dist/index.js"]
