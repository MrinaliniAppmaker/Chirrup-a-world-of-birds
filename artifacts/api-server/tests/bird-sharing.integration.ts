import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { birdShares, db, journalBirds, journalInstallations, pool } from "@workspace/db";
import { BirdShareUnavailable, createBirdShareLink, findBirdShare, importSharedBird } from "../src/lib/birdShares";
import { accountJournal, deleteSavedBird, JournalFullError, listSavedBirds, persistSavedBird, presentSavedBird } from "../src/lib/journalRepository";
import { authorizePortrait, deletePortrait } from "../src/lib/journalPortraits";

if (process.env.NODE_ENV === "production" || !process.env.REPLIT_DEV_DOMAIN) {
  throw new Error("Run sharing checks only in the development workspace.");
}
const run = randomUUID();
const journals: string[] = [];
const portraits = new Set<string>();
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ1cAAAAASUVORK5CYII=", "base64");
try {
  const sourceId = await accountJournal(`sharing-source-${run}`);
  const recipientId = await accountJournal(`sharing-recipient-${run}`);
  const strangerId = await accountJournal(`sharing-stranger-${run}`);
  const fullId = await accountJournal(`sharing-full-${run}`);
  journals.push(sourceId, recipientId, strangerId, fullId);
  const id = `sharing-test-${run}`;
  const upload = await authorizePortrait(sourceId, id);
  portraits.add(upload.portraitPath);
  const put = await fetch(upload.uploadUrl, { method: "PUT", headers: { "Content-Type": "image/png" }, body: png });
  assert.ok(put.ok, "test portrait must upload");
  const metadata = {
    id, name: "Rare-foot sharing check", scientificName: "", tagline: "An imaginary bird",
    appearance: "Upturned beak; two forward and two backward toes.",
    habitat: "Reeds", diet: "Seeds", behavior: "Climbs",
    imageUri: "", createdAt: new Date().toISOString(),
    traits: { beak: "upturned", feet: "zygodactyl", body: "songbird", colors: "violet", feathers: "smooth", legs: "short", extraFeatures: "violet plumage" },
  };
  await persistSavedBird(sourceId, metadata, upload.portraitPath);
  await assert.rejects(createBirdShareLink(strangerId, id), BirdShareUnavailable, "cannot share another account's bird by ID");
  await assert.rejects(findBirdShare(randomBytes(32).toString("base64url")), BirdShareUnavailable);
  await assert.rejects(findBirdShare("bad"), BirdShareUnavailable);

  const link = await createBirdShareLink(sourceId, id);
  assert.equal(link.token.length, 43);
  assert.ok(Date.parse(link.expiresAt) > Date.now() + 6 * 24 * 60 * 60_000);
  const preview = await findBirdShare(link.token);
  assert.deepEqual(preview.bird.metadata, metadata);
  assert.equal((await listSavedBirds(strangerId)).length, 0);
  // Previewing never imports, and importing one's own link reuses the original.
  assert.equal((await importSharedBird(sourceId, link.token)).birdId, id);
  const results = await Promise.all([
    importSharedBird(recipientId, link.token), importSharedBird(recipientId, link.token),
  ]);
  assert.equal(results[0].birdId, results[1].birdId);
  assert.equal((await listSavedBirds(recipientId)).length, 1, "concurrent retries must not duplicate");
  const imported = results[0];
  portraits.add(imported.portraitPath);
  assert.notEqual(imported.portraitPath, upload.portraitPath, "copies must not share a deletable object");
  assert.deepEqual(imported.metadata, { ...metadata, id: imported.birdId });
  const view = await presentSavedBird(imported);
  const downloaded = await fetch(view.imageUri);
  assert.ok(downloaded.ok);
  assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), png, "portrait bytes must remain exact");
  const anotherLink = await createBirdShareLink(sourceId, id);
  assert.equal((await importSharedBird(recipientId, anotherLink.token)).birdId, imported.birdId);
  assert.equal((await listSavedBirds(recipientId)).length, 1, "different links to same original must not duplicate");

  await db.insert(journalBirds).values(Array.from({ length: 100 }, (_, i) => ({
    installationId: fullId, birdId: `capacity-${i}`, metadata: { id: `capacity-${i}` },
    portraitPath: `sharing-tests/${run}/capacity-${i}`,
  })));
  await assert.rejects(importSharedBird(fullId, link.token), JournalFullError);
  assert.equal((await listSavedBirds(fullId)).length, 100);
  // Existing imports remain retryable even when a recipient is at capacity.
  await db.insert(journalBirds).values(Array.from({ length: 99 }, (_, i) => ({
    installationId: recipientId, birdId: `recipient-capacity-${i}`, metadata: { id: `recipient-capacity-${i}` },
    portraitPath: `sharing-tests/${run}/recipient-capacity-${i}`,
  })));
  assert.equal((await importSharedBird(recipientId, link.token)).birdId, imported.birdId);
  assert.equal((await listSavedBirds(recipientId)).length, 100);

  const expired = await findBirdShare(anotherLink.token);
  await db.update(birdShares).set({ expiresAt: new Date(Date.now() - 1000) })
    .where(eq(birdShares.tokenHash, expired.share.tokenHash));
  await assert.rejects(findBirdShare(anotherLink.token), BirdShareUnavailable);
  await assert.rejects(importSharedBird(strangerId, anotherLink.token), BirdShareUnavailable);
  await deleteSavedBird(sourceId, id);
  await deletePortrait(upload.portraitPath);
  await assert.rejects(findBirdShare(link.token), BirdShareUnavailable, "deleting source revokes link");
  const independent = await presentSavedBird((await listSavedBirds(recipientId)).find(b => b.birdId === imported.birdId)!);
  const afterDeletion = await fetch(independent.imageUri);
  assert.deepEqual(Buffer.from(await afterDeletion.arrayBuffer()), png, "sender deletion cannot break recipient copy");
  process.stdout.write("PASS: ownership, private preview, exact photo/traits, concurrent and cross-link idempotency, 100-bird limit, expiration, source deletion revocation, independent recipient portraits.\n");
} finally {
  await Promise.all([...portraits].map(path => deletePortrait(path).catch(() => {})));
  if (journals.length) await db.delete(journalInstallations).where(inArray(journalInstallations.id, journals));
  await pool.end();
}
