import { describe, it, expect, vi, beforeEach } from "vitest";

const selectMock = vi.fn();
const insertMock = vi.fn();
const updateMock = vi.fn();

const ensureUserMock = vi.fn().mockResolvedValue(undefined);
const checkAndIncrementAiUsageMock = vi.fn();
const getPlanConfigMock = vi.fn();
const auditLogMock = vi.fn();
const analyzeProjectCoherenceMock = vi.fn();
const buildProjectArtifactContextMock = vi.fn();

vi.mock("@workspace/db", () => ({
  db: { select: selectMock, insert: insertMock, update: updateMock },
  projectsTable: { id: "id", clerkId: "clerkId", deletedAt: "deletedAt", shareId: "shareId", isDemo: "isDemo" },
  phasesTable: {},
  phaseArtifactsTable: {},
  usersTable: {},
}));

vi.mock("./auth", () => ({
  ensureUser: ensureUserMock,
  checkAndIncrementAiUsage: checkAndIncrementAiUsageMock,
  aiLimitPayload: (opts: { limit: number; plan: string; used: number; context?: string }) => ({
    error: `Limite diário de ${opts.limit} execuções de IA atingido.`,
    code: "AI_LIMIT_EXCEEDED",
    limit: opts.limit,
    used: opts.used,
    plan: opts.plan,
    context: opts.context ?? null,
  }),
  trialExpiredPayload: (opts: { plan: string; context?: string }) => ({
    error: "Seu período gratuito terminou.",
    code: "FREE_TRIAL_EXPIRED",
    plan: opts.plan,
    context: opts.context ?? null,
  }),
}));

vi.mock("./stripe", () => ({ getPlanConfig: getPlanConfigMock }));
vi.mock("./audit", () => ({ auditLog: auditLogMock }));
vi.mock("./ai", () => ({ analyzeProjectCoherence: analyzeProjectCoherenceMock, analyzeMarketPotential: vi.fn() }));
vi.mock("./events", () => ({ logEvent: vi.fn() }));
vi.mock("./demoSeed", () => ({ seedDemoProject: vi.fn() }));
vi.mock("./project-context", () => ({ buildProjectArtifactContext: buildProjectArtifactContextMock }));

const { createProject, enableSharing, analyzeCoherence } = await import("./project-service");

function mockSelectOnce(rows: unknown[]) {
  selectMock.mockReturnValueOnce({ from: () => ({ where: () => Promise.resolve(rows) }) });
}

function mockInsertReturningOnce(rows: unknown[]) {
  insertMock.mockReturnValueOnce({ values: () => ({ returning: () => Promise.resolve(rows) }) });
}

function mockInsertNoReturningOnce() {
  insertMock.mockReturnValueOnce({ values: () => Promise.resolve(undefined) });
}

function mockUpdateReturningOnce(rows: unknown[]) {
  updateMock.mockReturnValueOnce({ set: () => ({ where: () => ({ returning: () => Promise.resolve(rows) }) }) });
}

beforeEach(() => {
  selectMock.mockReset();
  insertMock.mockReset();
  updateMock.mockReset();
  ensureUserMock.mockClear();
  auditLogMock.mockClear();
  getPlanConfigMock.mockReset();
});

describe("createProject", () => {
  it("bloqueia com 403 quando o plano já está no limite de projetos", async () => {
    getPlanConfigMock.mockReturnValue({ name: "Explorar", maxProjects: 1 });
    mockSelectOnce([{ plan: "free", isSuperuser: false }]); // getUserPlan
    mockSelectOnce([{ count: 1 }]); // countActiveProjects — already at limit

    const result = await createProject("clerk_1", { name: "Novo", briefing: "..." });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
      expect(result.code).toBe("PROJECT_LIMIT_REACHED");
      expect(result.error).toContain("Explorar");
    }
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("cria o projeto e as 7 fases quando dentro do limite", async () => {
    getPlanConfigMock.mockReturnValue({ name: "Founder", maxProjects: 5 });
    mockSelectOnce([{ plan: "founder", isSuperuser: false }]); // getUserPlan
    mockSelectOnce([{ count: 1 }]); // countActiveProjects — under limit
    mockInsertReturningOnce([{ id: 42, name: "Novo", briefing: "..." }]); // project insert
    mockInsertNoReturningOnce(); // phases insert (no .returning() call in source)

    const result = await createProject("clerk_1", { name: "Novo", briefing: "..." });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ id: 42, name: "Novo", briefing: "..." });
    expect(auditLogMock).toHaveBeenCalledWith(expect.objectContaining({ eventType: "user.project.created" }));
  });
});

describe("enableSharing", () => {
  it("atribui shareId atomicamente quando ainda não compartilhado", async () => {
    mockUpdateReturningOnce([{ shareId: "abc123", sharedAt: new Date("2026-01-01") }]);

    const result = await enableSharing("clerk_1", 10);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.shareId).toBe("abc123");
    expect(auditLogMock).toHaveBeenCalledWith(expect.objectContaining({ eventType: "user.project.shared" }));
  });

  it("quando já compartilhado, relê e devolve o shareId existente sem re-auditar", async () => {
    mockUpdateReturningOnce([]); // atomic update matched no row (already has a shareId)
    mockSelectOnce([{ shareId: "existing-id", sharedAt: new Date("2025-01-01") }]);

    const result = await enableSharing("clerk_1", 10);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.shareId).toBe("existing-id");
    expect(auditLogMock).not.toHaveBeenCalled();
  });

  it("retorna 404 quando o projeto não existe para o usuário", async () => {
    mockUpdateReturningOnce([]);
    mockSelectOnce([]);

    const result = await enableSharing("clerk_1", 999);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(404);
  });
});

describe("analyzeCoherence", () => {
  it("preserva o payload completo (plan/context/limit/used) quando o limite de IA é atingido", async () => {
    mockSelectOnce([{ id: 5, name: "Proj", briefing: "..." }]); // requireProjectForAi
    buildProjectArtifactContextMock.mockResolvedValueOnce("algum contexto de artefato");
    checkAndIncrementAiUsageMock.mockResolvedValueOnce({ allowed: false, limit: 30, plan: "founder", used: 30 });

    const result = await analyzeCoherence("clerk_1", 5);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(429);
      expect(result.code).toBe("AI_LIMIT_EXCEEDED");
      expect(result.body).toMatchObject({ limit: 30, used: 30, plan: "founder", context: "Análise de coerência do projeto" });
    }
  });

  it("retorna 402 com payload de trial expirado quando aplicável", async () => {
    mockSelectOnce([{ id: 5, name: "Proj", briefing: "..." }]);
    buildProjectArtifactContextMock.mockResolvedValueOnce("algum contexto de artefato");
    checkAndIncrementAiUsageMock.mockResolvedValueOnce({ allowed: false, reason: "trial_expired", plan: "free", limit: 3, used: 3 });

    const result = await analyzeCoherence("clerk_1", 5);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(402);
      expect(result.code).toBe("FREE_TRIAL_EXPIRED");
      expect(result.body).toMatchObject({ plan: "free" });
    }
  });

  it("atualiza o score quando a análise tem sucesso", async () => {
    mockSelectOnce([{ id: 5, name: "Proj", briefing: "..." }]);
    buildProjectArtifactContextMock.mockResolvedValueOnce("algum contexto de artefato");
    checkAndIncrementAiUsageMock.mockResolvedValueOnce({ allowed: true, limit: 30, plan: "founder", used: 1 });
    analyzeProjectCoherenceMock.mockResolvedValueOnce({ score: 85, notes: "ok" });
    updateMock.mockReturnValueOnce({ set: () => ({ where: () => Promise.resolve(undefined) }) });

    const result = await analyzeCoherence("clerk_1", 5);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ score: 85, notes: "ok" });
  });
});
