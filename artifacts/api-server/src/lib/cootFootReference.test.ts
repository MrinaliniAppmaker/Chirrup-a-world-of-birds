import { test } from "node:test";
import assert from "node:assert/strict";
import { cootFootReference } from "./cootFootReference";
import { portraitParts } from "./anatomyGuides";
import type { BirdTraits } from "./birdDesign";

const traits: BirdTraits = {
  body: "compact songbird", beak: "short conical",
  colors: "teal and copper", feathers: "contour",
  legs: "short pink legs", feet: "lobed swimming toes",
};
const photo = { inlineData: { mimeType: "image/png", data: "coot-foot-test-fixture" } };

test("real-foot input is requested only for positive lobed-foot traits", async () => {
  let reads = 0;
  const load = async () => { reads++; return photo; };
  assert.equal(await cootFootReference(traits, load), photo);
  for (const feet of ["webbed", "plain perching toes", "not lobed"]) {
    assert.equal(await cootFootReference({ ...traits, feet }, load), undefined);
  }
  assert.equal(await cootFootReference({ ...traits, feet: "plain", extra: "lobed tail" }, load), undefined);
  assert.equal(reads, 1);
});

test("foot photograph replaces only the lobed surface diagram, without losing selected directions or colors", () => {
  const parts = portraitParts({ ...traits, feet: "zygodactyl lobed toes" }, photo);
  assert.equal(parts.filter(p => p.inlineData).length, 3);
  assert.equal(parts.filter(p => p.inlineData?.data === photo.inlineData.data).length, 1);
  const text = parts.map(p => p.text ?? "").join("\n");
  assert.match(text, /REAL COOT FOOT/);
  assert.match(text, /Do not copy its leg\/skin colors/);
  assert.match(text, /TWO toes \(2,3\).*TWO toes \(1,4\)/);
  assert.ok(text.includes(JSON.stringify(traits.colors)));
  assert.ok(text.includes(JSON.stringify(traits.legs)));
});

test("missing real-foot reference fails explicitly instead of silently dropping conditioning", async () => {
  await assert.rejects(cootFootReference(traits, async () => { throw new Error("unavailable"); }), /unavailable/);
});
