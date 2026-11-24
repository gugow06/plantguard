<div align="center">

# PlantGuard

### Do diagnóstico à decisão no campo

[![DevSecOps](https://github.com/gugow06/plantguard/actions/workflows/devsecops.yml/badge.svg)](https://github.com/gugow06/plantguard/actions/workflows/devsecops.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-IA-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Kafka](https://img.shields.io/badge/Apache_Kafka-3.9-231F20?logo=apachekafka)](https://kafka.apache.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-compose-2496ED?logo=docker&logoColor=white)](infra/docker-compose.yml)

📄 **Documentação final:** [PDF](docs/fase7/PlantGuard-documentacao-livre.pdf) · [HTML](docs/fase7/documentacao-livre.html) · [Arquitetura](docs/fase7/arquitetura-final.md) · [Análise de processo](docs/fase7/processo/insights.md)

</div>

---

## Sobre

O **PlantGuard** recebe imagens de plantas — do celular do produtor ou de câmeras no campo —, diagnostica doenças com IA (**Google Gemini 2.5 Flash**), decide automaticamente quando é preciso agir (regras **R1–R4**) e avisa o produtor. A plataforma também **mede o próprio processo** (mineração de processos) para descobrir onde a resposta demora.

Projeto **PlantGuard** · desafio acadêmico **AgroSmart (FIAP)** · entrega final (Fase 7).

## Como funciona

```
ENTRADA                         PROCESSAMENTO                          SAÍDA
Câmeras de campo ──► Kafka ──► Consumer ──┐
Foto do produtor ──► API ──► Gemini ──────┼──► PostgreSQL ──► Regras R1–R4 ──► Alertas (sino + e-mail)
CSV/JSON ──────────► API ─────────────────┘                  └──────────────► Dashboard · Analytics · Processo
                                                MONITORAMENTO: /api/health · /monitor · Kafka UI · logs JSON
```

| Regra | Condição | Ação |
|---|---|---|
| R1 | alguma análise doente na espécie | alerta de doença |
| R2 | ≥ 50% das análises da espécie doentes | **intervenção urgente (crítico)** |
| R3 | mesma patologia em ≥ 3 análises | plano de controle |
| R4 | saudável com confiança ≤ 70% | diagnóstico incerto: refazer a foto |

## Executar

Pré-requisito: Docker.

```bash
cp infra/.env.example infra/.env          # defina NEXTAUTH_SECRET (openssl rand -base64 32); GEMINI_API_KEY é opcional
docker compose -f infra/docker-compose.yml up -d --build --wait
scripts/smoke-test.sh                     # confere o fluxo producer → Kafka → consumer → Postgres → app
```

| Endereço | O que é |
|---|---|
| http://localhost:3000 | App — login demo `agrosmart-stream@demo.local` / `stream123` |
| http://localhost:3000/monitor | Monitor do pipeline e saúde dos serviços |
| http://localhost:3000/process | Mineração de processos (mapa, variantes, gargalos) |
| http://localhost:3000/api/health | Saúde da plataforma (JSON) |
| http://localhost:8080 | Kafka UI |

Para a demonstração contínua, defina `STREAM_MAX_MESSAGES=0` e `STREAM_INTERVAL_MS=5000` no `infra/.env`.

### Mineração de processos

```bash
npm run process:simulate                                  # cenário simulado reproduzível (seed fixa), só em banco local
docker build -t plantguard-process-mining analysis/process-mining
docker run --rm -v "$PWD":/work plantguard-process-mining \
  docs/fase7/processo/event-log.csv docs/fase7/processo simulado
```

Detalhes em [analysis/process-mining/README.md](analysis/process-mining/README.md).

### Desenvolvimento local

```bash
npm install --legacy-peer-deps
npm run dev            # app em http://localhost:3000 (usa DATABASE_URL do .env)
npm test               # testes unitários (Vitest)
npm run test:coverage  # com cobertura (mínimo 70%)
npm run lint && npm run typecheck
npm run docs:pdf       # gera o PDF da documentação a partir do HTML
```

## Pipeline DevSecOps

[`.github/workflows/devsecops.yml`](.github/workflows/devsecops.yml), a cada push e pull request:

| Etapa | Ferramentas |
|---|---|
| Qualidade | ESLint, `tsc`, Vitest com cobertura mínima de 70% |
| Segredos | Gitleaks no histórico inteiro |
| Dependências e IaC | `npm audit` (falha em high/critical), Trivy fs |
| SAST | CodeQL |
| Build | imagens Docker do app e do streaming + Trivy nas imagens |
| Ponta a ponta | `docker compose up`, smoke test, Kafka derrubado e recuperado |
| Publicação | imagens no GitHub Container Registry (só na `main`) |

Resultados SARIF na aba *Security*. Evidências de antes e depois em [docs/fase7/evidencias/pipeline](docs/fase7/evidencias/pipeline).

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Interface e API | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Recharts |
| Autenticação | NextAuth v5 (e-mail/senha e Google), bcrypt, rate limit |
| IA | Google Gemini 2.5 Flash |
| Dados | PostgreSQL 16, Prisma 7 |
| Streaming | Apache Kafka 3.9 (KRaft), kafkajs |
| E-mail | Resend |
| Processo | event log próprio + pm4py |
| Infra e CI | Docker, docker compose, GitHub Actions, Trivy, CodeQL, Gitleaks |

## Estrutura

```
src/app/            páginas e rotas da API (analyze, health, process, stream/monitor…)
src/lib/            regras, analytics, saúde, event log, mineração de processos (+ testes)
infra/              docker-compose, producer/consumer Kafka, simulador de processo
analysis/           análise de processos com pm4py (container)
scripts/            smoke test e geração do PDF
.github/workflows/  pipeline DevSecOps
docs/               documentação por fase (docs/fase7 = entrega final)
```

## Uso de IA generativa

| Ferramenta | Uso |
|---|---|
| Google Gemini 2.5 Flash | No produto: diagnóstico das imagens e relatório de IA do campo |
| Claude Code (Anthropic) | Assistente de desenvolvimento: código e revisão, testes, pipeline, correções de segurança, análise de processos e documentação |

## Equipe

Projeto desenvolvido por alunos do **4o ano de Engenharia de Software** da **FIAP** para a atividade **AgroSmart**.

| Nome | RM |
|---|---|
| **Gustavo Cristiano Pessoa de Souza** | RM 551924 |
| **Ricardo Akira Kato Lopes** | RM 551447 |
| **Kevin Richard Xavier** | RM 551736 |
| **Vinicius do Carmo Fonseca Freitas** | RM 97599 |
| **Gustavo Medeiros Miranda da Silva** | RM 552093 |
