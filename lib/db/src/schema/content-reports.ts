import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const contentReports = pgTable("content_reports", {
  id: uuid("id").primaryKey(),
  payloadHash: text("payload_hash").notNull(),
  // The reporter need not create an account or disclose their email.
  surface: text("surface").notNull(),
  reason: text("reason").notNull(),
  details: text("details").notNull(),
  content: jsonb("content").$type<{ id: string; title: string; text: string }>().notNull(),
  portraitPath: text("portrait_path"),
  status: text("status").notNull().default("pending"),
  reviewNotes: text("review_notes"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [index("content_reports_review_queue").on(table.status, table.createdAt)]);
