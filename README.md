<div align="center">

# PlantGuard AI

### Diagnóstico inteligente de doenças em plantas com IA

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://www.prisma.io/)
[![Google Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-AI-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Demonstração](#-demonstração) · [Funcionalidades](#-funcionalidades) · [Instalação](#-instalação) · [Tecnologias](#%EF%B8%8F-tecnologias) · [Equipe](#-equipe)

</div>

---

## Sobre o Projeto

**PlantGuard AI** é uma aplicação web que utiliza inteligência artificial para diagnosticar doenças em plantas e avaliar a qualidade de alimentos a partir de fotos. O usuário envia uma imagem e recebe, em segundos, um diagnóstico detalhado com nível de confiança, descrição da condição, recomendações de tratamento e evidências visuais identificadas.

A análise é realizada pelo **Google Gemini 2.5 Flash**, configurado como um agrônomo sênior especialista em fitopatologia, nutrição vegetal e segurança alimentar.

---

## Funcionalidades

- **Upload de imagens** — arraste e solte ou selecione fotos (JPEG, PNG, WebP — até 10 MB)
- **Diagnóstico por IA** — análise automática com status (Saudável, Doente ou Inconclusivo), tipo da planta, patologia detectada e nível de confiança (0–100%)
- **Recomendações de tratamento** — orientações práticas de manejo baseadas no diagnóstico
- **Evidências visuais** — lista dos sinais identificados na imagem
- **Histórico de análises** — consulta paginada com filtros por status
- **Exportação de dados** — exporte o histórico em CSV ou JSON
- **Autenticação segura** — registro e login com email/senha, sessões JWT e rotas protegidas
- **Design responsivo** — interface adaptada para desktop, tablet e celular
- **Rate limiting** — proteção contra uso abusivo nas rotas de registro e análise

---

## Demonstração

| Landing Page | Dashboard | Resultado da Análise |
|:---:|:---:|:---:|
| Página inicial com apresentação do projeto | Upload de imagens para análise | Diagnóstico detalhado com recomendações |

---

## Instalação

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18+
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)
- Conta no [Google AI Studio](https://aistudio.google.com/) para obter a chave da API Gemini
- Banco PostgreSQL (recomendado: [Supabase](https://supabase.com/))

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/plantguard.git
cd plantguard

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
```

Preencha o arquivo `.env`:

```env
# Database (PostgreSQL via Supabase)
DATABASE_URL="postgresql://usuario:senha@host:porta/banco"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="gere_com_openssl_rand_base64_32"

# Google Gemini AI
GEMINI_API_KEY="sua_chave_api_gemini"
```

```bash
# 4. Crie as tabelas no banco
npx prisma db push

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Tecnologias

### Frontend

| Tecnologia | Versão | Descrição |
|---|---|---|
| **Next.js** | 16.1.6 | Framework React com App Router e Server Components |
| **React** | 19.2.3 | Biblioteca para construção de interfaces |
| **TypeScript** | 5 | Tipagem estática |
| **Tailwind CSS** | 4 | Framework de estilos utilitários |
| **shadcn/ui** | — | Componentes acessíveis e customizáveis |
| **React Hook Form** | 7 | Gerenciamento de formulários |
| **Zod** | 4 | Validação de schemas |
| **Lucide React** | — | Ícones |

### Backend

| Tecnologia | Versão | Descrição |
|---|---|---|
| **NextAuth.js** | 5 (beta) | Autenticação com Credentials provider e JWT |
| **Prisma ORM** | 7.4.2 | ORM para PostgreSQL com type-safety |
| **bcryptjs** | 3 | Hash de senhas (12 rounds) |
| **Google Gemini** | 2.5 Flash | Modelo de IA para análise de imagens |

### Infraestrutura

| Serviço | Descrição |
|---|---|
| **Vercel** | Deploy e hosting da aplicação |
| **Supabase** | Banco de dados PostgreSQL gerenciado |
| **Google AI Studio** | API do modelo Gemini |

---

## Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/          # Endpoint de análise de imagem
│   │   ├── history/          # Endpoint de histórico
│   │   └── auth/             # Registro e NextAuth handlers
│   ├── dashboard/            # Página protegida de análise
│   ├── history/              # Página protegida de histórico
│   ├── login/                # Página de login/registro
│   └── page.tsx              # Landing page
├── components/
│   ├── ui/                   # Componentes shadcn/ui
│   ├── AnalysisCard.tsx      # Card de resultado da análise
│   ├── UploadZone.tsx        # Zona de upload drag-and-drop
│   ├── HistoryTable.tsx      # Tabela de histórico paginada
│   └── Navbar.tsx            # Navegação com menu do usuário
├── hooks/
│   └── useAnalysis.ts        # Hook de estado e lógica de análise
├── lib/
│   ├── auth.ts               # Configuração do NextAuth
│   ├── gemini.ts             # Integração com Gemini AI
│   ├── prisma.ts             # Singleton do Prisma Client
│   ├── rate-limit.ts         # Rate limiter em memória
│   └── validations/          # Schemas Zod
└── types/                    # Definições de tipos
```

---

## Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|---|---|---|
| `DATABASE_URL` | Connection string do PostgreSQL | `postgresql://user:pass@host:6543/db` |
| `NEXTAUTH_URL` | URL base da aplicação | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Secret para assinatura JWT | `openssl rand -base64 32` |
| `GEMINI_API_KEY` | Chave da API Google Gemini | Obtida no Google AI Studio |

---

## Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção (inclui `prisma generate`) |
| `npm run start` | Inicia o servidor de produção |
| `npm run lint` | Executa o ESLint |
| `npx prisma db push` | Sincroniza o schema com o banco de dados |
| `npx prisma studio` | Abre o Prisma Studio para visualizar dados |

---

## Deploy na Vercel

1. Faça push do repositório para o GitHub
2. Importe o projeto na [Vercel](https://vercel.com/)
3. Configure as variáveis de ambiente no painel da Vercel:
   - `DATABASE_URL` (use a connection string do **pooler** do Supabase, porta `6543`)
   - `NEXTAUTH_URL` (URL do deploy, ex: `https://plantguard.vercel.app`)
   - `NEXTAUTH_SECRET`
   - `GEMINI_API_KEY`
4. Rode `npx prisma db push` localmente com a `DATABASE_URL` de produção para criar as tabelas
5. Faça o deploy

---

## Equipe

Projeto desenvolvido por alunos do **4o ano de Engenharia de Software** da **FIAP** para a atividade **AgroSmart**.

| Nome | RM |
|---|---|
| **Gustavo Cristiano Pessoa de Souza** | RM 551924 |
| **Ricardo Akira Kato Lopes** | RM 551447 |
| **Kevin Richard Xavier** | RM 551736 |
| **Vinicius do Carmo Fonseca Freitas** | RM 97599 |
| **Gustavo Medeiros Miranda da Silva** | RM 552093 |

---

<div align="center">

Feito com dedicação para a atividade AgroSmart — FIAP 2026

</div>
