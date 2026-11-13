import { Modality } from "@google/genai";
import type { EncounterBird } from "@workspace/api-zod";
import { ai } from "@workspace/integrations-gemini-ai/image";
import { batchProcess } from "@workspace/integrations-openai-ai-server/batch";
import { encounterParts } from "./encounterReference";

export async function generateEncounterPortrait(birds: EncounterBird[], setting: string, moment: string): Promise<string> {
  const parts = encounterParts(birds, setting, moment);
  const [portrait] = await batchProcess([parts], async (input) => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ role: "user", parts: input }],
      config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
    });
    const image = response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData;
    if (!image?.data) throw new Error("Encounter image was empty");
    return `data:${image.mimeType || "image/png"};base64,${image.data}`;
  }, { concurrency: 1, retries: 1 });
  if (!portrait) throw new Error("Encounter image was empty");
  return portrait;
}
