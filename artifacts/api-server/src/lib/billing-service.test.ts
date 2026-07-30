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
  sessionsCreateMock.mockResolvedValue({ url: "https://checkout.stripe.com/session" });
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
});
