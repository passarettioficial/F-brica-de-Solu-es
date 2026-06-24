---
name: Clerk auth on public CTAs + safe redirects
description: How to guard public pages that trigger authed actions (checkout) and how to avoid open-redirect via Clerk redirect params
---

# Public CTAs that call authed endpoints

`/pricing` is a public page but its paid-plan buttons hit authed endpoints
(`/api/billing/checkout`, `/api/billing/me`). A logged-out click produced a raw
`Unauthorized` alert.

**Rule:** before firing an authed action from a public page, gate on Clerk state.
- Early-return while `!isLoaded` AND disable the CTA (`disabled={!isLoaded || ...}`) so the
  request can never fire during the auth-loading race.
- When `!isSignedIn`, redirect to `/sign-in?redirect_url=<internal dest>` instead of calling the API.

**Why:** server-side auth already returns 401, but the UX must route users to login, not surface a cryptic error. The `!isLoaded` guard alone is insufficient — a click during loading falls through to the fetch.

# Open-redirect via Clerk redirect params

Clerk `<SignIn>` honors a raw `redirect_url` query param by default.
- Use **`forceRedirectUrl`** (NOT `fallbackRedirectUrl`) with an app-validated value so the
  raw query param can never win.
- Validate to internal relative paths only: must start with `/`, reject `//` (protocol-relative)
  and `/\` (backslash trick). Present-but-invalid → force a safe default (`${basePath}/dashboard`).
  Absent param → leave `forceRedirectUrl` undefined to preserve Clerk's normal flow.

**Why:** `fallbackRedirectUrl` only applies when Clerk has no other target, so an attacker-controlled `redirect_url` could still drive a post-login external redirect.

# "Endpoint has been disabled. Enable it using the API and retry"

This Postgres/Neon error in production (retention jobs, publish-time DB diff) means the prod DB
compute endpoint is suspended/disabled — typically a Replit **deployment/account suspension** (e.g.
billing failure), NOT a code bug. Do not change schema/migrations. Resolve billing + Resume the
deployment; the endpoint reactivates on connection. Dev DB is unaffected.

**Nuance:** the *current* live deployment can still show healthy (`isDeployed:true`,
`hasSuccessfulBuild:true`, public URL up) while **republish** fails — republish runs a schema diff
against the prod DB compute, and only that step hits the disabled endpoint. Agent cannot enable the
endpoint (no callback); route the user to Replit support for billing/account, don't keep retrying.
