import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const selectMock = vi.fn();
const updateMock = vi.fn();
const insertMock = vi.fn();
const constructEventMock = vi.fn();
const subscriptionsCancelMock = vi.fn();
const chargesRetrieveMock = vi.fn();
const auditLogMock = vi.fn();

vi.mock("@clerk/express", () => ({ getAuth: vi.fn() }));

vi.mock("@workspace/db", () => ({
  db: { select: selectMock, update: updateMock, insert: insertMock },
  usersTable: { clerkId: "clerkId", stripeCustomerId: "stripeCustomerId" },
  couponsTable: { code: "code", usesCount: "usesCount", maxUses: "maxUses" },
  couponRedemptionsTable: { couponId: "couponId", clerkId: "clerkId" },
}));

vi.mock("../lib/stripe", () => ({
  stripe: {
    webhooks: { constructEvent: constructEventMock },
    subscriptions: { cancel: subscriptionsCancelMock },
    charges: { retrieve: chargesRetrieveMock },
  },
  PLANS: { free: { id: "free" }, founder: { id: "founder" }, studio: { id: "studio" } },
  getPlanConfig: vi.fn(),
  getOrCreateStripeCustomer: vi.fn(),
  getPriceId: vi.fn(),
  getOrCreateStripeCoupon: vi.fn(),
  normalizePlanId: (id: string) => id,
}));

vi.mock("../lib/coupons", () => ({ validateCoupon: vi.fn() }));
vi.mock("../lib/audit", () => ({ auditLog: auditLogMock }));
vi.mock("../lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

const { handleStripeWebhook } = await import("./billing");

function mockSelectOnce(rows: unknown[]) {
  selectMock.mockReturnValueOnce({ from: () => ({ where: () => Promise.resolve(rows) }) });
}

function mockUpdateOnce(returningRows: unknown[] = []) {
  updateMock.mockReturnValueOnce({
    set: () => ({
      where: () => {
        const p = Promise.resolve(undefined) as Promise<undefined> & { returning?: () => Promise<unknown[]> };
        p.returning = () => Promise.resolve(returningRows);
        return p;
      },
    }),
  });
}

function mockInsertOnce() {
  const onConflictDoNothing = vi.fn().mockResolvedValue(undefined);
  insertMock.mockReturnValueOnce({ values: () => ({ onConflictDoNothing }) });
  return onConflictDoNothing;
}

function fakeReq(opts: { hasSignature?: boolean } = {}) {
  return {
    headers: opts.hasSignature === false ? {} : { "stripe-signature": "sig_test" },
    body: Buffer.from("{}"),
  } as any;
}

function fakeRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res;
}

describe("handleStripeWebhook — verificação de assinatura (fail-closed)", () => {
  const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;

  afterEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
    vi.clearAllMocks();
  });

  it("rejeita com 500 se STRIPE_WEBHOOK_SECRET não estiver configurado, mesmo com payload válido", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const req = fakeReq();
    const res = fakeRes();

    await handleStripeWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(constructEventMock).not.toHaveBeenCalled();
  });

  it("rejeita com 400 se não houver header stripe-signature", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    const req = fakeReq({ hasSignature: false });
    const res = fakeRes();

    await handleStripeWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(constructEventMock).not.toHaveBeenCalled();
  });

  it("rejeita com 400 se a assinatura for inválida", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    constructEventMock.mockImplementationOnce(() => {
      throw new Error("invalid signature");
    });
    const req = fakeReq();
    const res = fakeRes();

    await handleStripeWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("handleStripeWebhook — eventos processados", () => {
  beforeEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    vi.clearAllMocks();
  });

  it("checkout.session.completed ativa o plano do usuário", async () => {
    constructEventMock.mockReturnValueOnce({
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: { clerkId: "clerk_1", planId: "founder" },
          subscription: "sub_123",
        },
      },
    });
    mockSelectOnce([{ clerkId: "clerk_1", stripeSubscriptionId: null }]);
    mockUpdateOnce();

    const res = fakeRes();
    await handleStripeWebhook(fakeReq(), res);

    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("checkout.session.completed com cupom incrementa uso e registra a redenção por usuário", async () => {
    constructEventMock.mockReturnValueOnce({
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: { clerkId: "clerk_1", planId: "founder", couponCode: "PROMO10" },
          subscription: "sub_123",
        },
      },
    });
    mockSelectOnce([{ clerkId: "clerk_1", stripeSubscriptionId: null }]); // existing user lookup
    mockUpdateOnce(); // user plan activation
    mockUpdateOnce([{ id: 42, code: "PROMO10" }]); // bounded coupon usesCount increment
    const onConflictDoNothing = mockInsertOnce();

    const res = fakeRes();
    await handleStripeWebhook(fakeReq(), res);

    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(onConflictDoNothing).toHaveBeenCalledTimes(1);
    expect(auditLogMock).toHaveBeenCalledWith(expect.objectContaining({ eventType: "user.coupon.redeemed" }));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("charge.refunded com reembolso total cancela a assinatura e rebaixa para free", async () => {
    constructEventMock.mockReturnValueOnce({
      type: "charge.refunded",
      data: {
        object: { id: "ch_1", customer: "cus_1", amount: 1000, amount_refunded: 1000 },
      },
    });
    mockSelectOnce([{ clerkId: "clerk_1", stripeCustomerId: "cus_1", stripeSubscriptionId: "sub_123" }]);
    mockUpdateOnce();

    const res = fakeRes();
    await handleStripeWebhook(fakeReq(), res);

    expect(subscriptionsCancelMock).toHaveBeenCalledWith("sub_123");
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(auditLogMock).toHaveBeenCalledWith(expect.objectContaining({ eventType: "user.payment.refunded" }));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("charge.refunded parcial não cancela assinatura nem rebaixa o plano", async () => {
    constructEventMock.mockReturnValueOnce({
      type: "charge.refunded",
      data: {
        object: { id: "ch_2", customer: "cus_2", amount: 1000, amount_refunded: 300 },
      },
    });
    mockSelectOnce([{ clerkId: "clerk_2", stripeCustomerId: "cus_2", stripeSubscriptionId: "sub_456" }]);

    const res = fakeRes();
    await handleStripeWebhook(fakeReq(), res);

    expect(subscriptionsCancelMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
    expect(auditLogMock).toHaveBeenCalledWith(expect.objectContaining({ eventType: "user.payment.refunded" }));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("charge.dispute.created audita mas não revoga acesso automaticamente", async () => {
    constructEventMock.mockReturnValueOnce({
      type: "charge.dispute.created",
      data: {
        object: { id: "dp_1", charge: "ch_3", amount: 1000, reason: "fraudulent" },
      },
    });
    chargesRetrieveMock.mockResolvedValueOnce({ customer: "cus_3" });
    mockSelectOnce([{ clerkId: "clerk_3", stripeCustomerId: "cus_3" }]);

    const res = fakeRes();
    await handleStripeWebhook(fakeReq(), res);

    expect(updateMock).not.toHaveBeenCalled();
    expect(auditLogMock).toHaveBeenCalledWith(expect.objectContaining({ eventType: "user.payment.disputed" }));
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
