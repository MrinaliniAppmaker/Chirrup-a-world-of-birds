import type { Part } from "@google/genai";
import type { BirdTraits } from "./birdDesign";
import { requestedAnatomyFeatures } from "./anatomyGuidance";
import { portraitReadUrl } from "./journalPortraits";

// Fixed application asset, not a URL or storage path supplied by a user.
// Source/licensing and crop coordinates: docs/anatomy-references.md.
export const COOT_FOOT_REFERENCE_PATH = "anatomy-references/coot-feet-shyamal-crop.png";
let cached: Promise<Part> | undefined;

async function readCootFoot(): Promise<Part> {
  const response = await fetch(await portraitReadUrl(COOT_FOOT_REFERENCE_PATH), {
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error("The coot-foot anatomy reference could not be loaded.");
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > 2 * 1024 * 1024 ||
      !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    throw new Error("The coot-foot anatomy reference could not be read.");
  }
  return { inlineData: { mimeType: "image/png", data: bytes.toString("base64") } };
}

export async function cootFootReference(
  traits: BirdTraits,
  load: () => Promise<Part> = () => {
    if (!cached) cached = readCootFoot().catch((error) => { cached = undefined; throw error; });
    return cached;
  },
): Promise<Part | undefined> {
  return requestedAnatomyFeatures(traits).includes("lobed") ? load() : undefined;
}
