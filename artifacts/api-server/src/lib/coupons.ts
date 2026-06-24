import { eq } from "drizzle-orm";
import { db, couponsTable, type Coupon } from "@workspace/db";

export type CouponValidation =
  | { ok: true; coupon: Coupon }
  | { ok: false; status: number; error: string };

export async function validateCoupon(rawCode: string, planId?: string): Promise<CouponValidation> {
  const code = (rawCode ?? "").toUpperCase().trim();
  if (!code) return { ok: false, status: 400, error: "Código obrigatório" };

  const [coupon] = await db.select().from(couponsTable).where(eq(couponsTable.code, code));
  if (!coupon || !coupon.active) return { ok: false, status: 404, error: "Cupom inválido ou inativo" };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { ok: false, status: 400, error: "Cupom expirado" };
  if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses) return { ok: false, status: 400, error: "Cupom esgotado" };
  if (coupon.appliesTo && planId && !coupon.appliesTo.split(",").map((p) => p.trim()).includes(planId)) {
    return { ok: false, status: 400, error: "Cupom não aplicável a este plano" };
  }

  return { ok: true, coupon };
}
