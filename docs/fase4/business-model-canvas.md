# Business Model Canvas — AgroSmart / PlantGuard AI

Modelo de negócio para a solução de diagnóstico inteligente de doenças em plantas por IA.

---

## 1. Segmentos de Clientes (Customer Segments)
- **Pequenos e médios produtores rurais** (hortaliças, fruticultura, café, grãos) que não têm agrônomo dedicado.
- **Cooperativas agrícolas** que prestam suporte técnico a associados.
- **Agrônomos e consultores técnicos** que querem triagem rápida em escala.
- **Revendas de insumos agrícolas** (defensivos/fertilizantes) que oferecem o diagnóstico como serviço de valor agregado.
- **Agtechs e integradores** que consomem a API de diagnóstico (B2B2C).

## 2. Proposta de Valor (Value Propositions)
- **Diagnóstico de doenças em segundos** a partir de uma foto, com nível de confiança (0–100%).
- **Recomendações de manejo acionáveis** para cada diagnóstico.
- **Detecção precoce** que reduz perdas de safra e uso desnecessário de defensivos.
- **Acessível e sem hardware especializado** — funciona pelo celular.
- **Dashboard de analytics e alertas automáticos** por cultura/patologia, com histórico exportável (CSV/JSON).
- **Pipeline em tempo real**: integra fluxos contínuos (sensores/câmeras de campo) via streaming.

## 3. Canais (Channels)
- **Aplicação web responsiva** (PWA) — acesso direto no navegador/celular.
- **API/SaaS** para integração com sistemas de cooperativas e agtechs.
- **Parcerias com revendas e cooperativas** como canal de distribuição.
- **Marketing digital** (redes sociais do agro, eventos como Agrishow) e indicação.

## 4. Relacionamento com Clientes (Customer Relationships)
- **Self-service** na plataforma (cadastro, upload, histórico).
- **Suporte técnico** e onboarding para planos pagos/cooperativas.
- **Notificações e alertas automáticos** (e-mail/in-app) que mantêm engajamento.
- **Comunidade e base de conhecimento** sobre patologias e manejo.

## 5. Fontes de Receita (Revenue Streams)
- **Assinatura SaaS (freemium)**: plano gratuito com limite de análises; planos pagos por volume.
- **Cobrança por uso da API** (pay-per-analysis) para integradores B2B.
- **Licenciamento para cooperativas/revendas** (contas multiusuário).
- **Relatórios e analytics premium** (tendências por cultura/região).

## 6. Recursos-Chave (Key Resources)
- **Modelo de IA** (Google Gemini 2.5 Flash) configurado como agrônomo especialista.
- **Plataforma de software** (Next.js, PostgreSQL, pipeline Kafka).
- **Base de dados de análises** que cresce e gera inteligência por cultura.
- **Time de engenharia e conhecimento agronômico**.

## 7. Atividades-Chave (Key Activities)
- **Desenvolvimento e manutenção da plataforma e do pipeline de dados**.
- **Curadoria/ajuste do modelo de IA** e validação dos diagnósticos.
- **Operação da infraestrutura** (containers, banco, streaming).
- **Vendas, parcerias e suporte ao cliente**.

## 8. Parcerias-Chave (Key Partnerships)
- **Google AI** (provedor do modelo de IA).
- **Provedores de nuvem/infra** (Vercel, Supabase/Postgres gerenciado).
- **Cooperativas, revendas de insumos e consultorias agronômicas** (distribuição e validação).
- **Universidades/centros de pesquisa agrícola** (validação científica das patologias).

## 9. Estrutura de Custos (Cost Structure)
- **Custos de IA** (chamadas ao modelo Gemini — variável por uso).
- **Infraestrutura em nuvem** (hosting, banco, broker de streaming).
- **Desenvolvimento e manutenção** (time de engenharia).
- **Aquisição de clientes** (marketing, parcerias, eventos).
- **Suporte e operação**.

---

### Resumo da grade (visão Canvas)

| Parcerias-Chave | Atividades-Chave | Proposta de Valor | Relacionamento | Segmentos |
|---|---|---|---|---|
| Google AI; nuvem; cooperativas/revendas; pesquisa agrícola | Plataforma + pipeline; ajuste de IA; operação; vendas | Diagnóstico em segundos por foto; recomendações; detecção precoce; dashboard+alertas | Self-service; suporte; alertas automáticos; comunidade | Produtores P/M; cooperativas; agrônomos; revendas; agtechs |
| | **Recursos-Chave**: IA Gemini; plataforma; base de dados; time | | **Canais**: app web/PWA; API/SaaS; revendas; marketing | |
| **Estrutura de Custos**: IA (Gemini), infra nuvem, engenharia, aquisição, suporte || **Fontes de Receita**: assinatura SaaS freemium; API por uso; licença cooperativas; analytics premium |||
