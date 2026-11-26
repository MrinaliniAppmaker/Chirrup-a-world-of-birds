import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { contentReports, db } from "@workspace/db";
import type { ContentReportInput } from "@workspace/api-zod";
import { referencePart } from "./encounterReference";
import { deletePortrait, storeReportPortrait } from "./journalPortraits";

export class ReportConflictError extends Error {}

// Fixed field order makes identical retries idempotent regardless of JSON order.
export function reportPayload(report: ContentReportInput) {
  return {
    surface: report.surface, reason: report.reason, details: report.details,
    content: { id: report.content.id, title: report.content.title, text: report.content.text, image: report.content.image },
  };
}

export function reportHash(report: ContentReportInput) {
  return createHash("sha256").update(JSON.stringify(reportPayload(report))).digest("hex");
}

export async function storeContentReport(report: ContentReportInput) {
  // Validate bytes before touching storage. Remote URLs are never fetched.
  const picture = report.content.image ? referencePart(report.content.image).inlineData : undefined;
  const hash = reportHash(report);
  const [existing] = await db.select({ hash: contentReports.payloadHash }).from(contentReports)
    .where(eq(contentReports.id, report.submissionId));
  if (existing) {
    if (existing.hash !== hash) throw new ReportConflictError();
    return { id: report.submissionId, created: false };
  }
  let portraitPath: string | null = null;
  try {
    if (picture?.data && picture.mimeType) {
      portraitPath = await storeReportPortrait(report.submissionId, picture.mimeType, Buffer.from(picture.data, "base64"));
    }
    const [inserted] = await db.insert(contentReports).values({
      id: report.submissionId, payloadHash: hash,
      surface: report.surface, reason: report.reason, details: report.details,
      content: { id: report.content.id, title: report.content.title, text: report.content.text },
      portraitPath,
    }).onConflictDoNothing({ target: contentReports.id }).returning({ id: contentReports.id });
    if (inserted) return { id: inserted.id, created: true };
    // A concurrent retry may have won. Delete only this attempt's unique file.
    const [winner] = await db.select({ hash: contentReports.payloadHash }).from(contentReports)
      .where(eq(contentReports.id, report.submissionId));
    if (!winner || winner.hash !== hash) throw new ReportConflictError();
    return { id: report.submissionId, created: false };
  } catch (error) {
    // A timeout can occur after an INSERT committed. Never discard evidence
    // referenced by that row just because the client did not get its receipt.
    if (portraitPath) {
      try {
        const [saved] = await db.select({ path: contentReports.portraitPath }).from(contentReports)
          .where(eq(contentReports.id, report.submissionId));
        if (saved?.path !== portraitPath) await deletePortrait(portraitPath);
      } catch { /* Preserve evidence when commit state cannot be established. */ }
    }
    throw error;
  } finally {
    if (portraitPath) {
      try {
        const [saved] = await db.select({ path: contentReports.portraitPath }).from(contentReports)
          .where(eq(contentReports.id, report.submissionId));
        if (saved && saved.path !== portraitPath) await deletePortrait(portraitPath);
      } catch { /* Operator cleanup can remove any unreferenced private file. */ }
    }
  }
}
