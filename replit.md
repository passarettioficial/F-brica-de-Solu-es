# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: Clerk (React SDK + Express middleware)
- **Payments**: Stripe
- **Frontend**: React + Vite + Wouter + TanStack Query + Tailwind CSS v4

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Project: FoundersFlow

AI SaaS PT-BR para founders. 7 fases sequenciais levam um produto da ideia ao deploy validado: Ideia → PRD → Segurança & LGPD → Spec → Implementação → Teste → Deploy.

**Linguagem:** PT-BR direto, sem emojis (exceto thumbs/check em controles de UI). Headings em Space Grotesk, corpo em Inter.

**Histórico de sprints:** `docs/replit-history.md` — descrição detalhada de cada feature já shipada (paywall, share, demo, command palette, PDF export, feedback, etc). Consulte ao mexer em código existente.

### Artifacts

| Artifact | Path | Purpose |
|---|---|---|
| `api-server` | `/api` | Express REST API |
| `fabrica` | `/` | React frontend |
| `pitch-deck` | `/pitch-deck` | Slide deck institucional |
| `mockup-sandbox` | (interno) | Canvas para variantes de design |

### DB Schema (lib/db/src/schema/)

- `usersTable` — Clerk users, plan, Stripe IDs, `isAdmin`, `isSuperuser`, daily AI usage
- `projectsTable` — user projects with phase state (`isDemo`, `shareId`, `coherenceScore`, `marketPotentialScore`)
- `phasesTable` — uma linha por (project, phaseNumber) com gates e status
- `phaseArtifactsTable` — AI-generated deliverables per phase
- `artifactVersionsTable` — histórico de versões por artefato
- `artifactFeedbackTable` — thumbs up/down + comentário por (user, project, phase, artifact)
- `couponsTable` — discount coupons (code, type, value, usage limits)
- `notificationsTable` — per-user notifications
- `supportTicketsTable` — tickets de atendimento
- `eventsTable` — telemetria leve (`EventType` union em `events.ts`)
- `auditLogsTable` — audit trail
- `settingsTable` — key-value store

### Plans & Billing

Plans: `free` (Explorar), `founder`, `studio`. Definidos em `artifacts/api-server/src/lib/stripe.ts` via `getPlanConfig(plan, isSuperuser?)`.

| Plan | Monthly | Yearly (≈17% off) | AI/day | Projects | Seats | AI Advisor |
|---|---|---|---|---|---|---|
| Explorar (free) | R$0 | — | 3 | 1 | 1 | ❌ |
| Founder | R$197 | R$1.970 (≈R$164/mo) | 30 | 5 | 1 | ✅ |
| Studio | R$697 | R$6.970 (≈R$581/mo) | 999 | ∞ | 3 | ✅ |

Yearly Stripe lookup keys: `founder_yearly`, `studio_yearly`. Monthly: `founder_monthly`, `studio_monthly`. Setup via `npx tsx artifacts/api-server/src/scripts/setup-stripe.ts`.

Legacy plan IDs (`basic`, `pro`, `advanced`, `starter`) auto-mapeados via `normalizePlanId()` em `lib/stripe.ts`.

Superusers bypass todos os limites — `getPlanConfig` retorna config unlimited quando `isSuperuser=true`.

**Checkout API:** `POST /api/billing/checkout` aceita `{ planId, billingCycle: "monthly" | "yearly" }`. Default monthly.

### Auth flow

- `requireAuth(req)` — extrai Clerk userId, throws 401.
- `ensureUser(clerkId)` — upserta user no DB; auto-promote admin/superuser se Clerk ID estiver em `ADMIN_CLERK_IDS` / `SUPERUSER_CLERK_IDS` env vars.
- `requireAdmin(req)` — checa `isAdmin || isSuperuser`, throws 403.
- `checkAndIncrementAiUsage(clerkId)` — counter diário por user, reseta meia-noite. Bypassed pra superusers.

### Admin Panel (`/admin`)

Restrito a `isAdmin=true` ou `isSuperuser=true`. Tabs: **Visão Geral**, **Insights** (funil, gargalos, DAU/WAU/MAU), **Feedback** (agregador thumbs por artefato + comentários recentes), **Usuários**, **Cupons**, **Planos & Preços**, **Entregáveis**, **Tema**, **Configurações**, **Audit Log**.

**Granting admin:**
- Env `ADMIN_CLERK_IDS=clerk_user_id1,clerk_user_id2` (auto-grant no próximo login)
- Env `SUPERUSER_CLERK_IDS=clerk_user_id` (unlimited + admin)
- Ou: `UPDATE users SET is_admin=true WHERE clerk_id='...'`

### Customer Service Routes

- `/atendimento` — WhatsApp, FAQ, ticket form, LGPD notice. WhatsApp configurável via `VITE_WHATSAPP_NUMBER`.
- `/privacidade` — política completa (LGPD Art. 18).
- `/p/:shareId` — share público de projeto (noindex).

### Visual Design Language (brandbook)

**Paleta:**
- Azul profundo `#0F1F5C` → base dark mode
- Azul principal `#1A3FAB` → `--primary` (botões primários, links, destaques)
- Azul claro `#EEF1FB` → `--secondary` (superfícies, chips, atalhos)
- Laranja destaque `#FF8C42` → `--accent` (CTAs de conversão na landing)
- Background `--background: 220 20% 97%` (cool off-white azulado — sem bege/quente)
- Foreground `--foreground: 222 25% 10%` (quase preto com tom azul)
- Muted fg `--muted-foreground: 220 10% 46%` (cinza neutro, sem tom quente)
- **Sem verde** — substituído por primary blue em badges/sucesso de UI proprietária. Emerald/amber/danger seguem mantidos em status (score, AI usage).

**Hierarquia de botões:**
- Landing/home CTA conversão → `bg-accent text-accent-foreground` (laranja)
- Ações primárias no app → `bg-primary text-white` (azul)
- Destaque de upgrade → `bg-accent` (laranja)
- Ações secundárias → `variant="outline"` (borda azul)

**Dark mode:** Base `225 60% 8%` (azul profundo), primário `224 75% 60%` (azul mais claro pra legibilidade). Token-based `.dark` via `ThemeToggle` + `localStorage`.

**Typography:**
- `--font-sans: Inter` (corpo) — pesos 400/500/600/700/800
- `--font-serif: Space Grotesk` (headings h1–h6, `font-medium tracking-tight`) — pesos 400/500/700
- Ênfase em headings via underline laranja (`decoration-accent decoration-4`), nunca italic (Space Grotesk não tem itálica real)

**Aesthetic:**
- Blueprint: grid 48px no hero, corner bracket marks, labels mono uppercase
- `glass-card` class — backdrop blur + tokens, hover lifts + borda azul
- Dark sections (`bg-foreground`) pra ritmo de contraste
- `.stat-shimmer` — animação azul nos números de proof bars

### Convenções importantes

- **Sem `console.log` em server code** — use `req.log` em handlers, singleton `logger` fora de requests.
- **Contract-first**: novos endpoints idealmente passam pelo OpenAPI spec → `pnpm --filter @workspace/api-spec run codegen`. Rotas internas/admin podem usar Zod inline (`zod/v4`) com `safeParse`.
- **Sem secrets em código** — use env vars via skill `environment-secrets`.
- **Charts/scores**: usar tokens de cor, não hex hardcoded; emerald/amber/destructive em estados de score são intencionais (semáforo).

### Variáveis de ambiente relevantes

- `ADMIN_CLERK_IDS`, `SUPERUSER_CLERK_IDS` — auto-grant
- `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `SESSION_SECRET`
- `VITE_WHATSAPP_NUMBER` (default `5511999999999`)
- `VITE_DEMO_SHARE_ID` — shareId do projeto demo público pra mostrar na landing
