---
name: Free trial gate (Explorar 7 dias)
description: Regra de negócio do plano free com expiração temporal e como o gate de execução é centralizado.
---

# Plano free "Explorar" expira em 7 dias

Regra: plano `free` é gratuito por 7 dias a partir de `usersTable.createdAt`. Depois, **qualquer execução de IA é bloqueada** (geração de fase, análise de coerência, análise de potencial, geração de script de validação, análise de entrevistas). Leitura/visualização de conteúdo existente continua liberada.

**Why:** decisão do dono do produto — free é trial temporal, não um plano permanente com cota diária. O limite diário (`aiDailyLimit=3`) ainda existe, mas a expiração de 7 dias tem precedência.

**How to apply:**
- A checagem é centralizada em `checkAndIncrementAiUsage` (lib/auth.ts): ela retorna `reason: "ai_limit" | "trial_expired"` e curto-circuita com `trial_expired` ANTES de incrementar o contador.
- `isFreeTrialExpired(user)` só vale pra `plan === "free"` e isenta `isAdmin`/`isSuperuser`.
- Todo endpoint de execução deve ramificar: `402` + `trialExpiredPayload` (code `FREE_TRIAL_EXPIRED`) quando `trial_expired`, senão `429` + `aiLimitPayload` (code `AI_LIMIT_EXCEEDED`). Se adicionar um novo endpoint que roda IA, replicar esse branch — não basta chamar o gate.
- Frontend: `handleAiLimit` (paywall.ts) trata tanto 429 quanto 402 e seta `kind`; o `PaywallModal` adapta o copy por `kind`.
- Endpoints GET (visualização) NÃO passam pelo gate — é o que mantém o conteúdo legível após expirar.
