import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const accountDeletions = pgTable("account_deletions", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: text("account_id"),
  accountHash: text("account_hash").notNull().unique(),
  status: text("status").notNull().default("requested"),
  installationIds: jsonb("installation_ids").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  eligibleAt: timestamp("eligible_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
