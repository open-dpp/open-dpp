---
"@open-dpp/dto": minor
"@open-dpp/main": minor
"@open-dpp/client": minor
---

Add total item count to organization-scoped paginated lists

Passport and template list endpoints now report a `total_count` in their
`paging_metadata`, computed with an index-backed `countDocuments` against the
same filter used for the page. The passport and template list views surface it
in the table footer ("Showing: 1 - 10 of 42"). The field is optional, so other
paginated endpoints keep their existing response shape.
