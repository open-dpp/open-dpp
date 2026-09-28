---
"@open-dpp/client": patch
---

Signing in with email and password while a Trusted Client waits for the OAuth Provider sends the browser to the Trusted Client once again. It went there twice with the same single-use code, so the second code exchange failed and the User saw the Trusted Client's sign-in error.
