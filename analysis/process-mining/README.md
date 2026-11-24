# Análise de processos (pm4py)

Mineração de processos do event log do PlantGuard. Roda num container com Graphviz,
sem instalar nada na máquina.

```bash
# 1. Suba a stack e gere o cenário simulado (opcional, os eventos reais já são gravados)
docker compose -f infra/docker-compose.yml up -d --build --wait
npm run process:simulate

# 2. Exporte o event log: botão "Event log (CSV)" na página /process
#    ou GET /api/process/event-log?format=csv&source=all  → docs/fase7/processo/event-log.csv

# 3. Rode a análise (origem: simulado | real | all)
docker build -t plantguard-process-mining analysis/process-mining
docker run --rm -v "$PWD":/work plantguard-process-mining \
  docs/fase7/processo/event-log.csv docs/fase7/processo simulado
```

Saídas em `docs/fase7/processo/`: mapas do processo (DFG por frequência e por tempo),
rede de Petri e BPMN (Inductive Miner), variantes, esperas, métricas e `insights.md`.

As mesmas métricas são calculadas em TypeScript em `src/lib/process-mining.ts`
(página `/process`); os números das duas implementações batem, o que valida uma pela outra.
