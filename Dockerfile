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
ENV NEXT_TELEMETRY_DISABLED=1
# Placeholders só para o build (URL válida evita erro em new URL()), passados na
# linha do RUN para não ficarem gravados na imagem. Os valores reais são
# injetados em runtime pelo docker-compose.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    NEXTAUTH_SECRET="build-time-placeholder" \
    npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
# O runtime só precisa do node: remove npm/npx/corepack da imagem base, que
# carregam dependências próprias com CVEs (achado do Trivy na imagem).
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
# Roda sem privilégio de root.
USER node
EXPOSE 3000
# Saúde do app, do banco e do Kafka (ver src/app/api/health/route.ts).
HEALTHCHECK --interval=15s --timeout=10s --start-period=20s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1
CMD ["node", "server.js"]
