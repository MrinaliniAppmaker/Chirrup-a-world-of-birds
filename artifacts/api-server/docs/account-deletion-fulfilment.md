# Account-deletion fulfilment

## User requests

Home and Profile link to an in-app deletion request screen. A signed-in user must
type `DELETE`. The server takes the account identity from verified authentication,
never from a posted email/user ID or a phone-journal token. Requests are
idempotent and cancellable until processing starts. Guests can still access the
public email instructions without signing in or installing the app.

An email request must be verified before an operator acts. Never request an OTP,
password or identity-document scan. An anonymous content report is not proof of
account ownership. Parent/guardian requests require an appropriate verification
process; this tool does not establish parental consent.

## Operator controls

```sh
pnpm --filter @workspace/api-server run accounts:delete --list
pnpm --filter @workspace/api-server run accounts:delete --preview REQUEST_UUID
```

Preview is read-only. Verify the request and its exact account before proceeding.
For an email-only request, first complete the support ownership verification,
then record it with `accounts:delete --record-verified-email EMAIL
--verified-request`. This requires exactly one account with that verified email;
it records a request, not a deletion. An email string alone is not verification.
Do not use fuzzy name matching or interpret an unverified message as ownership.

**The following command permanently removes an actual account. Do not use it for
routine testing. Confirm the request and retain only necessary support evidence.**

```sh
pnpm --filter @workspace/api-server run accounts:delete --execute REQUEST_UUID --confirm REQUEST_UUID --verified-request
```

The first execution:

1. Locks owned and previously claimed phone journals against further changes.
2. Revokes active sharing links.
3. Deletes the authentication user/profile through Clerk, revoking sessions.
4. Waits at least 20 minutes before purging portraits, allowing previously issued
   15-minute signed upload URLs to expire. The command prints when it can continue.

**Rerun the same confirmed command after that time. There is no hidden scheduler
and no automatic completion promise.** The next execution deletes private object
prefixes for the owned/claimed journals and then their database records, with
sharing records cascading. Original portrait paths in claimed phone journals are
included. Independent copies in other people's journals are not deleted.

Failures are resumable. If Clerk deletion fails, the account's journal remains
blocked and no journal data is purged. Only a confirmed `404` is treated as
"already deleted"; permission errors and outages are not ignored. If storage
cleanup fails, database records remain for the next attempt. Repeat execution
after completion is harmless.

After completion, the request drops the raw account ID and journal IDs. A
pseudonymous account hash and completion record remain to prevent still-valid
old tokens from recreating the deleted account's journal. Anonymous reports are
separate records and need their reference for a report-related privacy request.

This operation cannot remotely erase an offline phone's files or third-party
provider backups, request logs or legal retention. Uninstalling/clearing local
app data removes local caches; provider-specific retention still needs final
policy review. Do not claim zero retention or an exact backup-deletion deadline.

The command uses the configured server environment. It does not discover or
migrate production credentials/databases. Establish production operator access,
the review process and responsibility for the second pass before release.
