---
name: CHIRRUP product scope
description: User intent and boundaries for the bird-creation app
---
CHIRRUP turns the user's Figma bird generator into an actual mobile app. The user describes it as taking selected features and combining them into a bird, returning an image and descriptions including habitat and appearance.

**Why:** The user supplied an existing visual direction and asked for functioning mobile behavior, not a replacement concept or a static mockup.

**How to apply:** Preserve Chirrup's bird mark and keep feature selection and real generation central. Clearly distinguish invented birds from real species facts.

Use the exact tagline “A world of birds” in the Home subtitle and alongside the logo.

**Why:** The user said “field studio” did not fit the app and corrected the earlier “Welcome to the world of birds” wording.

**How to apply:** Keep the phrase standalone in both places; do not add a greeting or change the bird mark. Beside the logo, use uppercase with “A WORLD” on the first line and “OF BIRDS” on the second.

The user confirmed this two-line layout in their own preview after it was refreshed. Keep the approved line break rather than relying on the available width to wrap it.

One-time sign-in emails should show “Chirrup” as the sender, not “Bird Forge.”

**Why:** The user received an OTP from the old name and pointed out that it could confuse recipients.

**How to apply:** Check the sender display name in the managed authentication email settings. App logo text does not set this name, and the separate production settings should be verified rather than assuming publishing fixes it.

The user reported fixing the OTP email problem and asked to remove the temporary “Bird Forge” warning from the code screen. Keep the normal email-sent confirmation; do not reintroduce the warning without a new request.

Home, Create and Library are the bottom-bar destinations. Interactions remains a separate page reached from a Library button, not a fourth tab. Preserve the original Chirrup bird mark and anatomical illustrations.

**Why:** The user objected to merging Home with Create or Library and to the missing Interactions flow. They later clarified that Interactions should be reached from Library, not its own bottom tab.

**How to apply:** Consult the original Figma screens and asset exports before changing navigation or trait visuals. Mobile adaptation must not remove page boundaries or alter the meaning of illustrated choices.

Create normally starts a fresh bird when the user returns after leaving that page. Exception: an unsigned-in user's newly generated bird must survive Create → Home → Sign in → Create. The user confirmed that this exception works. During generation, use the Create icon rather than the Chirrup brand mark.

**Why:** The user requested a new creation session on reopening Create, but later explicitly exempted the Home/sign-in detour so signing in does not destroy the bird they just made. They disliked the Chirrup mark as the pre-image placeholder.

**How to apply:** Discard unsaved draft/result state on ordinary deliberate page exit, including late-arriving generation results, without deleting saved birds. Preserve a completed guest bird, its traits and unfinished name through the Home/sign-in detour; never transfer one signed-in account's draft to another. Error recovery is not a deliberate exit: retain the current route, selections, generated portrait and unfinished bird name when retrying a failed screen, and keep the signed-in session.

For the guest-bird detour, leaving sign-in should return directly to the generated bird, not leave the user on Home. Below the guest save/sign-in message, show “Don't worry: This bird won't fly away”.

**Why:** The user said people may not realize their generated bird is still waiting after signing in from Home.

**How to apply:** Restore the same image, traits and name after successful sign-in or closing sign-in without completing it. Do not save automatically or change ordinary sign-in and fresh-Create behavior when no guest bird is waiting.

Recovering from a screen error must not send an already signed-in user back to sign-in or discard the bird they were working on.

**Why:** The user reported recovery repeatedly returning to sign-in while they were creating a bird and explicitly asked for error prevention or return to their prior work.

**How to apply:** Prefer retrying the failed screen beneath the existing authentication providers instead of restarting the entire application. Preserve a session-scoped creation draft for recovery only; this must not change the intentional fresh-Create-on-navigation behavior or leak drafts between accounts. A previously generated portrait remains valid after retry even though the new request hook is idle; do not require another paid generation just to display it.

The library is intended to hold up to 100 saved birds.

**Why:** The user reported storage filling after very few birds and explicitly requested capacity for 100.

**How to apply:** Retain existing birds when improving storage, support the 100th save, and block additional saves clearly without deleting older birds.

Backend collections belong to signed-in accounts and contain saved journal birds only, not every generated bird. Existing per-installation journals must be preserved and securely transferred into the first account that claims them.

**Why:** The user initially requested storage per phone and explicitly chose “Saved journal birds.” They subsequently asked to change this individualization to accounts, with a profile photo/name beside the Home branding and a menu for viewing, renaming, and logging out.

**How to apply:** Keep journals and offline caches isolated between accounts; sign-out must hide, not delete, the account's birds. Preserve original portraits and notes during migration and prevent another account from claiming the same legacy collection. Do not automatically archive discarded or unnamed generations.

Cropping a profile picture is a draft step, not a save.

**Why:** The user explicitly requested a separate save action on actual phones rather than treating completion of cropping as saving their profile photo.

**How to apply:** Preview the chosen crop, upload only after “Save photo,” keep the existing avatar when cancelled, retain the draft after a failed upload, and confirm successful persistence. Apply this behavior to both profile-photo entry points.

Your Profile should show the saved-library count as “x birds in library”; tapping it reveals small square portraits and names. Bird sharing must be reachable from both Your Profile and Library.

**Why:** The user explicitly requested the count, expandable small-photo list (roughly one tenth of the shorter phone edge), and both sharing entry points.

**How to apply:** Count saved birds, not discarded generations. Preserve the compact photo/name presentation and access to the existing journal entries.

The requested account direction is email one-time-code authentication, including delivery to Gmail addresses, rather than asking users for a password.

**Why:** After asking for a shorter password minimum, the user explicitly superseded that request with “remove the password and replace by OTP to the gmail account given.”

**How to apply:** Preserve existing account identities and journals when changing login methods. Check sign-in and new-account registration requirements separately: an enabled email-code first factor does not mean password-free registration is enabled. Keeping a required registration password is a temporary provider-policy limitation, not the user's approved final design. Never simulate passwordless registration by secretly assigning users random passwords to bypass the configured policy.

Sharing between Chirrup accounts should use an emailed link that the recipient can click or copy to add the selected birds to their own library. Allow multiple birds to be selected for the same email/link.

**Why:** The user clarified “Send to another Chirrup account via gmail,” specified an email button or copyable download link rather than simply emailing a photograph, and subsequently requested multi-bird selection.

**How to apply:** Preserve each bird’s original portrait and traits in an independent recipient copy. Email composition is user-reviewed; never send email automatically on the user’s behalf or move/delete the sender’s birds as part of sharing.

Pasting a bird-sharing link and pressing “Open shared bird” should add its bird or selection directly to the signed-in recipient's library, not require another preview-and-add step.

**Why:** The user tested sharing, reported failure and clarified that the bottom link field and button should directly put the shared bird into the library.

**How to apply:** Keep source birds intact, support both single and multi-bird links, retain the pasted text on an error, and require the recipient's account before storing private library copies.

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

Newly generated birds have an “Interact bird” shortcut, including before they are named or saved.

**Why:** The user requested the button under a newly created bird. Requiring or automatically performing a journal save would change that request and the separately defined saved-birds-only collection rule.

**How to apply:** Hand the current portrait and traits into the interaction picker and preselect the new bird without writing it to the journal or placing image data in URLs. Scope the temporary handoff to the current account or guest. This is an intentional exception to discarding the generated result on leaving Create; the next Create visit still starts fresh.

Encounters may include realistic predation and death; survival is not guaranteed. Saved portraits preserve appearance, not starting pose or position.

**Why:** The user explicitly asked for realistic predator-prey outcomes and reported that interaction images were keeping birds fixed in their portrait positions.

**How to apply:** Let diet, anatomy and circumstances determine outcomes without forcing kills or universal escapes. Keep condition and movement continuous, and let image references change pose and composition freely without changing identity. Encounter deaths do not delete saved birds.

Prey–prey encounters must stay nonfatal. Predator–prey encounters may be fatal when biologically likely; predator–predator encounters should be nonfatal most of the time.

**Why:** The user explicitly distinguished these three cases rather than requesting indiscriminate dramatic deaths.

**How to apply:** Assess predation from diet and circumstances, not a bird's chosen name or a raptor-shaped bill alone. Insect eating does not imply the ability to hunt another participating bird.

Extra features must remain genuine bird features, even though combinations may be imaginary. Non-avian appendages and magical or mechanical features should produce an error instead of a chimera.

**Why:** The user reported that “elephant trunk, catlike ears, and butterfly wings” was accepted and identified this as a major generation error.

**How to apply:** Check both “Type your traits” and “More traits” before opening Review, not only after asking to generate. The user explicitly requested earlier errors and highlighting the offending typed features so they can edit them. Identify the field and exact offending words, preserve all entered text, and never silently remove features. Preserve rare avian anatomy, unusual feather colors, feathered ear tufts, and contradictory combinations of valid bird traits.

Highlight invalid words inside the original editable text box, not in a duplicated copy beneath it.

**Why:** The user explicitly corrected the first implementation: the highlighting belonged “in the text box, not the error message.”

**How to apply:** Keep the real input, plain text, caret and selection intact. Any decorative word-highlighting layer must be noninteractive, hidden from accessibility, clipped to the text area and synchronized with its scroll position. Helper text may explain the error but must not repeat the input as a highlighted example.

Do not display the “6 of 6 traits” counter on Create.

**Why:** The user explicitly requested its removal because it took up space without a purpose.

**How to apply:** Keep the completeness requirement for continuing, but do not reintroduce the numeric trait-count badge.

Legs and Feet choices should scroll with their underside scrollbars, without large side arrows.

**Why:** The user explicitly rejected the large arrow controls after trying them.

**How to apply:** Retain easy horizontal swiping and scroll indicators rather than reintroducing large previous/next buttons.

Feet illustrations must be detailed side-view silhouettes, comparable to the other bird drawings in Create.

**Why:** The user rejected the first feet diagrams for their overhead angle and schematic level of detail, explicitly asking for side views and detailed silhouettes.

**How to apply:** Focus on the foot; at most a short natural ankle stub is allowed, never a long leg. Give each type genuinely distinct, natural contours: slender perching toes, a broad webbed paddle, heavy hooked talons, opposed climbing toes, and individually lobed swimming toes. Use real anatomical references and organic continuous contours. The user explicitly rejected segmented worm-like toes; do not substitute top-down toe-count symbols, a symmetric climbing-foot X, stick diagrams, or the same generic foot with minor variations.
