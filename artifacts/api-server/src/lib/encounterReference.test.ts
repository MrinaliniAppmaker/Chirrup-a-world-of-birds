import { test } from "node:test";
import assert from "node:assert/strict";
import type { EncounterBird } from "@workspace/api-zod";
import { encounterParts, referencePart, InvalidReferenceError } from "./encounterReference";

const png = `data:image/png;base64,${Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1]).toString("base64")}`;
const jpeg = `data:image/jpeg;base64,${Buffer.from([255, 216, 255, 224, 2]).toString("base64")}`;
const bird = (id: string, referenceImage: string): EncounterBird => ({
  id, name: id, referenceImage,
  traits: { body: "compact", beak: "hooked", feet: "webbed", legs: "pink", feathers: "down", colors: "teal" },
  appearance: "An approximate written description", habitat: "marsh", diet: "insects", behavior: "curious",
});

test("each identity is paired with its actual portrait in selection order", () => {
  const parts = encounterParts([bird("teal", png), bird("mallard", jpeg)], "pond", "meeting");
  assert.match(parts[1].text!, /"id":"teal"/);
  assert.equal(parts[2].inlineData?.data, png.split(",")[1]);
  assert.match(parts[3].text!, /"id":"mallard"/);
  assert.equal(parts[4].inlineData?.data, jpeg.split(",")[1]);
  assert.match(parts[0].text!, /EXISTING INDIVIDUALS/);
  assert.match(parts[1].text!, /image takes precedence/);
});

test("all six selected birds have separate references without extra image copies", () => {
  const parts = encounterParts(Array.from({ length: 6 }, (_, i) => bird(`bird-${i}`, png)), "shore", "feeding");
  assert.equal(parts.filter((part) => part.inlineData).length, 6);
  assert.match(parts[0].text!, /exactly 6 individual birds/);
  assert.ok(parts.every((part) => !part.text?.includes(png)));
});

test("server never fetches arbitrary URLs or accepts device-only URIs as portraits", () => {
  for (const uri of ["https://example.com/bird.png", "http://127.0.0.1/admin", "file:///bird.png", "blob:bird", ""]) {
    assert.throws(() => referencePart(uri), InvalidReferenceError);
  }
});

test("invalid image bytes and oversized payloads are rejected before AI requests", () => {
  assert.throws(() => referencePart("data:image/png;base64,aGVsbG8="), InvalidReferenceError);
  assert.throws(() => referencePart(`data:image/png;base64,${"A".repeat(1_400_000)}`), InvalidReferenceError);
});
