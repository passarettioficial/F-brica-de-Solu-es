import { describe, it, expect, vi, beforeEach } from "vitest";

const selectMock = vi.fn();
const updateMock = vi.fn();
const sessionsCreateMock = vi.fn();
const getOrCreateStripeCustomerMock = vi.fn();
const getPriceIdMock = vi.fn();
const getOrCreateStripeCouponMock = vi.fn();
const validateCouponMock = vi.fn();

vi.mock("@workspace/db", () => ({
  db: { select: selectMock, update: updateMock },
  usersTable: { clerkId: "clerkId", stripeCustomerId: "stripeCustomerId" },
  couponsTable: {},
  couponRedemptionsTable: {},
}));

vi.mock("./stripe", () => ({
  stripe: { checkout: { sessions: { create: sessionsCreateMock } } },
  PLANS: {
    free: { id: "free", lookupKey: "", lookupKeyYearly: "" },
    founder: { id: "founder", lookupKey: "founder_monthly", lookupKeyYearly: "founder_yearly" },
    studio: { id: "studio", lookupKey: "studio_monthly", lookupKeyYearly: "studio_yearly" },
  },
  getOrCreateStripeCustomer: getOrCreateStripeCustomerMock,
  getPriceId: getPriceIdMock,
  getOrCreateStripeCoupon: getOrCreateStripeCouponMock,
  normalizePlanId: (id: string) => id,
  planIdFromLookupKey: vi.fn().mockReturnValue(null),
}));

vi.mock("./coupons", () => ({ validateCoupon: validateCouponMock }));
vi.mock("./audit", () => ({ auditLog: vi.fn() }));
vi.mock("./logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

const { createCheckoutSession } = await import("./billing-service");

function mockSelectOnce(rows: unknown[]) {
  selectMock.mockReturnValueOnce({ from: () => ({ where: () => Promise.resolve(rows) }) });
}

function chainableUpdate(returningRows: unknown[]) {
  return {
    set: () => ({
      where: () => {
        const p = Promise.resolve(undefined) as Promise<undefined> & { returning?: () => Promise<unknown[]> };
        p.returning = () => Promise.resolve(returningRows);
        return p;
      },
    }),
  };
}

/** Faz o próximo `db.update(...)` "perder" a reserva (outro checkout já em andamento). */
function mockUpdateReservationLoses() {
  updateMock.mockReturnValueOnce(chainableUpdate([]));
}

const baseParams = {
  clerkId: "clerk_1",
  billingCycle: "monthly" as const,
  successUrl: "https://foundersflow.com.br/success",
  cancelUrl: "https://foundersflow.com.br/cancel",
};

beforeEach(() => {
  vi.clearAllMocks();
  getPriceIdMock.mockResolvedValue("price_123");
  getOrCreateStripeCustomerMock.mockResolvedValue("cus_123");
  sessionsCreateMock.mockResolvedValue({ url: "https://checkout.stripe.com/session", id: "cs_test_123" });
  // Por padrão, toda reserva de checkout concorrente "vence" — testes que querem exercitar
  // a corrida (F8) chamam mockUpdateReservationLoses() explicitamente antes.
  updateMock.mockImplementation(() => chainableUpdate([{ id: 1 }]));
});

describe("createCheckoutSession — proteção contra assinatura duplicada (F8)", () => {
  it("rejeita com 409 se o usuário já tem assinatura ativa", async () => {
    mockSelectOnce([{ clerkId: "clerk_1", stripeCustomerId: "cus_1", stripeSubscriptionId: "sub_1", stripeSubscriptionStatus: "active" }]);

    const result = await createCheckoutSession({ ...baseParams, planId: "founder" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(409);
    expect(sessionsCreateMock).not.toHaveBeenCalled();
  });

  it("rejeita com 409 se a assinatura está trialing (também concede acesso)", async () => {
    mockSelectOnce([{ clerkId: "clerk_1", stripeCustomerId: "cus_1", stripeSubscriptionId: "sub_1", stripeSubscriptionStatus: "trialing" }]);

    const result = await createCheckoutSession({ ...baseParams, planId: "studio" });

    expect(result.ok).toBe(false);
    expect(sessionsCreateMock).not.toHaveBeenCalled();
  });

  it("permite novo checkout se a assinatura anterior está cancelada (não bloqueia recuperação/upgrade)", async () => {
    mockSelectOnce([{ clerkId: "clerk_1", stripeCustomerId: "cus_1", stripeSubscriptionId: "sub_old", stripeSubscriptionStatus: "canceled" }]);

    const result = await createCheckoutSession({ ...baseParams, planId: "founder" });

    expect(result.ok).toBe(true);
    expect(sessionsCreateMock).toHaveBeenCalledTimes(1);
  });

  it("permite checkout para usuário sem assinatura e passa idempotencyKey determinística", async () => {
    mockSelectOnce([{ clerkId: "clerk_1", stripeCustomerId: "cus_1", stripeSubscriptionId: null, stripeSubscriptionStatus: null }]);

    const result = await createCheckoutSession({ ...baseParams, planId: "founder" });

    expect(result.ok).toBe(true);
    expect(sessionsCreateMock).toHaveBeenCalledTimes(1);
    const [, options] = sessionsCreateMock.mock.calls[0] as [unknown, { idempotencyKey?: string }];
    expect(options.idempotencyKey).toContain("clerk_1");
    expect(options.idempotencyKey).toContain("founder");
  });

  it("rejeita com 409 se outro checkout já está reservado/em andamento (corrida concorrente)", async () => {
    mockSelectOnce([{ clerkId: "clerk_1", stripeCustomerId: "cus_1", stripeSubscriptionId: null, stripeSubscriptionStatus: null }]);
    mockUpdateReservationLoses();

    const result = await createCheckoutSession({ ...baseParams, planId: "founder" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(409);
    expect(sessionsCreateMock).not.toHaveBeenCalled();
  });

  it("libera a reserva se a criação da sessão falhar (não trava o usuário por 30min)", async () => {
    mockSelectOnce([{ clerkId: "clerk_1", stripeCustomerId: "cus_1", stripeSubscriptionId: null, stripeSubscriptionStatus: null }]);
    sessionsCreateMock.mockRejectedValueOnce(new Error("Stripe indisponível"));

    await expect(createCheckoutSession({ ...baseParams, planId: "founder" })).rejects.toThrow("Stripe indisponível");

    // A última chamada de update deve ser a liberação da reserva (pendingCheckoutSessionId: null).
    const lastSetCall = updateMock.mock.results.at(-1);
    expect(lastSetCall).toBeDefined();
  });

  it("passa expires_at na sessão do Stripe alinhado à janela de reserva (30min)", async () => {
    mockSelectOnce([{ clerkId: "clerk_1", stripeCustomerId: "cus_1", stripeSubscriptionId: null, stripeSubscriptionStatus: null }]);

    await createCheckoutSession({ ...baseParams, planId: "founder" });

    const [sessionParams] = sessionsCreateMock.mock.calls[0] as [{ expires_at?: number }];
    expect(sessionParams.expires_at).toBeGreaterThan(Math.floor(Date.now() / 1000) + 29 * 60);
    expect(sessionParams.expires_at).toBeLessThanOrEqual(Math.floor(Date.now() / 1000) + 30 * 60);
  });
});
