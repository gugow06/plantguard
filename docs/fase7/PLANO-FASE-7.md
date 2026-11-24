# Fase 7: PlantGuard como produto (entrega final AgroSmart)

> Projeto **PlantGuard** · desafio acadêmico **AgroSmart (FIAP)**.
> Objetivo da fase: fechar o PlantGuard como uma plataforma completa, integrada e apresentável, com funcionamento de ponta a ponta, pipeline DevSecOps, monitoramento, mineração de processos e pitch.

---

## 0. Ponto de partida (estado em 24/11/2026, commit `7a9c42a`)

| Área | O que já existe | O que falta para a Fase 7 |
| --- | --- | --- |
| Entrada de dados | Upload de foto (`/api/analyze`), importação CSV/JSON (`/api/import`), producer Kafka que simula câmera de campo (`infra/streaming/producer.ts`) | API de clima só como exemplo (`data/lake/api-clima-exemplo.json`), sem conector real. Opcional nesta fase |
| Processamento | Gemini 2.5 Flash (diagnóstico + insights), consumer Kafka → Postgres, analytics | Nada de bloqueante |
| Decisão / automação | Regras R1–R4 (`src/lib/decision-rules.ts`), alerta `disease_alert` automático no consumer e no upload, relatório por e-mail | Testes automatizados das regras |
| Saída | Dashboard, analytics, alertas, sino de notificações, relatório por e-mail, export CSV/JSON | Nada de bloqueante |
| Containers | `Dockerfile` multi-stage, `infra/docker-compose.yml` com 7 serviços (postgres, kafka, kafka-ui, init, app, producer, consumer) | `app` sem healthcheck; `kafka-ui:latest` sem versão fixa |
| CI/CD | Nenhum (`.github/` não existe) | **Pipeline inteiro** |
| Qualidade | ESLint + Prettier configurados; `tsc` passa | **`npm run lint` falha com 3 erros** (setState dentro de effect em `reset-password/page.tsx`, `NotificationBell.tsx`, `AlertsSummary.tsx`); zero testes |
| Segurança | NextAuth (JWT), bcrypt, rate limit, Zod | **`dev.db` (SQLite com 2 usuários e 11 análises) está versionado no repo público**; `NEXTAUTH_SECRET` com valor padrão no compose |
| Monitoramento | Página `/monitor` (offsets, lag, throughput, feed, a cada 3s), Kafka UI | Endpoint de saúde, logs estruturados, status dos serviços |
| Mineração de processos | Nada | **Event log, descoberta do processo e análise** (entrega de maior peso, 25%) |
| Documentação | Docs das fases 3–5 (md, docx, html com Mermaid) | Documentação final "livre" + slides + 2 vídeos |

---

## 1. Decisões para fechar antes de começar

| # | Decisão | Opções | Recomendação |
| --- | --- | --- | --- |
| F7-D1 | Onde roda o pipeline | GitHub Actions · GitLab CI · Jenkins local | **GitHub Actions**: o repo já está no GitHub, é gratuito para repo público e o print do "verde" é a evidência |
| F7-D2 | Ferramenta de qualidade de código | SonarCloud · só ESLint + `tsc` + cobertura | ✅ **Decidido: ESLint + `tsc` + cobertura do Vitest (mínimo de 70%)**, sem SonarCloud |
| F7-D3 | Ferramentas de vulnerabilidade | Trivy · Snyk · CodeQL · npm audit · Gitleaks | **Trivy** (imagem Docker + dependências + IaC do compose/Dockerfile), **CodeQL** (SAST de TS) e **Gitleaks** (segredos). Nenhum dos três precisa de conta. Resultados em SARIF na aba *Security* do GitHub |
| F7-D4 | Stack de monitoramento | Só `/monitor` + `/api/health` · Prometheus + Grafana | **`/api/health` + `/monitor` ampliado + logs JSON**. É leve e já roda no compose. Prometheus/Grafana só se sobrar tempo (vale 10%) |
| F7-D5 | Ferramenta de mineração de processos | pm4py (Python) · Disco/Celonis (GUI) · análise no próprio app | **pm4py** para gerar o mapa (DFG), as variantes e os tempos com rigor, **mais uma página `/process` no app** com as mesmas métricas para a demonstração ao vivo |
| F7-D6 | Origem do event log | Só eventos reais do pipeline · eventos reais + cenário simulado com variação | **Os dois, rotulados**: eventos reais de cada execução, mais um cenário simulado reproduzível (seed fixa) com falhas, retentativas e atrasos humanos, para o processo ter variações e gargalos que valham a análise. A documentação diz o que é simulado |
| F7-D7 | O que fazer com o `dev.db` versionado | Remover do índice e ignorar · reescrever o histórico | **Remover do índice + `.gitignore`** agora. Reescrever o histórico só se os 2 usuários forem contas reais (é uma decisão sua) |
| F7-D8 | Formato dos slides do pitch | Artifact de Slides (exporta .pptx/PDF) · PowerPoint feito à mão | **Artifact de Slides** com a mesma identidade visual da documentação |

---

## 2. Entregas, pesos e onde fica cada artefato

| Entrega | Peso | Artefatos exigidos | Onde vai ficar |
| --- | --- | --- | --- |
| Arquitetura final | 15% | Diagrama, descrição dos componentes, fluxo de dados | `docs/fase7/arquitetura-final.md` (Mermaid) + seção 2 da documentação livre |
| Execução da plataforma | 20% | Prints/logs, descrição do funcionamento, exemplo de entrada e saída | `docs/fase7/evidencias/execucao/` + seção 3 |
| Pipeline DevSecOps | 20% | Configurações, descrição do pipeline, evidência da execução | `.github/workflows/`, `docs/fase7/evidencias/pipeline/` + seção 4 |
| Monitoramento | 10% | Prints/logs, descrição, como acompanhar | `/api/health`, `/monitor`, `docs/fase7/evidencias/monitoramento/` + seção 5 |
| Processo + demo final | 25% | Event log, diagrama do processo, insights, vídeo de 5 a 8 min | `analysis/process-mining/`, página `/process`, `docs/fase7/event-log-exemplo.csv` + seção 6 + vídeo |
| Pitch | 10% | Slides + vídeo de até 5 min | Artifact de Slides + `docs/fase7/roteiro-video.md` (parte B) |

---

## 3. Épico A: correções e segurança de base (fazer primeiro)

Tudo o que quebraria o pipeline ou apareceria como achado de segurança.

- [ ] Corrigir os 3 erros de lint (`react-hooks/set-state-in-effect`) e os 2 avisos (`email.ts:210` e o outro do relatório).
- [ ] `git rm --cached dev.db` e adicionar `*.db` ao `.gitignore` (F7-D7).
- [ ] Fixar a versão das imagens: `provectuslabs/kafka-ui:v0.7.2` (no lugar de `latest`).
- [ ] Compose: remover o valor padrão do `NEXTAUTH_SECRET` e falhar se a variável não for definida (`${NEXTAUTH_SECRET:?defina no .env}`); atualizar o `.env.example`.
- [ ] Dockerfile: rodar como usuário sem privilégio (`USER node`) e adicionar `HEALTHCHECK` apontando para `/api/health`.
- [ ] README: trocar a seção "Infraestrutura" (Vercel/Supabase) pela arquitetura atual (compose + Kafka) e deixar o link da documentação, dos vídeos e dos slides no topo, como no ELO.

## 4. Épico B: testes (base da análise de qualidade)

- [ ] Adicionar **Vitest** + cobertura (`@vitest/coverage-v8`), com os scripts `test` e `test:coverage`.
- [ ] Testes unitários de `decision-rules.ts` (R1–R4, limites exatos: 50%, 3 ocorrências, 70% de confiança), `compute-alerts.ts`, `compute-analytics.ts` e das validações Zod.
- [ ] Teste do `toMessage`/`jitterConfidence` do producer (confiança sempre entre 0 e 100).
- [ ] Meta: cobertura ≥ 70% em `src/lib/` (é o que o quality gate vai mostrar).

## 5. Épico C: pipeline DevSecOps (20%)

Arquivo `.github/workflows/devsecops.yml`, disparado em `push` e `pull_request` para `main`:

```
┌─ quality ───────────────┐   ┌─ security ─────────────┐
│ npm ci                  │   │ Gitleaks (segredos)    │
│ lint (ESLint)           │   │ npm audit --high       │
│ typecheck (tsc)         │   │ Trivy fs (deps + IaC)  │
│ test + cobertura        │   │ CodeQL (SAST)          │
│ cobertura mínima 70%    │   └───────────┬────────────┘
└───────────┬─────────────┘               │
            └──────────────┬──────────────┘
                     ┌─ build ──────────────────────────┐
                     │ next build                       │
                     │ docker build (app + streaming)   │
                     │ Trivy image (HIGH/CRITICAL)      │
                     └──────────────┬───────────────────┘
                     ┌─ e2e (smoke) ────────────────────┐
                     │ docker compose up -d --wait      │
                     │ curl /api/health = 200           │
                     │ espera o consumer gravar ≥1      │
                     │ análise vinda do Kafka           │
                     │ salva logs como artefato         │
                     │ docker compose down -v           │
                     └──────────────┬───────────────────┘
                     ┌─ publish (só na main) ───────────┐
                     │ push da imagem para o GHCR       │
                     └──────────────────────────────────┘
```

- [ ] Relatórios SARIF (Trivy, CodeQL) publicados na aba *Security*; logs do smoke test e relatório de cobertura como *artifacts* do workflow.
- [ ] Badges no README: pipeline e cobertura.
- [ ] `dependabot.yml` para npm, Docker e Actions.
- [ ] Evidências: print do workflow verde, do resumo de cobertura, da aba Security e de um achado do Trivy **antes e depois** da correção (mostra que o pipeline barra e o time corrige).

## 6. Épico D: monitoramento e execução contínua (10%)

- [ ] `GET /api/health`: status do Postgres (`SELECT 1`), do Kafka (admin `describeCluster`), lag do consumer, idade da última mensagem consumida e versão/commit. Retorna `200` saudável, `503` degradado.
- [ ] Logs estruturados em JSON no producer e no consumer (`{ts, level, service, event, caseId, durationMs}`), que também alimentam o event log (Épico E).
- [ ] `/monitor` ampliado: cartão "Saúde dos serviços" (verde/amarelo/vermelho por componente), tempo médio entre publicação e persistência, alertas da última hora.
- [ ] Healthcheck do `app` no compose e `restart: unless-stopped` nos serviços de longa duração; producer em modo contínuo para a demo (`STREAM_MAX_MESSAGES=0`).
- [ ] Texto "Como acompanhar o sistema": `/monitor`, Kafka UI (`:8080`), `docker compose ps`, `docker compose logs -f consumer`, `/api/health`.

## 7. Épico E: mineração de processos (25%, a maior entrega)

### 7.1 O processo de negócio
Um **caso** é uma leitura de planta (uma imagem). As atividades:

| Atividade | Onde é registrada | Recurso |
| --- | --- | --- |
| Imagem capturada | producer / upload | câmera de campo · produtor |
| Publicada no Kafka | producer | `producer` |
| Consumida do tópico | consumer | `consumer` |
| Diagnóstico por IA | `/api/analyze` (Gemini) | `gemini` |
| Diagnóstico inconclusivo → nova captura | consumer / analyze | sistema |
| Persistida no banco | consumer / analyze | `postgres` |
| Regras avaliadas (R1–R4) | `compute-alerts` | motor de regras |
| Alerta gerado | consumer / analyze | sistema |
| Alerta visualizado | `PATCH /api/notifications/[id]` | produtor |
| Relatório enviado | `/api/reports/email` | sistema |
| Tratamento registrado (opcional) | nova ação na notificação | produtor |

### 7.2 Implementação
- [ ] Modelo Prisma `ProcessEvent { id, caseId, activity, timestamp, resource, lifecycle, attributes JSON }` com índice em `(caseId, timestamp)`.
- [ ] Helper `logProcessEvent()` em `src/lib/process-log.ts`, chamado nos pontos da tabela 7.1 (no producer, o `caseId` vai no payload do Kafka).
- [ ] `GET /api/process/event-log?format=csv|xes`: exporta no formato padrão (`case_id, activity, timestamp, resource`), pronto para pm4py, Disco ou Celonis.
- [ ] `infra/process-sim/simulate.ts` (seed fixa): gera de 300 a 500 casos com variações reais de campo: IA inconclusiva com nova captura (~12%), falha da IA com retentativa (~5%), alerta visto em minutos ou só no dia seguinte, relatório enviado em lote. Rótulo `source=simulado`.
- [ ] `analysis/process-mining/` (Python + pm4py, `requirements.txt`, notebook e script):
  - mapa do processo (DFG com frequência e com tempo de espera) e rede de Petri pelo Inductive Miner;
  - variantes (top 5 com % dos casos);
  - gargalos: tempo médio e P90 entre atividades;
  - conformidade: casos fora do caminho feliz (alerta nunca visto, retrabalho);
  - saída em PNG em `docs/fase7/processo/` + `insights.md`.
- [ ] Página `/process` no app: tabela de variantes, gráfico de tempo por etapa (Recharts), KPIs (lead time médio, % retrabalho, % alertas ignorados) e botão para baixar o event log.

### 7.3 Insights que esperamos encontrar (validar com os dados)
- **Gargalo humano:** o maior tempo não está na máquina (Kafka → banco leva milissegundos) e sim entre "Alerta gerado" e "Alerta visualizado". *Melhoria:* push/WhatsApp para alertas críticos (R2) e lembrete após X horas.
- **Retrabalho:** o laço "Inconclusivo → nova captura" é a principal variação. *Melhoria:* orientar a foto (iluminação, distância) antes do envio e mostrar o guia de captura quando a confiança fica abaixo de 70% (R4).
- **Dependência externa:** latência e falhas do Gemini como segundo gargalo. *Melhoria:* fila com retentativa e backoff, cache de diagnósticos repetidos.
- **Relatório em lote:** o relatório por e-mail atrasa a informação crítica. *Melhoria:* relatório imediato só para R2.

## 8. Épico F: documentação "livre" (no estilo da do ELO)

Mesma abordagem do ELO (`documentacao-livre.html` impresso em PDF pelo Chrome headless), com a identidade do PlantGuard (verde `#1b4d34`, creme `#f4f1e8`, já usados nos HTMLs da Fase 5).

- [ ] `docs/fase7/documentacao-livre.html`: página única, com capa, sumário, seções por entrega (indicando o peso de cada uma), diagramas Mermaid renderizados, prints com legenda, blocos de código e log, e quebra de página no ponto certo para impressão (`@page`, `break-before`).
- [ ] `npm run docs:pdf`: gera `docs/fase7/PlantGuard-documentacao-livre.pdf` pelo Chrome headless.
- [ ] Estrutura:
  1. Capa (PlantGuard · AgroSmart · FIAP · equipe e RMs)
  2. Problema e proposta de valor (uma página)
  3. Arquitetura final: diagrama, componentes, fluxo entrada → processamento → saída, evolução fase a fase
  4. Plataforma em execução: passo a passo com prints, exemplo de entrada (mensagem Kafka/CSV/foto) e saída (análise, alerta, e-mail)
  5. Pipeline DevSecOps: diagrama, cada etapa, prints e o antes/depois de uma vulnerabilidade
  6. Monitoramento: `/monitor`, `/api/health`, logs e como acompanhar
  7. Mineração de processos: event log, mapa, variantes, gargalos, melhorias
  8. Produto: público-alvo, diferencial, Business Model Canvas (Fase 4), roadmap
  9. Uso de IA generativa (Claude Code, Gemini) e links (repo, vídeos, slides)
- [ ] Publicar a página também como artifact privado, para compartilhar o link.

## 9. Épico G: pitch e vídeos

- [ ] Slides do pitch (F7-D8): 8 a 10 slides com problema, solução, demo em uma imagem, diferencial, público-alvo, proposta de valor, modelo de negócio, roadmap e equipe.
- [ ] Vídeo final (5 min) e vídeo pitch (até 5 min), pelo roteiro em [`roteiro-video.md`](roteiro-video.md). **Gravar por último**, com tudo pronto.

---

## 10. Ordem de execução

| Etapa | Conteúdo | Depende de | Peso que destrava |
| --- | --- | --- | --- |
| 1 | Épico A (correções e segurança) + Épico B (testes) | — | base de 20% |
| 2 | Épico C (pipeline) | 1 | 20% |
| 3 | Épico E: `ProcessEvent` + instrumentação + `/api/health` (Épico D) | 1 | 25% + 10% |
| 4 | Épico E: simulador + análise pm4py + página `/process` | 3 | 25% |
| 5 | Arquitetura final + coleta de evidências (prints, logs) | 2–4 | 15% + 20% |
| 6 | Documentação livre + PDF | 5 | todas |
| 7 | Slides do pitch | 6 | 10% |
| 8 | Gravação e edição dos vídeos | tudo | 25% + 10% |

## 11. Checklist de evidências (pasta `docs/fase7/evidencias/`)

- [ ] `docker compose ps` com todos os serviços saudáveis
- [ ] Log do producer publicando e do consumer gravando e gerando ALERTA
- [ ] Dashboard, analytics, alertas e sino de notificação com dados do stream
- [ ] E-mail de relatório recebido
- [ ] Workflow verde no GitHub Actions (visão geral + cada job)
- [ ] Resumo de cobertura de testes no workflow
- [ ] Aba Security (CodeQL/Trivy) + antes/depois de uma vulnerabilidade
- [ ] `/api/health` em JSON (saudável e degradado, derrubando o Kafka)
- [ ] `/monitor` e Kafka UI com mensagens fluindo
- [ ] Trecho do event log (CSV), mapa do processo, variantes, gráfico de gargalos
- [ ] Página `/process`
