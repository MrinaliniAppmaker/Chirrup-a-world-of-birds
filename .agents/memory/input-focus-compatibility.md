---
name: Text-input focus across native and web
description: Submit and blur behavior differs between the installed native and browser text inputs
---
Do not assume a native text-input focus setting has equivalent behavior in the browser preview.

**Why:** Browser verification found that single-line Enter still blurred an input when configured only through native `submitBehavior`. The installed React Native Web implementation reads the legacy `blurOnSubmit` flag instead.

**How to apply:** Keep both native and browser focus semantics covered when changing form controls. Single-line submission should not automatically blur; multiline Enter should still insert a newline. Check intentional focus changes rather than forcing focus back after every blur, which would trap keyboard users.

Desktop focus tests that pass do not disprove intermittent mobile keyboard problems.

**Why:** The user continued reporting brief focus loss across naming, extra traits and other typed fields after earlier desktop checks could not reproduce it.

**How to apply:** Cover touch input, idle pauses, viewport changes, input zoom, cursor edits and deliberate dismissal. Report browser emulation and native bundle checks separately from physical-device verification; never promise every phone has been tested.

Adding a platform-specific input file can require one Metro restart before browser imports resolve to it.

**Why:** The running browser bundle kept resolving the base input after the web-specific counterpart was added. A single Expo workflow restart made it resolve the intended browser control; ordinary hot reload alone had not.

**How to apply:** When adding a new platform sibling, verify which implementation the actual bundle uses. Restart once if it remains cached; do not restart routinely for edits to an already-resolved file.
