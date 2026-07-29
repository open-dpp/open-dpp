---
"@open-dpp/client": minor
---

Add a multi-language description to data fields in the AAS editor. Every submodel
element (property, file, collection, list, submodel, shell) can now be given an
optional description alongside its display name, and the description is shown as
muted helper text under the field name in the presentation view. The display-name
editor was generalized into a reusable language-text array editor to back both
fields.
