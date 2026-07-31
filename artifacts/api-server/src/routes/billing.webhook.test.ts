import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const selectMock = vi.fn();
const updateMock = vi.fn();
const insertMock = vi.fn();
const constructEventMock = vi.fn();
const subscriptionsCancelMock = vi.fn();
const chargesRetrieveMock = vi.fn();
const invoicePaymentsListMock = vi.fn();
const auditLogMock = vi.fn();
const planIdFromLookupKeyMock = vi.fn().mockReturnValue(null);

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
    invoicePayments: { list: invoicePaymentsListMock },
  },
  PLANS: { free: { id: "free" }, founder: { id: "founder" }, studio: { id: "studio" } },
  getPlanConfig: vi.fn(),
  getOrCreateStripeCustomer: vi.fn(),
  getPriceId: vi.fn(),
  getOrCreateStripeCoupon: vi.fn(),
  normalizePlanId: (id: string) => id,
  planIdFromLookupKey: planIdFromLookupKeyMock,
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
  const values = vi.fn().mockReturnValue({ onConflictDoNothing });
  insertMock.mockReturnValueOnce({ values });
  return { onConflictDoNothing, values };
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

  it("checkout.session.completed com cupom incrementa uso e registra a redenção com snapshot do desconto", async () => {
    constructEventMock.mockReturnValueOnce({
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: { clerkId: "clerk_1", planId: "founder", billingCycle: "yearly", couponCode: "PROMO10" },
          subscription: "sub_123",
        },
      },
    });
    mockSelectOnce([{ clerkId: "clerk_1", stripeSubscriptionId: null }]); // existing user lookup
    mockUpdateOnce(); // user plan activation
    mockUpdateOnce([{ id: 42, code: "PROMO10", discountType: "percent", discountValue: 20 }]); // bounded coupon usesCount increment
    const { onConflictDoNothing, values } = mockInsertOnce();

    const res = fakeRes();
    await handleStripeWebhook(fakeReq(), res);

    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(values).toHaveBeenCalledWith({
      couponId: 42,
      clerkId: "clerk_1",
      planId: "founder",
      billingCycle: "yearly",
      discountType: "percent",
      discountValue: 20,
    });
    expect(onConflictDoNothing).toHaveBeenCalledTimes(1);
    expect(auditLogMock).toHaveBeenCalledWith(expect.objectContaining({ eventType: "user.coupon.redeemed" }));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("charge.refunded com reembolso total da assinatura canônica cancela e rebaixa para free", async () => {
    constructEventMock.mockReturnValueOnce({
      type: "charge.refunded",
      data: {
        object: { id: "ch_1", customer: "cus_1", amount: 1000, amount_refunded: 1000, payment_intent: "pi_1" },
      },
    });
    mockSelectOnce([{ clerkId: "clerk_1", stripeCustomerId: "cus_1", stripeSubscriptionId: "sub_123" }]);
    invoicePaymentsListMock.mockResolvedValueOnce({
      data: [{ invoice: { parent: { subscription_details: { subscription: "sub_123" } } } }],
    });
    mockUpdateOnce();

    const res = fakeRes();
    await handleStripeWebhook(fakeReq(), res);

    expect(invoicePaymentsListMock).toHaveBeenCalledWith({
      payment: { type: "payment_intent", payment_intent: "pi_1" },
      expand: ["data.invoice"],
      limit: 1,
    });
    expect(subscriptionsCancelMock).toHaveBeenCalledWith("sub_123");
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(auditLogMock).toHaveBeenCalledWith(expect.objectContaining({ eventType: "user.payment.refunded" }));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("charge.refunded (F9) de uma assinatura NÃO-canônica não cancela nem rebaixa a assinatura atual", async () => {
    constructEventMock.mockReturnValueOnce({
      type: "charge.refunded",
      data: {
        object: { id: "ch_old", customer: "cus_1", amount: 1000, amount_refunded: 1000, payment_intent: "pi_old" },
      },
    });
    // Usuário tem uma assinatura atual e ativa (sub_new) diferente da que foi reembolsada (sub_old).
    mockSelectOnce([{ clerkId: "clerk_1", stripeCustomerId: "cus_1", stripeSubscriptionId: "sub_new" }]);
    invoicePaymentsListMock.mockResolvedValueOnce({
      data: [{ invoice: { parent: { subscription_details: { subscription: "sub_old" } } } }],
    });

    const res = fakeRes();
    await handleStripeWebhook(fakeReq(), res);

    expect(subscriptionsCancelMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
    expect(auditLogMock).toHaveBeenCalledWith(expect.objectContaining({ eventType: "user.payment.refunded" }));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("charge.refunded (F9) sem confirmação da assinatura não rebaixa automaticamente (requer revisão manual)", async () => {
    constructEventMock.mockReturnValueOnce({
      type: "charge.refunded",
      data: {
        object: { id: "ch_unresolvable", customer: "cus_1", amount: 1000, amount_refunded: 1000 },
      },
    });
    mockSelectOnce([{ clerkId: "clerk_1", stripeCustomerId: "cus_1", stripeSubscriptionId: "sub_123" }]);

    const res = fakeRes();
    await handleStripeWebhook(fakeReq(), res);

    expect(invoicePaymentsListMock).not.toHaveBeenCalled();
    expect(subscriptionsCancelMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
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

  it("customer.subscription.updated com status=past_due rebaixa o plano para free (F2)", async () => {
    constructEventMock.mockReturnValueOnce({
      type: "customer.subscription.updated",
      data: {
        object: { id: "sub_1", status: "past_due", metadata: { clerkId: "clerk_1", planId: "founder" } },
      },
    });
    mockSelectOnce([{ stripeSubscriptionId: "sub_1" }]); // canonical check: mesma assinatura do evento
    mockUpdateOnce();

    const res = fakeRes();
    await handleStripeWebhook(fakeReq(), res);

    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(auditLogMock).toHaveBeenCalledWith(expect.objectContaining({
      eventType: "user.payment.canceled",
      actorClerkId: "clerk_1",
      meta: expect.objectContaining({ reason: "subscription_status", status: "past_due" }),
    }));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("customer.subscription.updated com status=active aplica o plano do metadata normalmente (sem regressão)", async () => {
    constructEventMock.mockReturnValueOnce({
      type: "customer.subscription.updated",
      data: {
        object: { id: "sub_1", status: "active", metadata: { clerkId: "clerk_1", planId: "studio" } },
      },
    });
    mockSelectOnce([{ stripeSubscriptionId: "sub_1" }]);
    mockUpdateOnce();

    const res = fakeRes();
    await handleStripeWebhook(fakeReq(), res);

    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(auditLogMock).not.toHaveBeenCalled(); // só audita quando o acesso é revogado
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("customer.subscription.updated com status=trialing mantém acesso (trialing concede acesso)", async () => {
    constructEventMock.mockReturnValueOnce({
      type: "customer.subscription.updated",
      data: {
        object: { id: "sub_1", status: "trialing", metadata: { clerkId: "clerk_1", planId: "founder" } },
      },
    });
    mockSelectOnce([{ stripeSubscriptionId: "sub_1" }]);
    mockUpdateOnce();

    const res = fakeRes();
    await handleStripeWebhook(fakeReq(), res);

    expect(auditLogMock).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("customer.subscription.updated deriva o plano do preço real da assinatura, não da metadata estática (F10)", async () => {
    // Cliente trocou de Founder para Studio pelo Customer Portal — a metadata da
    // assinatura (setada só na criação) continua dizendo "founder", mas o preço vigente
    // (lookup_key) já reflete "studio". O plano gravado deve ser o do preço real.
    constructEventMock.mockReturnValueOnce({
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_1",
          status: "active",
          metadata: { clerkId: "clerk_1", planId: "founder" }, // desatualizada
          items: { data: [{ price: { lookup_key: "studio_monthly" } }] }, // real
        },
      },
    });
    planIdFromLookupKeyMock.mockReturnValueOnce("studio");
    mockSelectOnce([{ stripeSubscriptionId: "sub_1" }]);
    mockUpdateOnce();

    const res = fakeRes();
    await handleStripeWebhook(fakeReq(), res);

    expect(planIdFromLookupKeyMock).toHaveBeenCalledWith("studio_monthly");
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("customer.subscription.updated de assinatura NÃO-canônica é ignorado (F9)", async () => {
    constructEventMock.mockReturnValueOnce({
      type: "customer.subscription.updated",
      data: {
        object: { id: "sub_OLD_secundaria", status: "canceled", metadata: { clerkId: "clerk_1", planId: "founder" } },
      },
    });
    // Usuário já tem outra assinatura (sub_NOVA) como canônica — o evento é de uma antiga.
    mockSelectOnce([{ stripeSubscriptionId: "sub_NOVA" }]);

    const res = fakeRes();
    await handleStripeWebhook(fakeReq(), res);

    expect(updateMock).not.toHaveBeenCalled(); // não mutou o estado da assinatura atual
    expect(auditLogMock).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200); // webhook sempre confirma 200 ao Stripe
  });

  it("customer.subscription.updated de usuário sem assinatura canônica ainda registrada é aceito (primeiro sync)", async () => {
    constructEventMock.mockReturnValueOnce({
      type: "customer.subscription.updated",
      data: {
        object: { id: "sub_1", status: "active", metadata: { clerkId: "clerk_1", planId: "founder" } },
      },
    });
    mockSelectOnce([{ stripeSubscriptionId: null }]); // ainda não setado
    mockUpdateOnce();

    const res = fakeRes();
    await handleStripeWebhook(fakeReq(), res);

    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("customer.subscription.deleted da assinatura canônica cancela e rebaixa para free", async () => {
    constructEventMock.mockReturnValueOnce({
      type: "customer.subscription.deleted",
      data: { object: { id: "sub_1", metadata: { clerkId: "clerk_1" } } },
    });
    mockSelectOnce([{ stripeSubscriptionId: "sub_1" }]);
    mockUpdateOnce();

    const res = fakeRes();
    await handleStripeWebhook(fakeReq(), res);

    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("customer.subscription.deleted de assinatura NÃO-canônica é ignorado (F9)", async () => {
    constructEventMock.mockReturnValueOnce({
      type: "customer.subscription.deleted",
      data: { object: { id: "sub_OLD_secundaria", metadata: { clerkId: "clerk_1" } } },
    });
    mockSelectOnce([{ stripeSubscriptionId: "sub_NOVA" }]);

    const res = fakeRes();
    await handleStripeWebhook(fakeReq(), res);

    expect(updateMock).not.toHaveBeenCalled(); // não cancelou a assinatura atual e correta
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("invoice.payment_failed rebaixa o plano para free (F2)", async () => {
    constructEventMock.mockReturnValueOnce({
      type: "invoice.payment_failed",
      data: {
        object: { customer: "cus_9" },
      },
    });
    mockUpdateOnce([{ clerkId: "clerk_9" }]);

    const res = fakeRes();
    await handleStripeWebhook(fakeReq(), res);

    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(auditLogMock).toHaveBeenCalledWith(expect.objectContaining({
      eventType: "user.payment.canceled",
      actorClerkId: "clerk_9",
      meta: expect.objectContaining({ reason: "invoice_payment_failed" }),
    }));
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
