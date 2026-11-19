import { foreignKey, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { journalBirds } from "./journal-birds";

// Only the digest is retained. A link authorizes a single saved bird, not a journal.
export const birdShares = pgTable("bird_shares", {
  tokenHash: text("token_hash").primaryKey(),
  installationId: uuid("installation_id").notNull(),
  birdId: text("bird_id").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [
  foreignKey({
    columns: [table.installationId, table.birdId],
    foreignColumns: [journalBirds.installationId, journalBirds.birdId],
  }).onDelete("cascade"),
]);

export const insertBirdShareSchema = createInsertSchema(birdShares).omit({ createdAt: true });
export type InsertBirdShare = z.infer<typeof insertBirdShareSchema>;
export type BirdShareRecord = typeof birdShares.$inferSelect;
