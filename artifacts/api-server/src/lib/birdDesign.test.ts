import { test } from "node:test";
import assert from "node:assert/strict";
import { createPortrait, portraitPrompt, type BirdTraits } from "./birdDesign";
import { anatomyGuidance } from "./anatomyGuidance";

const traits: BirdTraits = {
  body: "small, compact songbird body",
  beak: "sharp hooked raptor beak",
  colors: "iridescent teal with copper highlights",
  feathers: "soft down with crisp flight feathers",
  legs: "short pinkish-brown legs",
  feet: "fully webbed paddling feet",
  extra: "white spot above each eye",
};

test("conflicting predefined traits are described by independent physical geometry", () => {
  const prompt = portraitPrompt(traits);
  assert.match(prompt, /small compact oval torso/);
  assert.match(prompt, /sharply down-hooked upper mandible/);
  assert.match(prompt, /EACH foot joined by continuous fan-shaped skin membranes/);
  assert.doesNotMatch(prompt, /songbird|raptor|waterfowl|perching|duck/i);
  for (const key of ["colors", "feathers", "legs", "extra"] as const) {
    assert.ok(prompt.includes(JSON.stringify(traits[key])));
  }
});

test("body categories cannot import or override their customary legs", () => {
  const prompt = portraitPrompt({ ...traits, body: "slender long-necked wading bird body", legs: "tiny delicate black legs" });
  assert.match(prompt, /elongated gently curved neck/);
  assert.ok(prompt.includes('"tiny delicate black legs"'));
  assert.doesNotMatch(prompt, /long slender wading legs/);
});

test("free-form traits and markings are preserved verbatim, not mapped to familiar species", () => {
  const custom: BirdTraits = {
    body: "tiny owl-shaped torso with a long neck",
    beak: "long violet spoon bill with a golden hook",
    colors: "pink and turquoise stripes", feathers: "hairlike filoplumes",
    legs: "very long lime-green legs", feet: "purple webbed feet with four forward toes",
    extra: "three blue dots below the left eye",
  };
  const prompt = portraitPrompt(custom);
  for (const value of Object.values(custom)) assert.ok(prompt.includes(JSON.stringify(value)));
});

test("lobed feet and zygodactyl feet receive distinct physical descriptions", () => {
  assert.match(portraitPrompt({ ...traits, feet: "lobed swimming toes" }), /individual broad lateral skin lobes/);
  assert.match(portraitPrompt({ ...traits, feet: "zygodactyl climbing feet, two toes back" }), /two forward-pointing toes and two backward-pointing toes/);
});

test("typed uncommon toe terms and the reported spelling expand without replacing custom traits", () => {
  for (const feet of ["zygodactyl", "zygodactyly", "zygodactylity", "zygodactlity", "violet ZYGODACTYLOUS feet"]) {
    const prompt = portraitPrompt({ ...traits, feet });
    assert.ok(prompt.includes(JSON.stringify(feet)));
    assert.match(prompt, /TWO pointing forward.*TWO pointing backward/);
    assert.match(prompt, /outer fourth toe turns backward/);
    assert.match(prompt, /NOT the common three-forward\/one-back/);
  }
});

test("upturned bill synonyms explain shaft curvature rather than tilting the bird's head", () => {
  for (const beak of ["upturned beak", "up-turned violet bill", "upcurved bill", "recurved beak", "upward custom upcurving bill"]) {
    const prompt = portraitPrompt({ ...traits, beak });
    assert.ok(prompt.includes(JSON.stringify(beak)));
    assert.match(prompt, /Both closed mandibles follow the upward curve/);
    assert.match(prompt, /not a straight bill on a tilted-up head/);
    assert.match(prompt, /bill silhouette unobstructed/);
  }
});

test("extra anatomy is explained without inferring rare features from other body parts", () => {
  const input = { ...traits, extra: "zygodactyly; long upturned violet beak" };
  const guidance = anatomyGuidance(input);
  assert.match(guidance, /Zygodactyl/);
  assert.match(guidance, /Upturned/);
  assert.equal(anatomyGuidance({ ...traits, body: "upturned tail on a zygodactyl-shaped torso" }), "");
  assert.equal(anatomyGuidance({ ...traits, beak: "decurved beak" }).includes("Upturned"), false);
  assert.match(guidance, /respect negations, explicit toe counts/);
});

test("rare feet and bills stay independent of conflicting body categories", () => {
  const input = { ...traits, feet: "zygodactyl violet toes", beak: "slender upturned bill" };
  const prompt = portraitPrompt(input);
  assert.match(prompt, /small compact oval torso/);
  assert.match(prompt, /digits II and III/);
  assert.match(prompt, /BILL ITSELF bends UPWARD/);
  assert.ok(prompt.includes(JSON.stringify(input.colors)));
  assert.match(anatomyGuidance({ ...traits, feet: "totipalmate" }), /ALL FOUR toes/);
});

test("one image request returns directly, with no inspector or quality retry", async () => {
  let calls = 0;
  const result = await createPortrait(traits, async (prompt) => {
    calls += 1;
    assert.match(prompt, /continuous fan-shaped skin membranes/);
    return { b64_json: "portrait", mimeType: "image/png" };
  });
  assert.equal(calls, 1);
  assert.equal(result, "data:image/png;base64,portrait");
});

test("genuine provider failures remain explicit and are not converted into fake images", async () => {
  await assert.rejects(createPortrait(traits, async () => { throw new Error("Provider unavailable"); }), /Provider unavailable/);
  await assert.rejects(createPortrait(traits, async () => ({ b64_json: "", mimeType: "image/png" })), /no portrait/);
});
