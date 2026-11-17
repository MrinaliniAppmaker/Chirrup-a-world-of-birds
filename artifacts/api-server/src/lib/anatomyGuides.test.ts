import { test } from "node:test";
import assert from "node:assert/strict";
import { anatomyGuideParts, portraitParts } from "./anatomyGuides";
import { requestedAnatomyFeatures } from "./anatomyGuidance";
import type { BirdTraits } from "./birdDesign";

const traits: BirdTraits = {
  body: "small, compact songbird body", beak: "violet upturned bill",
  colors: "teal and copper", feathers: "down and flight feathers",
  feet: "zygodactlity", legs: "short pink legs",
};

test("rare traits send real separate PNG guides paired with part-specific captions", () => {
  const parts = anatomyGuideParts(traits);
  assert.equal(parts.length, 4);
  assert.match(parts[0].text!, /BILL SHAPE ONLY/);
  assert.match(parts[2].text!, /TOE ARRANGEMENT ONLY/);
  const pngs = parts.filter((part) => part.inlineData);
  for (const part of pngs) {
    assert.equal(part.inlineData!.mimeType, "image/png");
    const bytes = Buffer.from(part.inlineData!.data!, "base64");
    assert.equal(bytes.subarray(1, 4).toString(), "PNG");
    assert.equal(bytes.readUInt32BE(16), 720);
    assert.equal(bytes.readUInt32BE(20), 420);
  }
  assert.notEqual(pngs[0].inlineData!.data, pngs[1].inlineData!.data);
  assert.deepEqual(anatomyGuideParts(traits), parts);
});

test("presets, custom spelling and extra terms select the same guides", () => {
  assert.deepEqual(requestedAnatomyFeatures(traits), ["zygodactyl", "upcurved"]);
  assert.equal(anatomyGuideParts({ ...traits, feet: "zygodactyl climbing feet, two toes back", beak: "slender upcurved sweep-feeding beak" }).length, 4);
  assert.equal(anatomyGuideParts({ ...traits, feet: "plain", beak: "plain", extra: "zygodactyly and a recurved beak" }).length, 4);
});

test("do not force guides for absent, negated, unrelated or conflicting anatomy", () => {
  const plain = { ...traits, feet: "three toes forward", beak: "short straight bill" };
  assert.deepEqual(anatomyGuideParts(plain), []);
  assert.deepEqual(anatomyGuideParts({ ...plain, extra: "upturned tail" }), []);
  assert.deepEqual(anatomyGuideParts({ ...plain, beak: "not upturned", feet: "without zygodactyly" }), []);
  assert.deepEqual(anatomyGuideParts({ ...plain, beak: "upturned and downcurved", feet: "zygodactyl or heterodactyl" }), []);
});

test("guide-equipped request still includes exact custom traits and one photorealistic bird", () => {
  const parts = portraitParts(traits);
  assert.equal(parts.filter((part) => part.inlineData).length, 2);
  assert.match(parts[0].text!, /not species references/);
  const final = parts.at(-1)!.text!;
  assert.ok(final.includes(JSON.stringify(traits.beak)));
  assert.ok(final.includes(JSON.stringify(traits.feet)));
  assert.ok(final.includes(JSON.stringify(traits.colors)));
  const plain = { ...traits, beak: "short straight bill", feet: "plain toes" };
  assert.equal(portraitParts(plain).length, 1);
});
