import { clerkClient } from "@clerk/express";
import { eq, inArray } from "drizzle-orm";
import { accountDeletions, db, journalBirds, pool } from "@workspace/db";
import { fulfillAccountDeletion, requestDeletion } from "../lib/accountDeletion";

const [command = "--list", id, ...flags] = process.argv.slice(2);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function run() {
  if (command === "--record-verified-email") {
    if (!id || id.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(id) ||
        flags.length !== 1 || flags[0] !== "--verified-request") {
      throw new Error("Use --record-verified-email <email> --verified-request only after verifying the external deletion request. Never ask for a password or OTP.");
    }
    const users = await clerkClient.users.getUserList({ emailAddress: [id], limit: 2 });
    const matches = users.data.filter(user => user.emailAddresses.some(email =>
      email.emailAddress.toLowerCase() === id.toLowerCase() && email.verification?.status === "verified"));
    if (matches.length !== 1) throw new Error("Exactly one account with this verified email is required. No request or deletion was performed.");
    const request = await requestDeletion(matches[0].id);
    console.log({ requestId: request.id, status: request.status, message: "Verified support request recorded. Preview before execution. No account or birds were deleted." });
    return;
  }
  if (command === "--list") {
    console.table(await db.select({
      id: accountDeletions.id, status: accountDeletions.status,
      createdAt: accountDeletions.createdAt, eligibleAt: accountDeletions.eligibleAt,
    }).from(accountDeletions).where(inArray(accountDeletions.status, ["requested", "processing"])));
    return;
  }
  if (!id || !uuid.test(id) || !["--preview", "--execute"].includes(command)) throw new Error("Use --list or --preview <request-id>. Execution requires --execute <request-id> --confirm <same-id> --verified-request. Verified email requests can be recorded with --record-verified-email <email> --verified-request.");
  const [request] = await db.select().from(accountDeletions).where(eq(accountDeletions.id, id));
  if (!request) throw new Error("Deletion request not found.");
  if (command === "--preview") {
    const { journalInstallations } = await import("@workspace/db");
    const { or } = await import("drizzle-orm");
    const owned = request.accountId ? await db.select().from(journalInstallations).where(or(
      eq(journalInstallations.accountId, request.accountId), eq(journalInstallations.claimedBy, request.accountId),
    )) : [];
    const birds = owned.length ? await db.select({ id: journalBirds.birdId }).from(journalBirds)
      .where(inArray(journalBirds.installationId, owned.map(row => row.id))) : [];
    console.log({
      requestId: request.id, accountId: request.accountId, status: request.status,
      ownedJournals: owned.length, ownedBirds: birds.length, eligibleAt: request.eligibleAt,
      warning: "Execution permanently deletes the authentication account/profile, owned birds and sharing links. Imported copies in other accounts are not deleted.",
    });
    return;
  }
  if (flags[0] !== "--confirm" || flags[1] !== id || flags[2] !== "--verified-request" || flags.length !== 3) {
    throw new Error("Preview first. Execution requires --confirm <same request-id> --verified-request after you have verified the request.");
  }
  const result = await fulfillAccountDeletion(id, async accountId => {
    try { await clerkClient.users.deleteUser(accountId); }
    catch (error) {
      if ((error as { status?: number }).status !== 404) throw new Error("Authentication deletion was not confirmed. Processing is paused; no journal data was purged. Retry after resolving the provider error.");
    }
  });
  console.log(result.completed
    ? "Account and owned app data deleted. Independent recipient copies and provider/legal retention are outside this operation."
    : `Account access and new journal writes are blocked. Existing upload authorisations must expire. Rerun the same verified command after ${result.eligibleAt?.toISOString()}. No background completion is implied.`);
}
run().catch(error => { console.error(error instanceof Error ? error.message : "Deletion failed."); process.exitCode = 1; }).finally(() => pool.end());
