import type { BirdTraits } from "./birdDesign";

// Definitions supplement, rather than rewrite, the user's original trait data.
// Keep matching local to the relevant part and optional extra-trait text.
const definitions = [
  {
    id: "zygodactyl",
    part: "feet",
    term: /\bzygodact(?:yl(?:ous|y|ity)?|lity)\b/i,
    meaning: "Zygodactyl / zygodactyly: each foot has FOUR toes, TWO pointing forward (digits II and III) and TWO pointing backward (digits I and IV). The outer fourth toe turns backward alongside the first toe. This is a 2+2 arrangement, NOT the common three-forward/one-back arrangement; long claws alone do not represent it. In a side view with the bird facing right, show two separate toes extending right of EACH ankle and two separate toes extending left of EACH ankle, with a visible gap between the rear pair.",
  },
  {
    id: "heterodactyl",
    part: "feet",
    term: /\bheterodact(?:yl(?:ous|y|ity)?)\b/i,
    meaning: "Heterodactyl: each foot has four toes; digits III and IV face forward, while digits I and II face backward. Do not replace it with the different digit pairing of zygodactyl feet.",
  },
  {
    id: "pamprodactyl",
    part: "feet",
    term: /\bpamprodact(?:yl(?:ous|y|ity)?)\b/i,
    meaning: "Pamprodactyl: all FOUR toes can rotate to point forward. Show the requested orientation; do not automatically add a backward-facing toe.",
  },
  {
    id: "lobed",
    part: "feet",
    term: /\b(?:lobed|lobate)\b/i,
    meaning: "Lobed / lobate toes: use a COOT'S FOOT as the anatomical model for the toe surfaces ONLY. EACH INDIVIDUAL TOE has broad, flat leaf-like lateral skin flaps along its phalanges, interrupted by shallow notches at the joints; a narrow scaled central digit ends in its own claw. These are soft continuous skin lobes, not pointed spikes, beads, armored plates, feathers or ordinary skinny perching toes. The lobes attach to that toe alone. Keep open air gaps between neighboring toes from beyond the ankle junction all the way to their separate claws. Do not bridge those gaps with a shared sheet of skin: lobed toes are NOT webbed feet. Preserve independently requested toe counts and directions; lobes change a toe's edges, not its branching. Do NOT copy a coot's body, head, bill, black plumage, white forehead or green leg color; all other selected traits remain unchanged.",
  },
  {
    id: "totipalmate",
    part: "feet",
    term: /\btotipalmate\b/i,
    meaning: "Totipalmate: continuous swimming membranes connect ALL FOUR toes, including the innermost toe, not only the usual three front toes.",
  },
  {
    id: "upcurved",
    part: "beak",
    term: /\b(?:up[- ]?(?:turned|curved|curving)|recurved)\b/i,
    meaning: "Upturned / upcurved / recurved bill: the BILL ITSELF bends UPWARD along its length toward its tip. Both closed mandibles follow the upward curve; the distal tip lies above the bill base when the head is level. In side silhouette the curve is CONCAVE UP, like the rising right end of a smile, not an arch: start near-horizontal at the face, then progressively sweep upward to a raised pointed tip. The last quarter of the bill points skyward, never toward the ground. This is not a straight bill on a tilted-up head, an open bill, or a downward hook. Preserve the requested thickness, length and color.",
  },
  {
    id: "downcurved",
    part: "beak",
    term: /\b(?:down[- ]?(?:curved|curving)|decurved)\b/i,
    meaning: "Decurved bill: the bill shaft curves DOWNWARD along its length, not just a hooked tip. Preserve any independently requested bill thickness, length and color.",
  },
] as const;

export type AnatomyFeature = (typeof definitions)[number]["id"];

// A diagram is a positive structural constraint. Never attach one for a term
// the user negated, or for e.g. an upturned tail mentioned in extra traits.
export function requestedAnatomyFeatures(traits: BirdTraits): AnatomyFeature[] {
  return definitions.filter(({ id, part, term }) => {
    const extra = id === "lobed"
      ? (traits.extra ?? "").split(/[.;,\n]/).filter(clause =>
        /\b(?:(?:lobed|lobate)(?:[-\s]+swimming)?[-\s]+(?:toes?|feet|foot|digits?)|(?:toes?|feet|foot|digits?)(?:[-\s]+\w+){0,3}[-\s]+(?:lobed|lobate|lobes))\b/i.test(clause)).join("; ")
      : traits.extra ?? "";
    const fields = [traits[part], ...(part === "feet" || /\b(?:bill|beak|mandibles?)\b/i.test(extra) ? [extra] : [])];
    return fields.some((field) => {
      const matches = field.matchAll(new RegExp(term.source, "gi"));
      return Array.from(matches).some((match) => {
        const before = field.slice(0, match.index).split(/[.;,\n]/).at(-1) ?? "";
        return !/\b(?:not|no|without|non|instead of)(?:[-\s]+\w+){0,3}[-\s]*$/i.test(before);
      });
    });
  }).map(({ id }) => id);
}

export function anatomyGuidance(traits: BirdTraits): string {
  const requested = new Set(requestedAnatomyFeatures(traits));
  const meanings = definitions
    .filter(({ id }) => requested.has(id))
    .map(({ meaning }) => meaning);
  if (!meanings.length) return "";
  return `ANATOMY DEFINITIONS FOR TERMS IN THE SELECTED TRAITS:
${meanings.join("\n")}
These are vocabulary definitions, not additional traits. Apply only the features the user positively requested; respect negations, explicit toe counts, curvature and other custom qualifications over a generic term. Keep all unrelated parts unchanged. For any other unfamiliar anatomy term, spell out its physical structure rather than substituting common anatomy or a familiar species.`;
}
