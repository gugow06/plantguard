#!/usr/bin/env bash
# Smoke test ponta a ponta da stack do docker compose.
# 1) /api/health responde e o banco está de pé
# 2) Kafka de pé e o consumer acompanhando
# 3) pelo menos uma mensagem atravessou producer -> Kafka -> consumer -> Postgres
# Uso: BASE_URL=http://localhost:3000 TIMEOUT=180 scripts/smoke-test.sh
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
TIMEOUT="${TIMEOUT:-180}"
deadline=$(( $(date +%s) + TIMEOUT ))

log() { printf '[smoke] %s\n' "$*"; }

while true; do
  body="$(curl -fsS "${BASE_URL}/api/health" || true)"
  if [ -n "$body" ]; then
    status="$(printf '%s' "$body" | jq -r '.status')"
    kafka="$(printf '%s' "$body" | jq -r '.services.kafka.status')"
    total="$(printf '%s' "$body" | jq -r '.services.consumer.totalMessages // 0')"
    consumed="$(printf '%s' "$body" | jq -r '.services.consumer.lastConsumedAt // empty')"
    log "status=${status} kafka=${kafka} mensagens_no_topico=${total} ultima_consumida=${consumed:-nenhuma}"
    if [ "$status" = "ok" ] && [ "$kafka" = "up" ] && [ -n "$consumed" ]; then
      break
    fi
  else
    log "app ainda não respondeu"
  fi
  if [ "$(date +%s)" -ge "$deadline" ]; then
    log "FALHOU: o fluxo não ficou saudável em ${TIMEOUT}s"
    exit 1
  fi
  sleep 5
done

monitor="$(curl -fsS "${BASE_URL}/api/stream/monitor")"
analyses="$(printf '%s' "$monitor" | jq -r '.total')"
alerts="$(printf '%s' "$monitor" | jq -r '.alerts | length')"
log "análises gravadas pelo consumer: ${analyses} | alertas: ${alerts}"
[ "$analyses" -ge 1 ] || { log "FALHOU: nenhuma análise gravada"; exit 1; }

log "OK: entrada (producer) -> Kafka -> consumer -> Postgres -> app funcionando"
printf '%s\n' "$body" | jq . > "${SMOKE_OUT:-/dev/null}" 2>/dev/null || true
