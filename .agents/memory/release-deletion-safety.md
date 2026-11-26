---
name: Release deletion safety
description: Why account deletion currently requires verified operator handling and a delayed storage purge
---
Keep request submission separate from irreversible deletion during release preparation. An in-app request or support email is not permission to run destructive tests against a real account.

**Why:** CHIRRUP includes children as an intended audience, and support may receive guardian requests that need appropriate verification. The initial release preparation deliberately uses a verified operator process rather than pretending an email link, confirmation checkbox or anonymous report proves authority.

**How to apply:** Any replacement with automatic self-service deletion needs an explicit identity/guardian-verification decision and safe cancellation/retry semantics. Test destructive logic with synthetic journals and a mocked authentication deletion operation unless a genuinely disposable account has been explicitly authorised.

Revoking authentication does not revoke an already issued storage upload authorisation.

**Why:** A still-valid signed PUT can recreate a portrait after a premature purge; waiting on an existing journal writer can also consume part of an incorrectly measured delay.

**How to apply:** Measure any upload-expiry safety window from the actual write-blocking point, not the original request time. Include originally claimed phone journals without deleting independently imported recipient copies. Do not claim that server deletion remotely wipes an offline device or provider backups.
