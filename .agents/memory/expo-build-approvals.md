---
name: Expo build approvals
description: Handle usage-budget previews and chat approval without invalidating confirmation tokens
---
Expo usage-budget confirmations bind the confirmation mode as well as the usage limits.

**Why:** A default-mode preview reported that native confirmation was unavailable. After the user approved its limits in chat, switching to conversation mode caused Expo to reject the confirmation and issue a new preview requiring fresh approval. No budget or build was created.

**How to apply:** Follow the integration's allowed confirmation modes. If the tool permits recovery from unavailable native confirmation, obtain the conversation-mode preview before asking the user to approve it. After approval, resubmit the same limits and mode with that preview's token. A refreshed preview requires fresh approval even if the numeric limits are unchanged. Never store confirmation tokens in project memory or bypass a rejected confirmation.
