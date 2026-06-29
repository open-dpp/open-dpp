# open-dpp — Domain Language

Glossary of terms specific to open-dpp. Definitions describe what each term _is_, not how it is implemented. Currently focused on the identity / account-management area; extend as other areas are resolved.

## Identity & Account

**User**:
A person who can sign in. Distinct from the Organization(s) they belong to, from their Profile (their editable settings), and from their Account(s) (their links to authentication methods).
_Not to be confused with_: Account (a User's link to an authentication method) or Member (a User's link to an Organization).

**Account**:
A User's link to an authentication method, holding the secret for that method. Today a User authenticates with a password, so each has a single Account holding it; the concept also allows for additional methods (e.g. an external identity provider). The password on the Account is what a User re-enters to re-confirm their identity before a sensitive change (see Email Change Request).

**Profile**:
The User-editable subset of their own account: name and preferred language. Editing the email address is _not_ part of profile editing — it follows the Email Change flow.

**Email Change Request**:
A standing authorization for a User to move to a new email address. The change only completes while this authorization exists; removing it (see Revoke) prevents completion even if the verification link is clicked. At most one is outstanding per User.
_Avoid_: pending email, shadow row (implementation term).

**Pending Email Change**:
The user-facing state shown while an Email Change Request is outstanding — the target address and when it was requested.

**Revoke**:
Cancelling an outstanding Email Change Request so that completion is _guaranteed_ not to happen, even if the verification link is later clicked. Distinct from the verification token's natural expiry, which merely lets the request lapse on its own.
_Avoid_: cancel (used interchangeably in UI, but Revoke is the precise term for the guarantee).

**Preferred Language**:
The User's chosen UI language, persisted on the User and mirrored to the browser locale on load and on save.
