# Backend + Miniapp Dockerfile
FROM node:18-alpine

WORKDIR /app

# ============ Install Backend dependencies ============
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --only=production

# ============ Install and Build Miniapp ============
COPY miniapp/package*.json ../miniapp/
COPY miniapp/package-lock.json ../miniapp/
WORKDIR /app/miniapp
RUN npm ci

COPY miniapp/ ./
RUN npm run build

# ============ Backend setup ============
WORKDIR /app/backend
COPY backend/ ./

# Copy miniapp dist for SPA fallback
COPY ../miniapp/dist ./miniapp/dist

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3001

# Start server
CMD ["npm", "start"]
