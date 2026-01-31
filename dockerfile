# ---- Stage 1: Build the Next.js app ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of your project files
COPY . .

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

# Install only production dependencies
RUN npm install --omit=dev --legacy-peer-deps

# Expose the app port (default for Next.js)
EXPOSE 3000

# Run Next.js in production mode
CMD ["npm", "run", "start"]
