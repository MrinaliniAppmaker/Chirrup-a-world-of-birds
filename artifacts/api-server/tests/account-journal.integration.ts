import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { inArray } from "drizzle-orm";
import { db, pool, journalBirds, journalInstallations } from "@workspace/db";
import {
  accountJournal, authenticateInstallation, claimInstallation, createInstallation,
  JournalClaimError, JournalFullError, listSavedBirds,
} from "../src/lib/journalRepository";

if (process.env.NODE_ENV === "production" || !process.env.REPLIT_DEV_DOMAIN) {
  throw new Error("Use only the development database for account-journal checks.");
}
const run = randomUUID();
const created: string[] = [];
try {
  const a = `account-check-a-${run}`;
  const b = `account-check-b-${run}`;
  const targetA = await accountJournal(a);
  const targetB = await accountJournal(b);
  created.push(targetA, targetB);
  assert.notEqual(targetA, targetB);
  assert.equal(await accountJournal(a), targetA);
  const source = await createInstallation();
  created.push(source.installationId);
  assert.equal(await authenticateInstallation(source.token), source.installationId);
  const metadata = {
    id: `test-${run}`, name: "Account migration test", imageUri: "",
    traits: { beak: "upturned", feet: "zygodactyl" },
  };
  const portraitPath = `private-test/${run}/original-portrait.png`;
  await db.insert(journalBirds).values({
    installationId: source.installationId, birdId: metadata.id, metadata, portraitPath,
  });
  assert.equal(await claimInstallation(a, source.token), targetA);
  assert.equal(await authenticateInstallation(source.token), null, "old key must be revoked after claim");
  assert.equal(await claimInstallation(a, source.token), targetA, "lost claim responses must be retryable");
  await assert.rejects(claimInstallation(b, source.token), JournalClaimError);
  assert.equal((await listSavedBirds(source.installationId)).length, 0);
  assert.equal((await listSavedBirds(targetB)).length, 0);
  const rows = await listSavedBirds(targetA);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].metadata, metadata);
  assert.equal(rows[0].portraitPath, portraitPath, "never regenerate or move portrait bytes on migration");

  // Capacity rejection must roll back ownership and all bird transfers.
  const full = await accountJournal(`account-check-full-${run}`);
  const overflow = await createInstallation();
  created.push(full, overflow.installationId);
  await db.insert(journalBirds).values(Array.from({ length: 100 }, (_, i) => ({
    installationId: full, birdId: `capacity-${run}-${i}`,
    metadata: { id: `capacity-${i}` }, portraitPath: `private-test/${run}/capacity-${i}`,
  })));
  await db.insert(journalBirds).values({
    installationId: overflow.installationId, birdId: `overflow-${run}`,
    metadata, portraitPath: `private-test/${run}/overflow`,
  });
  await assert.rejects(claimInstallation(`account-check-full-${run}`, overflow.token), JournalFullError);
  assert.equal(await authenticateInstallation(overflow.token), overflow.installationId);
  assert.equal((await listSavedBirds(overflow.installationId)).length, 1);
  assert.equal((await listSavedBirds(full)).length, 100);

  // Two accounts racing for the same source can never both receive it.
  const race = await createInstallation();
  created.push(race.installationId);
  const claims = await Promise.allSettled([claimInstallation(a, race.token), claimInstallation(b, race.token)]);
  assert.equal(claims.filter(result => result.status === "fulfilled").length, 1);
  assert.equal(claims.filter(result => result.status === "rejected").length, 1);
  process.stdout.write("PASS: account isolation, idempotent migration, exact notes/portrait paths, legacy key revocation, atomic capacity rollback, concurrent claim ownership.\n");
} finally {
  if (created.length) await db.delete(journalInstallations).where(inArray(journalInstallations.id, created));
  // No object was uploaded by this repository test.
  await pool.end();
}
