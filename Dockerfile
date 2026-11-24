# ---- App Next.js 16 (saída standalone) ----
# Build multi-stage: deps -> builder (prisma generate + next build) -> runner enxuto.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Placeholders apenas para o build (URLs válidas evitam erro em new URL()).
# Os valores reais são injetados em runtime pelo docker-compose.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV NEXTAUTH_SECRET="build-time-placeholder"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
# Roda sem privilégio de root.
USER node
EXPOSE 3000
# Saúde do app, do banco e do Kafka (ver src/app/api/health/route.ts).
HEALTHCHECK --interval=15s --timeout=10s --start-period=20s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1
CMD ["node", "server.js"]
