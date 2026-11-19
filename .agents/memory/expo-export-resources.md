---
name: Expo verification resource limits
description: Avoid simultaneous heavy verification jobs that have coincided with workspace disconnections
---
Prefer serial verification in this workspace: native JavaScript export with one worker, then type checking, rather than running exports, type checking and browser tests together.

**Why:** Heavy export runs have coincided with `SERVER unexpectedly disconnected` and managed services stopping, including a one-worker export run alongside type checking and browser testing. Resource pressure is suspected, not proven; a successful export does not mean a disconnected parallel check passed.

**How to apply:** Reuse still-valid checks, keep export workers at one, run remaining checks sequentially, and restore any managed service stopped by the interruption. Do not interpret a container disconnection as an application-code exception or rewrite auth in response.
