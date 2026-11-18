---
name: App Storage sidecar compatibility
description: Storage SDK compatibility with Replit's externally authenticated, bucket-scoped connection
---
Keep the storage SDK compatible with Replit's standard sidecar authentication rather than inventing a Google project ID.

**Why:** On 2026-11-18, Storage SDK 9 required project-ID discovery even for bucket-scoped metadata reads. The standard sidecar configuration intentionally has no project ID; signing and direct uploads worked, but image validation and cleanup failed. The latest SDK 7 patch worked with the unchanged Replit client configuration.

**How to apply:** Before changing storage SDK major versions, verify actual metadata reads, partial image reads, and deletion—not just presigned uploads. Retain the compatible major until Replit's prescribed connection setup supports the newer transport. Do not change authentication endpoints or expose credentials while debugging.
