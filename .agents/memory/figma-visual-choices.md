---
name: Figma visual choice sources
description: Which layers represent the user's updated body and beak options
---
Use the visible artwork in the selected Body shape popup, Beak popup, and Refine Beak Silhouettes screens, not their older underlying vector layers.

**Why:** The body and beak popups contain updated raster overlays above hidden legacy vectors. Exported underlying SVGs can therefore disagree with the design the user actually selected.

**How to apply:** Compare imported artwork against the rendered screen before replacing trait illustrations. The specialist waterbird screen is a code layer whose exported frame clips lower options; do not invent missing silhouettes or treat resource-link filenames as downloaded artwork.
