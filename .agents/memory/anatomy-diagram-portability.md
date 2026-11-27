---
name: Anatomy diagram portability
description: Verify toe geometry across native, browser, and portable SVG rendering.
---
Use explicit standard SVG transforms with rotation centers for anatomy drawings, and visually inspect every option rather than relying only on TypeScript or element counts.

**Why:** Rotation expressed through a separate origin property serialized into SVG that a portable renderer interpreted differently, leaving toe lobes detached from their toes. Type checking and path-count checks both passed.

**How to apply:** Keep rotation centers inside the SVG transform itself, such as `rotate(angle cx cy)`. Render all variants together to check toe count, direction, webbing and lobe attachment before shipping changes to anatomical artwork.

Select reference views and portrait angles for the anatomical feature being constrained, not one universal camera angle.

**Why:** A pure side view can hide a spoonbill's sideways-widened tip even when the chosen trait is correctly passed to the image model. Side views remain useful for upward/downward shaft curvature.

**How to apply:** For spatulate bills, expose the bill's top surface and sideways tip width; keep toe-layout visibility and unrelated selected parts intact. Do not interpret passing prompt tests as proof of consistent generated-image accuracy.
