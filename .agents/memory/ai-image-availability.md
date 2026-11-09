---
name: AI image model availability
description: Difference between integration documentation and observed image API behavior
---
The OpenAI proxy rejected the documented `gpt-image-1` model as unavailable on 2026-11-09. Its models-list endpoint also returned 405. Gemini's documented flash image integration successfully returned a real bird portrait.

**Why:** The integration documentation did not match runtime availability; repeating the same documented model would leave the core feature broken.

**How to apply:** Treat live provider responses as authoritative. Use the working Gemini image integration unless availability is reverified. Do not assume image failure means credentials are wrong or expose environment values while diagnosing.
