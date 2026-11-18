---
"@open-dpp/api-client": major
"@open-dpp/permission": major
"@open-dpp/exception": major
"@open-dpp/testing": major
"@open-dpp/dto": major
"@open-dpp/env": major
"@open-dpp/client": major
"@open-dpp/main": major
"@open-dpp/docs": major
---

- A template that is no longer a draft is read-only. A passport created from a published template after this change only allows overwriting data values (table rows can still be added and deleted). Existing passports keep their stored `Full` editing mode. Passports from draft templates or without a template stay fully editable.
- The last remaining row of a table (its header row) cannot be deleted; deleting a row while others remain is allowed, and the next row becomes the header. Rows cannot be added to a table without columns.
- Breaking: removed `PUT /templates/:id/passport-editing-mode` and `PUT /passports/:id/editing-mode`, the related DTOs and the api-client methods `setEditingMode` / `setPassportEditingMode`. The template field `passportEditingMode` is replaced by the derived `editingMode`.
- Client: published templates open in a read-only editor, restricted passports hide column actions, and table rows get a "Clear row values" action.
