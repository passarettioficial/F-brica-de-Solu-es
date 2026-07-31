import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Deduplicação de webhooks do Stripe. A Stripe não garante entrega única — pode reentregar
 * um evento legítimo (retry após timeout de resposta, reenvio manual pelo painel). Sem isso,
 * um `checkout.session.completed` reentregue depois que o usuário já cancelou/rebaixou o
 * plano reativaria o acesso pago indevidamente. `eventId` é a chave de idempotência real
 * (`event.id` da Stripe, único por evento); inserir com `onConflictDoNothing` antes de
 * processar é o guard.
 */
export const webhookEventsTable = pgTable("webhook_events", {
  eventId: text("event_id").primaryKey(),
  eventType: text("event_type").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
});

export type WebhookEvent = typeof webhookEventsTable.$inferSelect;
