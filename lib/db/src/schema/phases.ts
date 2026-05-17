import { pgTable, text, serial, timestamp, integer, boolean, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";

export const phasesTable = pgTable("phases", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  phaseNumber: integer("phase_number").notNull(),
  status: text("status", { enum: ["locked", "active", "completed"] }).notNull().default("locked"),
  gate1Checked: boolean("gate1_checked").notNull().default(false),
  gate2Checked: boolean("gate2_checked").notNull().default(false),
  gate3Checked: boolean("gate3_checked").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("phases_project_phase_unique").on(table.projectId, table.phaseNumber),
  index("phases_project_id_idx").on(table.projectId),
]);

export const insertPhaseSchema = createInsertSchema(phasesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPhase = z.infer<typeof insertPhaseSchema>;
export type Phase = typeof phasesTable.$inferSelect;
