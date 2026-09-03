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

## Conformance Review

**Conformance Review**:
The whole effort of assessing how far open-dpp enables an operator to meet the EU Digital Product Passport requirements: the law (ESPR, Batteries Regulation and their delegated/implementing acts) and the harmonised CEN/CENELEC JTC 24 standards. Produces the Conformance Matrix, Gaps and a re-validation playbook.
_Avoid_: compliance review, audit. The software cannot be "compliant"; only an operator can. The review states conformance status.

**Conformance Matrix**:
The living artifact of the Conformance Review: every Criterion with its latest Assessment, kept in the repo so it can be re-validated.

**Criterion**:
One requirement traced to exactly one standard and clause (or article and paragraph). The unit the matrix is assessed at.

**Assessment**:
One dated evaluation of one Criterion against one open-dpp version, with a status of Met, Partial, Gap or Not applicable, and evidence pointing into code, tests or docs.
_Not to be confused with_: the Conformance Review (the whole effort) or a Gap (an outcome of an Assessment).

**Gap**:
A Criterion whose latest Assessment is Partial or Gap. Every Gap is tracked as an issue linked from the Conformance Matrix.

**Re-validation**:
Running the Assessments again, for every Criterion or the ones a trigger touches, after a new version of a standard or a new release of open-dpp. Meant to be driven by an agent following a playbook.

## Privacy & Compliance

Vocabulary of the Privacy Review. Roles and data-subject categories are defined from the standpoint of whoever runs an Instance, since that party answers for the personal data it processes.

**Vendor**:
The party that produces and ships the open-dpp software. It answers for privacy by design and by default in the product and for documenting what the product does with personal data; it does not, by shipping software, become responsible for any Operator's data.
_Not to be confused with_: Operator (who runs it).

**Operator**:
The party that runs an Instance and is legally responsible for the personal data processed on it. An Operator may be the Vendor (for the hosted instance) or any third party self-hosting the software.

**Instance**:
One running deployment of open-dpp under one Operator, serving one or more Organizations.

**Organization** (in this section):
A tenant on an Instance. Everything an Organization enters — including passport content — is processed on its behalf by the Operator.

**Account Holder**:
A User seen as a data subject: the person whose sign-in, profile, session and activity data an Instance holds.
_Not to be confused with_: User (the identity concept above); Account Holder is the same person viewed through what is known about them.

**Invitee**:
A person identified only by an email address that an Organization has invited but who has not (yet) become a User.

**Passport Viewer**:
Anyone reading a published passport without signing in. Identified, if at all, only by technical connection data.

**Named Person**:
Any person whose data an Organization has entered into passport content or attachments — a contact, a signatory, a photographed worker. The Organization decides to enter it; the Instance makes it visible to Passport Viewers once published.
_Avoid_: "third party in the passport" (ambiguous with Vendor/Operator third parties).

**Chat User**:
Anyone, Account Holder or Passport Viewer, who converses with the AI assistant on a passport. Their messages leave the Instance for the AI provider.

**Privacy Review**:
The complete document set assessing open-dpp against the Trusted Site Data Privacy catalogue: processing overview, data flows, deletion concept, logging concept, technical and organizational measures, processor list, the Conformity Assessment, the findings register, and the re-validation plan. Produced in two separated parts: the product, and the hosted instance.

**Conformity Assessment**:
The spine of the Privacy Review: one row per catalogue criterion, mapping it to evidence, a status, and the artifact that owns the detail.

**Finding**:
One gap between a criterion and the evidence, with a severity and a disposition. A Finding is ticketed, not fixed, within the Privacy Review.

**Validation Run**:
One dated pass of the re-validation runbook against a stated commit, signed by a reviewer of record. Re-validation happens on demand.
