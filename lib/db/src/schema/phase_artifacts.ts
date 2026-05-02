import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { phasesTable } from "./phases";

export const phaseArtifactsTable = pgTable("phase_artifacts", {
  id: serial("id").primaryKey(),
  phaseId: integer("phase_id").notNull().references(() => phasesTable.id, { onDelete: "cascade" }),
  artifactKey: text("artifact_key").notNull(),
  content: text("content").notNull().default(""),
  contentJson: text("content_json"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPhaseArtifactSchema = createInsertSchema(phaseArtifactsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPhaseArtifact = z.infer<typeof insertPhaseArtifactSchema>;
export type PhaseArtifact = typeof phaseArtifactsTable.$inferSelect;
