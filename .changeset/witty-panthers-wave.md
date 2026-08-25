---
"@open-dpp/main": minor
"@open-dpp/client": minor
"@open-dpp/api-client": minor
---

Organization owners can remove members. New `DELETE /organizations/members/:id` endpoint (owner-only, cross-organization guarded); owners and the acting user cannot be removed. Removing a member clears the organization from their sessions' active organization. The members list gains a remove button with a confirmation dialog.
