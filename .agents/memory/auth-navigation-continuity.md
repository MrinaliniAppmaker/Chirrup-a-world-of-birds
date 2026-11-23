---
name: Authentication navigation continuity
description: Preserve mounted navigation while adopting a guest creation after sign-in
---
Do not temporarily render an empty app shell while waiting for account-specific
draft cleanup or handoff after authentication.

**Why:** A readiness gate that removed navigation during successful OTP
finalization left a permanently blank Home screen despite a valid session.
Reloading restored the session but lost the in-memory creation. Keeping
navigation mounted removed the blank screen, and browser checks verified both
the header-Home and bottom-Home guest sign-in journeys.

**How to apply:** Isolate private account data without interrupting the router's
authentication navigation callback. A generated guest bird may be claimed by
the first signed-in account; preserve that one-time handoff even if screen
initialization happens before parent authentication cleanup. Never carry a
signed-in account's draft into another account or back into a guest session.
