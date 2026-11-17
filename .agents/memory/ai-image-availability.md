---
name: AI image model availability
description: Difference between integration documentation and observed image API behavior
---
The OpenAI proxy rejected the documented `gpt-image-1` model as unavailable on 2026-11-09. Its models-list endpoint also returned 405. Gemini's documented flash image integration successfully returned a real bird portrait.

**Why:** The integration documentation did not match runtime availability; repeating the same documented model would leave the core feature broken.

**How to apply:** Treat live provider responses as authoritative. Use the working Gemini image integration unless availability is reverified. Do not assume image failure means credentials are wrong or expose environment values while diagnosing.

Correct anatomical wording in generated notes is not evidence that the portrait depicts it correctly.

**Why:** On 2026-11-16, live tests with zygodactyl feet and an upturned bill produced accurate text descriptions but downcurved bills and uncertain or ordinary toe arrangements, even with explicit geometry and stronger visual instructions.

**How to apply:** Distinguish prompt/terminology tests from visual verification. Do not claim rare anatomy is reliably fixed from passing text tests. Use structural visual guidance rather than a rejection/retry loop when wording alone fails, and verify toes separately from bill direction.

Anatomy guides should depict isolated part geometry, not complete real species. Supply only guides relevant to positively requested features, alongside the unchanged user trait data.

**Why:** The user approved visual anatomy guides after prompt-only failures. Whole-bird references risk restoring the species bias they explicitly rejected. A guided live example corrected upward bill direction, but overlapping toes were not conclusive evidence of exact toe fidelity.

**How to apply:** Keep guides monochrome and part-scoped, exclude negated or conflicting guide selections, and preserve the bird's chosen palette and unrelated anatomy. Saved journal portraits remain the identity references for interactions; do not replace them with generic anatomy diagrams.
