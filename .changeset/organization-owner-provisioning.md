---
"@open-dpp/dto": minor
"@open-dpp/api-client": minor
"@open-dpp/main": minor
---

`POST /organizations` can create an organization together with its owner in one call (instance admins only).

- New optional `owner` in the body: `{ email, firstName?, lastName?, locale }`. The user is looked up by email (lowercased) or created like `POST /users` with a random password; it becomes the organization's only owner and the calling admin is not a member. A non-admin sending `owner` gets 403. Admin API keys are accepted.
- In that case the response carries `provisioning: { owner: { id, email, created }, emailSent }` (`OrganizationCreateResponseDto`, also returned by `@open-dpp/api-client` `organizations.post`). Without `owner` nothing changes.
- Mails, in English and German: new and unverified owners get "Start using open-dpp" with a password link valid for one hour plus the verification mail; verified owners get "Your organization <name> is ready" linking to the organization's passports.
- The standard verification mail is now localized as well: users with `preferredLanguage` "de" get "E-Mail-Adresse bestätigen".
- If the organization cannot be created after a new user was created, the user is removed again and the request fails with 500. Mail failures are logged and reported as `emailSent: false`.
