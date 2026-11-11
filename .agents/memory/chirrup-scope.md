---
name: CHIRRUP product scope
description: User intent and boundaries for the bird-creation app
---
CHIRRUP turns the user's Figma bird generator into an actual mobile app. The user describes it as taking selected features and combining them into a bird, returning an image and descriptions including habitat and appearance.

**Why:** The user supplied an existing visual direction and asked for functioning mobile behavior, not a replacement concept or a static mockup.

**How to apply:** Preserve the field-studio identity while adapting to mobile. Keep feature selection and real generation central. Clearly distinguish invented birds from real species facts.

Home, Create and Library are the bottom-bar destinations. Interactions remains a separate page reached from a Library button, not a fourth tab. Preserve the original Chirrup bird mark and anatomical illustrations.

**Why:** The user objected to merging Home with Create or Library and to the missing Interactions flow. They later clarified that Interactions should be reached from Library, not its own bottom tab.

**How to apply:** Consult the original Figma screens and asset exports before changing navigation or trait visuals. Mobile adaptation must not remove page boundaries or alter the meaning of illustrated choices.

Create starts a fresh bird whenever the user returns after leaving that page. During generation, use the Create icon rather than the Chirrup brand mark.

**Why:** The user explicitly requested a new creation session on reopening Create, and disliked the Chirrup mark as the pre-image placeholder.

**How to apply:** Discard unsaved draft/result state on page exit, including late-arriving generation results, without deleting already saved birds.

The library is intended to hold up to 100 saved birds.

**Why:** The user reported storage filling after very few birds and explicitly requested capacity for 100.

**How to apply:** Retain existing birds when improving storage, support the 100th save, and block additional saves clearly without deleting older birds.

Only users name their birds. The name field starts blank; generation must not invent or prefill names.

**Why:** The user explicitly said the name bar should be blank as in the original prototype because users name the birds.

**How to apply:** Keep model-generated common and scientific names out of newly generated birds. Preserve names already saved by users.

Selected features are independent creative constraints, even when their combination does not occur in real avian families.

**Why:** The user likes the images but objects when the generator compensates selected anatomy to make a bird fit an existing avian category.

**How to apply:** Body categories constrain shape only. Prioritize every selected beak, foot, leg, color and feather trait over taxonomy or biological plausibility in both image and description prompts.
