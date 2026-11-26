import { createHash } from "node:crypto";
import { and, eq, inArray, or, sql } from "drizzle-orm";
import { accountDeletions, birdShareBatches, birdShares, db, journalInstallations } from "@workspace/db";
import { deleteJournalPortraits } from "./journalPortraits";

export class AccountDeletionBlocked extends Error {}
export const accountHash = (accountId: string) => createHash("sha256").update(`chirrup-deletion:${accountId}`).digest("hex");
export const accountLock = (accountId: string) => sql`select pg_advisory_xact_lock(hashtext(${"account-journal:" + accountId}))`;
export const UPLOAD_DRAIN_MS = 20 * 60_000; // Existing portrait PUT authorisations last 15 minutes.

export async function getDeletionRequest(accountId: string) {
  const [request] = await db.select().from(accountDeletions).where(eq(accountDeletions.accountHash, accountHash(accountId)));
  return request ?? null;
}

export async function requestDeletion(accountId: string) {
  return db.transaction(async tx => {
    await tx.execute(accountLock(accountId));
    await tx.insert(accountDeletions).values({ accountId, accountHash: accountHash(accountId) })
      .onConflictDoNothing({ target: accountDeletions.accountHash });
    const [request] = await tx.select().from(accountDeletions).where(eq(accountDeletions.accountHash, accountHash(accountId)));
    return request;
  });
}

export async function cancelDeletion(accountId: string) {
  return db.transaction(async tx => {
    await tx.execute(accountLock(accountId));
    const [row] = await tx.select().from(accountDeletions).where(eq(accountDeletions.accountHash, accountHash(accountId))).for("update");
    if (row && row.status !== "requested") throw new AccountDeletionBlocked();
    if (row) await tx.delete(accountDeletions).where(eq(accountDeletions.id, row.id));
  });
}

export function publicDeletionState(request: Awaited<ReturnType<typeof getDeletionRequest>>) {
  return { request: request ? {
    id: request.id, status: request.status, createdAt: request.createdAt.toISOString(),
    eligibleAt: request.eligibleAt?.toISOString() ?? null,
  } : null };
}

/** Operator-only, explicitly confirmed by the CLI; never exposed as a public endpoint.
 * Account/data deletion is restartable. No credentials or actual user objects are
 * passed back to clients. The injectable auth operation permits safe fixture tests.
 */
export async function fulfillAccountDeletion(id: string, deleteAuthUser: (accountId: string) => Promise<void>, now = new Date()) {
  const beganAt = Date.now();
  const [initial] = await db.select().from(accountDeletions).where(eq(accountDeletions.id, id));
  if (!initial) throw new Error("Deletion request not found.");
  if (initial.status === "completed") return { completed: true };
  if (!initial.accountId) throw new Error("Deletion request has no account identity.");
  const accountId = initial.accountId;
  const request = await db.transaction(async tx => {
    // Same account lock as first journal creation/claims. Existing journal writes
    // lock installation rows, so they finish before this blocks further writes.
    await tx.execute(accountLock(accountId));
    const [current] = await tx.select().from(accountDeletions).where(eq(accountDeletions.id, id)).for("update");
    if (!current) throw new Error("The request was cancelled. Nothing was deleted.");
    if (current.status !== "requested") return current;
    const owned = await tx.select({ id: journalInstallations.id }).from(journalInstallations)
      .where(or(eq(journalInstallations.accountId, accountId), eq(journalInstallations.claimedBy, accountId)))
      .orderBy(journalInstallations.id).for("update");
    // Start the drain after outstanding writers release their locks, not before
    // waiting for them. Long-running imports must not shorten URL expiry safety.
    const blockedAt = new Date(now.getTime() + Date.now() - beganAt);
    for (const row of owned) await tx.update(journalInstallations).set({ lockedAt: blockedAt }).where(eq(journalInstallations.id, row.id));
    if (owned.length) {
      await tx.delete(birdShares).where(inArray(birdShares.installationId, owned.map(row => row.id)));
      await tx.delete(birdShareBatches).where(inArray(birdShareBatches.installationId, owned.map(row => row.id)));
    }
    const [started] = await tx.update(accountDeletions).set({
      status: "processing", installationIds: owned.map(row => row.id), eligibleAt: new Date(blockedAt.getTime() + UPLOAD_DRAIN_MS),
    }).where(eq(accountDeletions.id, id)).returning();
    return started;
  });
  if (request.status === "completed") return { completed: true };
  // Revoke authentication first. The operator wrapper treats an already missing
  // Clerk user as success, but must propagate outages/authorization errors.
  await deleteAuthUser(accountId);
  if (!request.eligibleAt || now < request.eligibleAt) return { completed: false, eligibleAt: request.eligibleAt };
  // Prefixes include claimed phone journals whose original object paths were
  // deliberately preserved. Recipient-owned imported copies are not in scope.
  for (const installationId of request.installationIds) await deleteJournalPortraits(installationId);
  await db.transaction(async tx => {
    await tx.execute(accountLock(accountId));
    for (const installationId of request.installationIds) {
      await tx.delete(journalInstallations).where(and(eq(journalInstallations.id, installationId),
        or(eq(journalInstallations.accountId, accountId), eq(journalInstallations.claimedBy, accountId))));
    }
    // Retain only a pseudonymous security tombstone to reject unexpired tokens.
    await tx.update(accountDeletions).set({
      accountId: null, installationIds: [], status: "completed", completedAt: now,
    }).where(eq(accountDeletions.id, id));
  });
  return { completed: true };
}
