import { pgTable, text, serial, timestamp, integer, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull(),
  name: text("name").notNull(),
  briefing: text("briefing").notNull().default(""),
  currentPhase: integer("current_phase").notNull().default(1),
  coherenceScore: integer("coherence_score"),
  coherenceData: jsonb("coherence_data"),
  coherenceUpdatedAt: timestamp("coherence_updated_at", { withTimezone: true }),
  marketPotentialScore: integer("market_potential_score"),
  marketPotentialData: jsonb("market_potential_data"),
  marketPotentialUpdatedAt: timestamp("market_potential_updated_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("projects_clerk_id_idx").on(table.clerkId),
  index("projects_deleted_at_idx").on(table.deletedAt),
]);

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
