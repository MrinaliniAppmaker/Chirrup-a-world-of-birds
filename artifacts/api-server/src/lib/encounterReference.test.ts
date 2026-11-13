import { test } from "node:test";
import assert from "node:assert/strict";
import type { EncounterBird } from "@workspace/api-zod";
import { anonymousParticipants, restoreBirdNames, encounterParts, referencePart, InvalidReferenceError } from "./encounterReference";

const png = `data:image/png;base64,${Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1]).toString("base64")}`;
const jpeg = `data:image/jpeg;base64,${Buffer.from([255, 216, 255, 224, 2]).toString("base64")}`;
const bird = (id: string, referenceImage: string): EncounterBird => ({
  id, name: id, referenceImage,
  traits: { body: "compact", beak: "hooked", feet: "webbed", legs: "pink", feathers: "down", colors: "teal" },
  appearance: "An approximate written description", habitat: "marsh", diet: "insects", behavior: "curious",
});

test("each identity is paired with its actual portrait in selection order", () => {
  const parts = encounterParts([bird("teal", png), bird("mallard", jpeg)], "pond", "meeting");
  assert.match(parts[1].text!, /scene identifier BIRD_1/);
  assert.equal(parts[2].inlineData?.data, png.split(",")[1]);
  assert.match(parts[3].text!, /scene identifier BIRD_2/);
  assert.equal(parts[4].inlineData?.data, jpeg.split(",")[1]);
  assert.match(parts[0].text!, /EXISTING INDIVIDUALS/);
  assert.match(parts[1].text!, /image takes precedence/);
});

test("renaming a bird cannot change the scene planning or image instructions", () => {
  const original = [bird("Falcon", png), bird("Grey-and-white eagle", jpeg)];
  const renamed = original.map((entry, index) => ({ ...entry, id: `new-id-${index}`, name: `Fluffy ${index}` }));
  assert.deepEqual(anonymousParticipants(original), anonymousParticipants(renamed));
  assert.deepEqual(encounterParts(original, "pond", "BIRD_1 meets BIRD_2"), encounterParts(renamed, "pond", "BIRD_1 meets BIRD_2"));
  const allText = JSON.stringify(encounterParts(original, "pond", "BIRD_1 meets BIRD_2"));
  assert.doesNotMatch(allText, /Falcon|Grey-and-white eagle/);
});

test("display names are restored only in returned text, without altering their spelling", () => {
  const birds = [bird("Falcon $&", png), bird("Teal watercock", jpeg)];
  assert.equal(restoreBirdNames("BIRD_1 watches BIRD_2; BIRD_1 waits.", birds), "Falcon $& watches Teal watercock; Falcon $& waits.");
  assert.equal(restoreBirdNames("BIRD_10 is not a participant.", birds), "BIRD_10 is not a participant.");
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
