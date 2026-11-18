import { test } from "node:test";
import assert from "node:assert/strict";
import { encounterMortalityPolicy } from "./encounterPolicy";

test("nonpredatory pairs cannot receive a fatal outcome", () => {
  for (const random of [0, 0.01, 0.5, 0.99]) {
    assert.match(encounterMortalityPolicy([{ diet: "seeds and fruit" }, { diet: "insects and nectar" }], () => random), /NONFATAL ENCOUNTER/);
  }
});
test("bird-eating predator and suitable prey can have a fatal or nonfatal encounter", () => {
  const birds = [{ diet: "small birds and rodents" }, { diet: "seeds and insects" }];
  assert.match(encounterMortalityPolicy(birds, () => 0.1), /BIRD_1 hunting BIRD_2/);
  assert.match(encounterMortalityPolicy(birds, () => 0.8), /NONFATAL ENCOUNTER/);
});
test("predator-predator encounters are nonfatal in 92 percent of policy draws", () => {
  const birds = [{ diet: "fish and frogs" }, { diet: "rodents and small birds" }];
  let permits = 0;
  for (let i = 0; i < 1000; i++) if (!encounterMortalityPolicy(birds, () => (i + 0.5) / 1000).includes("NONFATAL ENCOUNTER")) permits++;
  assert.equal(permits, 80);
});
test("names, bill shape, insect eating and negated hunting cannot justify a bird kill", () => {
  assert.match(encounterMortalityPolicy([{ diet: "invertebrates and seeds" }, { diet: "fish" }], () => 0), /NONFATAL ENCOUNTER/);
  assert.match(encounterMortalityPolicy([{ diet: "never eats birds; eats seeds" }, { diet: "nectar" }], () => 0), /NONFATAL ENCOUNTER/);
});
