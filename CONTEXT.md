# open-dpp — Domain Language

Glossary of terms specific to open-dpp. Definitions describe what each term _is_, not how it is implemented. Currently covers identity / account management and passport media; extend as other areas are resolved.

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

## Passport & Media

**Permalink**:
A public address under which a passport is presented. A passport can have several, and deleting one withdraws that address without touching the passport.

**Permalink-gated Media**:
A passport's media as the public can reach it: only through one of that passport's Permalinks, so access ends when the Permalink is deleted or the passport is unpublished. A Member of the owning Organization can reach a draft's media the same way.
_Not to be confused with_: a Member's own media access inside the Organization, which needs no Permalink.

**Referenced Media**:
A media item a passport points at, as the value of a File element or as a default thumbnail of one of its shells. Only Referenced Media that the passport's Organization owns is reachable through the passport's Permalinks; a pointer at another Organization's media resolves to nothing.
_Avoid_: attached file, linked media.

**Organization Logo**:
The one media item an Organization designates in its branding. It is the only media an Organization exposes to the public on its own, without a Permalink.
_Not to be confused with_: the instance logo (the deployment's default branding shown when an Organization has none).
