import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { readFile, rm } from "node:fs/promises";
import nodePath from "node:path";
import { eq } from "drizzle-orm";
import { contentReports, db, pool } from "@workspace/db";
import { deletePortrait, readReportPortrait } from "./journalPortraits";

const origin = "http://127.0.0.1:8080";
const image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j2ioAAAAASUVORK5CYII=";

test("guest reports persist private evidence, retry safely and reject invalid inputs without touching birds", async () => {
  assert.notEqual(process.env.NODE_ENV, "production", "Never run fixture writes in production");
  const id = randomUUID();
  const input = {
    submissionId: id, surface: "creation", reason: "inaccurate",
    details: "Automated report test; no real user data.",
    content: { id: "report-fixture", title: "<script>fixture</script>", text: "A generated bird test report.", image },
  };
  let path: string | null = null;
  const post = (payload: unknown) => fetch(`${origin}/api/content-reports`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  try {
    const created = await post(input);
    assert.equal(created.status, 201, await created.clone().text());
    assert.deepEqual(await created.json(), { id, received: true });
    const [stored] = await db.select().from(contentReports).where(eq(contentReports.id, id));
    assert.ok(stored);
    path = stored.portraitPath;
    assert.equal(stored.status, "pending");
    assert.equal(stored.content.text, input.content.text);
    assert.ok(path?.startsWith(`content-reports/${id}/`));
    assert.equal(await readReportPortrait(path!), image);
    const review = (...args: string[]) => spawnSync(process.execPath, ["artifacts/api-server/scripts/run-maintenance.mjs", "reports", ...args], { encoding: "utf8" });
    const exported = review("--export", id);
    assert.equal(exported.status, 0, exported.stderr);
    const html = await readFile(`generated-artifacts/private-report-reviews/${id}.html`, "utf8");
    assert.ok(html.includes(image));
    assert.ok(html.includes("&lt;script&gt;fixture&lt;/script&gt;"));
    assert.ok(!html.includes("<script>"));
    assert.equal(review("--resolve", id, "--note", "Fixture reviewed; no real user content or model change.").status, 0);
    const [reviewed] = await db.select().from(contentReports).where(eq(contentReports.id, id));
    assert.equal(reviewed.status, "reviewed");
    assert.ok(reviewed.reviewedAt);
    assert.equal((await post(input)).status, 200, "same submission retries without duplicate evidence");
    assert.equal((await post({ ...input, details: "Changed payload" })).status, 409);
    assert.equal((await post({ ...input, submissionId: randomUUID(), details: "x".repeat(1501) })).status, 400);
    assert.equal((await post({ ...input, submissionId: randomUUID(), content: { ...input.content, image: "https://example.org/private.png" } })).status, 400);
    assert.equal((await post({ ...input, submissionId: randomUUID(), content: { ...input.content, image: "data:image/png;base64,YWJj" } })).status, 400);
    assert.equal((await fetch(`${origin}/api/content-reports`)).status, 404, "no public report listing");
  } finally {
    // Remove only this run's own fixture, including if a later assertion failed.
    const [saved] = await db.select({ path: contentReports.portraitPath }).from(contentReports).where(eq(contentReports.id, id));
    if (saved?.path) await deletePortrait(saved.path);
    await db.delete(contentReports).where(eq(contentReports.id, id));
    await rm(nodePath.resolve(`generated-artifacts/private-report-reviews/${id}.html`), { force: true });
    await pool.end();
  }
});
