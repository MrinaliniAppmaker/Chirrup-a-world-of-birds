import { createHash, randomBytes } from "node:crypto";
import { and, count, eq, gt, inArray, sql } from "drizzle-orm";
import { birdShareBatches, birdShares, db, journalBirds, journalInstallations } from "@workspace/db";
import { copyJournalPortrait, deletePortrait } from "./journalPortraits";
import { JournalFullError, MAX_JOURNAL_BIRDS } from "./journalRepository";

const digest = (value: string) => createHash("sha256").update(value).digest("hex");
export class BirdShareUnavailable extends Error {}
const birdScope = (installationId: string, birdId: string) =>
  and(eq(journalBirds.installationId, installationId), eq(journalBirds.birdId, birdId));

export async function createBirdShareLink(installationId: string, birdId: string) {
  return db.transaction(async tx => {
    const [journal] = await tx.select().from(journalInstallations)
      .where(eq(journalInstallations.id, installationId)).for("update");
    if (!journal || journal.lockedAt) throw new BirdShareUnavailable();
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
  const [journal] = await db.select().from(journalInstallations).where(eq(journalInstallations.id, record.share.installationId));
  if (!journal || journal.lockedAt) throw new BirdShareUnavailable();
  return record;
}

export async function importSharedBird(targetId: string, token: string) {
  const initial = await findBirdShare(token);
  let copiedPath: string | undefined;
  try {
    return await db.transaction(async tx => {
      const sourceId = initial.share.installationId;
      // Same ordering as journal claims; serialize deletion, imports and normal saves.
      const journals = await tx.select().from(journalInstallations)
        .where(sql`${journalInstallations.id} = ${targetId} OR ${journalInstallations.id} = ${sourceId}`)
        .orderBy(journalInstallations.id).for("update");
      if (journals.length !== new Set([targetId, sourceId]).size || journals.some(row => row.lockedAt)) throw new BirdShareUnavailable();
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

export async function createBirdShareBatchLink(installationId: string, birdIds: string[]) {
  if (!birdIds.length || birdIds.length > 100 || new Set(birdIds).size !== birdIds.length) throw new BirdShareUnavailable();
  return db.transaction(async tx => {
    const [journal] = await tx.select().from(journalInstallations)
      .where(eq(journalInstallations.id, installationId)).for("update");
    if (!journal || journal.lockedAt) throw new BirdShareUnavailable();
    const birds = await tx.select().from(journalBirds).where(and(
      eq(journalBirds.installationId, installationId), inArray(journalBirds.birdId, birdIds),
    ));
    if (birds.length !== birdIds.length) throw new BirdShareUnavailable();
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60_000);
    await tx.insert(birdShareBatches).values({ tokenHash: digest(token), installationId, birdIds, expiresAt });
    return { token, expiresAt: expiresAt.toISOString() };
  });
}

export async function findSharedBirds(token: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new BirdShareUnavailable();
  const [batch] = await db.select().from(birdShareBatches).where(and(
    eq(birdShareBatches.tokenHash, digest(token)), gt(birdShareBatches.expiresAt, new Date()),
  ));
  if (!batch) {
    const single = await findBirdShare(token);
    return { birds: [single.bird], expiresAt: single.share.expiresAt };
  }
  const [journal] = await db.select().from(journalInstallations).where(eq(journalInstallations.id, batch.installationId));
  if (!journal || journal.lockedAt) throw new BirdShareUnavailable();
  const birds = await db.select().from(journalBirds).where(and(
    eq(journalBirds.installationId, batch.installationId), inArray(journalBirds.birdId, batch.birdIds),
  ));
  if (birds.length !== batch.birdIds.length) throw new BirdShareUnavailable();
  return { birds: batch.birdIds.map(id => birds.find(bird => bird.birdId === id)!), expiresAt: batch.expiresAt };
}

export async function importSharedBirdBatch(targetId: string, token: string) {
  const initial = await findSharedBirds(token);
  const sourceId = initial.birds[0].installationId;
  const copiedPaths: string[] = [];
  try {
    return await db.transaction(async tx => {
      const journals = await tx.select().from(journalInstallations)
        .where(sql`${journalInstallations.id} = ${targetId} OR ${journalInstallations.id} = ${sourceId}`)
        .orderBy(journalInstallations.id).for("update");
      if (journals.length !== new Set([targetId, sourceId]).size || journals.some(row => row.lockedAt)) throw new BirdShareUnavailable();
      const [batch] = await tx.select().from(birdShareBatches).where(and(
        eq(birdShareBatches.tokenHash, digest(token)), gt(birdShareBatches.expiresAt, new Date()),
      ));
      const [single] = batch ? [] : await tx.select().from(birdShares).where(and(
        eq(birdShares.tokenHash, digest(token)), gt(birdShares.expiresAt, new Date()),
      ));
      if (!batch && !single) throw new BirdShareUnavailable();
      const ids = batch ? batch.birdIds : [single!.birdId];
      const source = await tx.select().from(journalBirds).where(and(
        eq(journalBirds.installationId, sourceId), inArray(journalBirds.birdId, ids),
      ));
      if (source.length !== ids.length) throw new BirdShareUnavailable();
      const ordered = ids.map(id => source.find(bird => bird.birdId === id)!);
      if (sourceId === targetId) return ordered;
      const existing = await tx.select().from(journalBirds).where(eq(journalBirds.installationId, targetId));
      const copyId = (id: string) => `shared_${digest(`${sourceId}:${id}`)}`;
      const missing = ordered.filter(bird => !existing.some(other => other.birdId === copyId(bird.birdId)));
      // Capacity is checked for the whole batch before copying a single portrait.
      if (existing.length + missing.length > MAX_JOURNAL_BIRDS) throw new JournalFullError();
      const result = [];
      for (const bird of ordered) {
        const id = copyId(bird.birdId);
        const previous = existing.find(other => other.birdId === id);
        if (previous) { result.push(previous); continue; }
        const portraitPath = await copyJournalPortrait(bird.portraitPath, targetId, id);
        copiedPaths.push(portraitPath);
        const [saved] = await tx.insert(journalBirds).values({
          installationId: targetId, birdId: id, portraitPath,
          metadata: { ...bird.metadata, id, imageUri: "" },
        }).returning();
        result.push(saved);
      }
      return result;
    });
  } catch (error) {
    await Promise.all(copiedPaths.map(path => deletePortrait(path).catch(() => {})));
    throw error;
  }
}
