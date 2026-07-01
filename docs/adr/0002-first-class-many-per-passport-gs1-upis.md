# GS1 UPIs are first-class and many-per-passport

The feature exposes a UPI list where users create GS1 identities (GTIN + key qualifiers), and the identity conceptually belongs to the UPI, not the passport. We model GS1 UPIs as first-class, **many-per-passport** records (e.g. one per batch/serial), each owning its identity and referencing a passport, and replace the 1:1 `PUT/DELETE /passports/:id/gs1-identity` surface with a UPI-collection API. Each GS1 key remains globally unique.

## Consequences

- This changes the prior model where a distinct serialized key was a distinct **passport** → a distinct serialized key is now a distinct **UPI** under one passport.
- `findByReferenceIdAndType` (which assumed one GS1 row per passport) and the resolver's "passport's `permalink[0]`" assumption must change to per-UPI lookups.
- A UPI's identity still freezes with its referenced passport's publish state: create/edit/delete is allowed only while the passport is a draft.
