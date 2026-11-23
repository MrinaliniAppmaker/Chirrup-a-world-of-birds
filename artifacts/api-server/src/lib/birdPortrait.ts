import { batchProcess } from "@workspace/integrations-openai-ai-server/batch";
import { ai } from "@workspace/integrations-gemini-ai/image";
import { Modality, type GenerateContentParameters } from "@google/genai";
import { createPortrait, type BirdTraits } from "./birdDesign";
import { portraitParts, portraitSystemInstruction } from "./anatomyGuides";
import { cootFootReference } from "./cootFootReference";
import type { Part } from "@google/genai";

export function portraitRequest(traits: BirdTraits, cootPhoto?: Part) {
  return {
    model: "gemini-2.5-flash-image",
    contents: [{ role: "user", parts: portraitParts(traits, cootPhoto) }],
    config: {
      systemInstruction: portraitSystemInstruction,
      responseModalities: [Modality.TEXT, Modality.IMAGE],
      imageConfig: { aspectRatio: "1:1" },
    },
  } satisfies GenerateContentParameters;
}

export async function generateBirdPortrait(traits: BirdTraits): Promise<string> {
  const cootPhoto = await cootFootReference(traits);
  // Retain backoff for provider rate limits only, not trait-based rejection.
  const [portrait] = await batchProcess([traits], (input) =>
    createPortrait(input, async () => {
      const response = await ai.models.generateContent(portraitRequest(input, cootPhoto));
      const image = response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData;
      if (!image?.data) throw new Error("Image provider returned no portrait");
      return { b64_json: image.data, mimeType: image.mimeType || "image/png" };
    }), { concurrency: 1, retries: 1 });
  if (!portrait) throw new Error("Image provider returned no portrait");
  return portrait;
}
