import { test } from "node:test";
import assert from "node:assert/strict";
import { clearlyNonAvianFeatures, inspectBirdTraits, validateBirdTraits, birdTraitValidationPrompt } from "./birdTraitValidation";
import type { BirdTraits } from "./birdDesign";

const traits: BirdTraits = { body: "small songbird body", beak: "upturned avocet beak", colors: "teal and copper", feathers: "contour feathers", legs: "long legs", feet: "zygodactyl toes", extra: "" };

test("reported elephant/cat/butterfly combination is blocked before any AI call", async () => {
  let calls = 0;
  const error = await validateBirdTraits({ ...traits, extra: "elephant trunk, catlike ears, and butterfly wings" }, async () => { calls++; throw Error("Must not run"); });
  assert.equal(calls, 0);
  assert.match(error!, /aren't bird features/);
  assert.match(error!, /elephant trunk/);
  assert.match(error!, /mammalian ears/);
  assert.match(error!, /non-bird wings/);
});

test("non-avian traits in typed primary fields are blocked too", () => {
  assert.deepEqual(clearlyNonAvianFeatures({ ...traits, beak: "elephant trunk" }), ["elephant trunk"]);
  assert.deepEqual(clearlyNonAvianFeatures({ ...traits, extra: "bat wings" }), ["non-bird wings"]);
});

test("rare bird anatomy and contradictory combinations reach semantic validation unchanged", async () => {
  const rare = { ...traits, extra: "heterodactyly, webbed feet, openbill gap, feathered crest" };
  assert.equal(await validateBirdTraits(rare, async (input) => {
    assert.deepEqual(input, rare);
    return { valid: true, invalidFeatures: [] };
  }), null);
  assert.match(birdTraitValidationPrompt, /must NEVER cause rejection/);
});

test("avian tufts, feather markings and negated non-bird traits are not keyword-blocked", () => {
  for (const extra of ["catlike ear tufts made of feathers", "butterfly wings pattern on the feathers", "no elephant trunk; without butterfly wings", "owl-like feather ear tufts"]) {
    assert.deepEqual(clearlyNonAvianFeatures({ ...traits, extra }), [], extra);
  }
});

test("semantic rejection and validator outages cannot fall through to generation", async () => {
  assert.match((await validateBirdTraits({ ...traits, extra: "wheels instead of legs" }, async () => ({ valid: false, invalidFeatures: ["wheels"] })))!, /wheels/);
  assert.notEqual(await validateBirdTraits(traits, async () => ({ valid: true, invalidFeatures: ["gills"] })), null);
  await assert.rejects(validateBirdTraits(traits, async () => { throw Error("provider unavailable"); }), /provider unavailable/);
});

test("pre-review rejection identifies exact words in extra and multiple typed fields", async () => {
  const input = { ...traits, beak: "elephant truk", feathers: "brown feathers, butterfly wings", extra: "white eye-ring, catlike ears" };
  const result = await inspectBirdTraits(input, async () => { throw Error("No AI needed"); });
  assert.equal(result.valid, false);
  assert.deepEqual(result.issues.map(({ field, feature }) => ({ field, feature })), [
    { field: "beak", feature: "elephant truk" },
    { field: "feathers", feature: "butterfly wings" },
    { field: "extra", feature: "catlike ears" },
  ]);
  for (const issue of result.issues) assert.equal(input[issue.field]!.slice(issue.start, issue.end), issue.feature);
});

test("all repeated invalid phrases and normalized Unicode map to original character ranges", async () => {
  const input = { ...traits, extra: "🪶 ｅｌｅｐｈａｎｔ trunk; butterfly wings and butterfly wings" };
  const result = await inspectBirdTraits(input, async () => { throw Error("No AI needed"); });
  assert.equal(result.issues.length, 3);
  for (const issue of result.issues) assert.equal(input[issue.field]!.slice(issue.start, issue.end), issue.feature);
  assert.equal(result.issues[0].feature, "ｅｌｅｐｈａｎｔ trunk");
});

test("semantic issues use the supplied field and an exact source substring", async () => {
  const input = { ...traits, extra: "forked tail, wheels instead of legs" };
  const result = await inspectBirdTraits(input, async () => ({
    valid: false, invalidFeatures: ["wheels"], issues: [{ field: "extra", feature: "wheels instead of legs" }],
  }));
  assert.equal(result.issues[0].feature, "wheels instead of legs");
  assert.equal(input.extra.slice(result.issues[0].start, result.issues[0].end), "wheels instead of legs");
});
