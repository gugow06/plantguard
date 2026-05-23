# PlantGuard AI — Orquestrador de Desenvolvimento

Registro de tudo que foi implementado e corrigido nas sessões de **22 e 23 de maio de 2026** (incluindo continuação no mesmo dia 23/05).

---

## Sessão 1 — 22/05/2026

---

### 1.1 Correções de Autenticação e Banco de Dados

#### Problema
Login e cadastro retornavam erro 500 ao tentar conectar com o banco Supabase.

#### Causas e Correções

**`src/lib/prisma.ts`**
- O Supabase usa `%40` (encoding de `@`) na senha da connection string. A biblioteca `pg` não decodifica URLs automaticamente, causando falha de autenticação
- Correção: parsear a URL com `new URL()` e aplicar `decodeURIComponent()` no username e password antes de passar ao `PrismaPg`
- Adicionado `ssl: { rejectUnauthorized: false }` para o pooler do Supabase
- Adicionado cast `as any` no construtor do `PrismaPg` para resolver conflito entre duas versões de `@types/pg` (global vs. bundled no adapter)

**`src/lib/auth.ts`**
- O método `authorize()` não tinha `try/catch` — erros de banco propagavam como 500
- Correção: envolver em `try/catch` retornando `null` para qualquer exceção

**Infraestrutura**
- Projeto Supabase estava pausado (plano gratuito) — reativado manualmente no dashboard

---

### 1.2 Lógica de Alertas por Análise

#### Objetivo
Exibir alertas linha a linha no histórico e por tipo de planta no dashboard, com base em regras de decisão configuráveis.

#### Regras Implementadas

| Regra | Condição | Severidade |
|-------|----------|------------|
| R1 | `doente > 0` | warning |
| R2 | `doente / total ≥ 0.50` | critical |
| R3 | Patologia dominante em ≥ 3 análises | warning |
| R4 | `saudável` com `confidence ≤ 70%` | warning |

#### `src/lib/decision-rules.ts` *(novo)*
- Define tipos: `AlertSeverity`, `PlantAlert`, `TriggeredRule`, `AlertRecord`
- Função `evaluatePlantAlert(breakdown, topPathology, topCount, lowConfidenceSaudavel)` retorna: `{ triggered, severity, diseaseRate, rules[], recommendation, prognosis }`

#### `src/lib/compute-alerts.ts` *(novo)*
- Agrupa `RawAnalysisRecord[]` por `plantType`, contabilizando: `saudavel`, `doente`, `inconclusivo`, `lowConfidenceSaudavel`, `pathologyCounts`
- Retorna `AlertRecord[]` após aplicar `evaluatePlantAlert()` em cada grupo

#### `src/app/api/alerts/route.ts` *(novo)*
- `GET /api/alerts?days=30` — autenticado
- Busca análises do usuário no período, aplica `computeAlerts()`, retorna lista de plantas com alerta ativo

#### `src/components/HistoryTable.tsx`
- Avaliação por linha via `getRowAlert(status, confidence)` — removida dependência da API `/api/alerts`
- Tipo `RowAlert`: `'disease' | 'uncertain' | 'inconclusive' | null`
- Componente `AlertBadge`: badge clicável vermelho (Doente), âmbar (Inconclusivo/Incerto), check verde (OK)
- Componente `AlertDetailModal`: confiança, patologia, diagnóstico, recomendação, prognóstico
- Modal "Inconclusivo" explica o motivo: confiança < 50% → qualidade de imagem; ≥ 50% → sintomas ambíguos
- Campo `recommendations` adicionado à interface `HistoryItem`

#### `src/components/PlantAlertModal.tsx` *(novo)*
- Modal para alertas agregados por tipo de planta (chamado pelo `AlertsSummary`)
- Mini gráfico donut (Recharts) com distribuição saudável/doente
- Taxa de saúde e taxa de doença em destaque
- Lista de regras ativadas com ID, label e descrição
- Recomendação e previsão de evolução

#### `src/components/analytics/AlertsSummary.tsx` *(novo)*
- Card colapsável que aparece no topo do dashboard quando há plantas em alerta
- Contagem de críticos vs. atenção
- Grid de botões por planta — clique abre `PlantAlertModal`
- Busca da API `/api/alerts` ou aceita `importedAlerts` como prop (para dados importados)

---

### 1.3 Sistema de Redefinição de Senha

#### Objetivo
Fluxo completo de forgot/reset password via email usando Resend como provedor.

#### `prisma/schema.prisma`
- Adicionado modelo `PasswordResetToken`:
  ```prisma
  model PasswordResetToken {
    id        String   @id @default(cuid())
    email     String
    token     String   @unique
    expiresAt DateTime
    createdAt DateTime @default(now())
    @@index([email])
  }
  ```
- Tabela criada via SQL raw (Prisma 7 sem `url` no schema); `prisma generate` executado após
- **Bug:** após o `generate`, o servidor precisou ser reiniciado para que `prisma.passwordResetToken` ficasse disponível em memória

#### `src/app/api/auth/forgot-password/route.ts` *(novo)*
- Rate limit: 3 tentativas/minuto por IP
- Validação de email com regex
- Nunca vaza se o email existe (resposta genérica em ambos os casos)
- Invalida tokens anteriores antes de criar novo
- Token: 32 bytes hex aleatório, expira em 1 hora
- Email HTML com botão de reset e link de cópia (Resend SDK)

#### `src/app/api/auth/reset-password/route.ts` *(novo)*
- Valida existência e expiração do token
- Hash da nova senha com bcryptjs (12 rounds)
- Apaga token após uso (single-use)
- Erros descritivos: token expirado vs. inválido

#### `src/app/forgot-password/page.tsx` *(novo)*
- Formulário com Zod + react-hook-form
- Estado de sucesso com ícone `MailCheck` e instrução de verificar spam
- Link de volta ao login

#### `src/app/reset-password/page.tsx` *(novo)*
- Lê `?token` da URL via `useSearchParams` (envolto em `<Suspense>`)
- Estado inválido: `AlertCircle` + link para novo link
- Estado de sucesso: `ShieldCheck` + redirect automático para `/login` em 3s
- Campos de senha com toggle show/hide (`Eye`/`EyeOff`)
- Validação de confirmação com `z.refine()`

#### `.env`
```env
RESEND_API_KEY="re_..."
RESEND_FROM="PlantGuard AI <onboarding@resend.dev>"
```

---

### 1.4 Redesign da Página de Login

#### `src/app/login/page.tsx`
- Layout split-panel: painel da marca (esquerdo, verde floresta) + formulário (direito)
- Painel esquerdo: SVG de padrão de folhas decorativo, logo, tagline
- Tabs "Entrar" / "Criar conta" com `role="tablist"` + `role="tab"` + `role="tabpanel"`
- Componentes internos: `TabBtn`, `Field` (label + input + erro), `PasswordInput` (toggle show/hide)
- Link "Esqueceu sua senha?" abaixo do campo de senha — aponta para `/forgot-password`
- IDs únicos via `useId()` para evitar colisões em SSR
- WCAG: `aria-invalid`, `aria-describedby`, `aria-busy`, `role="alert"` em erros, skip link

---

### 1.5 Dados de Amostra

#### `data/sample-plants.csv` *(novo)*
- ~30 linhas cobrindo 4 culturas: Tomate, Alface, Milho, Morango
- Campos: `imageName, status, plantType, pathology, confidence, description, recommendations, createdAt`
- Cenários que ativam as regras de decisão:
  - Tomate: 5 Doente / 2 Saudável → R1 + R2
  - Alface: 6 Doente / 1 Saudável → R1 + R2 (crítico)
  - Patologia "Míldio" em 4 análises → R3
  - Milho: 8 Saudável / 2 Doente → sem alerta
- Importável pelo modal "Importar Dados" do dashboard de analytics

---

## Sessão 2 — 23/05/2026

---

### 2.1 Redesign Visual Completo — "Botanical Field Lab"

#### Objetivo
Revisar todo o front-end aplicando identidade visual coesa — fundos em pergaminho quente, verde floresta profundo, modo escuro bioluminescente — com conformidade total às diretrizes WCAG 2.1.

#### `src/app/globals.css` (reescrita completa)
- Nova paleta de cores:
  - Claro: `--background: #f4f1e8` (pergaminho), `--primary: #1b4d34` (floresta), `--foreground: #0e1c12`
  - Escuro: `--background: #091410`, `--primary: #52d68a` (bioluminescente), `--foreground: #d8e8d2`
- Sombras aquecidas: `--shadow-sm/md/lg/glow`
- Keyframes: `fade-in-up`, `fade-in`, `slide-in-right`, `scan-line`, `pulse-ring`, `shimmer`
- Classes utilitárias: `.animate-fade-in-up`, `.animate-scan`, `.grain-overlay`, `.shimmer`
- Stagger helpers `.stagger-1` a `.stagger-5`
- WCAG 2.4.7: `focus-visible` com outline 2.5px, offset 3px
- WCAG 2.3.3: `prefers-reduced-motion` zera todas as animações
- Suporte a `forced-colors` (modo alto contraste do SO)
- Scrollbar estilizada (WebKit)

#### `src/components/StatusBadge.tsx`
- Badge estilo herbário: borda + ponto colorido + ícone + label
- Cores com variantes dark seguras (`emerald/red/amber`)

#### `src/components/Navbar.tsx`
- Altura reduzida para 56px, backdrop blur
- Indicador de ativo: linha `h-0.5` na cor primária abaixo do link
- `aria-current="page"` em cada link ativo
- Dropdown de usuário refinado; sheet mobile com separação visual
- `<NotificationBell />` integrado ao lado do avatar (desktop) e no topo do sheet (mobile)

#### `src/components/UploadZone.tsx`
- Drop zone com grid pattern CSS decorativo
- Animação `animate-scan` (linha varrendo a prévia) durante análise
- Estado de drag: texto muda para "Solte para analisar", escala 1.005
- WCAG: `role="button"`, `tabIndex={0}`, navegação por `Enter`/`Space`, `aria-describedby` no erro, `role="alert"`, `useId()`

#### `src/components/AnalysisCard.tsx`
- Header com fundo colorido por status (vermelho/âmbar/verde)
- Barra de confiança colorida: verde ≥ 85%, âmbar ≥ 65%, vermelho < 65%
- Label descritivo: "Alta confiança", "Confiança moderada", "Baixa confiança"
- Acordeões com `aria-expanded` + `aria-controls`
- Ícone Leaf ao lado do nome da planta; `animate-fade-in-up` na entrada

#### `src/app/page.tsx` (Landing Page)
- Hero: pill "Powered by Gemini AI", blob de glow, grid de fundo, headline Fraunces
- Dois CTAs: "Começar agora" e "Ver demonstração"
- Seção "Como funciona": numeração decorativa grande (01/02/03)
- Nova seção "Por que PlantGuard?": 3 cards de diferenciais
- Banner CTA com fundo verde primário
- Skip link para teclado (WCAG 2.4.1); footer com aviso legal

#### `src/components/analytics/KpiCards.tsx`
- Accent corner decorativo por cor de métrica
- Label uppercase tracking-wider
- `animate-fade-in-up` com delay escalonado por card
- `role="list"` + `aria-label` no container

#### `src/components/analytics/AlertsSummary.tsx`
- `role="region"` + `aria-label` no container
- Header colapsável como `<button>` com `aria-expanded` + `aria-controls`
- Cards de planta com ícone Leaf + badge de severidade refinado

---

### 2.2 Sistema de Notificações In-App + Email de Diagnóstico

#### Objetivo
Ao detectar planta doente: criar notificação in-app e enviar email formatado. Bell na navbar com controle de leitura. Relatório periódico por email.

#### `prisma/schema.prisma`
- Adicionado modelo `Notification` e relação em `User`:
  ```prisma
  model Notification {
    id         String   @id @default(cuid())
    userId     String
    type       String   // "disease_alert"
    title      String
    message    String
    read       Boolean  @default(false)
    data       String?  // JSON snapshot completo da análise
    analysisId String?
    user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    createdAt  DateTime @default(now())
    @@index([userId])
    @@index([userId, read])
  }
  ```
- Tabela criada via SQL raw; `npx prisma generate` + reinício do servidor executados após

#### `src/lib/email.ts` *(novo)*
- `sendDiseaseAlertEmail(to, data)`: email HTML com barra de confiança, diagnóstico, recomendações em destaque verde, link para histórico
- `sendAnalysisReportEmail(to, userName, analyses, period)`: tabela HTML com todas as análises do período — status colorido, patologia, diagnóstico resumido, confiança

#### `src/app/api/analyze/route.ts`
- Após `prisma.analysis.create` bem-sucedido, chama `createDiseaseNotification()` sem `await`
- `createDiseaseNotification()`: função top-level com `try/catch` próprio — busca email do usuário, cria `Notification`, envia email; qualquer falha é logada sem afetar a resposta

#### `src/app/api/notifications/route.ts` *(novo)*
- `GET`: 50 notificações mais recentes + `unreadCount`
- `PATCH`: marca todas as notificações do usuário como lidas

#### `src/app/api/notifications/[id]/route.ts` *(novo)*
- `PATCH`: marca notificação individual como lida

#### `src/app/api/reports/email/route.ts` *(novo)*
- `POST { days: 7 | 30 | 90 }`
- Rate limit: 3 relatórios/hora por usuário
- Retorna `{ ok, count, sentTo }`

#### `src/components/NotificationBell.tsx` *(novo)*
- Sino com badge de não lidas (mostra "9+" acima de 9)
- Painel dropdown: lista, lida/não lida, polling 60s
- Indicador visual: ponto primário + fundo tênue para não lidas
- Tempo relativo: "agora mesmo" / "Xmin atrás" / "Xh atrás" / "ontem" / "X dias atrás"
- Botão "Marcar todas" como lidas
- Clique → modal de detalhe + marca lida automaticamente
- Modal: planta, patologia, barra de confiança colorida, diagnóstico, recomendações, previsão de evolução
- Fecha com `ESC` e clique fora
- ARIA: `role="dialog"`, `aria-expanded`, `aria-label`, `aria-haspopup`, `aria-modal`

#### `src/components/SendReportButton.tsx` *(novo)*
- Dropdown: "Últimos 7 dias", "Últimos 30 dias", "Últimos 90 dias"
- Loading com spinner; sucesso com ícone check
- Toast com contagem de análises e email destino; toast de erro com mensagem da API

#### `src/components/HistoryContent.tsx`
- `<SendReportButton />` adicionado ao lado do botão "Exportar"

#### `src/components/analytics/AnalyticsDashboard.tsx`
- `<SendReportButton />` adicionado na barra de ações (apenas para dados próprios)

---

### 2.3 Correções de Bug

| Bug | Causa raiz | Correção |
|-----|-----------|----------|
| Análise contada no histórico mas erro 500 exibido | `await prisma.user.findUnique()` estava no mesmo `try` que `analysis.create` — se falhasse após o commit, retornava 500 mas o registro já estava salvo | Lógica pós-análise extraída para `createDiseaseNotification()` com `try/catch` próprio, chamada sem `await` |
| Notificação não criada silenciosamente | Servidor não reiniciado após `prisma generate` — instância em memória não conhecia o modelo `notification` | Servidor reiniciado; falhas na criação de notificação agora aparecem nos logs |

---

## Sessão 3 — 23/05/2026 (continuação)

---

### 3.1 Correções de UI — Sobreposição e Centralização do Modal de Notificação

#### Problema 1
Ao clicar em uma notificação no sino, o **painel da notificação ficava sobreposto ao modal de detalhe** — ambos visíveis ao mesmo tempo.

#### Problema 2
O modal de detalhe **não ficava centralizado na tela** — aparecia deslocado por causa do `backdrop-blur-md` da navbar, que cria um *containing block* que aprisiona elementos com `position: fixed`.

#### Correção — `src/components/NotificationBell.tsx`
- `handleSelectNotif()`: agora chama `setOpen(false)` **antes** de `setSelected(notif)`, fechando o painel antes de abrir o modal
- Modal renderizado via `createPortal(modal, document.body)` para escapar do containing block da navbar
- Guarda `mounted` (state `useState(false)` + `useEffect(() => setMounted(true), [])`) para evitar erro de SSR no `document.body`

---

### 3.2 Relatórios por Email para Dados Externos Importados

#### Objetivo
Permitir o envio de relatório por email também quando o usuário está visualizando **dados externos importados** (CSV/JSON) na aba Analytics — não apenas para os dados próprios do banco.

#### `src/app/api/reports/email/route.ts`
- Aceita opcionalmente `{ analyses: RawAnalysisRecord[], sourceLabel?: string }` no corpo do POST
- Quando recebe `analyses`, **bypass na query do Prisma** e usa os registros vindos do cliente
- Função `sanitizeImported()` valida e normaliza cada registro importado (status, plantType, pathology, confidence, datas)
- Período é calculado a partir do `min/max` dos `createdAt` dos registros importados
- Mantém o template de email com tabela HTML (verde para saudável, vermelho para doente, âmbar para inconclusivo)

#### `src/components/SendReportButton.tsx`
- Novas props opcionais: `importedAnalyses?: RawAnalysisRecord[]` e `importedFileName?: string`
- Quando `isImportMode` é `true`: botão envia direto (sem dropdown de período), o período vem dos próprios dados
- Label do toast inclui `sourceLabel` quando vem de importação

#### `src/components/analytics/AnalyticsDashboard.tsx`
- Estado `importedRecords` propagado para `<SendReportButton>` quando `isViewingImport`
- Quando o usuário volta para os dados próprios, o botão volta ao comportamento padrão com dropdown de período

---

### 3.3 Login/Cadastro com Google (OAuth)

#### Objetivo
Permitir login ou criação de conta via Google, com link automático para contas existentes com mesmo email.

#### `prisma/schema.prisma`
- Adicionados modelos `Account`, `Session`, `VerificationToken` exigidos pelo `@auth/prisma-adapter`
- `User.emailVerified DateTime?` adicionado
- `password String?` (tornado opcional — usuários OAuth não têm senha inicial)

#### `src/lib/auth.ts`
- Importado `Google from 'next-auth/providers/google'`
- Importado `PrismaAdapter from '@auth/prisma-adapter'`
- `adapter: PrismaAdapter(prisma as any)` (cast para resolver tipo do client gerado em `src/generated/prisma`)
- Provider Google com `allowDangerousEmailAccountLinking: true` — permite vincular conta Google a usuário existente que já tem credentials com o mesmo email
- Credentials provider mantido — usuários podem fazer login das duas formas

#### `src/lib/auth.config.ts`
- Callback `authorized()`: adicionado `/settings` à lista de rotas protegidas
- Callback `jwt()`: propaga `name`, `email`, `picture` quando `user` está presente; trata `trigger === 'update'` para refresh do token após edição de perfil
- Callback `session()`: propaga `name`, `email`, `image` do token para a sessão

#### `src/app/login/page.tsx`
- Componente `<GoogleButton>` com SVG completo do logo Google (4 cores oficiais)
- Handler `onGoogle()` chamando `signIn('google', { callbackUrl: '/dashboard' })`
- Botão inserido **acima** dos formulários de Login e Cadastro com divisor visual ("ou com email")
- WCAG: `aria-label="Entrar com Google"`, `type="button"`, foco visível

#### Variáveis de Ambiente
- `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` adicionadas ao `.env`
- Redirect URI obrigatório no Google Cloud Console: `http://localhost:3000/api/auth/callback/google`

---

### 3.4 Página de Configurações de Conta

#### Objetivo
Tela única para o usuário gerenciar foto de perfil, nome, email e senha, seguindo padrões de design da aplicação + WCAG.

#### `src/lib/validations/profile.ts` *(novo)*
- `updateProfileSchema`: `name` (1-80 chars), `email` (opcional, formato válido)
- `updatePasswordSchema`: `currentPassword`, `newPassword` (min 8), `confirmPassword` — com `.refine()` validando que `newPassword === confirmPassword`
- `setPasswordSchema`: variante para usuários OAuth sem senha inicial (sem `currentPassword`)
- `updateImageSchema`: valida data URL `data:image/(png|jpeg|jpg|webp);base64,...` com tamanho máximo de 700KB

#### `src/app/api/account/profile/route.ts` *(novo)*
- `GET`: retorna `{ id, name, email, image, hasPassword, providers[] }` (lista de providers OAuth vinculados)
- `PATCH`: atualiza `name`/`email` com checagem de conflito de email
- Rate limit: 10 atualizações/minuto

#### `src/app/api/account/password/route.ts` *(novo)*
- `PATCH`: ramifica por `hasPassword`
  - Se `true`: usa `updatePasswordSchema`, verifica `currentPassword` com `bcrypt.compare`, atualiza com hash novo (salt 12)
  - Se `false` (OAuth puro): usa `setPasswordSchema`, define senha inicial
- Rate limit: 5 tentativas/minuto

#### `src/app/api/account/image/route.ts` *(novo)*
- `PATCH`: aceita `{ image: dataUrl | null }`, salva direto em `User.image` (sem storage externo)
- Rate limit: 10/minuto

#### `src/app/settings/layout.tsx` *(novo)*
- Layout com `<Navbar>` + container `max-w-3xl` + padding consistente

#### `src/app/settings/page.tsx` *(novo)*
- Server component com `auth()` + `redirect('/login')` se não autenticado
- Renderiza `<AccountSettings />`

#### `src/components/settings/AccountSettings.tsx` *(novo)*
Componente cliente com três seções:

**`AvatarSection`**
- `<input type="file" accept="image/*">` invisível, acionado por botão "Alterar foto"
- Resize client-side em `<canvas>`: 256×256px → JPEG quality 0.85 → data URL
- Preview imediato; botão "Remover foto" para `null`
- PATCH `/api/account/image` + `update({ user: { image } })` do `useSession()` para refresh do JWT

**`ProfileSection`**
- `useForm` com `zodResolver(updateProfileSchema)`
- Campos: `name`, `email`
- PATCH `/api/account/profile` + `update({ user: { name, email } })`

**`PasswordSection`**
- Estado condicional via `hasPassword` do GET
  - `true`: form "Alterar senha" (currentPassword + newPassword + confirmPassword)
  - `false`: form "Criar senha" (newPassword + confirmPassword) com aviso "Você fez login via Google e ainda não tem uma senha"
- Botões de mostrar/ocultar senha com `aria-pressed`
- Após sucesso, GET refetched para atualizar `hasPassword`

**Padrões aplicados em todas as seções**
- `<Card>` (shadcn) com header + content; `Separator` entre blocos
- Mensagens de erro com `role="alert"`; campos com `aria-invalid` + `aria-describedby`
- Botões com `aria-busy` durante submissão; `disabled` evita double-submit
- Toasts (Sonner) para feedback de sucesso/erro
- Foco visível em todos os controles interativos

---

### 3.5 Indicador "N" do Next.js Removido

#### `next.config.ts`
- Adicionado `devIndicators: false` para suprimir o badge "N" do canto inferior esquerdo no dev server

#### `public/`
- Removidos SVGs órfãos não usados pela aplicação: `next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg`

---

### 3.6 Configurações no Navbar

#### `src/components/Navbar.tsx`
- Importado `Settings` (lucide), `AvatarImage`, `useRouter`
- Avatar do desktop agora renderiza `<AvatarImage>` quando `session.user.image` existir (fallback continua sendo iniciais)
- **Dropdown desktop**: novo item "Configurações" entre informações do usuário e "Sair"
  - Usa `onClick={() => router.push('/settings')}` ao invés de `asChild + <Link>` (base-ui `Menu.Item` não suporta `asChild`)
- **Sheet mobile**: link "Configurações" adicionado após links de navegação, antes do botão "Sair"
- Indicador de rota ativa em `/settings` (mesma lógica dos outros links)

---

### 3.7 Investigação do Erro 400 do Google OAuth

#### Diagnóstico
Usuário relatou erro `invalid_request` ao clicar em "Entrar com Google".

#### Causa raiz
`GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no `.env` estavam definidos como string vazia (`=""`). NextAuth montava a URL OAuth com `client_id=` vazio, e o Google rejeitava com `invalid_request`.

#### Resolução
- Identificado via inspeção de `length` das variáveis no `.env` (sem expor o valor)
- Orientação ao usuário: preencher valores reais sem aspas, conferir Redirect URI `http://localhost:3000/api/auth/callback/google` no Google Cloud Console, reiniciar dev server
- ⚠️ Usuário colou Client Secret em texto aberto durante a sessão — orientado a rotacionar a credencial

---

### 3.8 Arquivos Desta Sessão

| Arquivo | Ação |
|---------|------|
| `src/components/NotificationBell.tsx` | Modificado — `createPortal` + close-before-open |
| `src/app/api/reports/email/route.ts` | Modificado — aceita `analyses` importadas |
| `src/components/SendReportButton.tsx` | Modificado — props `importedAnalyses`/`importedFileName` |
| `src/components/analytics/AnalyticsDashboard.tsx` | Modificado — propaga registros importados |
| `next.config.ts` | Modificado — `devIndicators: false` |
| `public/*.svg` | **Removidos** — next/vercel/file/globe/window |
| `prisma/schema.prisma` | Modificado — `Account`, `Session`, `VerificationToken`, `emailVerified` |
| `src/lib/auth.ts` | Modificado — Google provider + PrismaAdapter |
| `src/lib/auth.config.ts` | Modificado — `/settings` protegido + jwt/session callbacks expandidos |
| `src/app/login/page.tsx` | Modificado — botão "Entrar com Google" + divisor |
| `src/lib/validations/profile.ts` | **Criado** — schemas Zod de perfil/senha/imagem |
| `src/app/api/account/profile/route.ts` | **Criado** — GET + PATCH nome/email |
| `src/app/api/account/password/route.ts` | **Criado** — PATCH senha (com ramo OAuth) |
| `src/app/api/account/image/route.ts` | **Criado** — PATCH avatar |
| `src/app/settings/layout.tsx` | **Criado** — layout da seção |
| `src/app/settings/page.tsx` | **Criado** — página server-side com guard |
| `src/components/settings/AccountSettings.tsx` | **Criado** — UI completa (avatar/perfil/senha) |
| `src/components/Navbar.tsx` | Modificado — `<AvatarImage>`, item Configurações desktop+mobile |
| `.env` | Modificado — `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` adicionados |

---

## Resumo Geral de Arquivos

| Arquivo | Sessão | Ação |
|---------|--------|------|
| `src/lib/prisma.ts` | 22/05 | Modificado — fix `%40`, SSL, cast `as any` |
| `src/lib/auth.ts` | 22/05 | Modificado — try/catch no authorize() |
| `src/lib/decision-rules.ts` | 22/05 | **Criado** — engine de regras R1–R4 |
| `src/lib/compute-alerts.ts` | 22/05 | **Criado** — agregação de alertas por planta |
| `src/app/api/alerts/route.ts` | 22/05 | **Criado** — GET alertas por período |
| `src/components/HistoryTable.tsx` | 22/05 | Modificado — avaliação por linha, AlertBadge, AlertDetailModal |
| `src/components/PlantAlertModal.tsx` | 22/05 | **Criado** — modal de alerta agregado por planta |
| `src/components/analytics/AlertsSummary.tsx` | 22/05 | **Criado** — card colapsável de plantas em alerta |
| `prisma/schema.prisma` | 22/05 + 23/05 | Modificado — `PasswordResetToken` (22) + `Notification` (23) |
| `src/app/api/auth/forgot-password/route.ts` | 22/05 | **Criado** — solicitação de reset com Resend |
| `src/app/api/auth/reset-password/route.ts` | 22/05 | **Criado** — validação de token e update de senha |
| `src/app/login/page.tsx` | 22/05 | Modificado — split-panel, tabs, link forgot password, WCAG |
| `src/app/forgot-password/page.tsx` | 22/05 | **Criado** — página de solicitação |
| `src/app/reset-password/page.tsx` | 22/05 | **Criado** — página de definição de nova senha |
| `data/sample-plants.csv` | 22/05 | **Criado** — ~30 registros para demonstração das regras |
| `src/app/globals.css` | 22/05 + 23/05 | Modificado — WCAG básico (22), paleta completa + animações (23) |
| `src/components/StatusBadge.tsx` | 23/05 | Modificado — estilo herbário com border + dot |
| `src/components/Navbar.tsx` | 23/05 | Modificado — indicador ativo, bell integrado |
| `src/components/UploadZone.tsx` | 23/05 | Modificado — scan animation, acessibilidade completa |
| `src/components/AnalysisCard.tsx` | 23/05 | Modificado — header por status, barra de confiança colorida |
| `src/app/page.tsx` | 23/05 | Modificado — landing page redesenhada |
| `src/components/analytics/KpiCards.tsx` | 23/05 | Modificado — animação escalonada, accent corner |
| `src/components/analytics/AlertsSummary.tsx` | 23/05 | Modificado — ARIA, layout refinado |
| `src/lib/email.ts` | 23/05 | **Criado** — templates HTML (alerta + relatório) |
| `src/app/api/analyze/route.ts` | 23/05 | Modificado — notificação/email isolado, bug de commit parcial corrigido |
| `src/app/api/notifications/route.ts` | 23/05 | **Criado** — GET lista + PATCH marca todas lidas |
| `src/app/api/notifications/[id]/route.ts` | 23/05 | **Criado** — PATCH marca notificação individual |
| `src/app/api/reports/email/route.ts` | 23/05 | **Criado** — relatório tabular por email |
| `src/components/NotificationBell.tsx` | 23/05 | **Criado** — sino com painel, polling e modal de detalhe |
| `src/components/SendReportButton.tsx` | 23/05 | **Criado** — seletor de período + envio de relatório |
| `src/components/HistoryContent.tsx` | 23/05 | Modificado — botão de relatório adicionado |
| `src/components/analytics/AnalyticsDashboard.tsx` | 23/05 | Modificado — botão de relatório adicionado |
