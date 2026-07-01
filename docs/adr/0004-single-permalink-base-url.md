# Permalink has a single base URL (GS1 resolver base folded in)

A permalink renders one of two URL shapes depending on kind — a presentation page (`base/{slug|id}`) and a GS1 Digital Link (`base/01/{gtin}/10/{batch}/21/{serial}`). ADR `0001-polymorphic-permalink` gave the GS1 Digital Link permalink **its own GS1 resolver base**: a second base-URL concept with a parallel three-level cascade (`permalink.gs1ResolverBase → branding.gs1ResolverBaseUrl → Gs1ResolverBaseUrl` instance setting). We fold that into the one base URL every permalink already has. A GS1 Digital Link's resolver base **is** the permalink's `baseUrl`, resolved through the same cascade as the presentation base (`permalink.baseUrl → branding.permalinkBaseUrl → instance OPEN_DPP_URL`). This supersedes the "its own resolver base" aspect of ADR 0001.

## Considered Options

- **A1 — one base concept everywhere (chosen).** Delete the per-permalink `gs1ResolverBase`, the `branding.gs1ResolverBaseUrl` field, and the `Gs1ResolverBaseUrl` instance setting. A GS1 Digital Link's resolver base comes from the permalink-base cascade. One base concept at every level.
- **A2 — drop only the per-permalink override, keep org/instance GS1-resolver defaults** — rejected: it leaves a single per-link field (`baseUrl`) driving _both_ the page base and the resolver base while two separate org-level defaults survive. An asymmetry with no demonstrated need (open-dpp does not support an external GS1 resolver).
- **B — edit-dialog cleanup only, keep the backend resolver-base cascade** — rejected: the goal is one base concept, not a hidden second one behind a single field.

## Consequences

- **Deleted:** `permalink.gs1ResolverBase`, `branding.gs1ResolverBaseUrl`, the `Gs1ResolverBaseUrl` instance setting (+ its `Gs1ResolverBaseUrlSetting` domain class), and `resolveGs1ResolverBase`. The GS1 Digital Link's resolver base is computed from the permalink-base cascade.
- Both the edit and create dialogs expose a **single** "Custom base URL" per permalink, for both kinds.
- A brand can no longer point its GS1 Digital Links at a GS1-specific resolver host (e.g. `id.gs1.org`) distinct from where it hosts DPP pages — open-dpp resolves both from one base. Accepted: open-dpp is the resolver.
- **No data migration.** The GS1 Digital Link / resolver-base feature is unreleased — it lives only on the `gs1-upi` branch, is not merged to `main`, has no changelog entry, and there is no migration tooling. No production records and no QR codes in the wild, so `gs1ResolverBase` is removed cleanly.
