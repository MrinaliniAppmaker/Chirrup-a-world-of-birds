import { batchProcess } from "@workspace/integrations-openai-ai-server/batch";
import { ai } from "@workspace/integrations-gemini-ai/image";
import { Modality } from "@google/genai";
import { createPortrait, type BirdTraits } from "./birdDesign";
import { portraitParts } from "./anatomyGuides";

export async function generateBirdPortrait(traits: BirdTraits): Promise<string> {
  // Retain backoff for provider rate limits only, not trait-based rejection.
  const [portrait] = await batchProcess([traits], (input) =>
    createPortrait(input, async () => {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [{ role: "user", parts: portraitParts(input) }],
        config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
      });
      const image = response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData;
      if (!image?.data) throw new Error("Image provider returned no portrait");
      return { b64_json: image.data, mimeType: image.mimeType || "image/png" };
    }), { concurrency: 1, retries: 1 });
  if (!portrait) throw new Error("Image provider returned no portrait");
  return portrait;
}
