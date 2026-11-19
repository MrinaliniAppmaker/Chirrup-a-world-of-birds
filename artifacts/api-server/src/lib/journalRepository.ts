import { createHash, randomBytes } from "node:crypto";
import { and, count, desc, eq, isNull, sql } from "drizzle-orm";
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
    .where(and(
      eq(journalInstallations.tokenHash, createHash("sha256").update(token).digest("hex")),
      isNull(journalInstallations.accountId), isNull(journalInstallations.claimedBy),
    )).limit(1);
  return row?.id ?? null;
}

export async function accountJournal(accountId: string) {
  // Unique account identity makes concurrent first sign-ins idempotent.
  await db.insert(journalInstallations).values({
    accountId, tokenHash: createHash("sha256").update(randomBytes(48)).digest("hex"),
  }).onConflictDoNothing({ target: journalInstallations.accountId });
  const [row] = await db.select({ id: journalInstallations.id }).from(journalInstallations)
    .where(eq(journalInstallations.accountId, accountId));
  return row.id;
}

export class JournalClaimError extends Error {}
export async function claimInstallation(accountId: string, token: string) {
  const targetId = await accountJournal(accountId);
  const hash = createHash("sha256").update(token).digest("hex");
  return db.transaction(async tx => {
    // Lock target and source in consistent order, including simultaneous claims.
    const rows = await tx.select().from(journalInstallations)
      .where(sql`${journalInstallations.id} = ${targetId} OR ${journalInstallations.tokenHash} = ${hash}`)
      .orderBy(journalInstallations.id).for("update");
    const source = rows.find(row => row.tokenHash === hash);
    if (!source || source.accountId || (source.claimedBy && source.claimedBy !== accountId)) {
      throw new JournalClaimError("This phone journal is unavailable or already belongs to another account. No birds were changed.");
    }
    if (source.claimedBy === accountId) return targetId;
    const sourceBirds = await tx.select().from(journalBirds).where(eq(journalBirds.installationId, source.id));
    const targetBirds = await tx.select().from(journalBirds).where(eq(journalBirds.installationId, targetId));
    if (sourceBirds.length + targetBirds.length > MAX_JOURNAL_BIRDS) throw new JournalFullError();
    if (sourceBirds.some(bird => targetBirds.some(other => other.birdId === bird.birdId))) {
      throw new JournalClaimError("These journals contain conflicting bird identifiers. No birds were changed.");
    }
    // Private object paths remain unchanged, preserving exact portrait bytes.
    await tx.update(journalBirds).set({ installationId: targetId })
      .where(eq(journalBirds.installationId, source.id));
    await tx.update(journalInstallations).set({ claimedBy: accountId })
      .where(eq(journalInstallations.id, source.id));
    return targetId;
  });
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
