# Modelo de Negócio e Inteligência de Dados — PlantGuard (Fase 5)

> **Objetivo desta entrega:** atualizar o modelo de negócio da solução PlantGuard,
> incorporando o uso intensivo de dados e inteligência. Devem ser considerados aspectos como:
> **proposta de valor**, **fontes de receita**, **monetização baseada em dados** e
> **parcerias estratégicas**.

Atualização do modelo de negócio da solução PlantGuard, agora incorporando **uso intensivo
de dados e inteligência**. Complementa o [Business Model Canvas da Fase 4](../fase4/business-model-canvas.md),
aprofundando os quatro eixos exigidos: **proposta de valor**, **fontes de receita**,
**monetização baseada em dados** e **parcerias estratégicas**.

O diferencial da Fase 5 é que a PlantGuard deixa de ser "um app que diagnostica fotos" e
passa a ser uma **plataforma de inteligência de dados agrícolas**: cada análise alimenta um
**Data Lake** (bruta → confiável → refinada) que gera benchmarks, alertas e o
**relatório de decisão por IA generativa** — o dado vira ativo estratégico.

---

## 1. Proposta de Valor (orientada a dados)

- **Da foto ao insight gerencial**: além do diagnóstico por imagem, a plataforma entrega um
  **relatório de IA de apoio à decisão** (nível de risco, prioridades, recomendações e
  previsão) a partir de **todo o histórico do campo** — não de uma foto isolada.
- **Detecção precoce e priorização**: alertas automáticos por cultura/patologia (regras
  R1–R4) + IA generativa dizem **o que fazer primeiro**, reduzindo perdas e uso
  desnecessário de defensivos.
- **Benchmarking**: comparação da saúde do campo com médias regionais e por cultura
  (inteligência coletiva, com dados agregados e anonimizados).
- **Enriquecimento por clima**: correlação com dados de API meteorológica para antecipar
  janelas de risco fúngico.
- **Decisão baseada em evidência**: dashboards, tendências temporais e histórico exportável
  (CSV/JSON) — a base para decisões agronômicas defensáveis.

## 2. Fontes de Receita

- **Assinatura SaaS (freemium)**: plano gratuito com limite de análises; planos pagos por
  volume e por acesso aos recursos de inteligência (relatório de IA, benchmarks).
- **Tiers baseados em inteligência**: o **relatório de IA de decisão** e os **benchmarks
  regionais** como recursos de planos superiores (Pro/Cooperativa).
- **API pay-per-use (B2B)**: cobrança por análise e por chamada ao endpoint de insights
  para agtechs e integradores.
- **Licenciamento multiusuário** para cooperativas e revendas.
- **Relatórios/analytics premium** (tendências por cultura/região, sazonalidade).

## 3. Monetização baseada em dados

Este é o núcleo da Fase 5 — como o **dado acumulado** vira receita, sempre com
consentimento e anonimização:

- **Benchmarks e índices regionais**: painéis agregados e anônimos ("índice de incidência
  de míldio na sua região") vendidos como assinatura de inteligência de mercado.
- **Relatórios de tendência por cultura/região**: dados de safra agregados como produto de
  dados para cooperativas, revendas e indústria de insumos.
- **Alertas preditivos premium**: cruzamento de histórico + clima para prever surtos —
  monetizado como recurso avançado.
- **Data sharing B2B (opt-in)**: conjuntos de dados anonimizados para fabricantes de
  defensivos/sementes calibrarem recomendações e P&D (o produtor pode optar por participar,
  eventualmente com desconto na assinatura).
- **Modelos verticais treinados**: a base rotulada (diagnósticos + confirmações de campo)
  como ativo para melhorar/ajustar modelos específicos por cultura.

> **Governança**: monetização de dados só sobre dados **agregados e anonimizados**, com
> **opt-in explícito** e isolamento por `userId` — alinhado à LGPD (ver estratégia de
> manutenção em [ingestao-fluxo.md](./ingestao-fluxo.md)).

## 4. Parcerias Estratégicas

- **Google AI (Gemini)** — provedor do modelo generativo (diagnóstico + relatório de decisão).
- **Cooperativas agrícolas** — distribuição, base de usuários e validação de campo dos
  diagnósticos (retroalimenta a qualidade do dado).
- **Revendas de insumos** — canal de distribuição e parceiros de monetização de dados
  (recomendações calibradas por dados regionais).
- **Provedores de dados meteorológicos** (ex.: Open-Meteo/INMET) — enriquecimento climático
  para alertas preditivos.
- **Universidades e centros de pesquisa agrícola** (ex.: Embrapa, ESALQ) — validação
  científica das patologias e credibilidade dos benchmarks.
- **Provedores de nuvem/infra** (Supabase/Postgres, hospedagem) — operação da plataforma e
  do Data Lake.

---

## Expansão futura — sensores IoT

A solução atual é **vision-first** (imagens + arquivos + APIs); **não usa sensores** hoje.
Como **roadmap de crescimento**, sensores de campo (umidade de solo, temperatura, molhamento
foliar) são um canal de ingestão natural para o Data Lake já projetado — adicionariam uma
fonte estruturada em tempo real e reforçariam os alertas preditivos, sem alterar as camadas
(bruta → confiável → refinada). Fica registrado como oportunidade, não como funcionalidade
existente.

---

## Resumo — o que muda em relação à Fase 4

| Eixo | Fase 4 | Fase 5 (inteligência de dados) |
|------|--------|-------------------------------|
| Proposta de valor | Diagnóstico por foto + dashboard | + Relatório de IA de decisão sobre o histórico + benchmarks + clima |
| Receita | SaaS freemium; API; licença; analytics | + Tiers de inteligência; alertas preditivos; data sharing opt-in |
| Dados | Base que cresce | **Ativo monetizável** (benchmarks, tendências, modelos verticais) |
| Parcerias | Google AI; nuvem; coops; pesquisa | + Provedores de clima; indústria de insumos como parceira de dados |
