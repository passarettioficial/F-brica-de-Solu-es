import { pgTable, serial, integer, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const artifactFeedbackTable = pgTable("artifact_feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  projectId: integer("project_id").notNull(),
  phaseNumber: integer("phase_number").notNull(),
  artifactKey: text("artifact_key").notNull(),
  rating: text("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("artifact_feedback_user_artifact_uniq").on(table.userId, table.projectId, table.phaseNumber, table.artifactKey),
  index("artifact_feedback_artifact_idx").on(table.projectId, table.phaseNumber, table.artifactKey),
  index("artifact_feedback_rating_idx").on(table.rating),
]);

export type ArtifactFeedback = typeof artifactFeedbackTable.$inferSelect;
