---
type: Passports
---

<!--@include: ./digital-product-document/lifecycle.md-->

## Item-level serialization and component lineage

When issuing Digital Product Passports for serialized electronics, batteries, or multi-unit hardware kits using GS1 Digital Link identifiers (`01/{gtin14}[/10/{batch}][/21/{serial}]`) and traceability events (`OpenEpcisEvent`, `UntpEvent`, `OpenDppEvent`), two lifecycle verification practices help keep passport records synchronized with physical units:

- **Factory-gate shipment and kit validation (`GateCheck`):** Before a shipment event is accepted into downstream inventory or passport registries, verify that serialized items carry normalized GTIN-14 check digits, unique combined GTIN and serial qualifiers (`(GTIN, AI 21)`) within and across shipments, and complete parent-child kit hierarchies (`AggregationEvent`).
- **Component birth-record and repair reconciliation (`BirthCheck`):** For modular products subject to circularity, repair, or warranty return workflows, compare the product's initial assembly component bindings (`TransformationEvent` for consumed inputs; `AssociationEvent` for retained, removable components; or `AggregationEvent` for physical containment) against authorized service replacement events so legitimate repairs update passport lineage while unrecorded component swaps are flagged for quarantine.
