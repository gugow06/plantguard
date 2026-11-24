# ---- Serviços de streaming (seed / producer / consumer) ----
# Imagem única que roda os scripts .ts via tsx. O serviço a executar é definido
# pelo "command" de cada serviço no docker-compose.
# Context de build: raiz do repositório.

FROM node:26-alpine
WORKDIR /app

COPY package.json package-lock.json ./
# Só dependências de produção (tsx, prisma, kafkajs, papaparse...).
RUN npm ci --omit=dev --legacy-peer-deps

COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
# Gera o Prisma Client em src/generated/prisma (output definido no schema).
RUN ./node_modules/.bin/prisma generate

COPY infra/streaming ./infra/streaming
COPY infra/process-sim ./infra/process-sim
# Módulos do event log compartilhados com o app (sem dependências do Next).
COPY src/lib/process-log.ts src/lib/process-mining.ts ./src/lib/
COPY data ./data

# Remove npm/npx/corepack da imagem base (CVEs nas dependências do próprio npm).
# Os comandos usam os binários locais em node_modules/.bin.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
 && chown -R node:node /app
ENV PATH="/app/node_modules/.bin:${PATH}"
# Roda sem privilégio de root.
USER node

# Default: consumer. Sobrescrito no compose para seed e producer.
CMD ["tsx", "infra/streaming/consumer.ts"]
