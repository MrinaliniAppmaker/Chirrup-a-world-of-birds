---
name: Live API generation safety
description: Why regenerating API helpers must not remove modules used by the running preview
---
Regenerating API helpers must keep the running app's imported modules available throughout the operation.

**Why:** A user-reported Home recovery-screen failure coincided with the generator cleaning its live output directory. Metro reported that an imported generated client module did not exist. This was a development-tooling failure, not evidence of corrupted birds or an invalid account.

**How to apply:** Generate complete replacements in staging, retain the previous working files if generation fails, and publish complete files without a delete-and-recreate interval. Preserve this guarantee when changing the API toolchain. Avoid changing account state, deleting user data, or weakening the screen error boundary to address missing development imports.
