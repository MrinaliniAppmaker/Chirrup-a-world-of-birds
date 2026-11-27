import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FEET_OPTIONS, TRAIT_GROUPS, WATERBIRD_BEAK_OPTIONS } from "../../chirrup/constants/traits";
import { portraitPrompt, type BirdTraits } from "../src/lib/birdDesign";
import { portraitParts } from "../src/lib/anatomyGuides";
import { requestedAnatomyFeatures } from "../src/lib/anatomyGuidance";

const base: BirdTraits = {
  body: "small, compact perching bird body", beak: "", feet: "zygodactyl climbing feet, two toes back",
  colors: "teal and copper", feathers: "soft down with crisp flight feathers", legs: "short pinkish-brown legs",
};

test("lobed review label is concise without changing generation data or coot references", () => {
  const lobed = FEET_OPTIONS.find(option => option.id === "lobed")!;
  assert.equal(lobed.reviewLabel, "lobed, scalloped paddling toes");
  assert.equal(lobed.value, "lobed swimming toes, each toe edged with scalloped side lobes and open gaps between toes, no webbing between toes");
  const parts = portraitParts({ ...base, feet: lobed.value });
  assert.match(parts.map(part => part.text ?? "").join("\n"), /COOT FOOT REFERENCE/);
  const screen = readFileSync(new URL("../../chirrup/app/(tabs)/create.tsx", import.meta.url), "utf8");
  assert.match(screen, /mode === 'visual' \? optionFor\(k, sel\[k\]\)\?\.reviewLabel \?\? traits\[k\] : traits\[k\]/);
  assert.match(screen, /mode === 'typed' \? typed\[k\]\.trim\(\) : optionFor\(k, sel\[k\]\)\?\.value/);
});

test("each waterbird selection retains a unique id and reaches its own structural bill prompt", () => {
  const ordinary = TRAIT_GROUPS.find(group => group.key === "beak")!.options;
  const all = [...ordinary, ...WATERBIRD_BEAK_OPTIONS];
  assert.equal(new Set(all.map(option => option.id)).size, all.length);
  const signatures: Record<string, RegExp> = {
    spear: /rigid spear-shaped/,
    "water-probe": /gently curving downward to a fine pointed tip/,
    spoonbill: /tip distinctly wider than the shaft/,
    pelican: /expandable bare throat pouch/,
    skimmer: /LOWER mandible projects conspicuously/,
    flamingo: /abrupt downward bend around its midpoint/,
    shoebill: /tall bulky upper mandible/,
    avocet: /BOTH closed mandibles sweeping continuously UPWARD/,
    openbill: /permanent central gap/,
    merganser: /backward-pointing tooth-like keratin serrations/,
    cormorant: /down-hook confined to the UPPER terminal tip/,
  };
  assert.equal(WATERBIRD_BEAK_OPTIONS.length, Object.keys(signatures).length);
  for (const option of WATERBIRD_BEAK_OPTIONS) {
    const selected = all.find(item => item.id === option.id)!;
    const prompt = portraitPrompt({ ...base, beak: selected.value });
    assert.match(prompt, signatures[option.id], option.id);
    assert.match(prompt, /TWO pointing forward/);
    assert.ok(prompt.includes(JSON.stringify(base.colors)));
  }
});

test("spoonbill gets a width guide and unobstructed three-quarter bill, not a side-only probe", () => {
  const beak = WATERBIRD_BEAK_OPTIONS.find(option => option.id === "spoonbill")!.value;
  for (const feet of [base.feet, FEET_OPTIONS.find(option => option.id === "lobed")!.value, "plain perching toes"]) {
    const input = { ...base, beak, feet };
    const parts = portraitParts(input);
    const text = parts.map(part => part.text ?? "").join("\n");
    assert.match(text, /TOP view shows the essential sideways expansion/);
    assert.match(text, /FLAT TOP SURFACE/);
    assert.doesNotMatch(portraitPrompt(input), /clear right-facing side profile|Use a near-side view/);
    const guide = parts.findIndex(part => part.text?.includes("TOP view shows"));
    const png = Buffer.from(parts[guide + 1].inlineData!.data!, "base64");
    assert.equal(png.subarray(1, 4).toString(), "PNG");
  }
  assert.ok(!requestedAnatomyFeatures({ ...base, beak: "pointed probing bill" }).includes("spoonbill"));
  assert.ok(!requestedAnatomyFeatures({ ...base, beak: "not spoon-shaped" }).includes("spoonbill"));
  assert.ok(!requestedAnatomyFeatures({ ...base, beak: "plain", extra: "spoon-shaped tail" }).includes("spoonbill"));
});
