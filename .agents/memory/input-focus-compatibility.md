---
name: Text-input focus across native and web
description: Submit and blur behavior differs between the installed native and browser text inputs
---
Do not assume a native text-input focus setting has equivalent behavior in the browser preview.

**Why:** Browser verification found that single-line Enter still blurred an input when configured only through native `submitBehavior`. The installed React Native Web implementation reads the legacy `blurOnSubmit` flag instead.

**How to apply:** Keep both native and browser focus semantics covered when changing form controls. Single-line submission should not automatically blur; multiline Enter should still insert a newline. Check intentional focus changes rather than forcing focus back after every blur, which would trap keyboard users.

Across every typing field, an unrequested blur is not the user's permission to finish editing or collapse a name editor. Conditional recovery of unsolicited focus loss is intentional; do not replace it with unconditional refocusing.

**Why:** The user repeatedly reported a roughly half-second loss of selection across naming, typed traits, extra traits and sharing, with lost work, and explicitly required selection to continue until they click elsewhere. Programmatic screen or dialog focus changes are not equivalent to such a click.

**How to apply:** Preserve value and caret during unsolicited blur recovery. Accept real outside taps, moving to another field, keyboard navigation, unmounts and application backgrounding. Bound immediate recovery loops without permanently exhausting recovery for the rest of a long edit. Do not finalize a name merely because focus was lost unexpectedly. When a wrapper substitutes DOM inputs for native controls, preserve ref-based focus and submit behavior as well as appearance.

One passing focus test does not disprove intermittent browser or mobile keyboard problems.

**Why:** The user continued reporting brief focus loss across naming, extra traits and other typed fields after earlier desktop checks could not reproduce it, and confirmed the affected environment was the Chrome browser preview.

**How to apply:** Cover touch input, idle pauses, viewport changes, input zoom, cursor edits and deliberate dismissal. Do not treat Safari's small-font zoom as a proven explanation for the reported Chrome fault. Browser name alone does not establish device or engine, since Chrome on iOS differs from desktop/Android Chrome. Report browser emulation and native bundle checks separately from physical-device verification; never promise every phone has been tested.

Focus retention and caret stability are separate requirements.

**Why:** Testing once caught text being inserted at the beginning after a pause even though the same field remained focused and emitted no blur/focus event. Immediate replays did not reproduce it, so focus-only checks are insufficient and the original cause was not conclusively established.

**How to apply:** Check exact resulting text and selection position across pauses and parent rerenders, not just the active element. Avoid redundant value writes during an active browser edit while preserving explicit parent resets/prefills. Do not describe an intermittent caret issue as conclusively solved solely because a few replays pass.

A focused-looking border is not proof that an input accepts keyboard editing.

**Why:** After earlier focus repairs, the user explicitly reported that fields appeared selected but could not be typed into, and requested a complete fix rather than stronger apparent selection.

**How to apply:** Verify actual keyboard characters, deletion, paste and the value used by the form, not just styling, focus APIs or scripted filling. Reflect real blur in styling and do not let focus recovery compete with another editable control. Keep error highlights separate from the editable control so feedback cannot intercept typing.

Inspect actual read-only/disabled state before adding focus recovery. [A cancelled Google popup](browser-oauth-cancellation.md) left shared provider loading stuck and disabled otherwise correctly focused email fields.

Do not diagnose missing characters solely from an immediate React fiber snapshot.

**Why:** An input's inspected prop once appeared one character behind its DOM value immediately after typing. A settled read through the committed root matched the complete text. The original snapshot did not establish actual data loss; it could have observed an alternate fiber or an unfinished commit.

**How to apply:** Prefer checking the actual review/submission value. If internal inspection is necessary, locate the component through the root's current tree and allow the update to commit before comparing it with the DOM. Keep a transient diagnostic observation separate from a verified user-visible failure.

Adding a platform-specific input file can require one Metro restart before browser imports resolve to it.

**Why:** The running browser bundle kept resolving the base input after the web-specific counterpart was added. A single Expo workflow restart made it resolve the intended browser control; ordinary hot reload alone had not.

**How to apply:** When adding a new platform sibling, verify which implementation the actual bundle uses. Restart once if it remains cached; do not restart routinely for edits to an already-resolved file.
