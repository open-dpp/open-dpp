---
"@open-dpp/api-client": minor
"@open-dpp/testing": minor
"@open-dpp/dto": minor
"@open-dpp/client": minor
"@open-dpp/main": minor
"@open-dpp/docs": minor
---

Templates and passports have a status (Draft, Published, Archived) now.

The following operations are possible:

- publish (Draft -> Published)
- archive (Draft -> Archived or Published -> Archived)
- restore (Archived -> Published or Archived -> Draft)

In addition, a user can delete templates/ passports with the status draft.
