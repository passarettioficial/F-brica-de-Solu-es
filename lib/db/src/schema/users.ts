import { pgTable, text, serial, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  displayName: text("display_name"),
  dailyAiUsage: integer("daily_ai_usage").notNull().default(0),
  dailyAiResetDate: text("daily_ai_reset_date").notNull().default(""),
  plan: text("plan").notNull().default("free"), // free | founder | studio
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeSubscriptionStatus: text("stripe_subscription_status"), // active | canceled | past_due | etc
  isAdmin: boolean("is_admin").notNull().default(false),
  isSuperuser: boolean("is_superuser").notNull().default(false),
  founderProfile: jsonb("founder_profile"),
  onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
  lgpdConsentAt: timestamp("lgpd_consent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
