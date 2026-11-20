import { z } from "zod";
import { createHash } from "node:crypto";
import { openai } from "@workspace/integrations-openai-ai-server";
import type { BirdTraits } from "./birdDesign";
import { birdTraitValidationPrompt, type TraitDecision } from "./birdTraitValidation";

// Reuse a successful pre-review check at generation, avoiding a second model
// decision on the exact same features. Bounded, short-lived, no stored trait text.
const approved = new Map<string, number>();

export async function classifyBirdTraits(input: BirdTraits) {
  const key = createHash("sha256").update(JSON.stringify(input)).digest("hex");
  if ((approved.get(key) ?? 0) > Date.now()) return { valid: true, invalidFeatures: [], issues: [] };
  const completion = await openai.chat.completions.create({
    model: "gpt-5.4-mini",
    max_completion_tokens: 2048,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "bird_trait_validation", strict: true,
        schema: {
          type: "object", additionalProperties: false,
          required: ["valid", "invalidFeatures", "issues"],
          properties: {
            valid: { type: "boolean" },
            invalidFeatures: { type: "array", maxItems: 12, items: { type: "string", minLength: 1, maxLength: 150 } },
            issues: { type: "array", maxItems: 12, items: {
              type: "object", additionalProperties: false, required: ["field", "feature"],
              properties: {
                field: { type: "string", enum: ["body", "beak", "colors", "feathers", "legs", "feet", "extra"] },
                feature: { type: "string", minLength: 1, maxLength: 500 },
              },
            } },
          },
        },
      },
    },
    messages: [
      { role: "system", content: birdTraitValidationPrompt },
      { role: "user", content: JSON.stringify(input) },
    ],
  }, { timeout: 30000 });
  const decision: TraitDecision = z.object({
    valid: z.boolean(), invalidFeatures: z.array(z.string().min(1).max(150)).max(12),
    issues: z.array(z.object({
      field: z.enum(["body", "beak", "colors", "feathers", "legs", "feet", "extra"]),
      feature: z.string().min(1).max(500),
    })).max(12),
  })
    .parse(JSON.parse(completion.choices[0]?.message?.content ?? "{}"));
  if (decision.valid && !decision.invalidFeatures.length && !decision.issues?.length) {
    for (const [entry, expires] of approved) if (expires <= Date.now()) approved.delete(entry);
    if (approved.size >= 100) approved.delete(approved.keys().next().value!);
    approved.set(key, Date.now() + 5 * 60_000);
  } else if (!decision.issues?.length) {
    throw new Error("Trait classifier rejected features without identifying their fields");
  }
  return decision;
}
