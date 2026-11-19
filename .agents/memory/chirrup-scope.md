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

Backend collections belong to signed-in accounts and contain saved journal birds only, not every generated bird. Existing per-installation journals must be preserved and securely transferred into the first account that claims them.

**Why:** The user initially requested storage per phone and explicitly chose “Saved journal birds.” They subsequently asked to change this individualization to accounts, with a profile photo/name beside the Home branding and a menu for viewing, renaming, and logging out.

**How to apply:** Keep journals and offline caches isolated between accounts; sign-out must hide, not delete, the account's birds. Preserve original portraits and notes during migration and prevent another account from claiming the same legacy collection. Do not automatically archive discarded or unnamed generations.

Only users name their birds. The name field starts blank; generation must not invent or prefill names. The editor belongs below the generated photograph and becomes a single displayed name on deliberate blur, without a duplicate live heading.

**Why:** The user explicitly said users name their birds, moved the editor below the photo, and rejected showing the typed name twice.

**How to apply:** Keep model-generated common and scientific names out of newly generated birds. Preserve names already saved by users. Keep draft editing separate from the displayed name; deliberate blur finishes a nonempty name, and tapping the displayed unsaved name permits corrections.

Saving an unnamed bird should open a naming popup, not disable Save or show a permanent naming reminder underneath it.

**Why:** The user explicitly requested an actionable naming popup when saving an unnamed bird.

**How to apply:** Require a nonblank name before persistence, preserve the generated bird and entered name on cancellation or save failure, and close the popup only after a successful save.

Selected features are independent creative constraints, even when their combination does not occur in real avian families.

**Why:** The user likes the images but objects when the generator compensates selected anatomy to make a bird fit an existing avian category.

**How to apply:** Body categories constrain shape only. Prioritize every selected beak, foot, leg, color and feather trait over taxonomy or biological plausibility in both image and description prompts.

Anatomical realism means convincing materials and smooth, natural-looking attachment of the chosen parts, not a combination that exists in nature. Users may deliberately combine contradictory traits.

**Why:** The user explicitly clarified this distinction after reporting that webbed feet were replaced to fit a songbird body and raptor beak.

**How to apply:** Describe independently selected parts with concrete geometry. Keep the user's original trait data and free-form constraints intact; do not infer companion anatomy from a body or beak category.

Do not use automated visual rejection and quality-retry loops as the solution to trait fidelity.

**Why:** The user reported that this approach turned roughly 80% of attempts into generation errors and explicitly rejected it. Better generation instructions are required, not withholding most results.

**How to apply:** Improve the generation input itself. Genuine provider failures must still be reported, but do not reintroduce an AI trait judge that blocks portraits or silently regenerates them without discussing a different approach with the user.

A bird must remain the same recognizable individual across its journal portrait and interaction scenes.

**Why:** The user reported that birds' appearance varied greatly between the journal and other generated scenes.

**How to apply:** Use each participant's actual saved portrait as a separately bound visual identity reference, not just a fresh text-to-image recreation from trait categories. Preserve markings, palette distribution, beak, feet and proportions while changing pose and setting. Do not overwrite the original journal portrait or reintroduce a visual rejection loop.

User-chosen bird names are display labels, never visual or taxonomic instructions.

**Why:** The user reported that birds named "falcon" were becoming slim grey-and-white raptors in interactions despite their saved portraits.

**How to apply:** Keep names and user-derived identifiers out of all AI scene planning and image inputs. Use neutral participant labels throughout AI calls, restoring the exact user names only in the returned display text after image generation.

Text fields should retain focus while typing and scrolling, until the user deliberately changes focus.

**Why:** The user reported brief focus followed by deselection and asked for persistent selection across all typed fields.

**How to apply:** Avoid timer-based blur, state-dependent component identities or route cleanup triggered by form edits. Preserve multiline newlines, deliberate field changes and accessible keyboard navigation.

Encounters may include realistic predation and death; survival is not guaranteed. Saved portraits preserve appearance, not starting pose or position.

**Why:** The user explicitly asked for realistic predator-prey outcomes and reported that interaction images were keeping birds fixed in their portrait positions.

**How to apply:** Let diet, anatomy and circumstances determine outcomes without forcing kills or universal escapes. Keep condition and movement continuous, and let image references change pose and composition freely without changing identity. Encounter deaths do not delete saved birds.

Prey–prey encounters must stay nonfatal. Predator–prey encounters may be fatal when biologically likely; predator–predator encounters should be nonfatal most of the time.

**Why:** The user explicitly distinguished these three cases rather than requesting indiscriminate dramatic deaths.

**How to apply:** Assess predation from diet and circumstances, not a bird's chosen name or a raptor-shaped bill alone. Insect eating does not imply the ability to hunt another participating bird.

Extra features must remain genuine bird features, even though combinations may be imaginary. Non-avian appendages and magical or mechanical features should produce an error instead of a chimera.

**Why:** The user reported that “elephant trunk, catlike ears, and butterfly wings” was accepted and identified this as a major generation error.

**How to apply:** Reject non-bird anatomy before image generation without silently removing it. Preserve rare avian anatomy, unusual feather colors, feathered ear tufts, and contradictory combinations of valid bird traits.

Legs and Feet choices should scroll with their underside scrollbars, without large side arrows.

**Why:** The user explicitly rejected the large arrow controls after trying them.

**How to apply:** Retain easy horizontal swiping and scroll indicators rather than reintroducing large previous/next buttons.

Feet illustrations must be detailed side-view silhouettes, comparable to the other bird drawings in Create.

**Why:** The user rejected the first feet diagrams for their overhead angle and schematic level of detail, explicitly asking for side views and detailed silhouettes.

**How to apply:** Focus on the foot; at most a short natural ankle stub is allowed, never a long leg. Give each type genuinely distinct, natural contours: slender perching toes, a broad webbed paddle, heavy hooked talons, opposed climbing toes, and individually lobed swimming toes. Use real anatomical references and organic continuous contours. The user explicitly rejected segmented worm-like toes; do not substitute top-down toe-count symbols, a symmetric climbing-foot X, stick diagrams, or the same generic foot with minor variations.
