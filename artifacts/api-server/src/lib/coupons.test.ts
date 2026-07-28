import { describe, it, expect, vi, beforeEach } from "vitest";

const selectMock = vi.fn();

vi.mock("@workspace/db", () => ({
  db: { select: selectMock },
  couponsTable: { code: "code" },
  couponRedemptionsTable: { couponId: "couponId", clerkId: "clerkId" },
}));

const { validateCoupon } = await import("./coupons");

function mockCoupon(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    code: "PROMO10",
    active: true,
    expiresAt: null,
    maxUses: null,
    usesCount: 0,
    appliesTo: null,
    discountType: "percent",
    discountValue: 10,
    ...overrides,
  };
}

function mockSelectResult(rows: unknown[]) {
  selectMock.mockReturnValueOnce({
    from: () => ({ where: () => Promise.resolve(rows) }),
  });
}

describe("validateCoupon", () => {
  beforeEach(() => {
    selectMock.mockReset();
  });

  it("rejeita código vazio sem consultar o banco", async () => {
    const result = await validateCoupon("   ");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
    expect(selectMock).not.toHaveBeenCalled();
  });

  it("normaliza o código para maiúsculas/trim antes de consultar", async () => {
    mockSelectResult([mockCoupon()]);
    const result = await validateCoupon("  promo10 ");
    expect(result.ok).toBe(true);
  });

  it("rejeita cupom inexistente", async () => {
    mockSelectResult([]);
    const result = await validateCoupon("NAOEXISTE");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(404);
  });

  it("rejeita cupom inativo", async () => {
    mockSelectResult([mockCoupon({ active: false })]);
    const result = await validateCoupon("PROMO10");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(404);
  });

  it("rejeita cupom expirado", async () => {
    mockSelectResult([mockCoupon({ expiresAt: new Date(Date.now() - 86400000) })]);
    const result = await validateCoupon("PROMO10");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("aceita cupom com expiração futura", async () => {
    mockSelectResult([mockCoupon({ expiresAt: new Date(Date.now() + 86400000) })]);
    const result = await validateCoupon("PROMO10");
    expect(result.ok).toBe(true);
  });

  it("rejeita cupom esgotado (usesCount >= maxUses)", async () => {
    mockSelectResult([mockCoupon({ maxUses: 10, usesCount: 10 })]);
    const result = await validateCoupon("PROMO10");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("aceita cupom com usos restantes", async () => {
    mockSelectResult([mockCoupon({ maxUses: 10, usesCount: 9 })]);
    const result = await validateCoupon("PROMO10");
    expect(result.ok).toBe(true);
  });

  it("rejeita cupom não aplicável ao plano informado", async () => {
    mockSelectResult([mockCoupon({ appliesTo: "studio" })]);
    const result = await validateCoupon("PROMO10", "founder");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("aceita cupom aplicável ao plano informado (CSV)", async () => {
    mockSelectResult([mockCoupon({ appliesTo: "founder,studio" })]);
    const result = await validateCoupon("PROMO10", "founder");
    expect(result.ok).toBe(true);
  });

  it("ignora restrição de plano quando planId não é informado", async () => {
    mockSelectResult([mockCoupon({ appliesTo: "studio" })]);
    const result = await validateCoupon("PROMO10");
    expect(result.ok).toBe(true);
  });

  it("não checa redenção prévia quando clerkId não é informado", async () => {
    mockSelectResult([mockCoupon()]);
    const result = await validateCoupon("PROMO10");
    expect(result.ok).toBe(true);
    expect(selectMock).toHaveBeenCalledTimes(1);
  });

  it("aceita cupom quando o usuário ainda não o resgatou", async () => {
    mockSelectResult([mockCoupon()]);
    mockSelectResult([]);
    const result = await validateCoupon("PROMO10", undefined, "clerk_1");
    expect(result.ok).toBe(true);
    expect(selectMock).toHaveBeenCalledTimes(2);
  });

  it("rejeita cupom já resgatado pelo mesmo usuário", async () => {
    mockSelectResult([mockCoupon()]);
    mockSelectResult([{ id: 10, couponId: 1, clerkId: "clerk_1" }]);
    const result = await validateCoupon("PROMO10", undefined, "clerk_1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });
});
