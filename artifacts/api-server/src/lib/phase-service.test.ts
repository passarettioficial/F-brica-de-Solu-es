import { describe, it, expect, vi, beforeEach } from "vitest";

const selectMock = vi.fn();
const updateMock = vi.fn();

const getPlanConfigMock = vi.fn();
const checkAndIncrementAiUsageMock = vi.fn();
const auditLogMock = vi.fn();
const createNotificationMock = vi.fn();
const logEventMock = vi.fn();

vi.mock("@workspace/db", () => ({
  db: { select: selectMock, update: updateMock },
  projectsTable: { id: "id", clerkId: "clerkId", deletedAt: "deletedAt" },
  phasesTable: { id: "id", projectId: "projectId", phaseNumber: "phaseNumber", isGenerating: "isGenerating" },
  phaseArtifactsTable: {},
  artifactVersionsTable: {},
  usersTable: { clerkId: "clerkId" },
  artifactFeedbackTable: {},
}));

vi.mock("./ai", () => ({ generatePhaseArtifacts: vi.fn() }));
vi.mock("./events", () => ({ logEvent: logEventMock }));
vi.mock("./auth", () => ({
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
vi.mock("./audit", () => ({ auditLog: auditLogMock }));
vi.mock("./notifications", () => ({ createNotification: createNotificationMock }));
vi.mock("./stripe", () => ({ getPlanConfig: getPlanConfigMock }));
vi.mock("./artifact-versions", () => ({ snapshotArtifact: vi.fn(), snapshotAllPhaseArtifacts: vi.fn() }));

const { applyPhase3FreeGate, isPhase3GatedKey, completePhase, prepareExecution } = await import("./phase-service");

function mockSelectOnce(rows: unknown[]) {
  selectMock.mockReturnValueOnce({ from: () => ({ where: () => Promise.resolve(rows) }) });
}

function mockUpdateReturningOnce(rows: unknown[]) {
  updateMock.mockReturnValueOnce({ set: () => ({ where: () => ({ returning: () => Promise.resolve(rows) }) }) });
}

function mockUpdateNoReturningOnce() {
  updateMock.mockReturnValueOnce({ set: () => ({ where: () => Promise.resolve(undefined) }) });
}

beforeEach(() => {
  selectMock.mockReset();
  updateMock.mockReset();
  getPlanConfigMock.mockReset();
  checkAndIncrementAiUsageMock.mockReset();
  auditLogMock.mockClear();
  createNotificationMock.mockClear();
  logEventMock.mockClear();
});

describe("isPhase3GatedKey", () => {
  it("só a política de privacidade fica fora do gate", () => {
    expect(isPhase3GatedKey("POLITICA_PRIVACIDADE")).toBe(false);
    expect(isPhase3GatedKey("LGPD_CHECKLIST")).toBe(true);
  });
});

describe("applyPhase3FreeGate", () => {
  const artifacts = [
    { artifactKey: "POLITICA_PRIVACIDADE", content: "livre", contentJson: { a: 1 } },
    { artifactKey: "LGPD_CHECKLIST", content: "pago", contentJson: { b: 2 } },
  ];

  it("não mexe em fases diferentes de 3", async () => {
    const result = await applyPhase3FreeGate("clerk_1", 4, artifacts);
    expect(result).toEqual(artifacts);
    expect(selectMock).not.toHaveBeenCalled();
  });

  it("libera tudo para plano pago", async () => {
    getPlanConfigMock.mockReturnValue({ id: "founder" });
    mockSelectOnce([{ plan: "founder", isSuperuser: false }]);
    const result = await applyPhase3FreeGate("clerk_pago", 3, artifacts);
    expect(result).toEqual(artifacts);
  });

  it("trava tudo exceto POLITICA_PRIVACIDADE para plano free", async () => {
    getPlanConfigMock.mockReturnValue({ id: "free" });
    mockSelectOnce([{ plan: "free", isSuperuser: false }]);
    const result = await applyPhase3FreeGate("clerk_free", 3, artifacts);
    expect(result.find((a) => a.artifactKey === "LGPD_CHECKLIST")!.locked).toBe(true);
    expect(result.find((a) => a.artifactKey === "POLITICA_PRIVACIDADE")!.locked).toBeUndefined();
  });
});

describe("completePhase", () => {
  it("bloqueia com 400 se nem todos os gates estiverem marcados", async () => {
    mockSelectOnce([{ id: 1, name: "Proj", clerkId: "clerk_1" }]); // project
    mockSelectOnce([{ id: 10, projectId: 1, phaseNumber: 2, gate1Checked: true, gate2Checked: false, gate3Checked: true }]); // phase

    const result = await completePhase("clerk_1", 1, 2);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("completa a fase, avança a próxima e notifica PHASE_COMPLETED (não é a última)", async () => {
    mockSelectOnce([{ id: 1, name: "Proj", clerkId: "clerk_1" }]);
    mockSelectOnce([{ id: 10, projectId: 1, phaseNumber: 2, gate1Checked: true, gate2Checked: true, gate3Checked: true }]);
    mockUpdateReturningOnce([{ id: 10, status: "completed" }]); // complete current phase
    mockUpdateNoReturningOnce(); // activate next phase
    mockUpdateNoReturningOnce(); // advance project.currentPhase

    const result = await completePhase("clerk_1", 1, 2);

    expect(result.ok).toBe(true);
    expect(updateMock).toHaveBeenCalledTimes(3);
    expect(createNotificationMock).toHaveBeenCalledWith("clerk_1", "PHASE_COMPLETED", expect.any(String), expect.any(String), "/projects/1/phases/3");
    expect(logEventMock).toHaveBeenCalledWith("clerk_1", "phase_completed", { projectId: 1, phaseId: 10 });
  });

  it("na fase 7, notifica PROJECT_COMPLETED e não tenta ativar uma fase 8", async () => {
    mockSelectOnce([{ id: 1, name: "Proj", clerkId: "clerk_1" }]);
    mockSelectOnce([{ id: 70, projectId: 1, phaseNumber: 7, gate1Checked: true, gate2Checked: true, gate3Checked: true }]);
    mockUpdateReturningOnce([{ id: 70, status: "completed" }]);

    const result = await completePhase("clerk_1", 1, 7);

    expect(result.ok).toBe(true);
    expect(updateMock).toHaveBeenCalledTimes(1); // only the completion update, no next-phase activation
    expect(createNotificationMock).toHaveBeenCalledWith("clerk_1", "PROJECT_COMPLETED", expect.any(String), expect.any(String), "/projects/1");
    expect(logEventMock).toHaveBeenCalledWith("clerk_1", "project_completed", { projectId: 1 });
  });
});

describe("requireProjectAndPhase — escopo de ownership exclui projetos soft-deleted", () => {
  // ownedActiveProject() filtra por isNull(deletedAt) na query real; o mock de
  // db.select() não interpreta o WHERE, então simulamos a CONSEQUÊNCIA que a query
  // real produziria para um projeto na lixeira: 0 linhas retornadas. Isso documenta
  // e trava o contrato "projeto na lixeira == projeto não encontrado" para todo
  // consumidor de requireProjectAndPhase — completePhase, prepareExecution,
  // getPhaseWithArtifacts, listPhaseArtifacts, markArtifactDownloaded,
  // listArtifactVersions compartilham exatamente este mesmo caminho.
  it("completePhase retorna 404 (não completa fase de projeto na lixeira)", async () => {
    mockSelectOnce([]); // projeto soft-deleted não aparece mais no resultado de ownedActiveProject
    const result = await completePhase("clerk_1", 1, 2);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(404);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("prepareExecution retorna 404 (não gera IA para projeto na lixeira, cota não é consumida)", async () => {
    mockSelectOnce([]);
    const result = await prepareExecution("clerk_1", 1, 1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(404);
    expect(checkAndIncrementAiUsageMock).not.toHaveBeenCalled();
  });
});

describe("prepareExecution", () => {
  it("rejeita com 400 se a fase estiver locked", async () => {
    mockSelectOnce([{ id: 1, name: "Proj", clerkId: "clerk_1" }]);
    mockSelectOnce([{ id: 10, projectId: 1, phaseNumber: 1, status: "locked", isGenerating: false }]);

    const result = await prepareExecution("clerk_1", 1, 1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("rejeita com 402 FREE_PHASE_LIMIT para fase 4+ em plano free", async () => {
    mockSelectOnce([{ id: 1, name: "Proj", clerkId: "clerk_1" }]);
    mockSelectOnce([{ id: 10, projectId: 1, phaseNumber: 4, status: "active", isGenerating: false }]);
    getPlanConfigMock.mockReturnValue({ id: "free" });
    mockSelectOnce([{ plan: "free", isSuperuser: false, founderProfile: null }]);

    const result = await prepareExecution("clerk_1", 1, 4);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("FREE_PHASE_LIMIT");
    expect(updateMock).not.toHaveBeenCalled(); // never reached the lock-acquire step
  });

  it("rejeita com 409 quando outra geração já está em andamento (lock não adquirido)", async () => {
    mockSelectOnce([{ id: 1, name: "Proj", clerkId: "clerk_1" }]);
    mockSelectOnce([{ id: 10, projectId: 1, phaseNumber: 1, status: "active", isGenerating: true }]);
    getPlanConfigMock.mockReturnValue({ id: "founder" });
    mockSelectOnce([{ plan: "founder", isSuperuser: false, founderProfile: null }]);
    updateMock.mockReturnValueOnce({ set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }) }); // lock update matches 0 rows

    const result = await prepareExecution("clerk_1", 1, 1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(409);
    expect(checkAndIncrementAiUsageMock).not.toHaveBeenCalled();
  });

  it("no limite de IA atingido, libera o lock e preserva o payload completo (limit/used/plan/context)", async () => {
    mockSelectOnce([{ id: 1, name: "Proj", clerkId: "clerk_1" }]);
    mockSelectOnce([{ id: 10, projectId: 1, phaseNumber: 1, status: "active", isGenerating: false }]);
    getPlanConfigMock.mockReturnValue({ id: "founder" });
    mockSelectOnce([{ plan: "founder", isSuperuser: false, founderProfile: null }]);
    mockUpdateReturningOnce([{ id: 10 }]); // lock acquired
    checkAndIncrementAiUsageMock.mockResolvedValueOnce({ allowed: false, limit: 30, plan: "founder", used: 30 });
    mockUpdateNoReturningOnce(); // lock released

    const result = await prepareExecution("clerk_1", 1, 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(429);
      expect(result.body).toMatchObject({ limit: 30, used: 30, plan: "founder" });
    }
    expect(updateMock).toHaveBeenCalledTimes(2); // acquire + release
    expect(auditLogMock).toHaveBeenCalledWith(expect.objectContaining({ eventType: "security.rate_limited" }));
  });
});
