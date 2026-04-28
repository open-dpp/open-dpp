---
"@open-dpp/api-client": patch
"@open-dpp/permission": patch
"@open-dpp/exception": patch
"@open-dpp/testing": patch
"@open-dpp/dto": patch
"@open-dpp/env": patch
"@open-dpp/client": patch
"@open-dpp/main": patch
"e2e": patch
"@open-dpp/docs": patch
---

Add instance setting OPEN_DPP_INSTANCE_ORGANIZATION_CREATION_ENABLED. If it is disabled only administrators are allowed to add new organizations. In addition the list of pending invitations are shown for new registered users and also within the profile view. Furthermore, the routing flow for users without organization has been corrected.
