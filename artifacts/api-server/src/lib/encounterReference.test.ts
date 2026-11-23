import { test } from "node:test";
import assert from "node:assert/strict";
import type { EncounterBird } from "@workspace/api-zod";
import { anonymousParticipants, restoreBirdNames, encounterParts, referencePart, InvalidReferenceError } from "./encounterReference";
import { encounterNarratorPrompt } from "./encounterNarrative";
import { Resvg } from "@resvg/resvg-js";

const png = `data:image/png;base64,${new Resvg('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="teal"/></svg>').render().asPng().toString("base64")}`;
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

test("all six selected birds use one labelled group sheet without extra image copies", () => {
  const parts = encounterParts(Array.from({ length: 6 }, (_, i) => bird(`bird-${i}`, png)), "shore", "feeding");
  assert.equal(parts.filter((part) => part.inlineData).length, 1);
  assert.match(parts[0].text!, /exactly 6 individual birds/);
  assert.match(parts[1].text!, /BIRD_6 = row 2, column 3/);
  assert.match(parts[1].text!, /ORIGINAL portraits/);
  assert.match(parts[1].text!, /NOT a collage/);
  assert.ok(parts.every((part) => !part.text?.includes(png)));
});

test("group sheet and neutral labels do not depend on user-chosen names", () => {
  for (const count of [4, 5, 6]) {
    const birds = Array.from({ length: count }, (_, i) => bird(`falcon-${i}`, png));
    const renamed = birds.map((entry) => ({ ...entry, name: "swan", id: "different" }));
    assert.deepEqual(encounterParts(birds, "marsh", "BIRD_1 lands"), encounterParts(renamed, "marsh", "BIRD_1 lands"));
  }
});

test("encounters allow realistic predation without forced deaths or resurrection", () => {
  assert.match(encounterNarratorPrompt, /capture, kill and eat/);
  assert.match(encounterNarratorPrompt, /do not force a kill/);
  assert.match(encounterNarratorPrompt, /Once a bird dies it stays dead/);
  assert.match(encounterNarratorPrompt, /not necessarily alive, visible or acting in every minute/);
});

test("portrait identity does not freeze action or force every bird to stand alive", () => {
  const action = "BIRD_1 grips BIRD_2 after a chase; BIRD_2 is dead.";
  const parts = encounterParts([bird("one", png), bird("two", jpeg)], "marsh", action);
  const text = parts.map((part) => part.text ?? "").join("\n");
  assert.match(text, /APPEARANCE ONLY, not pose, position/);
  assert.match(text, /Repose and reposition each bird freely/);
  assert.match(text, /dead bird must not be shown standing alert/);
  assert.match(text, /natural foreshortening and occlusion/);
  assert.ok(text.includes(action));
  assert.doesNotMatch(text, /Show distinct full bodies|Put ALL/);
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
