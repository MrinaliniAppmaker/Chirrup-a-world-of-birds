import { Resvg } from "@resvg/resvg-js";
import type { Part } from "@google/genai";
import type { BirdTraits } from "./birdDesign";
import { requestedAnatomyFeatures, type AnatomyFeature } from "./anatomyGuidance";
import { portraitPrompt } from "./birdDesign";

type Guide = { id: AnatomyFeature; caption: string; svg: string };
const canvas = (content: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="420" viewBox="0 0 720 420"><rect width="720" height="420" fill="white"/>${content}</svg>`;

// Deliberately isolated part diagrams, not reference species or complete birds.
// Geometry is authored directly so a second AI cannot misunderstand the guide.
const billGuide = (up: boolean) => canvas(`
  <ellipse cx="180" cy="245" rx="110" ry="100" fill="#eeeeee" stroke="#777777" stroke-width="3"/>
  <circle cx="215" cy="212" r="9" fill="#333333"/>
  <path d="${up
    ? "M275 238 C405 246 548 200 664 76 C565 229 413 268 275 260 Z"
    : "M275 238 C405 230 548 276 664 400 C565 247 413 208 275 216 Z"}"
    fill="#555555" stroke="#222222" stroke-width="3"/>
`);
const toeGuide = (forward: number[], backward: number[]) => {
  const toes = (digits: number[], front: boolean) => digits.map((digit, i) => {
    const endX = 360 + (i - (digits.length - 1) / 2) * 110;
    const endY = front ? 65 : 355;
    return `<path d="M360 210 Q${endX} ${front ? 150 : 265} ${endX} ${endY}" fill="none" stroke="#555555" stroke-width="24" stroke-linecap="round"/>
      <text x="${endX + 20}" y="${endY + 6}" font-family="sans-serif" font-size="22" fill="#222222">${digit}</text>`;
  }).join("");
  return canvas(`<text x="295" y="30" font-family="sans-serif" font-size="20" fill="#222222">FRONT / HEAD</text>
    ${toes(forward, true)}${toes(backward, false)}
    <circle cx="360" cy="210" r="25" fill="#bbbbbb" stroke="#222222" stroke-width="3"/>
    <text x="285" y="400" font-family="sans-serif" font-size="20" fill="#222222">BACK / TAIL</text>`);
};
const guides: Guide[] = [
  { id: "upcurved", caption: "BILL SHAPE ONLY, side view facing right: copy the continuous UPWARD sweep to the raised tip, with the head level. The grey oval is orientation context only, not the requested head shape. Do not copy grey coloring, scale or illustration style.", svg: billGuide(true) },
  { id: "downcurved", caption: "BILL SHAPE ONLY, side view facing right: copy the continuous DOWNWARD bill curve. Grey head is orientation context only; keep the user's own head shape, bill dimensions and palette.", svg: billGuide(false) },
  { id: "zygodactyl", caption: "TOE ARRANGEMENT ONLY: top view of ONE foot, front/head at top. Two toes (2,3) extend forward; two (1,4) extend backward. Repeat this 2+2 layout on BOTH feet in the final bird's perspective, with natural joints and claws. Circle is the ankle, not a fifth toe. Do not copy labels, grey color or flat illustration style.", svg: toeGuide([2, 3], [1, 4]) },
  { id: "heterodactyl", caption: "TOE ARRANGEMENT ONLY: top view of ONE foot, front/head at top. Digits 3 and 4 forward, digits 1 and 2 backward. Repeat on both feet with realistic skin and claws. Circle is ankle; labels and grey are diagram conventions only.", svg: toeGuide([3, 4], [1, 2]) },
  { id: "pamprodactyl", caption: "TOE ARRANGEMENT ONLY: top view of ONE foot, front/head at top, showing all FOUR toes pointing forward. Repeat on both feet. Circle is ankle, not a toe; do not copy labels or grey color.", svg: toeGuide([1, 2, 3, 4], []) },
];

const rasterCache = new Map<AnatomyFeature, string>();
export function anatomyGuideParts(traits: BirdTraits): Part[] {
  const requested = requestedAnatomyFeatures(traits);
  const parts: Part[] = [];
  // Conflicting custom terms should stay text constraints, not contradictory
  // hard visual references. Explicit user wording still reaches the prompt.
  const billConflict = requested.includes("upcurved") && requested.includes("downcurved");
  const toeFeatures = requested.filter((id) => ["zygodactyl", "heterodactyl", "pamprodactyl"].includes(id));
  for (const guide of guides) {
    if (!requested.includes(guide.id)) continue;
    if (billConflict && ["upcurved", "downcurved"].includes(guide.id)) continue;
    if (toeFeatures.length > 1 && toeFeatures.includes(guide.id)) continue;
    let data = rasterCache.get(guide.id);
    if (!data) {
      data = new Resvg(guide.svg, { font: { loadSystemFonts: true } }).render().asPng().toString("base64");
      rasterCache.set(guide.id, data);
    }
    parts.push({ text: guide.caption }, { inlineData: { mimeType: "image/png", data } });
  }
  return parts;
}

export function portraitParts(traits: BirdTraits): Part[] {
  const referenceParts = anatomyGuideParts(traits);
  return [
    ...(referenceParts.length ? [{
      text: "The following images are STRUCTURAL ANATOMY GUIDES for the selected parts only. Use their geometry to construct the bird in the final specification. They are not species references, finished bird portraits, palette references or output panels. Return ONE photorealistic bird, never a diagram, collage, inset or comparison sheet.",
    }, ...referenceParts] : []),
    { text: portraitPrompt(traits) },
  ];
}
