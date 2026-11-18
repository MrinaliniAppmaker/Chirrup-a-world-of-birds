---
name: Anatomy diagram portability
description: Verify toe geometry across native, browser, and portable SVG rendering.
---
Use explicit standard SVG transforms with rotation centers for anatomy drawings, and visually inspect every option rather than relying only on TypeScript or element counts.

**Why:** Rotation expressed through a separate origin property serialized into SVG that a portable renderer interpreted differently, leaving toe lobes detached from their toes. Type checking and path-count checks both passed.

**How to apply:** Keep rotation centers inside the SVG transform itself, such as `rotate(angle cx cy)`. Render all variants together to check toe count, direction, webbing and lobe attachment before shipping changes to anatomical artwork.
