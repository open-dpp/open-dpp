---
type: Passports
---

<!--@include: ./digital-product-document/lifecycle.md-->

## Item-level serialization and component lineage

When issuing Digital Product Passports for serialized products or modular assemblies using GS1 Digital Link unique product identifiers (`01/{gtin14}[/10/{batch}][/21/{serial}]`, `granularity: "item"`) and Asset Administration Shell (AAS) submodels in the Passport Designer, two verification practices help keep passport records aligned with physical units without locking the database schema to a single sector:

- **Item and kit identity verification (`GateCheck`):** Assign item-level GS1 unique product identifiers with normalized GTIN-14 check digits and unique `(GTIN, batch, serial)` combinations, and represent multi-unit kits or sub-assemblies using AAS `ReferenceElement` or `SubmodelElementList` links to child passports so every referenced unit resolves before a passport is published.
- **Component and repair lineage (`BirthCheck`):** For repairable or modular products, model initial component bindings and authorized service replacements as rows in a dynamic AAS `SubmodelElementList` (table) within the Passport Designer—recording component identifiers/serials and replacement timestamps so legitimate repairs append to the passport's AAS submodel while unrecorded component swaps can be detected during warranty or circularity checks.
