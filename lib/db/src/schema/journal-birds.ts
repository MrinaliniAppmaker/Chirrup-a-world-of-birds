import { jsonb, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { journalInstallations } from "./journal-installations";

export const journalBirds = pgTable("journal_birds", {
  installationId: uuid("installation_id").notNull().references(() => journalInstallations.id, { onDelete: "cascade" }),
  birdId: text("bird_id").notNull(),
  // Only field notes and traits, never image bytes or expiring signed URLs.
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull(),
  portraitPath: text("portrait_path").notNull().unique(),
  savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.installationId, table.birdId] })]);

export const insertJournalBirdSchema = createInsertSchema(journalBirds).omit({ savedAt: true });
export type InsertJournalBird = z.infer<typeof insertJournalBirdSchema>;
export type JournalBirdRecord = typeof journalBirds.$inferSelect;
