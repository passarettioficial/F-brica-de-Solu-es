import { describe, it, expect, vi, beforeEach } from "vitest";

const updateMock = vi.fn();

vi.mock("@workspace/db", () => ({
  db: { select: vi.fn(), update: updateMock },
  phasesTable: {},
  projectsTable: {},
  auditLogsTable: { id: "id", createdAt: "createdAt", ip: "ip", userAgent: "userAgent" },
}));
vi.mock("../lib/notifications", () => ({ createNotification: vi.fn() }));
vi.mock("../lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("../lib/distributed-lock", () => ({ withAdvisoryLock: vi.fn() }));

const { anonymizeOldAuditLogs } = await import("./retention-jobs");

function mockUpdateOnce(returningRows: unknown[]) {
  updateMock.mockReturnValueOnce({
    set: () => ({
      where: () => ({
        returning: () => Promise.resolve(returningRows),
      }),
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("anonymizeOldAuditLogs", () => {
  it("anonimiza ip/userAgent de registros com mais de 90 dias", async () => {
    mockUpdateOnce([{ id: 1 }, { id: 2 }]);

    await anonymizeOldAuditLogs();

    expect(updateMock).toHaveBeenCalledTimes(1);
  });

  it("não lança e apenas loga se o update falhar (job não deve derrubar o processo)", async () => {
    updateMock.mockReturnValueOnce({
      set: () => ({
        where: () => ({
          returning: () => Promise.reject(new Error("db down")),
        }),
      }),
    });

    await expect(anonymizeOldAuditLogs()).resolves.toBeUndefined();
  });

  it("não faz nada quando não há registros elegíveis (retorno vazio, sem erro)", async () => {
    mockUpdateOnce([]);

    await expect(anonymizeOldAuditLogs()).resolves.toBeUndefined();
    expect(updateMock).toHaveBeenCalledTimes(1);
  });
});
