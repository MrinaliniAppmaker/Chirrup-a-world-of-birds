import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import type { z } from "zod/v4";

export const journalInstallations = pgTable("journal_installations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tokenHash: text("token_hash").notNull().unique(),
  accountId: text("account_id").unique(),
  claimedBy: text("claimed_by"),
  lockedAt: timestamp("locked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertJournalInstallationSchema = createInsertSchema(journalInstallations).omit({ id: true, createdAt: true });
export type InsertJournalInstallation = z.infer<typeof insertJournalInstallationSchema>;
export type JournalInstallationRecord = typeof journalInstallations.$inferSelect;
