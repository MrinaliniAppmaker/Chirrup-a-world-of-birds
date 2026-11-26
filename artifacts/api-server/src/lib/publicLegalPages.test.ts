import assert from "node:assert/strict";
import test from "node:test";
import { publicLegalPage } from "./publicLegalPages";

test("public privacy draft discloses actual processors and unresolved family-launch requirements", () => {
  const html = publicLegalPage("privacy");
  assert.match(html, /<html lang="en">/);
  for (const text of [
    "Chirrup", "India", "Replit", "Clerk", "Google Gemini", "OpenAI",
    "Pre-release draft", "not legal advice", "Children and launch restrictions",
    "parental", "does not claim", "retention", "/api/legal/delete-account",
  ]) assert.ok(html.includes(text), text);
  assert.doesNotMatch(html, /<script|<iframe|https:\/\/.*\.js["']/);
  assert.doesNotMatch(html, /pk_live_|pk_test_|sk_live_|sk_test_/);
});

test("deletion page honestly offers a user-sent request, never automatic deletion or email", () => {
  const html = publicLegalPage("delete-account");
  assert.match(html, /without installing or signing in/);
  assert.match(html, /You must send the email yourself/);
  assert.match(html, /does not delete anything/);
  assert.match(html, /not.*immediate or automatic deletion/);
  assert.match(html, /Independent bird copies/);
  assert.match(html, /Never include your password/);
  assert.match(html, /guardian/);
  const draft = html.match(/class="button" href="([^"]+)"/)?.[1].replace(/&amp;/g, "&");
  assert.ok(draft);
  const uri = new URL(draft);
  assert.equal(uri.protocol, "mailto:");
  assert.equal(uri.searchParams.get("subject"), "Chirrup account deletion");
  assert.match(uri.searchParams.get("body") ?? "", /My account email address/);
  assert.match(html, /href="\/api\/legal\/privacy"/);
  assert.doesNotMatch(html, /<script|<form|<iframe/);
});
