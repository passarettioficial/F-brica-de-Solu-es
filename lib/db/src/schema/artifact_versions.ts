import { pgTable, text, serial, timestamp, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { phasesTable } from "./phases";

export const artifactVersionsTable = pgTable("artifact_versions", {
  id: serial("id").primaryKey(),
  phaseId: integer("phase_id").notNull().references(() => phasesTable.id, { onDelete: "cascade" }),
  artifactKey: text("artifact_key").notNull(),
  content: text("content").notNull().default(""),
  contentJson: text("content_json"),
  source: text("source").notNull(),
  createdByClerkId: text("created_by_clerk_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("artifact_versions_phase_key_idx").on(table.phaseId, table.artifactKey, table.createdAt),
]);

export const insertArtifactVersionSchema = createInsertSchema(artifactVersionsTable).omit({ id: true, createdAt: true });
export type InsertArtifactVersion = z.infer<typeof insertArtifactVersionSchema>;
export type ArtifactVersion = typeof artifactVersionsTable.$inferSelect;
