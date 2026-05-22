import { pgTable, serial, text, timestamp, integer, index } from "drizzle-orm/pg-core";

export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull(),
  projectId: integer("project_id"),
  phaseId: integer("phase_id"),
  eventType: text("event_type").notNull(),
  meta: text("meta"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("events_clerk_id_idx").on(table.clerkId),
  index("events_project_id_idx").on(table.projectId),
  index("events_event_type_idx").on(table.eventType),
]);

export type EventType =
  | "project_created"
  | "phase_started"
  | "phase_completed"
  | "ai_generated"
  | "gate_checked"
  | "coherence_analyzed"
  | "market_potential_analyzed"
  | "validation_generated"
  | "project_completed"
  | "artifact_feedback";
