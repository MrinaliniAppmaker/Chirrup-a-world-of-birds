import { test } from "node:test";
import assert from "node:assert/strict";
import { anatomyGuideParts, anatomyPoseParts, portraitParts } from "./anatomyGuides";
import { requestedAnatomyFeatures } from "./anatomyGuidance";
import type { BirdTraits } from "./birdDesign";
import { billGuide, lobedToeGuide, toeGuide, GUIDE_WIDTH, GUIDE_HEIGHT } from "./anatomyGuideDrawings";
import { portraitSystemInstruction } from "./anatomyGuides";

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
    assert.equal(bytes.readUInt32BE(16), GUIDE_WIDTH);
    assert.equal(bytes.readUInt32BE(20), GUIDE_HEIGHT);
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
  assert.equal(parts.filter((part) => part.inlineData).length, 3);
  assert.match(parts[0].text!, /not species references/);
  const text = parts.map((part) => part.text ?? "").join("\n");
  assert.ok(text.includes(JSON.stringify(traits.beak)));
  assert.ok(text.includes(JSON.stringify(traits.feet)));
  assert.ok(text.includes(JSON.stringify(traits.colors)));
  assert.match(parts.at(-1)!.text!, /FINAL RENDERING PRIORITY/);
  const plain = { ...traits, beak: "short straight bill", feet: "plain toes" };
  assert.equal(portraitParts(plain).length, 1);
});

test("toe guides show articulated digits in multiple views and both-foot stance", () => {
  const svg = toeGuide([2, 3], [1, 4]);
  assert.match(svg, /2 FORWARD \+ 2 BACKWARD ON EACH FOOT/);
  assert.match(svg, /OBLIQUE VIEW/);
  assert.match(svg, /TOP VIEW/);
  assert.match(svg, /LEFT FOOT/);
  assert.match(svg, /RIGHT FOOT/);
  assert.equal((svg.match(/>1<\/text>/g) ?? []).length, 4);
  assert.equal((svg.match(/>4<\/text>/g) ?? []).length, 4);
  assert.match(billGuide(true), /RAISED TIP/);
  assert.match(billGuide(false), /LOWERED TIP/);
});

test("rare-toe portrait exposes rather than obscures rear toes", () => {
  const text = portraitParts(traits).map((part) => part.text ?? "").join("\n");
  assert.match(text, /broad FLAT light matte surface/);
  assert.match(text, /NOT gripping a narrow perch/);
  assert.match(text, /Eight toes across the pair/);
  assert.match(text, /rear pair a visible gap/);
  assert.match(text, /both the selected bill curvature and toe arrangement together/);
  assert.doesNotMatch(text, /low near-side|narrow bare rock ledge/);
  assert.match(portraitSystemInstruction, /Plan each foot separately/);
});

test("spatial base binds required toe structures to actual leg ends", () => {
  const parts = anatomyPoseParts(traits);
  assert.match(parts[0].text!, /actual leg ends/);
  assert.match(parts[0].text!, /neutral placeholders/);
  assert.match(parts[0].text!, /Keep selected leg length/);
  const image = Buffer.from(parts[1].inlineData!.data!, "base64");
  assert.equal(image.readUInt32BE(16), 1440);
  assert.equal(image.readUInt32BE(20), 1440);
  assert.deepEqual(anatomyPoseParts({ ...traits, feet: "plain toes" }), []);
  assert.deepEqual(anatomyPoseParts({ ...traits, feet: "zygodactyl or heterodactyl" }), []);
});

test("lobed toes receive a separate surface guide, not a webbed-foot or digit-count guide", () => {
  const input = { ...traits, beak: "short straight bill", feet: "lobed swimming toes" };
  assert.deepEqual(requestedAnatomyFeatures(input), ["lobed"]);
  const parts = anatomyGuideParts(input);
  assert.equal(parts.length, 2);
  assert.match(parts[0].text!, /TOE SURFACE ONLY/);
  assert.match(parts[0].text!, /Preserve open gaps/);
  assert.match(parts[0].text!, /not a toe-count diagram/);
  assert.match(parts[0].text!, /COOT FOOT REFERENCE/);
  assert.match(parts[0].text!, /broad, flat leaf-like/);
  assert.match(parts[0].text!, /never a coot's body/);
  assert.equal(Buffer.from(parts[1].inlineData!.data!, "base64").subarray(1, 4).toString(), "PNG");
  assert.match(lobedToeGuide(), /White gaps stay OPEN/);
  assert.match(lobedToeGuide(), /NOT SPIKES, BEADS OR FEATHERS/);
  assert.equal((lobedToeGuide().match(/<polygon /g) ?? []).length, 3);
  assert.deepEqual(requestedAnatomyFeatures({ ...input, feet: "not lobed" }), []);
  assert.deepEqual(requestedAnatomyFeatures({ ...input, feet: "plain", extra: "lobed tail" }), []);
  assert.deepEqual(requestedAnatomyFeatures({ ...input, feet: "plain", extra: "lobate toes" }), ["lobed"]);
  const combined = anatomyGuideParts({ ...input, feet: "zygodactyl lobed toes" });
  assert.equal(combined.filter(p => p.inlineData).length, 2, "surface and toe-direction guides must coexist");
  const spatial = anatomyPoseParts(input);
  assert.equal(spatial.filter(p => p.inlineData).length, 1);
  assert.match(spatial.at(-1)!.text!, /ordinary skinny toes/);
  assert.deepEqual(anatomyPoseParts({ ...input, feet: "lobed toes, five forward toes" }), [], "never replace a custom count with the default scaffold");
});
