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

AI-powered web app for founders. 7 sequential phases take a product from idea to validated deploy.

### Share Público de Projeto (viral loop)

- **Schema:** `projectsTable.shareId text unique nullable` + `sharedAt timestamp`.
- **Routes:** `POST /api/projects/:id/share` (auth, atomic — UPDATE com `share_id IS NULL` guard, gera 72-bit base64url), `DELETE /api/projects/:id/share` (revoke), `GET /api/public/projects/:shareId` (sem auth, retorna project + phases + artifacts, headers `X-Robots-Tag: noindex,noarchive,nosnippet` + `Cache-Control: private,no-store`).
- **Frontend:** página `/p/:shareId` (`public-share.tsx`) renderiza header próprio com CTA "Criar meu plano"/"Começar grátis", tabs de fases, ArtifactBody markdown. Meta `robots noindex` no Helmet. UI de share em `project.tsx` aba Colaboração: gerar/copiar/revogar com status visual.
- **Audit events:** `user.project.shared`, `user.project.unshared`.

### Editing & Export — User Stories / Casos de Teste / Milestones (Fase 2/5/6)

- **Inline edit por clique nos badges** (paid plans + canEdit): badges de prioridade e esforço viram botões que ciclam ao clicar. UserStories prio 1→5, esforço P/M/G. CasosTeste prio P0/P1/P2. Free users veem `<span>` estático.
- **Drag-reorder** com pointer-aware before/after (midpoint do row), renumeração automática + remap de `dependencias`/`marco_mvp`, useEffect resync.
- **Filtro por épico + prioridade** em `UserStoriesCanvas`: chip bar acima da lista. `displayItems` preserva idx original via `{s, idx}` mapping. `dragEnabled = canDrag && !filterActive` (grip mostra `cursor-not-allowed` quando filtrando). Chip selecionado permanece visível mesmo se nenhum item atual o usa (evita filtro fantasma).
- **PDF export estruturado** (`lib/pdf-export.ts`): blocos ```json detectados via `tryDrawStructured()` com `.some()` schema check. Renderiza cards com pré-medição de altura (`measureLines`), `cardOpen(totalH)` faz page-break preventivo. Badges com paleta dark+texto branco (sem verde — substituído por primary blue). Reserva dinâmica de largura direita em milestones.

### Visual Design Language (brandbook sprint — aplicado)

**Paleta do Brandbook:**
- Azul profundo: `#0F1F5C` → base do dark mode
- Azul principal: `#1A3FAB` → `--primary: 224 74% 39%` (botões primários, links, destaques)
- Azul claro: `#EEF1FB` → `--secondary: 225 55% 95%` (superfícies, chips, atalhos)
- Laranja destaque: `#FF8C42` → `--accent: 26 100% 63%` (CTAs de conversão na landing)
- Background: `--background: 220 20% 97%` (cool off-white azulado — sem bege/quente)
- Foreground: `--foreground: 222 25% 10%` (quase preto com tom azul)
- Muted fg: `--muted-foreground: 220 10% 46%` (cinza neutro, sem tom quente)

**Hierarquia de botões:**
- Landing/home CTA → `bg-accent text-accent-foreground` (laranja — "Começar gratis", "Iniciar construção")
- Ações primárias no app → `bg-primary text-white` (azul — "Nova construção", "Criar projeto", "Entrar na Fase")
- Destaque de upgrade → `bg-accent` (laranja — "Fazer upgrade")
- Ações secundárias → `variant="outline"` (borda azul)

**Dark mode:** Base `225 60% 8%` (azul profundo), primário `224 75% 60%` (azul mais claro para legibilidade)

**Componentes:**
- **Typography**: `--font-sans: Inter` (corpo), `--font-serif: Space Grotesk` (headings h1–h6, `font-medium tracking-tight`). Google Fonts carrega `Inter:wght@400;500;600;700;800` + `Space+Grotesk:wght@400;500;700`. Ênfase em headings via underline laranja (`decoration-accent decoration-4`), não italic (Space Grotesk não tem variante itálica real).
- **Blueprint aesthetic**: Grid 48px no hero, corner bracket marks, labels monospace uppercase
- **Glass cards**: `glass-card` class — backdrop blur + card/border tokens, hover lifts + borda azul no hover
- **Dark sections**: Testimonials em `bg-foreground` para ritmo de contraste
- **Shimmer stat**: `.stat-shimmer` CSS animation — azul primário shimmer nos números
- **MetricCards**: slate→azul família, terracotta→laranja família, amber/emerald/danger mantidos
- **Dark mode**: Token-based `.dark` via `ThemeToggle` + `localStorage`
- **Removed**: `UxStrategyCard` e `VisualModeCard` — ferramentas internas, não exibidas a usuários

### Artifacts

| Artifact | Path | Purpose |
|---|---|---|
| `api-server` | `/api` | Express REST API |
| `fabrica` | `/` | React frontend |

### DB Schema (lib/db/src/schema/)

- `usersTable` — Clerk users, plan, Stripe IDs, `isAdmin`, `isSuperuser`, daily AI usage
- `projectsTable` — user projects with phase state
- `phaseArtifactsTable` — AI-generated deliverables per phase
- `couponsTable` — discount coupons (code, type, value, usage limits)
- `settingsTable` — key-value store for app-wide settings

### Plans & Billing

Plans: `free` (Explorar), `founder`, `studio`. Defined in `artifacts/api-server/src/lib/stripe.ts` via `getPlanConfig(plan, isSuperuser?)`.

| Plan | Monthly | Yearly (≈17% off) | AI/day | Projects | Seats | AI Advisor |
|---|---|---|---|---|---|---|
| Explorar (free) | R$0 | — | 3 | 1 | 1 | ❌ |
| Founder | R$197 | R$1.970 (≈R$164/mo) | 30 | 5 | 1 | ✅ |
| Studio | R$697 | R$6.970 (≈R$581/mo) | 999 | ∞ | 3 | ✅ |

Yearly Stripe lookup keys: `founder_yearly`, `studio_yearly`. Monthly: `founder_monthly`, `studio_monthly`. Set up via `npx tsx artifacts/api-server/src/scripts/setup-stripe.ts`.

Legacy plan IDs (`basic`, `pro`, `advanced`, `starter`) are auto-mapped to new plans via `normalizePlanId()` in `lib/stripe.ts` for backward compatibility.

Superusers bypass all plan limits — `getPlanConfig` returns unlimited config when `isSuperuser=true`.

**Checkout API:** `POST /api/billing/checkout` accepts `{ planId, billingCycle: "monthly" | "yearly" }`. Default is monthly.

### Customer Service & UX Features

**Routes:**
- `/atendimento` — support page (WhatsApp, FAQ, ticket form, LGPD notice)
- `/privacidade` — full privacy policy (LGPD Art. 18 compliance, data categories, encryption info)

**Components:**
- `WhatsAppButton` — floating green button (bottom-right), configurable via `VITE_WHATSAPP_NUMBER` env var
- `NotificationBell` — header bell icon with unread badge, dropdown list, auto-polls every 60s
- `OnboardingTour` — 6-step guided tour modal shown automatically on first login (localStorage `fabrica_onboarding_done`). User can reset via Settings → "Ver tour de boas-vindas"

**DB Tables:**
- `notificationsTable` — per-user notifications (title, message, type, link, isRead)
- `supportTicketsTable` — support tickets (subject, message, category, status)

**API Routes:**
- `GET /api/notifications` — list user notifications
- `PATCH /api/notifications/read-all` — mark all read
- `PATCH /api/notifications/:id/read` — mark single read
- `DELETE /api/notifications/:id` — delete notification
- `POST /api/support/tickets` — create support ticket (categories: general, billing, technical, lgpd)
- `GET /api/support/tickets` — list user's tickets

**Dashboard enhancements:**
- Greeting with user's first name
- Metrics row: active projects, completed phases, AI usage %, plan name
- Shortcuts grid: Assinatura, AI Advisor, Atendimento, Configurações
- `ResumeCard` — hero card for most recent active project with progress bar and CTA
- `AiLimitBanner` — contextual alert at 70%+ AI usage, red at 100%, with upgrade CTA
- `ActivationChecklist` — 6-step onboarding progress tracker for new users (hidden after 3 phases or dismissed). Stored dismissal in localStorage `fabrica_activation_dismissed`
- Toast on project creation success/error
- Example templates (SaaS, App, Marketplace) pre-fill name+briefing in new project dialog
- OnboardingTour completion callback auto-opens new project dialog

**Settings enhancements:**
- Plan management section with feature comparison
- LGPD section: links to privacy policy, data portability request, data deletion request (auto-creates lgpd ticket)
- Shortcuts section with onboarding tour reset

**WhatsApp config:** Set `VITE_WHATSAPP_NUMBER` env var (default: 5511999999999)

### Admin Panel (`/admin`)

Full admin panel at `/admin`, restricted to users with `isAdmin=true` or `isSuperuser=true`.

**Tabs:**
1. **Visão Geral** — stats: total users, projects, AI runs, revenue
2. **Usuários** — search, list, patch `isAdmin`/`isSuperuser`, change plan
3. **Cupons** — CRUD for discount coupons (flat or percent, per-user or global limits)
4. **Planos & Preços** — edit plan names, prices, feature flags per plan
5. **Entregáveis** — enable/disable individual AI deliverables per phase
6. **Tema** — HSL color sliders + branding text saved to `settingsTable`
7. **Configurações** — free-form key-value settings store

**Granting admin access:**
- Set env var `ADMIN_CLERK_IDS=clerk_user_id1,clerk_user_id2` to auto-grant admin on next login
- Set env var `SUPERUSER_CLERK_IDS=clerk_user_id` to auto-grant superuser (unlimited plan + admin)
- Or directly update DB: `UPDATE users SET is_admin=true WHERE clerk_id='...'`

**Admin link** appears in the dashboard and settings header nav for admin users.

### Auth flow

`requireAuth(req)` — extracts Clerk userId from header, throws 401 if missing.
`ensureUser(clerkId)` — upserts user in DB; auto-promotes to admin/superuser if their Clerk ID is in `ADMIN_CLERK_IDS` or `SUPERUSER_CLERK_IDS` env vars.
`requireAdmin(req)` — checks `isAdmin || isSuperuser`, throws 403 otherwise.

### AI usage limits

`checkAndIncrementAiUsage(clerkId)` — daily counter per user, resets at midnight. Bypassed for superusers.
