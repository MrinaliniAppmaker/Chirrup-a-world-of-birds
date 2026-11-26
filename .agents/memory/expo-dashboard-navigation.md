---
name: Expo dashboard navigation
description: Avoid repeating incorrect instructions when locating an existing Expo project identifier
---
Do not assume the Expo project UUID is visible in Settings → General.

**Why:** The user explicitly reported that this page did not show an ID after repeated linking instructions. A subsequently fetched dashboard screenshot guide showed a top-right **Details** button on the project page and an **ID** field in the resulting Project details panel. The user subsequently supplied the requested UUID in response to these alternate directions.

**How to apply:** Check the existing project's overview for Details, or verify the current authenticated UI. Treat menu labels as potentially stale, not universal facts. Request only the project identifier, never an access token or signing secret. Do not create a replacement project when an existing project's ID is difficult to locate.
