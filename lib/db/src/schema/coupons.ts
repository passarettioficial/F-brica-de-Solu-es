import { pgTable, text, serial, timestamp, integer, boolean, real, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const couponsTable = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull().default("percent"), // percent | fixed
  discountValue: real("discount_value").notNull().default(0), // e.g. 20 = 20% or 20 = R$20
  maxUses: integer("max_uses"), // null = unlimited
  usesCount: integer("uses_count").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  active: boolean("active").notNull().default(true),
  appliesTo: text("applies_to"), // null = all plans, or comma-separated plan ids
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCouponSchema = createInsertSchema(couponsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Coupon = typeof couponsTable.$inferSelect;

// One row per (coupon, user) redemption. The unique index is the actual enforcement of
// "one redemption per user per coupon" — validateCoupon() only pre-checks it for a fast 4xx.
//
// discountType/discountValue/planId/billingCycle are a SNAPSHOT taken at redemption time —
// not a live join to couponsTable — so this row keeps reporting the discount actually
// granted even if an admin edits the coupon's value later. Stripe remains the source of
// truth for the exact R$ charged per invoice; this is the minimal ledger for "which coupon,
// what discount, which plan, redeemed by whom, when" without needing to query Stripe.
export const couponRedemptionsTable = pgTable("coupon_redemptions", {
  id: serial("id").primaryKey(),
  couponId: integer("coupon_id").notNull().references(() => couponsTable.id, { onDelete: "cascade" }),
  clerkId: text("clerk_id").notNull(),
  planId: text("plan_id").notNull(),
  billingCycle: text("billing_cycle").notNull(),
  discountType: text("discount_type").notNull(),
  discountValue: real("discount_value").notNull(),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("coupon_redemptions_coupon_user_unique").on(table.couponId, table.clerkId),
  index("coupon_redemptions_clerk_id_idx").on(table.clerkId),
]);

export type CouponRedemption = typeof couponRedemptionsTable.$inferSelect;
