# Permalink is a polymorphic resolver (presentation + GS1 Digital Link)

The GS1 Digital Link (the QR target) needs to be a managed, listable record that references a GS1 UPI and carries GS1 data attributes plus its own resolver base. Rather than add a separate `Gs1DigitalLink` entity, we extend the existing `Permalink` into a polymorphic resolver: a permalink is either a **presentation permalink** (references a presentation configuration) or a **GS1 Digital Link permalink** (references a UPI, may also reference a presentation configuration, and carries nullable GS1 data attributes and a GS1 resolver base). `presentationConfigurationId` becomes nullable.

## Considered Options

- **Separate `Gs1DigitalLink` entity** — rejected: it duplicates the resolver, list, and reference plumbing, and the product model treats the digital link *as* a permalink ("the permalink for the GS1 Digital Link"). One resolver concept, one list, one endpoint surface won out.

## Consequences

- The publish-freeze, branding, and AAS-serving machinery applies only to the presentation kind.
- A passport may have several presentation permalinks, so resolution uses a passport's **primary** permalink instead of `permalink[0]`; a `primary` flag and guarded delete (cannot delete a published or last/primary permalink) are required to keep passports resolvable.
- A GS1 Digital Link permalink resolves to its own presentation configuration when set, otherwise falls back to the referenced UPI's passport's primary permalink.
