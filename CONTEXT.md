# open-dpp

Open-source platform for managing Digital Product Passports (DPPs) based on the IEC 63278 Asset Administration Shell standard. This glossary captures the project-specific language; it is not a spec.

## Language

### Product Identification

**Unique Product Identifier (UPI)**:
The first-class record that identifies a product. It carries an identifier _type_ and, for a GS1 UPI, _owns_ the GS1 identity. It references the passport it identifies — the identity lives on the UPI, not on the passport. A passport may have **many** GS1 UPIs (e.g. one per batch/serial); each GS1 key is globally unique.
_Avoid_: external identifier (that names the type, not the record)

**GS1 UPI**:
A UPI whose type is `GS1`. It owns a GS1 identity (a GTIN plus its key qualifiers).

**GS1 Identity**:
The GTIN plus its key qualifiers carried by a GS1 UPI. It belongs to the UPI; "a passport's GS1 identity" is shorthand for "a GS1 UPI that references that passport" (a passport may have several).

**GTIN**:
The GS1 Global Trade Item Number that anchors a GS1 identity. Stored normalized to GTIN-14.

**Permalink**:
A public, shareable resolver for a digital product passport. A permalink resolves to a passport's presentation; it may _additionally_ be a GS1 Digital Link by referencing a GS1 UPI and carrying GS1 data attributes. Every permalink has a single base URL (see **Permalink Base URL**) that serves both shapes.
_Avoid_: short link, public URL (that names the rendered string, not the record)

**Presentation Permalink**:
A permalink that resolves to a passport's presentation. A passport may have several; one is its primary. Created automatically and manageable in the permalink list.

**GS1 Digital Link Permalink**:
A permalink that represents a GS1 Digital Link: it references a GS1 UPI (at most one such permalink per UPI), carries optional GS1 data attributes, and may also reference a presentation configuration. Created on demand (the "add a GS1 Digital Link?" prompt, or directly). Its resolver base is the permalink's base URL — there is no separate GS1 resolver base.

**Primary Permalink**:
The single presentation permalink that provides a passport's canonical public URL; the public resolver falls back to it. Exactly one per passport; it cannot be deleted while it is the passport's last presentation permalink.

**GS1 Digital Link**:
The GS1-standard URL form carried by a QR code and resolved to a passport. Its **base** is the permalink's base URL; its **path** comes from the GS1 UPI's identity (`…/01/{gtin}/10/{batch}/21/{serial}`); its **query string** comes from the permalink's GS1 data attributes (`?17=…&3103=…`). Owned by the permalink, which holds the UPI reference, the base URL, and the data attributes.

**Permalink Base URL**:
The single host a permalink renders against, for both kinds: the page URL of a presentation permalink (`base/{slug}`) and the resolver base of a GS1 Digital Link (`base/01/{gtin}/…`). Resolved through one cascade — the permalink's own `baseUrl`, then the org's branding base URL, then the instance default. There is no separate GS1 resolver base.

**GS1 Data Attributes**:
Optional GS1 Application Identifiers appended to a GS1 Digital Link's query string (e.g. expiry `17`, net weight `3103`). A link-level concern carried by the permalink, distinct from the identity's key qualifiers.

**Key Qualifiers**:
The GS1 Application Identifiers that qualify a GTIN within the identity — batch/lot (`10`) and serial (`21`) today. Part of the GS1 UPI's identity (the digital link path), distinct from GS1 data attributes.
