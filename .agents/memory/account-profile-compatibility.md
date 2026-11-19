---
name: Account profile compatibility
description: Why CHIRRUP renaming uses a narrowly scoped authenticated server action instead of Clerk's frontend name update
---
The managed Clerk instance rejects frontend `firstName` updates with `form_param_unknown`, even though the Expo SDK exposes the property and the server-side user update accepts it. Do not assume a typed frontend profile field is enabled by the instance.

**Why:** A live mobile-preview check found Rename failed with HTTP 422 while a server-side update of the same test user's name succeeded. The account's normal sign-in, photo upload, and session handling worked.

**How to apply:** Keep profile-name updates authenticated and narrowly allowlisted to the verified session's own display name. Do not accept an arbitrary user ID or general provider-update payload. Refresh the client user after a successful change. Avoid adding frontend name parameters to sign-up without first verifying instance support.
