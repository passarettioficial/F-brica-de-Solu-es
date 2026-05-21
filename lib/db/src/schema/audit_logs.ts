import { pgTable, text, serial, timestamp, integer, index } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export type AuditEventType =
  | "admin.user.plan_changed"
  | "admin.user.admin_toggled"
  | "admin.user.superuser_toggled"
  | "admin.coupon.created"
  | "admin.coupon.updated"
  | "admin.coupon.deleted"
  | "admin.deliverable.toggled"
  | "admin.settings.updated"
  | "admin.plans.updated"
  | "admin.openai_budget.updated"
  | "admin.users.exported"
  | "user.login"
  | "user.project.created"
  | "user.project.deleted"
  | "user.project.restored"
  | "user.project.shared"
  | "user.project.unshared"
  | "user.project.exported"
  | "user.project.permanent_deleted"
  | "user.ai.used"
  | "user.payment.subscribed"
  | "user.payment.canceled"
  | "user.coupon.redeemed"
  | "security.unauthorized"
  | "security.rate_limited"
  | "security.plan_limit_reached";

export const auditLogsTable = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(),
  actorClerkId: text("actor_clerk_id"),
  actorName: text("actor_name"),
  targetClerkId: text("target_clerk_id"),
  targetName: text("target_name"),
  meta: text("meta"),
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("audit_logs_event_type_idx").on(table.eventType),
  index("audit_logs_actor_idx").on(table.actorClerkId),
  index("audit_logs_created_at_idx").on(table.createdAt),
]);

export type AuditLog = typeof auditLogsTable.$inferSelect;
