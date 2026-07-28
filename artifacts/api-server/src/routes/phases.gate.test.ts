import { describe, it, expect, vi, beforeEach } from "vitest";

const selectMock = vi.fn();

vi.mock("@clerk/express", () => ({ getAuth: vi.fn() }));
vi.mock("@workspace/db", () => ({
  db: { select: selectMock },
  usersTable: { clerkId: "clerkId", plan: "plan", isSuperuser: "isSuperuser" },
  projectsTable: {},
  phasesTable: {},
  phaseArtifactsTable: {},
  artifactVersionsTable: {},
  artifactFeedbackTable: {},
}));
vi.mock("../lib/ai", () => ({ generatePhaseArtifacts: vi.fn() }));
vi.mock("../lib/events", () => ({ logEvent: vi.fn() }));
vi.mock("../lib/audit", () => ({ auditLog: vi.fn() }));
vi.mock("../lib/notifications", () => ({ createNotification: vi.fn() }));
vi.mock("../lib/artifact-versions", () => ({ snapshotArtifact: vi.fn(), snapshotAllPhaseArtifacts: vi.fn() }));

const { applyPhase3FreeGate, isPhase3GatedKey } = await import("./phases");

function mockSelectResult(rows: unknown[]) {
  selectMock.mockReturnValueOnce({
    from: () => ({ where: () => Promise.resolve(rows) }),
  });
}

describe("isPhase3GatedKey", () => {
  it("só a política de privacidade fica fora do gate", () => {
    expect(isPhase3GatedKey("POLITICA_PRIVACIDADE")).toBe(false);
    expect(isPhase3GatedKey("LGPD_CHECKLIST")).toBe(true);
    expect(isPhase3GatedKey("PLANO_SEGURANCA")).toBe(true);
  });
});

describe("applyPhase3FreeGate", () => {
  beforeEach(() => {
    selectMock.mockReset();
  });

  const artifacts = [
    { artifactKey: "POLITICA_PRIVACIDADE", content: "conteúdo livre", contentJson: { a: 1 } },
    { artifactKey: "LGPD_CHECKLIST", content: "conteúdo pago", contentJson: { b: 2 } },
  ];

  it("não mexe em artefatos de fases diferentes de 3", async () => {
    const result = await applyPhase3FreeGate("clerk_1", 4, artifacts);
    expect(result).toEqual(artifacts);
    expect(selectMock).not.toHaveBeenCalled();
  });

  it("libera tudo para plano pago", async () => {
    mockSelectResult([{ plan: "founder", isSuperuser: false }]);
    const result = await applyPhase3FreeGate("clerk_pago", 3, artifacts);
    expect(result).toEqual(artifacts);
  });

  it("libera tudo para superuser mesmo com plan=free no registro", async () => {
    mockSelectResult([{ plan: "free", isSuperuser: true }]);
    const result = await applyPhase3FreeGate("clerk_super", 3, artifacts);
    expect(result).toEqual(artifacts);
  });

  it("trava todo artefato exceto POLITICA_PRIVACIDADE para plano free", async () => {
    mockSelectResult([{ plan: "free", isSuperuser: false }]);
    const result = await applyPhase3FreeGate("clerk_free", 3, artifacts);

    const privacyDoc = result.find((a) => a.artifactKey === "POLITICA_PRIVACIDADE")!;
    expect(privacyDoc.locked).toBeUndefined();
    expect(privacyDoc.content).toBe("conteúdo livre");

    const gated = result.find((a) => a.artifactKey === "LGPD_CHECKLIST")!;
    expect(gated.locked).toBe(true);
    expect(gated.content).toBe("");
    expect(gated.contentJson).toBeNull();
  });

  it("trata usuário sem registro como free (fail-closed)", async () => {
    mockSelectResult([]);
    const result = await applyPhase3FreeGate("clerk_desconhecido", 3, artifacts);
    const gated = result.find((a) => a.artifactKey === "LGPD_CHECKLIST")!;
    expect(gated.locked).toBe(true);
  });
});
