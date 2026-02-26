# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# ---- Production stage ----
FROM node:20-alpine
WORKDIR /app

# Only install production deps
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma

RUN mkdir -p /app/uploads

EXPOSE 3001

# Sync schema to DB then start server (db push is used because migrations are not tracked)
CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
