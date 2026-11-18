import { createHash, randomBytes } from "node:crypto";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db, journalBirds, journalInstallations, type JournalBirdRecord } from "@workspace/db";
import { ListJournalBirdsResponseItem } from "@workspace/api-zod";
import { portraitReadUrl } from "./journalPortraits";

export const MAX_JOURNAL_BIRDS = 100;
export class JournalFullError extends Error {}
const scope = (installationId: string, birdId: string) =>
  and(eq(journalBirds.installationId, installationId), eq(journalBirds.birdId, birdId));

export async function createInstallation() {
  const token = randomBytes(48).toString("base64url");
  const [row] = await db.insert(journalInstallations)
    .values({ tokenHash: createHash("sha256").update(token).digest("hex") }).returning();
  return { installationId: row.id, token };
}

export async function authenticateInstallation(token: string) {
  if (!/^[A-Za-z0-9_-]{64}$/.test(token)) return null;
  const [row] = await db.select({ id: journalInstallations.id }).from(journalInstallations)
    .where(eq(journalInstallations.tokenHash, createHash("sha256").update(token).digest("hex"))).limit(1);
  return row?.id ?? null;
}

export async function listSavedBirds(installationId: string) {
  return db.select().from(journalBirds).where(eq(journalBirds.installationId, installationId))
    .orderBy(desc(sql`${journalBirds.metadata}->>'createdAt'`), desc(journalBirds.savedAt));
}

export async function presentSavedBird(row: JournalBirdRecord) {
  return ListJournalBirdsResponseItem.parse({
    ...row.metadata,
    imageUri: await portraitReadUrl(row.portraitPath),
  });
}

export async function persistSavedBird(
  installationId: string, bird: Record<string, unknown> & { id: string }, portraitPath: string,
) {
  return db.transaction(async (tx) => {
    // Serialize writes for this installation: concurrent saves cannot exceed 100.
    await tx.select({ id: journalInstallations.id }).from(journalInstallations)
      .where(eq(journalInstallations.id, installationId)).for("update");
    const [existing] = await tx.select().from(journalBirds).where(scope(installationId, bird.id));
    if (existing) return existing;
    const [{ total }] = await tx.select({ total: count() }).from(journalBirds)
      .where(eq(journalBirds.installationId, installationId));
    if (total >= MAX_JOURNAL_BIRDS) throw new JournalFullError();
    const [saved] = await tx.insert(journalBirds).values({
      installationId, birdId: bird.id,
      metadata: { ...bird, imageUri: "" }, portraitPath,
    }).returning();
    return saved;
  });
}

export async function deleteSavedBird(installationId: string, birdId: string) {
  return db.transaction(async (tx) => {
    await tx.select({ id: journalInstallations.id }).from(journalInstallations)
      .where(eq(journalInstallations.id, installationId)).for("update");
    const [deleted] = await tx.delete(journalBirds).where(scope(installationId, birdId)).returning();
    return deleted;
  });
}
