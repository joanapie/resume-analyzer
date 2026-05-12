# ── Stage 1: Build frontend ──────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ── Stage 2: Production backend ───────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Install backend dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy backend source
COPY backend/ ./backend/

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/client/dist ./client/dist

# Serve frontend static files from Express
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "backend/index.js"]
