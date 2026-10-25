# --- Build Stage ---
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies based on preferred package manager
COPY package.json bun.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f bun.lock ]; then npm install -g bun && bun install; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install; \
  else npm install; fi

# Copy all project files
COPY . .

# Build the application (TanStack Start / Nitro SSR)
RUN \
  if [ -f bun.lock ]; then bun run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then pnpm build; \
  else npm run build; fi

# --- Production Stage ---
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NITRO_PRESET=node-server

# Copy built server and dependencies from builder
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]