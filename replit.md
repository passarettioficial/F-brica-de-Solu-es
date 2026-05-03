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

## Project: Fábrica de Soluções

AI-powered web app for founders. 6 sequential phases take a product from idea to validated deploy.

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

Plans: `free`, `starter`, `advanced`. Defined in `artifacts/api-server/src/lib/stripe.ts` via `getPlanConfig(plan, isSuperuser?)`.

Superusers bypass all plan limits — `getPlanConfig` returns unlimited config when `isSuperuser=true`.

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
