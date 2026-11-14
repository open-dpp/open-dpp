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

Add guest access for external verified users such as repairers. Organization owners invite a person by email and assign a guest role (Repairer, Recycler, Market Surveillance Authority, Independent Operator, Supplier). The invitation is accepted explicitly after sign-in or sign-up with the invited address. A guest is not a member: they can only read, via the presentation view of a passport, and only after the owner has granted access. A guest reads everything the public reads, plus the fields that the access rules allow for their role. Admins, owners, members and guests fall back to the rule of the public for objects without a rule of their own, so existing passports need no migration and new submodels no longer get a default rule per guest role. A guest-only field needs a Read rule for the guest role first, and then the public Read rule can be removed. A role's own rules win over the public rule, on the object and on its parents. Owners manage guests (invite, change role, revoke) in the new organization guests view, and guests are notified by email about invitations, role changes and revocations. The shared subject role hierarchy now lives in `@open-dpp/permission`.
