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
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
        systemInstruction: "Edit the supplied bird identity references into a shared action photograph. Identity preservation has priority over species conventions, stylistic harmonization or convenient composition. Each numbered bird remains the same individual with its own exact markings and anatomy; do not blend, redesign or swap participants. Change pose and setting, not identity. Reference labels are identifiers only and must not appear in the photograph.",
      },
    });
    const image = response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData;
    if (!image?.data) throw new Error("Encounter image was empty");
    return `data:${image.mimeType || "image/png"};base64,${image.data}`;
  }, { concurrency: 1, retries: 1 });
  if (!portrait) throw new Error("Encounter image was empty");
  return portrait;
}
