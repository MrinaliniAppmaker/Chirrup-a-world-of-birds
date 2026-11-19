import { createHash, randomBytes } from "node:crypto";
import { and, count, eq, gt, sql } from "drizzle-orm";
import { birdShares, db, journalBirds, journalInstallations } from "@workspace/db";
import { copyJournalPortrait, deletePortrait } from "./journalPortraits";
import { JournalFullError, MAX_JOURNAL_BIRDS } from "./journalRepository";

const digest = (value: string) => createHash("sha256").update(value).digest("hex");
export class BirdShareUnavailable extends Error {}
const birdScope = (installationId: string, birdId: string) =>
  and(eq(journalBirds.installationId, installationId), eq(journalBirds.birdId, birdId));

export async function createBirdShareLink(installationId: string, birdId: string) {
  return db.transaction(async tx => {
    await tx.select({ id: journalInstallations.id }).from(journalInstallations)
      .where(eq(journalInstallations.id, installationId)).for("update");
    const [bird] = await tx.select().from(journalBirds).where(birdScope(installationId, birdId));
    if (!bird) throw new BirdShareUnavailable();
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60_000);
    await tx.insert(birdShares).values({ tokenHash: digest(token), installationId, birdId, expiresAt });
    return { token, expiresAt: expiresAt.toISOString() };
  });
}

export async function findBirdShare(token: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new BirdShareUnavailable();
  const [record] = await db.select({ share: birdShares, bird: journalBirds }).from(birdShares)
    .innerJoin(journalBirds, and(
      eq(birdShares.installationId, journalBirds.installationId), eq(birdShares.birdId, journalBirds.birdId),
    )).where(and(eq(birdShares.tokenHash, digest(token)), gt(birdShares.expiresAt, new Date())));
  if (!record) throw new BirdShareUnavailable();
  return record;
}

export async function importSharedBird(targetId: string, token: string) {
  const initial = await findBirdShare(token);
  let copiedPath: string | undefined;
  try {
    return await db.transaction(async tx => {
      const sourceId = initial.share.installationId;
      // Same ordering as journal claims; serialize deletion, imports and normal saves.
      await tx.select({ id: journalInstallations.id }).from(journalInstallations)
        .where(sql`${journalInstallations.id} = ${targetId} OR ${journalInstallations.id} = ${sourceId}`)
        .orderBy(journalInstallations.id).for("update");
      const [active] = await tx.select().from(birdShares).where(and(
        eq(birdShares.tokenHash, digest(token)), gt(birdShares.expiresAt, new Date()),
      ));
      const [source] = await tx.select().from(journalBirds).where(birdScope(sourceId, initial.share.birdId));
      if (!active || !source) throw new BirdShareUnavailable();
      if (sourceId === targetId) return source;
      // Stable per-source ID makes repeated links/imports idempotent, even at capacity.
      const id = `shared_${digest(`${sourceId}:${source.birdId}`)}`;
      const [existing] = await tx.select().from(journalBirds).where(birdScope(targetId, id));
      if (existing) return existing;
      const [{ total }] = await tx.select({ total: count() }).from(journalBirds)
        .where(eq(journalBirds.installationId, targetId));
      if (total >= MAX_JOURNAL_BIRDS) throw new JournalFullError();
      copiedPath = await copyJournalPortrait(source.portraitPath, targetId, id);
      const [saved] = await tx.insert(journalBirds).values({
        installationId: targetId, birdId: id, portraitPath: copiedPath,
        metadata: { ...source.metadata, id, imageUri: "" },
      }).returning();
      return saved;
    });
  } catch (error) {
    if (copiedPath) await deletePortrait(copiedPath).catch(() => {});
    throw error;
  }
}
