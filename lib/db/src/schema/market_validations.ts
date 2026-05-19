import { pgTable, text, serial, timestamp, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";

export const marketValidationsTable = pgTable("market_validations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  phaseNumber: integer("phase_number").notNull(),
  interviewScript: text("interview_script"),
  interviewNotes: text("interview_notes"),
  aiAnalysis: text("ai_analysis"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("market_validations_project_phase_unique").on(table.projectId, table.phaseNumber),
  index("market_validations_project_id_idx").on(table.projectId),
]);

export type MarketValidation = typeof marketValidationsTable.$inferSelect;
