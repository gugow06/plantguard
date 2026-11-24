#!/usr/bin/env bash
# Smoke test ponta a ponta da stack do docker compose.
# 1) /api/health responde, banco e Kafka de pé, consumer acompanhando
# 2) pelo menos uma mensagem atravessou producer -> Kafka -> consumer -> Postgres
# 3) com MIN_ANALYSES=N, espera até haver mais de N análises (prova consumo novo)
# Uso: BASE_URL=http://localhost:3000 TIMEOUT=180 [MIN_ANALYSES=N] scripts/smoke-test.sh
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
TIMEOUT="${TIMEOUT:-180}"
MIN_ANALYSES="${MIN_ANALYSES:-0}"
deadline=$(( $(date +%s) + TIMEOUT ))

log() { printf '[smoke] %s\n' "$*"; }

analyses_count() {
  curl -fsS -m 15 "${BASE_URL}/api/stream/monitor" 2>/dev/null | jq -r '.total // 0' 2>/dev/null || echo 0
}

while true; do
  body="$(curl -fsS -m 15 "${BASE_URL}/api/health" 2>/dev/null || true)"
  if [ -n "$body" ]; then
    status="$(printf '%s' "$body" | jq -r '.status')"
    kafka="$(printf '%s' "$body" | jq -r '.services.kafka.status')"
    total="$(printf '%s' "$body" | jq -r '.services.consumer.totalMessages // 0')"
    consumed="$(printf '%s' "$body" | jq -r '.services.consumer.lastConsumedAt // empty')"
    analyses="$(analyses_count)"
    log "status=${status} kafka=${kafka} mensagens_no_topico=${total} analises=${analyses} ultima_consumida=${consumed:-nenhuma}"
    if [ "$status" = "ok" ] && [ "$kafka" = "up" ] && [ -n "$consumed" ] && [ "$analyses" -gt "$MIN_ANALYSES" ]; then
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

alerts="$(curl -fsS -m 15 "${BASE_URL}/api/stream/monitor" | jq -r '.alerts | length')"
log "análises gravadas pelo consumer: ${analyses} | alertas: ${alerts}"
log "OK: entrada (producer) -> Kafka -> consumer -> Postgres -> app funcionando"
if [ -n "${SMOKE_OUT:-}" ]; then printf '%s\n' "$body" | jq . > "$SMOKE_OUT"; fi
