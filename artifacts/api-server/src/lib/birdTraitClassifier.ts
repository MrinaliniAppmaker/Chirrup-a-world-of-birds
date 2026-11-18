import { z } from "zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import type { BirdTraits } from "./birdDesign";
import { birdTraitValidationPrompt } from "./birdTraitValidation";

export async function classifyBirdTraits(input: BirdTraits) {
  const completion = await openai.chat.completions.create({
    model: "gpt-5.4-mini",
    max_completion_tokens: 2048,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "bird_trait_validation", strict: true,
        schema: {
          type: "object", additionalProperties: false,
          required: ["valid", "invalidFeatures"],
          properties: {
            valid: { type: "boolean" },
            invalidFeatures: { type: "array", maxItems: 12, items: { type: "string", minLength: 1, maxLength: 150 } },
          },
        },
      },
    },
    messages: [
      { role: "system", content: birdTraitValidationPrompt },
      { role: "user", content: JSON.stringify(input) },
    ],
  }, { timeout: 30000 });
  return z.object({ valid: z.boolean(), invalidFeatures: z.array(z.string().min(1).max(150)).max(12) })
    .parse(JSON.parse(completion.choices[0]?.message?.content ?? "{}"));
}
