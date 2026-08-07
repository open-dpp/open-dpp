---
"@open-dpp/client": patch
---

Fix blank page when entering an invalid hex value in the organization primary color field. The color palette now falls back to the default color for invalid input, the field shows an inline validation error, and saving is blocked until a valid hex color is entered.
