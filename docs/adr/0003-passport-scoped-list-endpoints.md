# Permalink & UPI lists are passport-scoped in the UI, org-scoped only via API

The backoffice surfaces a permalink list and a Unique Product Identifier (UPI) list. Originally both were **org-scoped** (`GET /permalinks`, `GET /unique-product-identifiers`) and reached from the sidebar. We move the **frontend** to **passport-scoped** lists: each list is reached from the passport's top-right dropdown and shows only that passport's rows. The org-scoped endpoints are **kept, but API-only** — the frontend no longer calls them. This leaves two list scopes per resource on purpose.

New passport-scoped endpoints, ownership-gated like the rest of the passport surface:

- `GET /passports/:id/permalinks` → the passport's presentation permalinks **and** its gs1-link permalinks (a union — see below).
- `GET /passports/:id/unique-product-identifiers` → the passport's `OPEN_DPP_UUID` + GS1 UPIs.

Both reuse the existing `_id`-cursor envelope (`{ paging_metadata, result }`) and DTOs. Per-passport pagination is justified because a passport may carry many GS1 UPIs (one per serial/batch) and a gs1-link permalink each.

## Considered Options

- **Re-scope the endpoints to passport-only (drop org-scoped).** Rejected: the org-scoped list + cursor pagination is a legitimate API-consumer surface (bulk/reporting). Deleting it would break external consumers for a UI-only change.
- **Keep the frontend org-scoped and filter by passport client-side.** Rejected: it was a `?passportId=` query + client-side filter over `PermalinkPublicDto`, but the public DTO carries no `passportId` (the server strips it), so the filter rendered empty in production. Server-side scoping is the correct fix.
- **Put the new routes on `PassportController`.** Partially rejected: the permalink route lives on `PermalinkController` (no controller prefix; already holds the assembly deps) and the UPI route on a small new controller in the UPI module (`@Controller("passports")`) — the existing `UniqueProductIdentifierController`'s prefix cannot express `/passports/:id/...`. This keeps each list's assembly logic in its own module.

## Consequences

- **Two list scopes coexist per resource.** A future reader will ask "why two `GET …permalinks`?" — the answer is: org-scoped = API consumers, passport-scoped = the UI.
- **The permalink passport list is a union, not a single query.** `permalinkRepository.findAllByPassportId` returns only presentation permalinks (it joins on the presentation configuration). gs1-link permalinks carry a null `presentationConfigurationId` and reference a UPI, so `findPageByPassportId` unions both in one aggregate: presentation via the config join + gs1-link via a `$lookup` to the UPI collection on `referenceId`.
- **Sidebar entries removed; dropdown relabeled.** The passport dropdown uses "Permalinks" / "Unique Product Identifiers" (`permalink.list.label` / `uniqueProductIdentifiers.label`). The old `permalink.settings.open` and `gs1.settings.open` strings are retired — "GS1 identity" collided with the CONTEXT.md glossary term when used as a list label.
