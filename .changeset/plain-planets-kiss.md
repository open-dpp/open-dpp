---
"@open-dpp/api-client": patch
"@open-dpp/permission": patch
"@open-dpp/exception": patch
"@open-dpp/testing": patch
"@open-dpp/dto": patch
"@open-dpp/env": patch
"@open-dpp/client": patch
"@open-dpp/main": patch
"@open-dpp/docs": patch
---

Add guest access for external verified users such as repairers. Organization owners invite a person by email and assign a guest role (Repairer, Recycler, Market Surveillance Authority, Supplier). The invitation is accepted explicitly after sign-in or sign-up with the invited address. A guest is not a member: they can only read, via the presentation view of a passport, the fields that the template's access rules allow for their role, and only after the owner has granted access. Owners manage guests (invite, change role, revoke) in the new organization guests view, and guests are notified by email about invitations, role changes and revocations. The shared subject role hierarchy now lives in `@open-dpp/permission`.
