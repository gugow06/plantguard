# 🌱 PlantGuard AI — Especificação Técnica

## Sistema de Reconhecimento de Saúde de Plantações e Alimentos

**Versão:** 1.0.0  
**Data:** Março 2026  
**Autor:** Equipe de Engenharia PlantGuard  

---

## 1. Visão Geral

O **PlantGuard AI** é uma aplicação web que permite a agricultores, agrônomos e entusiastas de jardinagem analisar a saúde de plantas e alimentos através de imagens processadas por inteligência artificial. O sistema utiliza o modelo Google Gemini com um System Prompt de Especialista Agrônomo para fornecer diagnósticos estruturados com nível de confiança estimado.

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|---|---|---|
| **Framework** | Next.js 14+ (App Router) | SSR, RSC, API Routes integradas |
| **Linguagem** | TypeScript | Segurança de tipos e manutenibilidade |
| **Estilização** | Tailwind CSS + shadcn/ui | Design system consistente e customizável |
| **IA** | Google Gemini API (`gemini-1.5-flash`) | Processamento multimodal (texto + imagem) |
| **ORM/DB** | Prisma + SQLite | Prototipagem rápida, zero config |
| **Autenticação** | NextAuth.js (v5) | OAuth + Credentials, sessões seguras |
| **Exportação** | file-saver + json2csv | Geração client-side de CSV/JSON |

---

## 3. Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                │
│                                                     │
│  ┌─────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │  Login/  │  │ Dashboard│  │    Histórico +    │  │
│  │ Cadastro │  │  Upload  │  │    Exportação     │  │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│       │              │                 │             │
├───────┴──────────────┴─────────────────┴─────────────┤
│                  API ROUTES (Next.js)                │
│                                                     │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  /auth   │  │  /analyze    │  │  /history      │  │
│  │  (NextA) │  │  (Gemini AI) │  │  (CRUD)        │  │
│  └────┬─────┘  └──────┬───────┘  └───────┬────────┘  │
│       │               │                  │           │
├───────┴───────────────┴──────────────────┴───────────┤
│              CAMADA DE DADOS (Prisma)                │
│                                                     │
│  ┌──────────────────────────────────────────────┐    │
│  │              SQLite Database                  │    │
│  │  Users | Analyses | Sessions | Accounts      │    │
│  └──────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  Google Gemini API    │
              │  gemini-1.5-flash     │
              │  (Vision + Text)      │
              └───────────────────────┘
```

---

## 4. Estrutura de Pastas

```
plantguard-ai/
├── prisma/
│   ├── schema.prisma
│   └── dev.db                  (gerado)
├── public/
│   └── placeholder.svg
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── analyze/route.ts
│   │   │   └── history/route.ts
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   └── history/
│   │       └── page.tsx
│   ├── components/
│   │   ├── ui/                 (shadcn/ui)
│   │   ├── AnalysisCard.tsx
│   │   ├── UploadZone.tsx
│   │   ├── HistoryTable.tsx
│   │   ├── ExportButton.tsx
│   │   ├── Navbar.tsx
│   │   └── StatusBadge.tsx
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── gemini.ts
│   │   └── utils.ts
│   └── types/
│       └── analysis.ts
├── .env.local
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── SPEC.md
```

---

## 5. Schema do Banco de Dados (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id            String     @id @default(cuid())
  name          String?
  email         String     @unique
  emailVerified DateTime?
  password      String?
  image         String?
  accounts      Account[]
  sessions      Session[]
  analyses      Analysis[]
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

model Analysis {
  id              String   @id @default(cuid())
  userId          String
  imageName       String
  imageData       String
  status          String         // "Saudável" | "Doente" | "Inconclusivo"
  confidence      Float          // 0-100
  description     String
  recommendations String
  plantType       String?
  pathology       String?
  rawResponse     String?
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([userId])
  @@index([createdAt])
}
```

---

## 6. Configuração da IA — Google Gemini

### 6.1 System Prompt (Especialista Agrônomo)

```
Você é o Dr. PlantGuard, um agrônomo sênior com 30 anos de experiência em 
fitopatologia, nutrição vegetal e segurança alimentar. Sua especialidade é 
diagnosticar doenças em plantas e avaliar a qualidade de alimentos através 
de análise visual.

REGRAS OBRIGATÓRIAS:
1. Analise EXCLUSIVAMENTE a imagem fornecida.
2. Responda ESTRITAMENTE no formato JSON especificado abaixo.
3. NÃO inclua markdown, comentários ou texto fora do JSON.
4. Se a imagem NÃO for de uma planta ou alimento, retorne status "Inconclusivo".
5. O campo "confidence" é seu Nível de Confiança Baseado na Nitidez e 
   Evidências Visuais — NÃO é uma acurácia estatística de CNN.

FORMATO DE RESPOSTA (JSON):
{
  "status": "Saudável" | "Doente" | "Inconclusivo",
  "plantType": "Nome da planta ou alimento identificado",
  "pathology": "Nome da doença/problema (null se saudável)",
  "confidence": <número de 0 a 100>,
  "description": "Diagnóstico detalhado com observações visuais",
  "recommendations": "Recomendações práticas de tratamento ou manejo",
  "visualEvidence": ["Evidência visual 1", "Evidência visual 2"]
}

CRITÉRIOS DE CONFIANÇA:
- 90-100%: Imagem nítida, sintomas clássicos e inequívocos
- 70-89%: Boa qualidade, sintomas reconhecíveis
- 50-69%: Qualidade média, sintomas ambíguos
- 30-49%: Baixa qualidade ou sintomas atípicos
- 0-29%: Imagem inadequada ou sem evidências claras
```

### 6.2 Parâmetros de Geração

| Parâmetro | Valor | Justificativa |
|---|---|---|
| `model` | gemini-1.5-flash | Rápido e multimodal |
| `temperature` | 0.2 | Respostas determinísticas |
| `responseMimeType` | application/json | Força output JSON |
| `maxOutputTokens` | 1024 | Diagnósticos completos |

---

## 7. API Routes

### 7.1 POST `/api/analyze`

**Request Body:**
```json
{
  "image": "<base64_string>",
  "mimeType": "image/jpeg",
  "imageName": "tomate_folha.jpg"
}
```

**Response 200:**
```json
{
  "id": "clx123...",
  "status": "Doente",
  "plantType": "Tomate (Solanum lycopersicum)",
  "pathology": "Requeima (Phytophthora infestans)",
  "confidence": 87,
  "description": "A folha apresenta manchas necróticas...",
  "recommendations": "1. Remover folhas afetadas...",
  "createdAt": "2026-03-10T14:30:00Z"
}
```

### 7.2 GET `/api/history?page=1&limit=10`

**Response 200:**
```json
{
  "analyses": [...],
  "total": 42,
  "page": 1,
  "totalPages": 5
}
```

---

## 8. Componentes Principais

### 8.1 AnalysisCard
- Indicador de cor: Verde para Saudável, Vermelho para Doente, Âmbar para Inconclusivo
- Barra de progresso animada para confiança
- Seções expansíveis para descrição e recomendações
- Miniatura da imagem analisada

### 8.2 UploadZone
- Drag & drop com feedback visual
- Preview da imagem pré-envio
- Validação: JPEG, PNG, WebP — máximo 10MB
- Estado de loading com animação durante processamento

### 8.3 ExportButton
- Dropdown com opções CSV e JSON
- Geração client-side via `file-saver`
- Campos: imageName, status, description, confidence, plantType, pathology, createdAt

---

## 9. Variáveis de Ambiente

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<openssl rand -base64 32>"
GEMINI_API_KEY="<api_key_do_google_ai_studio>"
GOOGLE_CLIENT_ID=""        # Opcional para OAuth
GOOGLE_CLIENT_SECRET=""    # Opcional para OAuth
```

---

## 10. Design System — "Clean Agricultural Tech"

### Paleta de Cores
| Token | Hex | Uso |
|---|---|---|
| bg-primary | #f8faf5 | Background off-white verde |
| bg-secondary | #eef2e6 | Cards e seções |
| accent-green | #2d6a4f | Primário, saudável |
| accent-red | #c1121f | Alertas, doente |
| accent-amber | #d4a017 | Warnings, inconclusivo |
| text-primary | #1a1a2e | Texto principal |
| text-muted | #6b7280 | Texto secundário |

### Tipografia
- **Display:** Fraunces (serifa orgânica)
- **Body:** DM Sans (sans-serif)
- **Mono:** JetBrains Mono (dados técnicos)

### Princípios de UI
1. Espaçamento generoso
2. Bordas suaves (12-16px radius)
3. Sombras sutis
4. Lucide Icons
5. Microinterações suaves

---

## 11. Segurança
- Sanitização de inputs em todas API routes
- Rate limiting: 10 req/min por usuário em `/api/analyze`
- Validação server-side de tipo e tamanho de arquivo
- Hash de senhas com bcrypt (salt rounds: 12)
- CSRF via NextAuth
- Headers de segurança em `next.config.js`

---

## 12. Roadmap

| Fase | Feature | Prioridade |
|---|---|---|
| v1.1 | Análise em lote | Alta |
| v1.2 | PWA + modo offline | Alta |
| v1.3 | Geolocalização GPS | Média |
| v2.0 | Dashboard analytics | Média |
| v2.1 | API pública (drones/sensores) | Baixa |
| v3.0 | CNN fine-tuned própria | Baixa |

---

## 13. Como Executar

```bash
npm install
cp .env.example .env.local   # Configurar chaves
npx prisma generate
npx prisma db push
npm run dev                   # http://localhost:3000
```
