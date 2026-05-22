# FoundersFlow — Histórico de Sprints

Notas de implementação das features já shipadas. Decisões vigentes ficam em `replit.md`. Este arquivo é referência pra entender o "porquê" de código existente.

## Fase 3 (Segurança & LGPD) — Gating do free (upsell Founder/Studio)

- **Regra de produto:** plano `free` recebe apenas `POLITICA_PRIVACIDADE` na Fase 3. Os outros 7 artefatos (DATA_MAP, CLASSIFICACAO_DADOS, PRIVACY_BY_DESIGN, THREAT_MODEL, MATRIZ_RBAC, OWASP_CHECKLIST, PLANO_INCIDENTES) ficam travados com upsell para Founder/Studio. Upgrade libera conteúdo imediatamente (DB intacto — strip é só na resposta).
- **Backend (`routes/phases.ts`):** helper `applyPhase3FreeGate(userId, phaseNumber, artifacts[])` resolve plano via `getPlanConfig(plan, isSuperuser)` (superuser bypass mantido) e, quando `id==="free"` e `phaseNumber===3`, retorna artefatos !==POLITICA_PRIVACIDADE com `content=""`, `contentJson=null`, `locked=true`. Aplicado em **todos** endpoints que devolvem artifact rows: `GET /phases/:n` (com phase meta), `GET /phases/:n/artifacts`, `GET /phases/:n/artifacts/:key/versions` (via `isFreePlan` + `isPhase3GatedKey`), `PATCH /phases/:n/artifacts/:key/download` e SSE `done` em `POST /phases/:n/execute`. PATCH edit/restore + export markdown/JSON em `projects.ts` continuam barrados upstream por `canCopy` (402 EXPORT_REQUIRES_PAID_PLAN).
- **SSE leak fix:** em `/execute`, `suppressProgressContent = phaseNumber===3 && isFreePlan(userId)` calculado antes da geração. Quando true, `onProgress` emite `{type:"progress", content:""}` (UI continua piscando, sem tokens crus do modelo vazando).
- **Public share leak fix (`routes/public.ts`):** `GET /public/projects/:shareId` busca o plano do **dono** do projeto (`usersTable` join via `clerkId`) e aplica o mesmo gating. Free founder que ativa share não vaza Fase 3 premium.
- **Frontend (`pages/phase.tsx` renderCard):** quando `phase===3 && plan==="free" && key!==POLITICA_PRIVACIDADE && (locked||!content)`, renderiza card travado com ícone de cadeado SVG inline (sem nova dep), chip laranja "Founder / Studio" e botão "Ver planos" → `/pricing`. Tokens brand (sem roxo).
- **Architect:** PASS na terceira passada (fechou objetivo + dois bypasses subsequentes).

## Demo Project (ativação imediata)

- **Schema:** `projectsTable.isDemo boolean default false` + partial unique index `projects_one_active_demo_per_user ON (clerk_id) WHERE is_demo=true AND deleted_at IS NULL` (garante 1 demo ativo/user no nível DB).
- **Seed:** `artifacts/api-server/src/lib/demoSeed.ts` — projeto "GestaoPro" (SaaS B2B PME) com Fases 1, 2 e 3 completas (status=completed, gates checked, currentPhase=4) e artefatos realistas: Fase 1 (LEAN_CANVAS JSON, JTBD, HIPOTESE_CENTRAL, SCORE_POTENCIAL JSON), Fase 2 (PRD, CARTAO_PERSONA JSON, METRICAS_SUCESSO), Fase 3 (DATA_MAP, THREAT_MODEL STRIDE, MATRIZ_RBAC).
- **Route:** `POST /api/projects/demo` — idempotente (fast-path SELECT + race-safe via try/catch PG 23505), plan-limit aware (só conta se for criação nova), retorna 201 (new) ou 200 (existed) com `alreadyExisted` flag.
- **Frontend:** `EmptyState` em `dashboard.tsx` ganha botão "Explorar projeto demo" ao lado de "Criar do zero", redireciona para Fase 1 após seed.
- **Audit event:** `user.project.demo_seeded`.

## Share Público de Projeto (viral loop)

- **Schema:** `projectsTable.shareId text unique nullable` + `sharedAt timestamp`.
- **Routes:** `POST /api/projects/:id/share` (auth, atomic — UPDATE com `share_id IS NULL` guard, gera 72-bit base64url), `DELETE /api/projects/:id/share` (revoke), `GET /api/public/projects/:shareId` (sem auth, retorna project + phases + artifacts, headers `X-Robots-Tag: noindex,noarchive,nosnippet` + `Cache-Control: private,no-store`).
- **Frontend:** página `/p/:shareId` (`public-share.tsx`) renderiza header próprio com CTA "Criar meu plano"/"Começar grátis", tabs de fases, ArtifactBody markdown. Meta `robots noindex` no Helmet. UI de share em `project.tsx` aba Colaboração: gerar/copiar/revogar com status visual.
- **Audit events:** `user.project.shared`, `user.project.unshared`.

## Paywall contextual end-to-end (loop fechado)

- **Trigger sites:** `paywall-modal.tsx` (limite IA — `?upgrade=ai&plan=founder|studio`); `dashboard.tsx` handleCreate `onError` inspeciona `ApiError.status===403 && data.code==="PROJECT_LIMIT_REACHED"` e redireciona para `/pricing?upgrade=projects` com toast informativo. `seats` reservado p/ futuro (sem trigger ainda).
- **`pricing.tsx`** consome `?upgrade=ai|projects|seats` via wouter `useSearch` + `URLSearchParams`, validação narrow (ignora valores inválidos). Cada reason tem copy própria (`UPGRADE_COPY`): eyebrow + título + descrição + recommended plan.
- **Recomendação dinâmica:** `recommendedPlanId = requestedPlan ?? UPGRADE_COPY[reason].recommended` (default ai→founder, projects→founder, seats→studio). Card recomendado ganha borda accent + ring-2 + shadow-xl + badge laranja "Recomendado para você" (substitui o badge default), e auto-scrollIntoView center após 250ms.
- **Banner topo:** `role=status aria-live=polite`, ícone ↑ accent, copy contextual, `data-testid="upgrade-banner-{reason}"`.

## Auto-save em edição inline de artefatos

- **Componente:** `ArtifactCard` em `artifacts/fabrica/src/pages/phase.tsx`. Adicionado `useEffect` debounced (1500ms) que dispara `updateArtifact.mutate` automaticamente quando `draft !== lastSavedRef.current` durante edição.
- **Estado visual:** `autoSaveState: "idle" | "saving" | "saved" | "error"` exibido em `<span aria-live="polite" data-testid="autosave-state">` no toolbar de edição.
- **Beforeunload guard:** segundo `useEffect` registra `beforeunload` listener enquanto há diff não persistido — browser pede confirmação antes de fechar aba.
- **Botões:** "Fechar" (era "Cancelar") restaura para `lastSavedRef.current` (último persistido, não o original); "Salvar agora" disabled quando draft===last.

## Dedupe coherence/potential

- **Helper:** `artifacts/api-server/src/lib/project-context.ts` exporta `buildProjectArtifactContext(projectId, charLimit)`. Substitui duplicação em `/projects/:id/coherence/analyze` e `/projects/:id/potential/analyze` (era loop fase→artefatos→slice em ambos).

## "Baseado em — Fase N-1" no header de execução

- **Local:** `phase.tsx` antes do card "Gerar com IA" (somente `phaseNumber >= 2`). Lê estática `PHASES[phaseNumber - 2].artifacts` + `ARTIFACT_LABELS` — sem fetch extra. Mostra até 6 chips com `+N` overflow + linha "A IA lê esses artefatos para manter coerência entre as fases". `data-testid="based-on-prev"`.

## Briefing estruturado (placeholder PROBLEMA/PÚBLICO/DIFERENCIAL/MODELO)

- **Local:** `dashboard.tsx` textarea `proj-briefing`. Placeholder com 4 prompts em maiúsculas + exemplo D2C real (condomínio/pet). Min-height 180px (era 140) pra acomodar bloco estruturado.

## Microcopy reativa no Score de Coerência

- **Local:** `project.tsx` CoherenceCard h3 (`data-testid="coherence-headline"`). Bands: `≥75` "Forte — produto coeso entre fases"; `≥50` "Atenção — divergências detectadas, revise antes de avançar"; `<50` "Risco — produto incoerente, alta chance de falha". Mantém badge de status e parágrafo `data?.resumo` inalterados.

## Admin → Feedback (agregador de thumbs)

- **Backend:** `GET /admin/feedback-stats` (admin-gated) — agrega `artifactFeedbackTable` com `count(*) FILTER (WHERE rating='up'|'down')` agrupado por `(phaseNumber, artifactKey)`, ordenado por phase/key (estabilidade). Retorna `byArtifact[]` (up/down/total/score%/comments/lastAt) + `recentComments[]` (últimos 30 com comentário, ordenados por `updatedAt`).
- **Frontend:** `components/admin/FeedbackTab.tsx` registrado em `admin.tsx` como tab "Feedback" (entre Insights e Usuários). Summary cards (votos/👍/👎/aprovação%), tabela ordenável (problemas/volume/fase) com tie-breakers determinísticos, lista de comentários recentes. Botões de sort com `aria-pressed`. Sem XSS — comentários renderizados como texto React.

## Feedback de artefatos (thumbs up/down + comentário)

- **Schema:** `lib/db/src/schema/artifact_feedback.ts` — `artifactFeedbackTable` (userId, projectId, phaseNumber, artifactKey, rating up|down, comment ≤500, timestamps). Unique idx `(userId, projectId, phaseNumber, artifactKey)` permite mudança de voto sem duplicar. EventType `artifact_feedback` adicionado.
- **Route:** `POST /api/projects/:projectId/phases/:phaseNumber/artifacts/:artifactKey/feedback` — Zod `ArtifactFeedbackBody` (`zod/v4`), upsert via `onConflictDoUpdate`, loga evento com `hasComment`.
- **UI:** `ArtifactFeedback` em `phase.tsx` (após body, antes do history dialog) — thumbs com `aria-pressed`, localStorage cache (`ff_artifact_fb_*`) pra hidratar voto entre reloads. Down abre Textarea opcional (max 500ch, `aria-label`). Toast confirma envio.

## Fase 7 — encerramento como "plano de lançamento completo"

- **PhaseCompletionBanner** em `phase.tsx` agora ramifica em `phaseNumber === 7`: troca copy "produto pronto para o mercado" por "Plano de lançamento completo" + checklist de execução 7-14d (RUNBOOK, LAUNCH_CHECKLIST, GTM, METRICAS_POS_LAUNCH, retro 14d) + 3 CTAs: Compartilhar projeto (vai pra aba colaboração), Iniciar novo projeto (`/dashboard?new=1`), Ver projeto completo.

## Landing v2 (conversão + prova social)

- **Hero:** headline com transformação clara ("Da ideia ao produto validado em 7 fases"), subheading explicando o método. CTA primário accent laranja "Começar grátis →" + secundário "Ver projeto demo (sem cadastro)" se `VITE_DEMO_SHARE_ID` configurado (fallback "Explorar templates").
- **Output sample card:** mockup de PRD GestaoPro com chrome de janela (3 dots), badge "Exemplo de output" + chips PRD/Markdown/PDF — mostra produto antes de cadastro.
- **Proof bar:** 3 stats (45+ artefatos, 7 fases, <5min) com `stat-shimmer` em primary.
- **7 phases grid:** lista nominal de cada fase com descrição curta (Ideia, PRD, Segurança, Spec, Execução, Testes, Lançamento) — explicita o método.
- **Why we exist (bloco "Por que a FoundersFlow existe"):** substitui testimonials placeholder. Bloco `bg-foreground` com 3 cards before/after nomeando dor concreta ("3 semanas no Notion virando spaghetti" → "PRD + LGPD em uma tarde"; "Prompts soltos no ChatGPT sem memória" → "Cada fase lê as anteriores"; "Consultoria de R$8k" → "Lean Canvas + STRIDE + RBAC + GTM"). CTA "Quer ser case study?" linka pra `/atendimento`. Restaurar testimonials reais quando ≥3 cases com nome+empresa estiverem disponíveis.
- **FAQ atualizado:** 4 perguntas concretas (cartão, vertical, exportação, LGPD).
- **CTA final:** card centralizado com "Sua próxima ideia merece um plano de verdade" + accent button.
- **Setup demo público:** admin gera share de um projeto demo via UI (`/projects/:id` → Colaboração → "Gerar link"), pega o `shareId` retornado e define `VITE_DEMO_SHARE_ID=<id>` no env do fabrica antes do build.

## ⌘K Command Palette

- **Componente:** `components/command-palette.tsx` montado globalmente em `App.tsx` ao lado de `PaywallModal`.
- **Shortcut:** ⌘K (Mac) / Ctrl+K (Win/Linux) toggle. ESC fecha. ↑↓ navega, ↵ abre.
- **Itens:** `STATIC_ITEMS` (Painel, Planos, Assinatura, Atendimento, Configurações, Privacidade, Admin, Admin Insights, atalhos de upgrade ai/projects); projetos via fetch lazy `${basePath}/api/projects` no primeiro open (cached em state); fases (7 por projeto) com link direto.
- **Score:** substring match (10) > subsequence match (5) > 0. Agrupado por `group` mantendo `flatIdx` global para keyboard nav.
- **A11y:** `role=dialog aria-modal=true`, body scroll lock, focus restore para previously focused element, backdrop click fecha.

## PDF Export Viral B2B (projeto completo)

- **Cover branded:** banda primary blue 140pt + stripe accent, mark `FOUNDERSFLOW`, título 34pt, dots de progresso das 7 fases (blue=done / outlined=pending), meta block, CTA strip light blue rodapé com `foundersflow.com.br ›`.
- **Watermark:** texto `FOUNDERSFLOW` diagonal -28°, opacity 0.05 via `GState`, centro de toda página de conteúdo. Roteado pelo helper privado `newContentPage()` (DRY — qualquer `addPage()` interno via ele). Cover e back-cover gerenciam próprio bleed.
- **Footer atualizado:** projeto (esq) · `foundersflow.com.br` em primary blue centralizado · page num (dir).
- **Back cover viral:** página full-bleed primary blue, headline `Quer levar o seu produto da ideia ao lançamento?` (2ª linha accent orange), 3 bullets de feature, CTA orange box `Comece grátis em foundersflow.com.br`, exibe `shareUrl` público se existir (`/p/:shareId`).
- **`downloadProjectPdf({shareUrl?})`** — `project.tsx` injeta `${origin}${basePath}/p/${shareId}` quando share está ativo.

## Editing & Export — User Stories / Casos de Teste / Milestones (Fase 2/5/6)

- **Inline edit por clique nos badges** (paid plans + canEdit): badges de prioridade e esforço viram botões que ciclam ao clicar. UserStories prio 1→5, esforço P/M/G. CasosTeste prio P0/P1/P2. Free users veem `<span>` estático.
- **Drag-reorder** com pointer-aware before/after (midpoint do row), renumeração automática + remap de `dependencias`/`marco_mvp`, useEffect resync.
- **Filtro por épico + prioridade** em `UserStoriesCanvas`: chip bar acima da lista. `displayItems` preserva idx original via `{s, idx}` mapping. `dragEnabled = canDrag && !filterActive` (grip mostra `cursor-not-allowed` quando filtrando). Chip selecionado permanece visível mesmo se nenhum item atual o usa (evita filtro fantasma).
- **PDF export estruturado** (`lib/pdf-export.ts`): blocos ```json detectados via `tryDrawStructured()` com `.some()` schema check. Renderiza cards com pré-medição de altura (`measureLines`), `cardOpen(totalH)` faz page-break preventivo. Badges com paleta dark+texto branco (sem verde — substituído por primary blue). Reserva dinâmica de largura direita em milestones.
