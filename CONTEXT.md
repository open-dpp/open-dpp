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

## Organization & Membership

**Member**:
A User's link to an Organization, carrying a role within it — Owner or Member. A User can be a Member of several Organizations.
_Not to be confused with_: User (the person) or the "member" role (the non-Owner role a Member can hold).

**Owner**:
The privileged Member role of an Organization. Only Owners may change other Members' roles or remove Members.

**Member Removal**:
An Owner ending another User's membership in an Organization. Owners cannot be removed — they must first be demoted to the member role — and no one can remove their own membership this way. A removed Member immediately loses access to the Organization.
_Not to be confused with_: leaving an Organization (self-initiated, a separate concept) or cancelling an Invitation (which ends a pending invite, not a membership).

**Organization Slug**:
better-auth's internal alias of an Organization. It always equals the Organization's id — set at creation and backfilled for older Organizations — is never chosen by a User and never exposed by the API. Organization names therefore need not be unique.

**Provisioning**:
An instance admin creating an Organization together with its Owner in one call (`POST /organizations` with `owner`). The Owner is looked up by email or created; the admin is not a Member. The Owner is told per their state: an unverified User gets a welcome mail with a password link plus the verification mail, a verified User gets a "ready" mail. A User created this way is removed again if the Organization cannot be created, unless a concurrent Provisioning for the same email has already made it an Owner elsewhere.
_Not to be confused with_: an Invitation (which the invitee must accept) or sign-up (self-service).
