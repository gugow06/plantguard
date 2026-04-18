# Especificação: Painel de Visualização de Dados e Integração com Fonte de Dados

## 1. Visão Geral

Evolução do dashboard existente do PlantGuard para incluir um painel analítico interativo com métricas visuais baseadas nos dados de análise do usuário autenticado, além de integração com fonte de dados externa (CSV/JSON) para importação e exportação de dados.

**Escopo:** Todas as métricas e visualizações são **por usuário** (filtradas pelo `userId` da sessão autenticada).

---

## 2. Arquitetura Atual (Contexto)

- **Frontend:** Next.js 16 + React 19 + Tailwind CSS 4 + shadcn/ui
- **Backend:** Next.js API Routes + Prisma ORM
- **Banco:** PostgreSQL (modelo `Analysis` com campos: status, plantType, pathology, confidence, createdAt, userId)
- **Auth:** NextAuth.js v5 com JWT
- **Dashboard atual:** Upload de imagem → análise via Gemini → exibição de resultado. Sem gráficos ou métricas agregadas.

---

## 3. Requisito 1 — Painel de Visualização de Dados

### 3.1 Nova Rota: `/dashboard/analytics`

Página protegida (requer autenticação) acessível via navbar. Exibe métricas agregadas do histórico de análises do usuário.

### 3.2 Métricas e Componentes Visuais

#### Card de Resumo (KPI Cards)
Quatro cards no topo da página:

| Métrica | Descrição | Ícone |
|---------|-----------|-------|
| **Total de Análises** | Contagem total de imagens analisadas pelo usuário | `ImageIcon` |
| **Taxa de Saúde** | % de análises com status "Saudável" | `HeartPulse` |
| **Patologias Detectadas** | Quantidade de patologias distintas encontradas | `Bug` |
| **Confiança Média** | Média do campo `confidence` de todas as análises | `Target` |

#### Gráfico 1 — Distribuição de Status (Donut/Pie Chart)
- **Dados:** Contagem de análises agrupadas por `status` (Saudável, Doente, Inconclusivo)
- **Cores:** Verde (Saudável), Vermelho (Doente), Âmbar (Inconclusivo)
- **Interação:** Tooltip com contagem e percentual ao passar o mouse

#### Gráfico 2 — Frequência por Patologia (Bar Chart Horizontal)
- **Dados:** Top 10 patologias mais frequentes agrupadas por `pathology`
- **Filtro:** Exclui registros onde `pathology` é null (plantas saudáveis)
- **Interação:** Tooltip com contagem, barra com cor vermelha gradiente

#### Gráfico 3 — Tendência Temporal (Line/Area Chart)
- **Dados:** Contagem de análises agrupadas por dia/semana/mês (selecionável)
- **Séries:** Uma linha por status (Saudável, Doente, Inconclusivo)
- **Eixo X:** Data (formatada pt-BR)
- **Eixo Y:** Quantidade de análises
- **Interação:** Tooltip com detalhamento, seletor de período (7d, 30d, 90d, 12m)

#### Gráfico 4 — Espécies Mais Analisadas (Bar Chart Vertical)
- **Dados:** Top 10 plantas mais analisadas agrupadas por `plantType`
- **Filtro:** Exclui "Não identificado"
- **Interação:** Tooltip com contagem, cores diferenciadas por planta

#### Gráfico 5 — Distribuição de Confiança (Histogram)
- **Dados:** Distribuição do campo `confidence` em faixas (0-29%, 30-49%, 50-69%, 70-89%, 90-100%)
- **Visualização:** Barras verticais com cores correspondentes às faixas (vermelho → verde)
- **Interação:** Tooltip com contagem por faixa

### 3.3 Filtros Globais

Barra de filtros no topo do painel (abaixo dos KPI cards):

- **Período:** Seletor de data inicial e final (date picker)
- **Status:** Multi-select (Saudável, Doente, Inconclusivo)
- **Tipo de Planta:** Dropdown com plantas já analisadas pelo usuário

Todos os gráficos reagem aos filtros em tempo real (client-side filtering sobre os dados já carregados).

### 3.4 Biblioteca de Gráficos

**Recomendação:** [Recharts](https://recharts.org/) — biblioteca React declarativa, leve, compatível com shadcn/ui e Tailwind.

```
npm install recharts
```

Alternativa: Tremor (mais integrada com Tailwind, porém mais pesada).

---

## 4. Requisito 2 — Integração com Fonte de Dados

### 4.1 Fonte Primária: Banco de Dados PostgreSQL (já existente)

Os dados já estão no modelo `Analysis` do Prisma. A API de analytics consultará diretamente o banco.

### 4.2 Importação de Dados Externos (CSV/JSON)

Permitir que o usuário importe um arquivo CSV ou JSON com dados históricos de análises para popular o dashboard.

#### Endpoint: `POST /api/import`

**Request:** `multipart/form-data` com arquivo `.csv` ou `.json`

**Formato CSV esperado:**
```csv
imageName,status,plantType,pathology,confidence,description,recommendations,createdAt
foto1.jpg,Doente,Tomate,Septoriose,85.5,"Manchas nas folhas","Aplicar fungicida",2025-03-15T10:00:00Z
```

**Formato JSON esperado:**
```json
[
  {
    "imageName": "foto1.jpg",
    "status": "Doente",
    "plantType": "Tomate",
    "pathology": "Septoriose",
    "confidence": 85.5,
    "description": "Manchas nas folhas",
    "recommendations": "Aplicar fungicida",
    "createdAt": "2025-03-15T10:00:00Z"
  }
]
```

**Validação:**
- Zod schema para cada registro importado
- Status deve ser: "Saudável" | "Doente" | "Inconclusivo"
- Confidence: 0-100
- Campos obrigatórios: imageName, status, confidence
- Limite: 500 registros por importação
- Rate limit: 5 importações por hora por usuário

**Processamento:**
1. Parse do arquivo (CSV com lib `papaparse` ou JSON nativo)
2. Validação de cada registro
3. Criação em batch no banco (`createMany`) vinculado ao `userId`
4. Retorno: `{ imported: N, errors: [...] }`

#### Componente: `ImportButton`
- Botão na página de analytics: "Importar Dados"
- Modal com drag-and-drop para arquivo CSV/JSON
- Preview dos primeiros 5 registros antes de confirmar
- Feedback de progresso e resultado (X importados, Y erros)

### 4.3 Exportação Aprimorada

Expandir o `ExportButton` existente (já em `/history`) para incluir:
- Exportação dos dados filtrados do painel analítico
- Formato adicional: `.xlsx` (opcional, via `xlsx` lib)
- Inclusão de metadados: período, filtros aplicados, data de exportação

### 4.4 API de Analytics

#### Endpoint: `GET /api/analytics`

**Query params:**
- `startDate` (ISO string, opcional)
- `endDate` (ISO string, opcional)
- `status` (string, opcional, múltiplos separados por vírgula)
- `plantType` (string, opcional)

**Response:**
```json
{
  "summary": {
    "totalAnalyses": 150,
    "healthRate": 62.5,
    "distinctPathologies": 8,
    "averageConfidence": 78.3
  },
  "statusDistribution": [
    { "status": "Saudável", "count": 94 },
    { "status": "Doente", "count": 45 },
    { "status": "Inconclusivo", "count": 11 }
  ],
  "pathologyFrequency": [
    { "pathology": "Septoriose", "count": 15 },
    { "pathology": "Oídio", "count": 12 }
  ],
  "timeline": [
    { "date": "2025-03-01", "saudavel": 5, "doente": 2, "inconclusivo": 1 }
  ],
  "plantTypeFrequency": [
    { "plantType": "Tomate", "count": 45 },
    { "plantType": "Soja", "count": 30 }
  ],
  "confidenceDistribution": [
    { "range": "90-100", "count": 40 },
    { "range": "70-89", "count": 55 }
  ]
}
```

**Implementação:** Queries Prisma com `groupBy`, `count`, `avg` — tudo filtrado por `userId` da sessão.

---

## 5. Estrutura de Arquivos (Novos/Modificados)

```
src/
├── app/
│   ├── dashboard/
│   │   └── analytics/
│   │       └── page.tsx                    # NOVO — página de analytics
│   └── api/
│       ├── analytics/
│       │   └── route.ts                    # NOVO — endpoint de métricas
│       └── import/
│           └── route.ts                    # NOVO — endpoint de importação
├── components/
│   ├── analytics/
│   │   ├── AnalyticsDashboard.tsx          # NOVO — container principal
│   │   ├── KpiCards.tsx                    # NOVO — cards de resumo
│   │   ├── StatusPieChart.tsx              # NOVO — gráfico donut
│   │   ├── PathologyBarChart.tsx           # NOVO — barras horizontais
│   │   ├── TimelineChart.tsx              # NOVO — linha temporal
│   │   ├── PlantTypeChart.tsx             # NOVO — barras verticais
│   │   ├── ConfidenceHistogram.tsx        # NOVO — histograma
│   │   ├── AnalyticsFilters.tsx           # NOVO — barra de filtros
│   │   └── ImportModal.tsx                # NOVO — modal de importação
│   └── Navbar.tsx                          # MODIFICADO — adicionar link "Analytics"
├── hooks/
│   └── useAnalytics.ts                    # NOVO — fetch e estado do analytics
├── lib/
│   └── validations/
│       └── import.ts                      # NOVO — schema de validação de importação
└── types/
    └── analytics.ts                       # NOVO — tipos do analytics
```

---

## 6. Dependências Novas

```json
{
  "recharts": "^2.15.0",
  "papaparse": "^5.5.0",
  "@types/papaparse": "^5.3.0",
  "date-fns": "^4.1.0"
}
```

> `date-fns` pode já estar disponível indiretamente; verificar antes de instalar.

---

## 7. Alterações no Banco de Dados

**Nenhuma migração necessária.** Todos os dados já existem no modelo `Analysis`. As queries de analytics usam agregações sobre os campos existentes:
- `status` → distribuição
- `pathology` → frequência
- `plantType` → espécies
- `confidence` → distribuição e média
- `createdAt` → tendência temporal
- `userId` → filtro por usuário

Os registros importados via CSV/JSON usam o mesmo modelo `Analysis`, com `imageData` preenchido como string vazia (já que não há imagem real).

---

## 8. Fluxo do Usuário

```
1. Usuário faz login
2. Navega para Dashboard → Analytics (novo link na navbar)
3. Vê KPI cards com resumo geral dos seus dados
4. Explora gráficos interativos (hover para detalhes)
5. Aplica filtros (período, status, planta) → gráficos atualizam
6. [Opcional] Clica "Importar Dados" → faz upload de CSV/JSON
   → Preview → Confirma → Dados populam o painel
7. [Opcional] Exporta dados filtrados em CSV/JSON
```

---

## 9. Considerações de Performance

- **Paginação na API:** Para usuários com muitas análises, a timeline retorna dados já agrupados (não registros individuais)
- **Cache client-side:** `useAnalytics` hook com estado local, re-fetch apenas quando filtros mudam
- **Queries otimizadas:** Usar `groupBy` do Prisma em vez de carregar todos os registros e agregar no frontend
- **Índices existentes:** `Analysis` já tem índices em `userId` e `createdAt` — suficiente para as queries

---

## 10. Prioridade de Implementação

| Ordem | Item | Esforço |
|-------|------|---------|
| 1 | API `/api/analytics` com queries agregadas | Médio |
| 2 | Hook `useAnalytics` + tipos | Baixo |
| 3 | KPI Cards | Baixo |
| 4 | Gráfico de Status (Pie) | Baixo |
| 5 | Gráfico de Timeline | Médio |
| 6 | Gráfico de Patologias (Bar) | Baixo |
| 7 | Gráfico de Espécies (Bar) | Baixo |
| 8 | Histograma de Confiança | Baixo |
| 9 | Filtros globais | Médio |
| 10 | Importação CSV/JSON (API + Modal) | Médio |
| 11 | Navbar atualizada | Baixo |
| 12 | Exportação aprimorada | Baixo |
