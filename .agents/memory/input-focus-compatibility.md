---
name: Text-input focus across native and web
description: Submit and blur behavior differs between the installed native and browser text inputs
---
Do not assume a native text-input focus setting has equivalent behavior in the browser preview.

**Why:** Browser verification found that single-line Enter still blurred an input when configured only through native `submitBehavior`. The installed React Native Web implementation reads the legacy `blurOnSubmit` flag instead.

**How to apply:** Keep both native and browser focus semantics covered when changing form controls. Single-line submission should not automatically blur; multiline Enter should still insert a newline. Check intentional focus changes rather than forcing focus back after every blur, which would trap keyboard users.
