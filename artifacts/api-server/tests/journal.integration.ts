/**
 * Development-only integration check. Uses real API, PostgreSQL and App Storage.
 * Creates isolated test installations and removes only their records/objects.
 * Bundle with the API package's esbuild; never run against production.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { and, count, eq, inArray } from "drizzle-orm";
import { db, journalBirds, journalInstallations, pool } from "@workspace/db";
import { deletePortrait, validatePortrait } from "../src/lib/journalPortraits";

const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=", "base64");
const devices: { installationId: string; token: string }[] = [];
const uploaded: string[] = [];
type TestBird = {
  id: string; name: string; scientificName: string; tagline: string;
  appearance: string; habitat: string; diet: string; behavior: string;
  imageUri: string; createdAt: string;
  traits: { body: string; beak: string; colors: string; feathers: string; legs: string; feet: string };
};
const bird = (id: string): TestBird => ({
  id, name: `Journal test ${id}`, scientificName: "", tagline: "Integration fixture",
  appearance: "Imaginary bird", habitat: "Test habitat", diet: "Seeds", behavior: "Perching",
  imageUri: "", createdAt: new Date().toISOString(),
  traits: { body: "songbird", beak: "upcurved", colors: "teal", feathers: "flight", legs: "short", feet: "zygodactyl" },
});

async function api(path: string, token?: string, method = "GET", body?: unknown) {
  const response = await fetch(`${base}/api/journal${path}`, {
    method, headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(60_000),
  });
  const data = response.status === 204 ? null : await response.json();
  return { status: response.status, data };
}

async function upload(device: typeof devices[number], id: string, bytes = png) {
  const result = await api("/portraits", device.token, "POST", {
    birdId: id, contentType: "image/png", byteLength: bytes.length,
  });
  assert.equal(result.status, 200, "Authorize portrait");
  uploaded.push(result.data.portraitPath);
  const response = await fetch(result.data.uploadUrl, {
    method: "PUT", headers: { "Content-Type": "image/png" }, body: new Uint8Array(bytes),
    signal: AbortSignal.timeout(60_000),
  });
  assert.equal(response.status, 200, "Upload bytes directly to App Storage");
  return result.data.portraitPath as string;
}

try {
  assert.equal((await api("/birds")).status, 401, "Unauthenticated journal access rejected");
  assert.equal((await api("/birds", "not-a-valid-credential")).status, 401, "Invalid credential rejected");
  for (let i = 0; i < 2; i++) {
    const result = await api("/installations", undefined, "POST");
    assert.equal(result.status, 201, "Create installation");
    devices.push(result.data);
  }
  const [a, b] = devices;
  assert.notEqual(a.installationId, b.installationId);
  const sample = bird(`check-${randomUUID()}`);
  const path = await upload(a, sample.id);
  try { await validatePortrait(path); }
  catch (error) {
    const issue = error as { code?: unknown; message?: string; name?: string; stack?: string };
    console.log("Portrait validation diagnostics", {
      kind: issue.name, code: typeof issue.code === "number" ? issue.code : undefined,
      wrongSize: issue.message === "Portrait must be smaller than 8 MB.",
      wrongFormat: issue.message === "A PNG, JPEG or WebP portrait is required.",
      frames: issue.stack?.split("\n").slice(1, 6).map(line => line.replace(/https?:\/\/\S+/g, "[URL]")),
    });
    throw new Error("Portrait validation failed; see non-sensitive diagnostics above.");
  }
  const saved = await api("/birds", a.token, "POST", { bird: sample, portraitPath: path });
  assert.equal(saved.status, 200, "Save generated bird and notes");
  assert.equal(saved.data.traits.feet, "zygodactyl", "Preserve exact rare traits");
  const portrait = await fetch(saved.data.imageUri);
  assert.equal(portrait.status, 200, "Authorized portrait readable");
  assert.deepEqual(Buffer.from(await portrait.arrayBuffer()), png, "Portrait bytes unchanged");
  const anonymous = new URL(saved.data.imageUri);
  anonymous.search = "";
  assert.notEqual((await fetch(anonymous)).status, 200, "Bucket is not public");
  assert.equal((await api("/birds", b.token)).data.length, 0, "Other installation cannot list bird");
  assert.equal((await api("/birds", b.token, "POST", { bird: sample, portraitPath: path })).status, 400, "Other installation cannot claim portrait");
  await api(`/birds/${sample.id}`, b.token, "DELETE");
  assert.equal((await api("/birds", a.token)).data.length, 1, "Other installation cannot delete bird");
  const retryPath = await upload(a, sample.id);
  assert.equal((await api("/birds", a.token, "POST", { bird: sample, portraitPath: retryPath })).status, 200, "Retry succeeds");
  assert.equal((await api("/birds", a.token)).data.length, 1, "Retry does not duplicate bird");
  assert.equal((await api("/birds", a.token, "POST", {
    bird: { ...sample, imageUri: "data:image/png;base64,AAAA" }, portraitPath: path,
  })).status, 400, "Image bytes are never accepted as database metadata");
  const invalid = bird(`invalid-${randomUUID()}`);
  const invalidPath = await upload(a, invalid.id, Buffer.from("not an image"));
  assert.equal((await api("/birds", a.token, "POST", { bird: invalid, portraitPath: invalidPath })).status, 400, "Reject non-image bytes");
  console.log("PASS: private installation identity, exact portraits/traits, isolation, idempotency and upload validation");

  // Seed only this test installation to exercise simultaneous saves at capacity.
  const fixtures = Array.from({ length: 98 }, (_, i) => {
    const fixture = bird(`capacity-${i}`);
    return { installationId: a.installationId, birdId: fixture.id, metadata: fixture, portraitPath: `capacity-fixture/${a.installationId}/${i}` };
  });
  await db.insert(journalBirds).values(fixtures);
  const candidates = [bird(`last-${randomUUID()}`), bird(`last-${randomUUID()}`)];
  const paths = await Promise.all(candidates.map(candidate => upload(a, candidate.id)));
  const finalSaves = await Promise.all(candidates.map((candidate, i) =>
    api("/birds", a.token, "POST", { bird: candidate, portraitPath: paths[i] })));
  assert.deepEqual(finalSaves.map(result => result.status).sort(), [200, 409], "Only one simultaneous save gets final slot");
  const [{ total }] = await db.select({ total: count() }).from(journalBirds)
    .where(eq(journalBirds.installationId, a.installationId));
  assert.equal(total, 100, "Server enforces 100 birds transactionally");
  await db.delete(journalBirds).where(and(
    eq(journalBirds.installationId, a.installationId), inArray(journalBirds.birdId, fixtures.map(fixture => fixture.birdId)),
  ));
  await api(`/birds/${sample.id}`, a.token, "DELETE");
  assert.equal((await api(`/birds/${sample.id}`, a.token, "DELETE")).status, 204, "Delete retry is safe");
  assert.notEqual((await fetch(saved.data.imageUri)).status, 200, "Deleted portrait is removed");
  assert.ok(!(await api("/birds", a.token)).data.some((entry: TestBird) => entry.id === sample.id), "Deleted bird stays absent");
  console.log("PASS: concurrent final-slot saves respect 100-bird limit; deletion removes record and portrait");
} finally {
  for (const path of uploaded) await deletePortrait(path).catch(() => {});
  if (devices.length) await db.delete(journalInstallations)
    .where(inArray(journalInstallations.id, devices.map(device => device.installationId)));
  await pool.end();
  console.log("Cleaned up only this run’s test journals and portraits.");
}
