# ---- Stage 1: Build the Next.js app ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of your project files
COPY . .

# NEXT_PUBLIC_BASE_URL / NEXT_PUBLIC_SERVER_URL are picked up automatically
# by Next.js from the .env file copied above (per-environment values).

# Build the Next.js app
RUN npm run build

# ---- Stage 2: Run the production app ----
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy only required files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Expose the app port (default for Next.js)
EXPOSE 3000

# Run Next.js in production mode
CMD ["npm", "run", "start"]
