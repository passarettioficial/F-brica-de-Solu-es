import { describe, it, expect, vi, beforeEach } from "vitest";

const selectMock = vi.fn();
const updateMock = vi.fn();

vi.mock("@workspace/db", () => ({
  db: { select: selectMock, update: updateMock },
  usersTable: { clerkId: "clerkId", dailyAiUsage: "dailyAiUsage", dailyAiResetDate: "dailyAiResetDate" },
}));

const { isFreeTrialExpired, checkAndIncrementAiUsage, FREE_TRIAL_DAYS } = await import("./auth");

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function mockSelectResult(rows: unknown[]) {
  selectMock.mockReturnValueOnce({
    from: () => ({ where: () => Promise.resolve(rows) }),
  });
}

function mockUpdateReturning(rows: unknown[]) {
  updateMock.mockReturnValueOnce({
    set: () => ({ where: () => ({ returning: () => Promise.resolve(rows) }) }),
  });
}

const today = new Date().toISOString().split("T")[0];

describe("isFreeTrialExpired", () => {
  it("nunca expira para plano pago", () => {
    expect(isFreeTrialExpired({ plan: "founder", isAdmin: false, isSuperuser: false, createdAt: daysAgo(30) })).toBe(false);
  });

  it("nunca expira para admin", () => {
    expect(isFreeTrialExpired({ plan: "free", isAdmin: true, isSuperuser: false, createdAt: daysAgo(30) })).toBe(false);
  });

  it("nunca expira para superuser", () => {
    expect(isFreeTrialExpired({ plan: "free", isAdmin: false, isSuperuser: true, createdAt: daysAgo(30) })).toBe(false);
  });

  it(`não expira dentro da janela de ${FREE_TRIAL_DAYS} dias`, () => {
    expect(isFreeTrialExpired({ plan: "free", isAdmin: false, isSuperuser: false, createdAt: daysAgo(FREE_TRIAL_DAYS - 1) })).toBe(false);
  });

  it(`expira após ${FREE_TRIAL_DAYS} dias`, () => {
    expect(isFreeTrialExpired({ plan: "free", isAdmin: false, isSuperuser: false, createdAt: daysAgo(FREE_TRIAL_DAYS + 1) })).toBe(true);
  });

  it("trata createdAt inválido como não expirado (fail-safe)", () => {
    expect(isFreeTrialExpired({ plan: "free", isAdmin: false, isSuperuser: false, createdAt: "not-a-date" })).toBe(false);
  });
});

describe("checkAndIncrementAiUsage", () => {
  beforeEach(() => {
    selectMock.mockReset();
    updateMock.mockReset();
  });

  it("bloqueia se o usuário não existe", async () => {
    mockSelectResult([]);
    const result = await checkAndIncrementAiUsage("clerk_missing");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("ai_limit");
  });

  it("superuser tem uso ilimitado e não consulta contador", async () => {
    mockSelectResult([{ isSuperuser: true, plan: "studio", dailyAiUsage: 0, dailyAiResetDate: today, createdAt: new Date() }]);
    const result = await checkAndIncrementAiUsage("clerk_super");
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(999999);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("bloqueia quando o trial gratuito de 7 dias expirou", async () => {
    mockSelectResult([{
      isSuperuser: false, plan: "free", dailyAiUsage: 1, dailyAiResetDate: today,
      isAdmin: false, createdAt: daysAgo(FREE_TRIAL_DAYS + 1),
    }]);
    const result = await checkAndIncrementAiUsage("clerk_expired");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("trial_expired");
  });

  it("reseta o contador atomicamente em um novo dia e permite o uso", async () => {
    mockSelectResult([{
      isSuperuser: false, plan: "founder", dailyAiUsage: 30, dailyAiResetDate: "2020-01-01",
      isAdmin: false, createdAt: daysAgo(100),
    }]);
    mockUpdateReturning([{}]);
    const result = await checkAndIncrementAiUsage("clerk_newday");
    expect(result.allowed).toBe(true);
    expect(result.used).toBe(1);
    expect(updateMock).toHaveBeenCalledTimes(1);
  });

  it("incrementa atomicamente quando abaixo do limite diário", async () => {
    mockSelectResult([{
      isSuperuser: false, plan: "founder", dailyAiUsage: 5, dailyAiResetDate: today,
      isAdmin: false, createdAt: daysAgo(100),
    }]);
    mockUpdateReturning([{ dailyAiUsage: 6 }]);
    const result = await checkAndIncrementAiUsage("clerk_ok");
    expect(result.allowed).toBe(true);
    expect(result.used).toBe(6);
  });

  it("bloqueia quando o update atômico não afeta nenhuma linha (limite atingido)", async () => {
    mockSelectResult([{
      isSuperuser: false, plan: "founder", dailyAiUsage: 30, dailyAiResetDate: today,
      isAdmin: false, createdAt: daysAgo(100),
    }]);
    mockUpdateReturning([]);
    const result = await checkAndIncrementAiUsage("clerk_limited");
    expect(result.allowed).toBe(false);
    expect(result.used).toBe(30);
  });
});
