import { batchProcess } from "@workspace/integrations-openai-ai-server/batch";
import { generateImage } from "@workspace/integrations-gemini-ai/image";
import { createPortrait, type BirdTraits } from "./birdDesign";

export async function generateBirdPortrait(traits: BirdTraits): Promise<string> {
  // Retain backoff for provider rate limits only, not trait-based rejection.
  const [portrait] = await batchProcess([traits], (input) =>
    createPortrait(input, generateImage), { concurrency: 1, retries: 1 });
  if (!portrait) throw new Error("Image provider returned no portrait");
  return portrait;
}
