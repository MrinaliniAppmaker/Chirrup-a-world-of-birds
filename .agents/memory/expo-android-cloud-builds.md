---
name: Expo Android cloud builds
description: Distinguish the verified separate Expo-account Android build route from Replit Expo Launch
---
Distinguish Replit's built-in store-publishing capabilities from those of a separately connected Expo account.

**Why:** The connected Expo service successfully produced the app's first production Android App Bundle from GitHub after the owner configured signing and production variables. This succeeded without a local native build or an EAS CLI run by the agent, despite the generic Expo GitHub guide listing a previous platform build as a prerequisite.

**How to apply:** Inspect the currently connected service's documented capabilities rather than assuming all Android builds are unavailable because built-in Expo Launch is iOS-only. Preserve the existing package, project and signing identity. The connected route depends on account-side GitHub linkage, pushed source, production variables and signing credentials; it does not inherit them merely because Replit's hosted deployment works. Obtain the required usage approval and leave store submission disabled unless separately authorized. Do not treat a successful bundle build as device testing or all-ages compliance approval.
