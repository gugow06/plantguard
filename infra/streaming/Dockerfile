# ---- Serviços de streaming (seed / producer / consumer) ----
# Imagem única que roda os scripts .ts via tsx. O serviço a executar é definido
# pelo "command" de cada serviço no docker-compose.
# Context de build: raiz do repositório.

FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
# Gera o Prisma Client em src/generated/prisma (output definido no schema).
RUN npx prisma generate

COPY infra/streaming ./infra/streaming
COPY data ./data

# Default: consumer. Sobrescrito no compose para seed e producer.
CMD ["npx", "tsx", "infra/streaming/consumer.ts"]
