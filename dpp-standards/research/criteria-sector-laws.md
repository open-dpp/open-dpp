# Sector DPP laws: Criteria comparison for CPR, Toys and Detergents

> **Superseded as a record on 2026-09-07 (ticket #830):** the Extract verified every row below against the texts and wrote `../matrix/CPR.yaml`, `../matrix/TOYS.yaml` and `../matrix/DET.yaml`. Where a row here and a matrix row disagree, the matrix file is the verified one (the ticket's resolution comment lists the corrections). This file stays as the comparison and the dates section.

Written in wayfinder ticket #767 (2026-09-06), which decided that the three sector laws enter the Conformance Review now. Seed for the Extract of `CPR`, `TOYS` and `DET`: rows tagged `mirrors` without a delta become Mirrors of the ESPR Criterion, rows with a delta and sector-specific rows get their own Criterion. Read on 2026-09-06 from the Cellar XHTML of the three OJ texts (`http://publications.europa.eu/resource/celex/32024R3110`, `…/32025R2509`, `…/32026R0405`, fetched with `Accept: application/xhtml+xml` and `Accept-Language: eng`). ESPR comparison ids are those of `criteria-tier-a.md` / `../matrix/ESPR.yaml`. Paraphrases are the reviewer's own; article numbers are verbatim.

Tag legend for section 2 of each law:
- `mirrors ESPR-…` = same software obligation in substance; `with delta:` names what differs.
- `sector-specific` = a requirement with a software footprint that ESPR Art. 9-15 / Annex III does not contain.
- `organisational` / `Commission` = duty of an economic operator, Member State, customs or the Commission with no software footprint of its own (delegated-act content clauses are tagged `Commission` but, where they copy an ESPR Art. 9(2) point, also carry the `mirrors` id, the way the ESPR table tags them `commission`/`mixed`).

Numbering check against the brief:
- CPR: Chapter X "Digital product passport" is **Art. 75-80** as listed. DPP content is not in an annex; it is listed in Art. 76(2)(a) and pulls in Annex V (declaration of performance and conformity model) and Annex IV (general product information / instructions / safety information). The obligation trigger sits outside the chapter in **Art. 22(7)**.
- Toys: Chapter V "Digital product passport" is **Art. 19-24**, not 19-23. Art. 23 = customs controls, **Art. 24 = "Assistance for micro-, small and medium-sized enterprises"** (Commission guidelines on setting up a DPP, by 1 August 2029). The technical-requirement empowerment is **Art. 49(1)-(3)**, in Chapter IX. Annex VI "Digital product passport" has Part I (mandatory) and Part II (optional).
- Detergents: Chapter V "Digital product passport" is **Art. 21-25** as listed (Art. 25 = customs). Annex VI has Part A (mandatory) and Part B (optional). The technical-requirement empowerment is an **implementing act in Art. 21(10)** (not a delegated act); the Annex VI / registry amendment powers are **Art. 30(2)-(3)**.

---

## CPR: Regulation (EU) 2024/3110 (construction products)

### 1. Dates

- Published OJ L 2024/3110, 18.12.2024. Entry into force: 20th day after publication = **7 January 2025** (Art. 96 first paragraph; matches the delegation start "five years from 7 January 2025" in Art. 89(2)).
- General application **8 January 2026** (Art. 96 second paragraph). Exceptions applying from 7 January 2025: Art. 1-4, 5(1)-(7), 7(1), 9, 10, 12(1) first subparagraph, 16(3), 37(4), 63, 89, 90 and Annexes I-IV, VII, IX, X; Art. 92 (penalties) from 8 January 2027. Chapter X is not excepted, so Art. 75-80 are formally applicable from 8 January 2026, but every operative obligation in them is conditioned on the Art. 75(1) delegated act.
- DPP obligation date: **no calendar date in the text.** Art. 22(7): the manufacturer shall make the Art. 76 DPP available through the Art. 75 system "by 18 months after the entry into force of the delegated act referred to in Article 75(1)". Art. 80(1): six months after that delegated act enters into force the system "shall be fully operational"; 18 months after it the Art. 22(7) obligations apply; voluntary use in between.
- Second gate: Art. 22 sits in Chapter III, and Art. 95(9) makes Chapter I-III obligations applicable to a product family only one year after the implementing act (Art. 5(8) or 6(1)) that makes a harmonised technical specification mandatory for that family (unless the implementing act sets a later date). So the DPP duty is doubly gated: the Art. 75(1) delegated act plus a per-family harmonised technical specification.
- Delegated / implementing acts the chapter waits on:
  - **Art. 75(1)**: delegated act (procedure Art. 89) "setting up a construction digital product passport system" that must do everything in Art. 75(2)(a)-(j). No deadline. The whole chapter, Art. 22(7), Art. 16(1), Art. 18(2)(g) and Art. 20(4) hinge on it.
  - **Art. 80(2)(a)-(b)**: delegated acts amending the Regulation to add/remove Art. 75(2) functionalities (technical progress, once-only principle) and to revise Art. 77(1) and Art. 78 "to ensure compatibility and interoperability with Regulation (EU) 2024/1781".
  - **Art. 15(5)**: delegated act amending the Annex V declaration model "to facilitate the fulfilment of digital product passport requirements set out in Articles 76 and 77" and integration with the Art. 75 system.
  - **Art. 16(3)**: Commission may ask the ESOs (in the Art. 5(2) standardisation request) for guidelines on interoperable human- and machine-readable declaration formats; Art. 77(1)(h) makes the declaration inside the DPP follow those guidelines.
  - **Art. 79(1)-(2)**: ESPR Art. 12 (identifiers/carriers) and Art. 13 (registry) apply "unless" the Art. 75(1) delegated act lays down more detailed or alternative rules (Art. 75(2)(h)). No "after the ESPR registry is operational" wording; the ESPR registry deadline (19 July 2026) is inherited by reference only.
  - **Art. 81(3)(b)**: implementing acts may give third-country authorities access to the construction DPP system.
  - Art. 89(2): the Art. 75(1) and 80(2) delegations run five years from 7 January 2025, tacitly renewable.
- Precedence: **Art. 12(2)**: where conflicts arise between the CPR and Regulation (EU) 2024/1781 (or Regulation 1025/2012), the CPR prevails.

### 2. Article-by-article paraphrase (Art. 75-80)

- Art. 75(1): Commission adopts a delegated act setting up the construction DPP system under this Chapter — Commission (role of ESPR-Art9(2)).
- Art. 75(2)(a): system compatible with, interoperable with and based upon the ESPR DPP, without compromising BIM interoperability, respecting construction specifics — mirrors ESPR-Art11(a) with delta: "based upon" ESPR DPP plus BIM interoperability (Commission, delegated-act content).
- Art. 75(2)(b): system has the functionalities needed to implement and manage Art. 76 DPPs — Commission.
- Art. 75(2)(c): determine which actors (economic operators, clients, deinstallers, users, authorities) access which information, protecting IP, commercial secrets and safety of works — mirrors ESPR-Art9(2)(f) with delta: named actor list includes clients and deinstallers (Commission).
- Art. 75(2)(d): determine which actors (manufacturers, authorised representatives, importers, distributors, DPP service providers) may introduce/update information, including creating a new DPP — mirrors ESPR-Art9(2)(g) with delta: explicit creation of a new DPP by non-manufacturers (Commission).
- Art. 75(2)(e): detailed arrangements for updating the DPP of an existing product — mirrors ESPR-Art9(2)(h) (Commission).
- Art. 75(2)(f): procedures ensuring DPP availability after insolvency, liquidation, cessation, or after manufacturer obligations expire, including a back-up system by DPP service providers — mirrors ESPR-Art11(e) + ESPR-Art10(4) with delta: also after the manufacturer's own availability duty expires (Commission).
- Art. 75(2)(g): requirements for DPP service providers, optionally a certification scheme, based on ESPR developments as far as possible — mirrors ESPR-Art11-sub3 (Commission).
- Art. 75(2)(h): where required, more detailed or alternative rules on the life cycle of identifiers, data carriers, digital credentials and the DPP registry than ESPR's — Commission, sector-specific power to deviate from ESPR-Art12/Art13.
- Art. 75(2)(i): system accessible 25 years after the last product of a product type is placed on the market; operator makes the DPP available at least 10 years — mirrors ESPR-Art9(2)(i) with delta: fixed 25-year system retention and 10-year operator duty, counted from the last product of the type (Commission).
- Art. 75(2)(j): take into account availability of information for reuse and remanufacturing — Commission.
- Art. 76(1): DPP information accurate, complete and up-to-date — mirrors ESPR-Art9(1) (second limb).
- Art. 76(2)(a)(i): include the declaration of performance and conformity (Art. 15), the Art. 15(6) REACH information (possibly via a connection to other Union databases) and the documentation accompanying it per Annex V — sector-specific (nearest ESPR-AnnexIII(e); delta: performance declaration with environmental data, REACH safety-data-sheet info, links to Union databases).
- Art. 76(2)(a)(ii): include general product information, instructions for use and safety information (Art. 22(6) / Annex IV) — mirrors ESPR-AnnexIII(f).
- Art. 76(2)(a)(iii): include the technical documentation (Art. 22(3)) with the sections for simplified procedures (Art. 59-61) — mirrors ESPR-AnnexIII(e) with delta: mandatory, not delegated-act-optional.
- Art. 76(2)(a)(iv): include the Art. 22(9) environmental sustainability label — sector-specific.
- Art. 76(2)(a)(v): include the unique identifiers issued under Art. 79(1) — mirrors ESPR-AnnexIII(b) (and (g),(h)).
- Art. 76(2)(a)(vi): include documentation required under other Union law applicable to the product — mirrors ESPR-Art10(2) / ESPR-AnnexIII(a).
- Art. 76(2)(a)(vii): include the data carriers of key parts that have their own DPP — sector-specific (parent-to-component DPP linkage; nearest ESPR-AnnexIII(c) parts GTIN / ESPR-Art11(d)).
- Art. 76(2)(b): connected to one or more data carriers — mirrors ESPR-Art10(1)(a) with delta: "one or more".
- Art. 76(2)(c): accessible electronically through the data carrier displayed per Art. 18(2)(g) (next to the CE marking) — mirrors ESPR-Art10(1)(b) with delta: carrier placement fixed by CE-marking rules, not by delegated act.
- Art. 76(2)(d): correspond to the product type and its unique identification code (Art. 22(5)) — mirrors ESPR-Art10(1)(f) / ESPR-Art9(2)(d) with delta: granularity fixed at "product type" with a manufacturer-specific code, no batch/item option.
- Art. 76(2)(e): accessible free of charge to all economic operators, clients, users and authorities through the data carrier — mirrors ESPR-Art11(b) with delta: actor list is operators, clients, users, authorities (no civil society, trade unions, repairers named).
- Art. 76(2)(f): give different levels of access to the construction DPP system — mirrors ESPR-Art10(1)(g) / ESPR-Art9(2)(f).
- Art. 76(2)(g): allow the actors specified in the system to introduce or update information — mirrors ESPR-Art11(f) / ESPR-Art9(2)(g).
- Art. 76(2)(h): accessible for an established period after the last product of the type is placed on the market — mirrors ESPR-Art9(2)(i) / ESPR-Art11(e) with delta: period runs from the last product of the type (25 y / 10 y per Art. 75(2)(i)).
- Art. 76(3)(a): requirements ensure value-chain actors easily access and understand relevant information — mirrors ESPR-Art9(3)(a) (Commission).
- Art. 76(3)(b): facilitate compliance verification by competent national authorities — mirrors ESPR-Art9(3)(b) (Commission).
- Art. 76(3)(c): improve traceability along the value chain — mirrors ESPR-Art9(3)(c) (Commission).
- Art. 76(4): products exempt from the declaration under Art. 14 (custom-made, heritage) are exempt from the DPP — organisational.
- Art. 77(1)(a): connected through one or more data carriers to a persistent unique identification code of the product type — mirrors ESPR-Art10(1)(a) with delta: identifier is the product-type code.
- Art. 77(1)(b): data carrier affixed per Art. 18(2)(g) — mirrors ESPR-Art10(1)(b) with delta: with the CE marking.
- Art. 77(1)(c): data carrier complies with Art. 79(1) (ESPR Art. 12 unless overridden) — mirrors ESPR-Art10(1)(c) / ESPR-Art12(1).
- Art. 77(1)(d): all information based on open standards, interoperable format, machine-readable, structured, searchable, transferable via an open interoperable data exchange network, no vendor lock-in, per Art. 78; attached declaration documents and technical documentation exempt where technically justified — mirrors ESPR-Art10(1)(d) with delta: technical-reason exemption for attached documents.
- Art. 77(1)(e): no end-user personal data without explicit GDPR Art. 6 consent — mirrors ESPR-Art10(1)(e).
- Art. 77(1)(f): information includes a reference to the product type (Art. 76(2)(d)) — mirrors ESPR-Art10(1)(f).
- Art. 77(1)(g): access regulated per Art. 78 essential requirements; specific rights per the system's access levels — mirrors ESPR-Art10(1)(g).
- Art. 77(1)(h): the declaration inside the DPP follows the Art. 16(3) interoperability guidelines — sector-specific.
- Art. 77(2): information required or allowed by other Union law may be included per the delegated act — mirrors ESPR-Art10(2).
- Art. 77(3): manufacturer gives online/distance sellers a digital copy of the data carrier and the product identifier, free of charge, within 5 working days — mirrors ESPR-Art10(3)(a)+(b) with delta: duty on the manufacturer (not "the operator placing on the market"), and both carrier and identifier.
- Art. 78(a): fully interoperable with other DPPs in technical, semantic and organisational aspects of end-to-end communication and data transfer — mirrors ESPR-Art11(a).
- Art. 78(b): recipient has easy, free access according to its access rights in the system — mirrors ESPR-Art11(b).
- Art. 78(c): data stored as specified in the construction DPP system — mirrors ESPR-Art11(c) with delta: storage arrangement dictated by the delegated act rather than "operator or service provider".
- Art. 78(d): authorised operators or DPP service providers may not sell, reuse or process the data beyond the service unless agreed — mirrors ESPR-Art11-sub2 with delta: also "authorised operators".
- Art. 78(e): DPP remains available for the Art. 76(2)(h) period, including after insolvency etc., with the Art. 75(2)(f) back-up — mirrors ESPR-Art11(e) + ESPR-Art10(4).
- Art. 78(f): rights to access, introduce, modify or update restricted to the system's access rights — mirrors ESPR-Art11(f).
- Art. 78(g): protection of trade secrets (Dir. 2016/943) and IP rights ensured — sector-specific (in ESPR this is only a delegated-act consideration, not an essential requirement).
- Art. 78(h): data authentication, reliability and integrity ensured — mirrors ESPR-Art11(g).
- Art. 78(i): high level of security and privacy; fraud avoided — mirrors ESPR-Art11(h).
- Art. 79(1): ESPR Art. 12 applies to unique identifiers and data carriers unless the Art. 75(1) act sets more detailed or alternative rules — mirrors ESPR-Art12(1)-(6) by reference, with delta: overridable.
- Art. 79(2): ESPR Art. 13 applies to the DPP registry unless the Art. 75(1) act sets alternative rules — mirrors ESPR-Art13(1)-(6) by reference, with delta: overridable.
- Art. 79(3): ESPR Art. 14 applies to the web portal — mirrors ESPR-Art14 (Commission).
- Art. 80(1): system fully operational 6 months after the delegated act; Art. 22(7) duty 18 months after; voluntary use meanwhile — Commission / organisational (timing).
- Art. 80(2)(a): delegated acts to specify, add or remove Art. 75(2) functionalities (technical progress, once-only principle) — Commission.
- Art. 80(2)(b): delegated acts revising Art. 77(1) and 78 for compatibility and interoperability with ESPR — Commission.

Related clauses outside Chapter X (not counted below, listed because the Criterion ids would cite them):
- Art. 22(7): manufacturer makes the DPP available 18 months after the Art. 75(1) act, connected to the Art. 18(2)(g) carrier — organisational trigger.
- Art. 18(2)(g) and last subparagraph: data carrier follows the CE marking; the unique identification code and declaration code next to the CE marking may be omitted when that carrier is present — sector-specific labelling.
- Art. 16(1): electronic supply of the declaration is waived when it sits in a compliant DPP; Art. 16(4): declaration in the DPP in every required Member State language — sector-specific.
- Art. 20(4): 10-year document retention for authorities waived for documents made available in the DPP — organisational.
- Art. 29(2): online / distance offers must show the data carrier — organisational.
- Art. 91(2): once Art. 22(7) applies, information obligations for Art. 76(2) documents are fulfilled by providing the DPP; paper declaration and instructions free of charge on request at purchase — organisational.
- Art. 15(5), Art. 81(3)(b), Art. 12(2): see section 1.
- Annex V point 2: permalinks / data carriers in the declaration are optional when the information is in the DPP.

### 3. Sector-specific content elements

Content is defined by Art. 76(2)(a)(i)-(vii), not by a DPP annex:
1. Declaration of performance and conformity (Art. 15, model Annex V): declaration code and version; product description (product-type unique identification code, batch/serial, category, declared uses, dimensions, key parts, estimated service life, variants, deinstallation date/place for used products); permalinks or carriers to Union database registrations, REACH information and Annex IV information (unless in the DPP); manufacturer, authorised representative, notified body and TAB contact blocks; certificate / validation report references; harmonised technical specification or EAD/ETA references; declared performances per essential characteristic (values, levels, classes or "NULL"), environmental sustainability per life-cycle module (Art. 15(2), calculated with Commission software, software version cited); applicable product requirements and AVS system; three declarations; signature. Art. 15(6): REACH Art. 31/33 information (safety data sheet / SVHC information) is supplied together with the declaration.
2. General product information, instructions for use, safety information (Annex IV: product identification, description, uses, users, conditions of use, and onwards).
3. Technical documentation (Art. 22(3)) including simplified-procedure sections (Art. 59-61).
4. Environmental sustainability label (Art. 22(9)), where a delegated act imposes one.
5. Unique identifiers per Art. 79(1).
6. Documentation required under other Union law.
7. Data carriers of key parts that have their own DPP.

Documents replaced or embedded: the **declaration of performance and conformity** is embedded (Art. 16(1) waives separate electronic supply); the **REACH safety data sheet / Art. 33 information** rides with it (Art. 15(6)); the **technical documentation** and **Annex IV instructions** are embedded; the DPP satisfies the Art. 91(2) information obligations and the Art. 20(4) retention duty, and lets the CE marking drop the product-type code and declaration code (Art. 18(2)).

### 4. Explicit links to ESPR (Regulation (EU) 2024/1781)

- Recital (91): delegated power to establish a construction DPP system "aligned to the extent possible" to the ESPR DPP. Recital (32): CPR developed "in line with the framework of" ESPR, is lex specialis for construction products; ESPR only complementary in exceptional cases; in conflict the CPR prevails. Recital (101): delegated acts to keep compatibility and interoperability with ESPR.
- Art. 12(2): CPR prevails over ESPR in conflicts.
- Art. 75(2)(a): system "compatible with, interoperable with and based upon" the ESPR DPP (also BIM).
- Art. 75(2)(g): DPP service provider requirements / certification "based upon developments under Regulation (EU) 2024/1781" as far as possible (ESPR Art. 11 third subparagraph in substance, not cited by number).
- Art. 75(2)(h): power to lay down more detailed or alternative rules on identifiers, data carriers, digital credentials and the registry than ESPR's.
- Art. 79(1): ESPR **Art. 12** (unique identifiers and data carriers) applies unless overridden.
- Art. 79(2): ESPR **Art. 13** (DPP registry) applies unless overridden.
- Art. 79(3): ESPR **Art. 14** (web portal) applies.
- Art. 80(2)(b): revise Art. 77(1)/78 for compatibility and interoperability with ESPR.
- Art. 93: 2033 evaluation must assess the correlation with ESPR.
- Not referenced by number: ESPR Art. 10 (general requirements), Art. 11 (technical design), Art. 15 (customs); no customs-control article exists in the CPR DPP chapter.
- Definitions: the CPR defines its own "data carrier" (Art. 3(41)) and "permalink" (Art. 3(40)); it does not define "digital product passport", "unique product identifier", "unique operator identifier" or "DPP service provider" and does not import the ESPR definitions.
- Presumption of conformity for the DPP: **none.** The CPR's harmonised standards / common specifications with presumption of conformity (Art. 8, Art. 9) concern product requirements. The only standards-adjacent DPP hook is the Art. 16(3) ESO *guidelines* on declaration formats referenced by Art. 77(1)(h).

### 5. Counts (Chapter X only, Art. 75-80)

- Candidate Criteria: **55** (Art. 75: 11; Art. 76: 19; Art. 77: 10; Art. 78: 9; Art. 79: 3; Art. 80: 3).
- Mirror ESPR: **42** (23 exact, 19 "with delta"). Of these 11 are Commission-shaped delegated-act content or Art. 9(3)-type purposes (Art. 75(2)(a),(c),(d),(e),(f),(g),(i); Art. 76(3)(a)-(c); Art. 79(3)).
- Sector-specific software-enabling: **5** (Art. 76(2)(a)(i) declaration of performance and conformity with REACH data and Union-database links; Art. 76(2)(a)(iv) sustainability label; Art. 76(2)(a)(vii) key-part DPP carriers; Art. 77(1)(h) declaration format guidelines; Art. 78(g) trade-secret / IP protection as an essential requirement).
- Organisational / Commission: **8** (Art. 75(1), 75(2)(b), 75(2)(h), 75(2)(j), 76(4), 80(1), 80(2)(a), 80(2)(b)).
- Adding the seven related clauses outside the chapter (Art. 22(7), 18(2)(g)+last subparagraph, 16(1), 16(4), 20(4), 29(2), 91(2)) would give 62, of which 3 are sector-specific software-relevant (Art. 18(2)(g) placement, Art. 16(1) embedding, Art. 16(4) languages).

---

## Toys: Regulation (EU) 2025/2509 (toy safety)

### 1. Dates

- Published OJ L 2025/2509, 12.12.2025. Entry into force: 20th day after publication = **1 January 2026** (Art. 59 first paragraph; matches "five years from 1 January 2026" in Art. 50(2)).
- Application: **1 August 2030** (Art. 59 second paragraph). Art. 28-44 (notified bodies) and Art. 49-55 (delegated powers, committee, confidentiality, penalties) apply from 1 January 2026, so the Art. 49 empowerments are exercisable now. Chapter V (Art. 19-24) and the manufacturer duty in Art. 7(2) apply from 1 August 2030.
- Transitional: Art. 56 repeals Directive 2009/48/EC from 1 August 2030; Art. 57(1): toys placed on the market under the Directive before 1 August 2030 may continue to be made available (no DPP for them); Art. 57(3): EC type-examination certificates valid until 1 February 2031. Art. 55: penalty rules notified by 1 August 2028.
- Acts the chapter waits on:
  - **Art. 49(1)** (delegated act, procedure Art. 50): "technical requirements related to the digital product passport for toys" covering (a) data carrier(s), (b) carrier layout and positioning, (c) technical elements for which European or international standards are to be used, (d) actors and their access rights, (e) actors that create/update and what data, (f) arrangements for introducing/updating. No adoption deadline. Its date of application may not be earlier than 18 months after its entry into force (except duly justified cases). Art. 19(2)(f), 19(2)(i) and 19(7) depend on it; Art. 47(1)(c)-(d) makes a DPP or carrier not compliant with Art. 19 a formal non-compliance.
  - **Art. 49(2)**: delegated acts amending Annex VI (DPP data). **Art. 49(3)**: delegated acts amending Art. 22(1) to store further Annex VI information or non-compliance information in the registry (criteria (a)-(d)).
  - **Art. 22(2) second subparagraph**: optional implementing act on registry arrangements including communication of the unique registration identifier (examination procedure, Art. 53(3)).
  - **Art. 23(4)**: automatic customs verification via the registry–EU CSW-CERTEX interconnection of ESPR Art. 15(3) applies from the later of that interconnection being operational or the date of application (1 August 2030).
  - **Art. 24**: Commission SME guidelines on setting up and operating a toy DPP by 1 August 2029.
  - By reference (Art. 21(2), (4), (5)): ESPR Art. 12(4) delegated acts (identifier / carrier lifecycle), ESPR Art. 11 fourth paragraph implementing acts (digital credentials) and ESPR Art. 11 third paragraph delegated acts (DPP service providers) "shall also apply".
  - Registry precondition: Art. 22(1) uploads go into "the digital registry established pursuant to Article 13(1) of Regulation (EU) 2024/1781"; the text states no fallback if that registry is not operational, except for customs (Art. 23(4)).
  - No harmonised-standard precondition for the DPP itself.

### 2. Article-by-article paraphrase (Art. 19-24, Art. 49(1)-(3), Annex VI)

- Art. 19(1): manufacturer creates the DPP before placing the toy on the market; DPP meets Art. 19 and 20 — mirrors ESPR-Art9(1) (first limb) with delta: creator fixed as the manufacturer.
- Art. 19(2)(a): corresponds to a specific toy model — mirrors ESPR-Art10(1)(f) / ESPR-Art9(2)(d) with delta: model level fixed in the law.
- Art. 19(2)(b): states that compliance with the Regulation, in particular the essential safety requirements, has been demonstrated — sector-specific (declaration-of-conformity statement inside the DPP).
- Art. 19(2)(c): contains at least the Annex VI Part I data — mirrors ESPR-Art9(2)(a) / ESPR-AnnexIII with delta: data set fixed in the law, not by delegated act.
- Art. 19(2)(d): accurate, complete and up to date — mirrors ESPR-Art9(1).
- Art. 19(2)(e): available in the language(s) required by the Member State of making available — sector-specific (multilingual DPP content).
- Art. 19(2)(f): accessible to consumers / end users, market surveillance, customs, notified bodies, the Commission and other economic operators per the Art. 49(1)(d) access rights — mirrors ESPR-Art11(b) with delta: notified bodies added; civil society, trade unions, repairers not named.
- Art. 19(2)(g): available 10 years after placing on the market, including after insolvency, liquidation or cessation — mirrors ESPR-Art11(e) / ESPR-Art9(2)(i) with delta: fixed 10 years from placing on the market.
- Art. 19(2)(h): connected through a data carrier to a persistent unique product identifier — mirrors ESPR-Art10(1)(a).
- Art. 19(2)(i): fulfils the specific and technical requirements laid down pursuant to Art. 49(1) — mirrors ESPR-Art9(1) ("per the delegated act").
- Art. 19(3): may contain the Annex VI Part II data (safety information and warnings; instructions) — mirrors ESPR-Art10(2) / ESPR-AnnexIII-para3 with delta: optional set fixed.
- Art. 19(4): by creating the DPP the manufacturer assumes responsibility for compliance — organisational.
- Art. 19(5)(a): where the DPP holds all declaration-of-conformity information under the AI Act, CRA, RoHS, EMC, LVD, RED or drone rules, the manufacturer is deemed to have drawn up those EU declarations — organisational (legal effect).
- Art. 19(5)(b): also deemed to satisfy the "declaration accompanies the product" duties of CRA / RED / drones — organisational.
- Art. 19(5)(c): manufacturer assumes responsibility under those acts by drawing up the DPP — organisational.
- Art. 19(5)(d): operators and AI-system providers use the DPP to fulfil their declaration-related duties under those acts — organisational.
- Art. 19(6): when relying on paragraph 5, the DPP contains the Annex VI(h) mention — sector-specific (content).
- Art. 19(7): data carrier physically on the toy or an affixed label; else packaging or accompanying documentation per the delegated act; visible before purchase and to market surveillance, including in distance sales — mirrors ESPR-Art10(1)(b) + ESPR-Art9(2)(e) with delta: priority order fixed in the law; visibility to authorities.
- Art. 19(8): where other Union law requires a data carrier, a single carrier serves both — sector-specific.
- Art. 19(9): where other Union law requires a DPP, a single DPP holds both data sets; may be at batch level if that law requires it — sector-specific (single-DPP rule and batch override; nearest ESPR-Art10(2)).
- Art. 19(10): other information reachable through the carrier must be clearly separated from the regulated information — sector-specific.
- Art. 19(11): a link to the Safety Gate Portal section (GPSR Art. 34(3)) is displayed when the DPP is accessed — sector-specific.
- Art. 19(12)(a): digital copy of the carrier or the unique product identifier to distributors and online marketplaces — mirrors ESPR-Art10(3)(a).
- Art. 19(12)(b): that copy or a web link free of charge, promptly, within 5 working days — mirrors ESPR-Art10(3)(b).
- Art. 19(13): back-up copy through a DPP service provider when placing on the market — mirrors ESPR-Art10(4).
- Art. 20(1): fully interoperable with other DPPs required by Union law (technical, semantic, organisational, end-to-end) — mirrors ESPR-Art11(a).
- Art. 20(2): open standards, interoperable format, machine-readable, structured, searchable, transferable via an open interoperable network, no vendor lock-in — mirrors ESPR-Art10(1)(d).
- Art. 20(3): consumers, operators, national and customs authorities, the Commission and other actors get free access per their access rights — mirrors ESPR-Art11(b).
- Art. 20(4): consumers shall not be asked to register or provide a password to access the DPP — sector-specific.
- Art. 20(5): stored by the responsible economic operator or by DPP service providers — mirrors ESPR-Art11(c).
- Art. 20(6): a new DPP for a toy that already has one is linked to the original(s) — mirrors ESPR-Art11(d).
- Art. 20(7): DPP service providers may not sell, reuse or process the data beyond the service unless agreed — mirrors ESPR-Art11-sub2.
- Art. 20(8): data authentication, reliability and integrity ensured — mirrors ESPR-Art11(g).
- Art. 20(9): high level of security and privacy; fraud avoided — mirrors ESPR-Art11(h).
- Art. 20(10): no tracking, analysis or use of usage information beyond what serving the DPP strictly needs; no customer personal data without explicit consent — mirrors ESPR-Art10(1)(e) with delta: explicit no-tracking / no-analytics prohibition.
- Art. 21(1): data carriers, unique product identifiers and unique operator identifiers comply with the standards applicable under ESPR — mirrors ESPR-Art10(1)(c) + ESPR-Art12(1) (+ ESPR-AnnexIII-para2).
- Art. 21(2) first subparagraph: ESPR Art. 12(2) applies where a unique operator identifier is not yet available — mirrors ESPR-Art12(2).
- Art. 21(2) second subparagraph: ESPR Art. 12(4) delegated-act lifecycle rules for identifiers and carriers also apply — mirrors ESPR-Art12(4)/(5).
- Art. 21(3): where the toy is also covered by an ESPR Art. 4 delegated act or other Union law, unique product, operator and registration identifiers are the same — sector-specific (identifier reuse across regimes).
- Art. 21(4): ESPR Art. 11 fourth paragraph implementing acts on issuing and verifying digital credentials also apply — mirrors ESPR-Art11-sub4.
- Art. 21(5): ESPR Art. 11 third paragraph delegated-act requirements for DPP service providers also apply — mirrors ESPR-Art11-sub3.
- Art. 22(1): before placing on the market, the operator uploads the unique product and operator identifiers into the ESPR Art. 13(1) registry; for imports the registry stores the commodity code — mirrors ESPR-Art13(4) (+ ESPR-Art13(1)).
- Art. 22(2) first subparagraph: registry automatically returns a unique registration identifier; not proof of compliance — mirrors ESPR-Art13(5).
- Art. 22(2) second subparagraph: Commission may adopt an implementing act on registry arrangements — mirrors ESPR-Art13(5)-sub2 (Commission).
- Art. 22(3): Commission, national and customs authorities have registry access — mirrors ESPR-Art13(6) (Commission).
- Art. 23(1): toys entering the Union are subject to this article; without prejudice to the Customs Code and Reg. 2019/1020 Chapter VII — mirrors ESPR-Art15(5) (Commission).
- Art. 23(2): the person declaring release for free circulation provides the unique registration identifier to customs — mirrors ESPR-Art15(1).
- Art. 23(3): customs release only after verifying registration identifier and commodity code against the registry; not proof of compliance — mirrors ESPR-Art15(2).
- Art. 23(4): verification is electronic and automatic via the registry–EU CSW-CERTEX interconnection (ESPR Art. 15(3)), from the later of interconnection or application date — mirrors ESPR-Art15(3) (Commission).
- Art. 23(5): Commission and customs may retrieve and use DPP and registry data for risk management, controls and release — mirrors ESPR-Art15(4).
- Art. 23(6): controls based on the Annex VII commodity-code list — Commission (sector-specific list).
- Art. 24: Commission provides SMEs with guidelines on setting up and operating a toy DPP by 1 August 2029 — Commission.
- Art. 49(1)(a): delegated act determines the data carrier(s) — mirrors ESPR-Art9(2)(b) (Commission).
- Art. 49(1)(b): layout and positioning of the carrier — mirrors ESPR-Art9(2)(c) (Commission).
- Art. 49(1)(c): technical elements of the DPP for which defined European or international standards are to be used — Commission (sector-specific mechanism; ESPR has no such delegated-act item).
- Art. 49(1)(d): actors and their data access — mirrors ESPR-Art9(2)(f) (Commission).
- Art. 49(1)(e): actors that create or update and what data — mirrors ESPR-Art9(2)(g) (Commission).
- Art. 49(1)(f): detailed arrangements for introducing or updating data — mirrors ESPR-Art9(2)(h) (Commission).
- Art. 49(1) second subparagraph: access rights weigh trade secrets (Dir. 2016/943) and consumer ease of access — Commission.
- Art. 49(1) third subparagraph: actors updating data are responsible for its accuracy, unless acting for the manufacturer — organisational.
- Art. 49(1) fourth subparagraph: delegated act applies no earlier than 18 months after its entry into force, save justified cases — Commission.
- Art. 49(2): delegated acts amend Annex VI for technical progress and digital readiness — Commission.
- Art. 49(3) first subparagraph: delegated acts amend Art. 22(1) to store further Annex VI or non-compliance information in the registry — mirrors ESPR-Art13(2) (Commission).
- Art. 49(3)(a): criterion consistency with other Union acts — Commission.
- Art. 49(3)(b): criterion verification of DPP authenticity — mirrors ESPR-Art13(2)(a) (Commission).
- Art. 49(3)(c): criterion relevance for market surveillance and customs — mirrors ESPR-Art13(2)(b) (Commission).
- Art. 49(3)(d): criterion avoiding disproportionate burden — mirrors ESPR-Art13(2)(c) (Commission).
- Annex VI Part I(a): unique product identifier — mirrors ESPR-AnnexIII(b).
- Annex VI Part I(b): manufacturer (and authorised representative) name and address plus unique operator identifier — mirrors ESPR-AnnexIII(g).
- Annex VI Part I(c): name, address and operator identifier of the Reg. 2019/1020 Art. 4 responsible operator — mirrors ESPR-AnnexIII(k).
- Annex VI Part I(d): statement that the DPP is issued under the manufacturer's sole responsibility — sector-specific.
- Annex VI Part I(e): object of the DPP: identification allowing traceability, including a colour image clear enough to identify the toy — sector-specific.
- Annex VI Part I(f): commodity code at creation, where applicable — mirrors ESPR-AnnexIII(d).
- Annex VI Part I(g): references to all Union law the toy complies with — sector-specific (nearest ESPR-AnnexIII(e)).
- Annex VI Part I(h): where applicable, the mention that the DPP replaces the EU declaration of conformity under the listed acts — sector-specific.
- Annex VI Part I(i): references to harmonised standards or common specifications used — sector-specific (nearest ESPR-AnnexIII(e)).
- Annex VI Part I(j): notified body name, number and certificate reference, where applicable — sector-specific (nearest ESPR-AnnexIII(e)).
- Annex VI Part I(k): the CE marking — sector-specific.
- Annex VI Part I(l): list of allergenic fragrances present and subject to labelling (Annex II Appendix Part B point 1; > 10 mg/kg) — sector-specific (nearest ESPR-Art7(5) substances of concern).
- Annex VI Part I(m): the Art. 7(12) consumer communication channel — sector-specific.
- Annex VI Part I(n): reference of the DPP service provider hosting the back-up — mirrors ESPR-AnnexIII(l).
- Annex VI Part II(a): optional safety information and warnings — mirrors ESPR-AnnexIII(f).
- Annex VI Part II(b): optional instructions of use — mirrors ESPR-AnnexIII(f).

Related clauses outside the chapter (not counted): Art. 3(16)-(20) definitions (data carrier, UPI, UOI imported from ESPR Art. 2(29)-(31); own DPP and DPP-service-provider definitions); Art. 7(2)(a),(b),(d) manufacturer creates DPP, affixes carrier, uploads to registry; Art. 7(3) keeps DPP 10 years; Art. 7(6) and 9(4) manufacturer / importer contact details may sit in the DPP; Art. 9(2)(c)-(e) importer verifies DPP, carrier, registry upload; Art. 47(1)(c)-(d) formal non-compliance; Annex IV 4.2 / Annex V 3.2 conformity-assessment modules ("create the DPP for a toy model … available for 10 years"); Annex II Appendix Part B point 1 (allergen names also in the DPP).

### 3. Sector-specific content elements (Annex VI)

Part I, mandatory: (a) unique product identifier; (b) manufacturer / authorised representative name, address, operator identifier; (c) responsible economic operator (Reg. 2019/1020 Art. 4) with operator identifier; (d) sole-responsibility statement; (e) object of the DPP with a colour image; (f) commodity code; (g) references to all Union law complied with; (h) mention that the DPP replaces the EU declaration of conformity under AI Act / CRA / RoHS / EMC / LVD / RED / drone rules; (i) harmonised standards or common specifications used; (j) notified body and certificate; (k) CE marking; (l) allergenic fragrances list; (m) consumer communication channel; (n) back-up service provider reference.
Part II, optional: (a) safety information and warnings; (b) instructions of use.

Documents replaced or embedded: the DPP **replaces the EU declaration of conformity** of Directive 2009/48/EC (recital 54, 58; Art. 19(2)(b), Annex VI(d),(g),(i),(j)) and, at the manufacturer's option, the EU declarations of conformity required by the AI Act, Cyber Resilience Act, RoHS, EMC, LVD, RED and Delegated Reg. 2019/945 (Art. 19(5)-(6), Annex VI(h)). It may carry the Art. 7(6)/9(4) contact details and the allergen labelling (Annex II Appendix Part B). Technical documentation is **not** embedded (Art. 7(3) keeps it separately; recital 57 foresees richer content later).

### 4. Explicit links to ESPR

- Recital (57): ESPR lays down DPP requirements, the registry and the CSW-CERTEX interconnection; ESPR "might include toys within its scope in the medium term"; the toy DPP "should therefore comply with the same requirements and technical elements as those set out in Regulation (EU) 2024/1781, including the technical, semantic and organisational aspects of end-to-end communication and data exchange". Recital (56): single DPP and full interoperability with any other Union-law DPP. Recital (63): customs verification through the ESPR Art. 15(3) interconnection.
- Art. 3(16), (18), (19): "data carrier", "unique product identifier", "unique operator identifier" defined by reference to ESPR Art. 2(29)-(31). "Digital product passport" (Art. 3(17)) and "DPP service provider" (Art. 3(20)) are defined locally, the latter with wording parallel to ESPR.
- Art. 21(1): carriers and identifiers comply with the standards applicable under ESPR (ESPR **Art. 10(1)(c) / Annex III** standards, not cited by number).
- Art. 21(2): ESPR **Art. 12(2)** applies (missing operator identifier); ESPR **Art. 12(4)** delegated acts apply.
- Art. 21(3): if the toy also falls under an ESPR **Art. 4** delegated act, the three identifiers are the same.
- Art. 21(4): ESPR **Art. 11 fourth paragraph** implementing acts (digital credentials) apply.
- Art. 21(5): ESPR **Art. 11 third paragraph** delegated acts (DPP service providers) apply.
- Art. 22(1): uploads into the registry established under ESPR **Art. 13(1)**.
- Art. 23(4): customs verification via the ESPR **Art. 15(3)** interconnection.
- Not referenced: ESPR Art. 9, 10 (other than by the standards clause), 14 (web portal), Annex III by name.
- "Compatible with / based on": no such words in the articles; the legal mechanism is the copy of ESPR Art. 10-11 text into Art. 19-20 plus the recital 57 statement "comply with the same requirements and technical elements". The Regulation has no precedence clause vis-a-vis ESPR.
- Presumption of conformity for the DPP: **none.** Art. 15 (presumption of conformity of toys via harmonised standards) and Art. 16 (common specifications) do not mention the DPP. The only standards hook is Art. 49(1)(c) (delegated act names the technical elements for which European or international standards are to be used) and Art. 21(1) (ESPR-applicable standards for identifiers and carriers).

### 5. Counts (Art. 19-24, Art. 49(1)-(3), Annex VI)

- Candidate Criteria: **83** (Art. 19: 25; Art. 20: 10; Art. 21: 6; Art. 22: 4; Art. 23: 6; Art. 24: 1; Art. 49(1)-(3): 15; Annex VI: 16).
- Mirror ESPR: **52** (44 exact, 8 "with delta": Art. 19(1), 19(2)(a),(c),(f),(g), 19(3), 19(7), 20(10)). Of these 13 are Commission-shaped (Art. 22(2) second subparagraph, 22(3), 23(1), 23(4), 49(1)(a),(b),(d),(e),(f), 49(3) first subparagraph and (b)-(d)).
- Sector-specific software-enabling: **18** (Art. 19(2)(b) compliance statement, 19(2)(e) languages, 19(6) declaration-replacement mention, 19(8) single carrier, 19(9) single DPP / batch override, 19(10) separation of extra data, 19(11) Safety Gate link, 20(4) no registration / password, 21(3) identical identifiers across regimes; Annex VI(d),(e),(g),(h),(i),(j),(k),(l),(m)).
- Organisational / Commission: **13** (Art. 19(4), 19(5)(a)-(d), 23(6), 24, 49(1)(c), 49(1) second-fourth subparagraphs, 49(2), 49(3)(a)).

---

## Detergents: Regulation (EU) 2026/405 (detergents and surfactants)

### 1. Dates

- Published OJ L 2026/405, 2.3.2026. Entry into force: 20th day after publication = **22 March 2026** (Art. 37 first paragraph; matches "five years from 22 March 2026" in Art. 31(2)).
- Application: **23 September 2029** for everything except Art. 4(3)-(4) (biodegradability deadlines 23 March 2032 / 2034) (Art. 37 second paragraph). The DPP duty (Art. 8(2)(a), Art. 21(1)) therefore applies from 23 September 2029; the repeal of Regulation (EC) No 648/2004 takes effect the same day (Art. 35).
- Transitional: Art. 36(1): products placed on the market before 23 September 2029 under Reg. 648/2004 may be made available indefinitely; Art. 36(2): products placed between 23 September 2029 and 22 September 2030 that comply with Reg. 648/2004 may be made available until 23 September 2030 (one-year grace during which DPP-less products can still be placed on the market).
- Acts the chapter waits on:
  - **Art. 21(10)** (implementing act, examination procedure Art. 32(2)): "basic technical requirements" covering at least (a) data carrier(s), (b) carrier layout and positioning, (c) technical elements for which European or international standards are to be used, (d) actors and access, (e) actors that create/update and what data, (f) arrangements for introducing/updating. "The Commission shall adopt" — mandatory, no deadline; application not earlier than 18 months after its entry into force (save justified cases). Art. 21(2)(f), 21(2)(i) and 21(4)(a) depend on it; Art. 29(1)(a),(c) make a DPP or carrier not compliant with Art. 21-22 / 21(4)(a),(d) a formal non-compliance.
  - **Art. 30(2)**: delegated acts amending Annex VI (DPP information). **Art. 30(3)**: delegated acts amending Art. 24(1) to store additional Annex VI information in the registry (criteria (a)-(d)).
  - **Art. 24(2) second subparagraph**: optional implementing act on registry arrangements and communication of the unique registration identifier.
  - **Art. 25(4)**: automatic customs verification via the registry–EU Customs Single Window Certificates Exchange System interconnection "shall apply from 23 September 2029 or from the date that interconnection is operational, whichever is later".
  - **Art. 30(10)**: by 1 October 2028 a delegated act on digital labelling (Art. 19); relevant because the digital label is reached through the DPP data carrier (Art. 19(1)(d), Art. 21(2)(h)).
  - **Art. 30(7)**: delegated acts on a harmonised format for the ingredients data sheet (Annex IV) — separate poison-centre document, not the DPP.
  - By reference (Art. 23(2), (4), (5)): ESPR Art. 12(2), ESPR Art. 12(4) delegated acts, ESPR Art. 11 fourth subparagraph implementing acts (credentials) and ESPR Art. 11 third subparagraph delegated acts (service providers) "shall also apply".
  - Registry precondition: Art. 24(1) uploads go into "the registry established under Article 13(1) of Regulation (EU) 2024/1781"; no fallback wording except the customs clause.
  - No harmonised-standard precondition for the DPP; the Regulation contains no presumption-of-conformity mechanism at all (the word does not occur).

### 2. Article-by-article paraphrase (Art. 21-25, Art. 30(2)-(3), Annex VI)

- Art. 21(1): manufacturer creates the DPP before placing the detergent or end-user surfactant on the market; DPP meets Art. 21 and 22 — mirrors ESPR-Art9(1) (first limb) with delta: creator fixed as the manufacturer.
- Art. 21(2)(a): corresponds to a specific model (recital 45: same model while formula / production changes do not alter the label) — mirrors ESPR-Art10(1)(f) / ESPR-Art9(2)(d) with delta: model level fixed.
- Art. 21(2)(b): states that compliance with the Regulation has been demonstrated — sector-specific.
- Art. 21(2)(c): contains at least the Annex VI Part A data — mirrors ESPR-Art9(2)(a) / ESPR-AnnexIII with delta: data set fixed in the law.
- Art. 21(2)(d): accurate, complete and up-to-date — mirrors ESPR-Art9(1).
- Art. 21(2)(e): available in the language(s) required by the Member State of making available — sector-specific.
- Art. 21(2)(f): accessible to consumers / end-users, market surveillance, customs, the Commission and other economic operators per the paragraph 10(d) access rights — mirrors ESPR-Art11(b) with delta: shorter actor list (no notified bodies, civil society, repairers).
- Art. 21(2)(g): available 10 years from placing on the market, including after insolvency etc. — mirrors ESPR-Art11(e) / ESPR-Art9(2)(i) with delta: fixed 10 years.
- Art. 21(2)(h): connected through a data carrier to a persistent unique product identifier — mirrors ESPR-Art10(1)(a).
- Art. 21(2)(i): fulfils the technical requirements laid down pursuant to paragraph 10 — mirrors ESPR-Art9(1) ("per the implementing act").
- Art. 21(3): may contain the Annex VI Part B data (label information) — mirrors ESPR-Art10(2) / ESPR-AnnexIII-para3 with delta: optional set fixed.
- Art. 21(4)(a): carrier printed or physically present on the label or packaging, or on accompanying documents for bulk transport, per the implementing act — mirrors ESPR-Art10(1)(b) with delta: bulk-transport documents.
- Art. 21(4)(b): carrier indelible — sector-specific.
- Art. 21(4)(c): carrier positioned so that digital devices can process it automatically — mirrors ESPR-Art9(2)(c) with delta: machine-processability fixed in the law.
- Art. 21(4)(d): carrier present on the refill station for refill sales — sector-specific.
- Art. 21(4)(e): carrier accompanied by "Please scan for more comprehensive information on the product" or similar — sector-specific.
- Art. 21(4)(f): carrier visible before purchase and to market surveillance, including in distance sales — mirrors ESPR-Art9(2)(e) with delta: fixed in the law.
- Art. 21(5): where other Union law requires a carrier, a single carrier serves both — sector-specific.
- Art. 21(6): where other Union law requires a DPP, a single DPP holds both data sets — sector-specific.
- Art. 21(7): DPP may be issued at batch or item level where other Union law requires it — sector-specific (derogation from model level).
- Art. 21(8): other information reachable through the carrier must be clearly separated — sector-specific.
- Art. 21(9): by creating the DPP the manufacturer assumes responsibility for compliance — organisational.
- Art. 21(10) chapeau: Commission shall adopt an implementing act with basic technical requirements; application at least 18 months after entry into force; examination procedure — Commission.
- Art. 21(10)(a): data carrier(s) to be used — mirrors ESPR-Art9(2)(b) (Commission).
- Art. 21(10)(b): carrier layout and positioning — mirrors ESPR-Art9(2)(c) (Commission).
- Art. 21(10)(c): technical elements for which defined European or international standards are to be used — Commission (sector-specific mechanism).
- Art. 21(10)(d): actors and their data access — mirrors ESPR-Art9(2)(f) (Commission).
- Art. 21(10)(e): actors that create or update and what data — mirrors ESPR-Art9(2)(g) (Commission).
- Art. 21(10)(f): detailed arrangements for introducing or updating data — mirrors ESPR-Art9(2)(h) (Commission).
- Art. 21(11): actors updating data are responsible for its accuracy unless acting for the manufacturer — organisational.
- Art. 21(12)(a): digital copy of the carrier or the unique product identifier to distributors and online marketplaces — mirrors ESPR-Art10(3)(a).
- Art. 21(12)(b): that copy or a web link free of charge, promptly, within five working days — mirrors ESPR-Art10(3)(b).
- Art. 21(12)(c): back-up copy through a DPP service provider — mirrors ESPR-Art10(4).
- Art. 22(a): fully interoperable with other Union-law DPPs (technical, semantic, organisational, end-to-end) — mirrors ESPR-Art11(a).
- Art. 22(b): open standards, interoperable format, machine-readable, structured, searchable, transferable via an open interoperable network, no vendor lock-in — mirrors ESPR-Art10(1)(d).
- Art. 22(c): consumers, operators, national and customs authorities, the Commission and other actors get free access per access rights — mirrors ESPR-Art11(b).
- Art. 22(d): consumers and other end-users are not required to register or provide a password — sector-specific.
- Art. 22(e): stored by the responsible economic operator or by DPP service providers — mirrors ESPR-Art11(c).
- Art. 22(f): a new DPP for a product that already has one or more is linked to them — mirrors ESPR-Art11(d).
- Art. 22(g): DPP service providers may not sell, reuse or process the data beyond the service unless agreed — mirrors ESPR-Art11-sub2.
- Art. 22(h): no tracking, analysis or use of usage information beyond serving the DPP; no consumer personal data without explicit consent — mirrors ESPR-Art10(1)(e) with delta: explicit no-tracking prohibition.
- Art. 22(i): data authentication, reliability and integrity ensured — mirrors ESPR-Art11(g).
- Art. 22(j): high level of security and privacy; fraud avoided — mirrors ESPR-Art11(h).
- Art. 23(1): carrier, unique product and operator identifiers comply with the standards applicable under ESPR — mirrors ESPR-Art10(1)(c) + ESPR-Art12(1) (+ ESPR-AnnexIII-para2).
- Art. 23(2): ESPR Art. 12(2) applies where an operator identifier is missing; ESPR Art. 12(4) lifecycle rules also apply — mirrors ESPR-Art12(2) + ESPR-Art12(4)/(5).
- Art. 23(3): where the product is also under an ESPR Art. 4 delegated act or other Union law, unique product, operator and registration identifiers are the same — sector-specific.
- Art. 23(4): ESPR Art. 11 fourth subparagraph implementing acts on digital credentials also apply — mirrors ESPR-Art11-sub4.
- Art. 23(5): ESPR Art. 11 third subparagraph delegated-act requirements for DPP service providers also apply — mirrors ESPR-Art11-sub3.
- Art. 24(1) first subparagraph: before placing on the market, the operator uploads unique product and operator identifiers into the ESPR Art. 13(1) registry — mirrors ESPR-Art13(4).
- Art. 24(1) second subparagraph: for imports the registry stores the commodity code — mirrors ESPR-Art13(1) (Commission).
- Art. 24(2) first subparagraph: registry automatically returns a unique registration identifier; not proof of compliance — mirrors ESPR-Art13(5).
- Art. 24(2) second subparagraph: Commission may adopt an implementing act on registry arrangements — mirrors ESPR-Art13(5)-sub2 (Commission).
- Art. 24(3): Commission, national and customs authorities have registry access — mirrors ESPR-Art13(6) (Commission).
- Art. 25(1): products entering the Union are subject to this article — Commission (scope).
- Art. 25(2): the declarant provides the unique registration identifier to customs — mirrors ESPR-Art15(1).
- Art. 25(3): customs release only after verifying registration identifier and commodity code against the registry; not proof of compliance — mirrors ESPR-Art15(2).
- Art. 25(4): verification electronic and automatic via the registry–customs single window interconnection, from 23 September 2029 or when operational — mirrors ESPR-Art15(3) (Commission).
- Art. 25(5): customs and the Commission may retrieve and use DPP and registry data — mirrors ESPR-Art15(4).
- Art. 25(6): controls based on the Annex VII commodity-code list — Commission.
- Art. 25(7): without prejudice to the Customs Code and Reg. 2019/1020 Chapter VII — mirrors ESPR-Art15(5) (Commission).
- Art. 30(2): delegated acts amend Annex VI for technical progress and digital readiness — Commission.
- Art. 30(3) first subparagraph: delegated acts amend Art. 24(1) to store additional Annex VI information in the registry — mirrors ESPR-Art13(2) (Commission).
- Art. 30(3)(a): criterion coherence with other Union acts — Commission.
- Art. 30(3)(b): criterion verification of DPP authenticity — mirrors ESPR-Art13(2)(a) (Commission).
- Art. 30(3)(c): criterion relevance for market surveillance and customs — mirrors ESPR-Art13(2)(b) (Commission).
- Art. 30(3)(d): criterion avoiding disproportionate burden — mirrors ESPR-Art13(2)(c) (Commission).
- Annex VI Part A(a): trade name, unique product identifier and a colour image of packaging or label clear enough to identify the model — mirrors ESPR-AnnexIII(b) with delta: trade name and image added.
- Annex VI Part A(b): manufacturer (and importer / authorised representative) name, postal and electronic address, telephone, plus manufacturer operator identifier — mirrors ESPR-AnnexIII(g) + (j) with delta: telephone; importer without EORI.
- Annex VI Part A(c): reference of the DPP service provider hosting the back-up — mirrors ESPR-AnnexIII(l).
- Annex VI Part A(d): identification of the product allowing traceability — sector-specific (nearest ESPR-AnnexIII(b)).
- Annex VI Part A(e): indication that the DPP is issued under the manufacturer's sole responsibility — sector-specific.
- Annex VI Part A(f): commodity codes at creation, where applicable — mirrors ESPR-AnnexIII(d).
- Annex VI Part A(g): statement that compliance has been demonstrated and references to other Union law complied with — sector-specific (nearest ESPR-AnnexIII(e)).
- Annex VI Part A(h): full list of intentionally added substances identified per CLP Art. 18(3), including labelled carry-over preservatives — sector-specific (nearest ESPR-Art7(5), but covers all ingredients, not substances of concern).
- Annex VI Part A(h) carve-out: not required for industrial / institutional detergents or surfactants where a REACH Art. 31 safety data sheet gives the equivalent information — organisational.
- Annex VI Part A(i): list of intentionally added micro-organisms with taxonomy (genus, species, strain) — sector-specific.
- Annex VI Part B: may include the Art. 17(3)-(4) label information (Annex V Part A general labelling, Part B dosage) — sector-specific optional content (nearest ESPR-AnnexIII(f)).

Related clauses outside the chapter (not counted): Art. 2(29)-(33) definitions (data carrier, UPI, UOI, DPP service provider imported from ESPR Art. 2(29)-(32); own DPP definition tied to Annex VI Part A and Art. 21(4)); Art. 8(2)(a)-(c) manufacturer creates DPP, ensures carrier, registers; Art. 8(3) keeps and updates DPP 10 years; Art. 9(3)(a)-(b) authorised representative verifies and keeps; Art. 10(2)(c) importer verifies; Art. 17(2) refill: physical label and carrier for every refilled packaging; Art. 19(1)(d) digital label accessible via the DPP carrier; Art. 20 distance sales show a digital copy of the carrier or the UPI; Art. 29(1)(a),(c) formal non-compliance; Annex IV point 4 (Module A: create the DPP per model, available 10 years, identifies the product).

### 3. Sector-specific content elements (Annex VI)

Part A, mandatory: (a) trade name, unique product identifier, colour image of packaging / label; (b) manufacturer and, where applicable, importer or authorised representative contact details incl. telephone, manufacturer operator identifier; (c) back-up service provider reference; (d) traceability identification; (e) sole-responsibility indication; (f) commodity codes; (g) compliance statement and other Union law references; (h) full list of intentionally added substances (CLP identification), incl. labelled carry-over preservatives — waived where a REACH safety data sheet covers it (industrial / institutional detergents, surfactants); (i) intentionally added micro-organisms with taxonomy.
Part B, optional: label information of Annex V Parts A and B (general labelling, dosage).

Documents replaced or embedded: the DPP is the **replacement for an EU declaration of conformity** (recital 44: "starting from the EU declaration of conformity"; Art. 21(2)(b), 21(9), Annex VI(e),(g)); the **ingredient list** overlaps the ingredients data sheet (Annex IV 2.2(e)) but that sheet stays a separate confidential submission to poison-centre bodies (Art. 8(6), Art. 16) and is not embedded; the **safety data sheet** (REACH Art. 31) substitutes for the ingredient list for B2B products; the **label** (Annex V) may be duplicated in the DPP (Part B) and the **digital label** (Art. 18-19) shares the DPP data carrier (Art. 19(1)(d)); technical documentation is not embedded (recital 44: "could be envisaged in the future").

### 4. Explicit links to ESPR

- Recital (47): ESPR lays down DPP requirements, the registry and the customs single-window interconnection; ESPR "could include detergents or surfactants within its scope in the medium term". Recital (48): the detergent DPP "should therefore comply with the same requirements and technical elements as those set out in Regulation (EU) 2024/1781, including its technical, semantic and organisational aspects of end-to-end communication and data exchange". Recital (46): single DPP and full interoperability with any other Union-law DPP.
- Art. 2(29), (30), (31), (33): "data carrier", "unique product identifier", "unique operator identifier" and "digital product passport service provider" defined by reference to ESPR Art. 2(29)-(32). "Digital product passport" (Art. 2(32)) defined locally.
- Art. 23(1): carriers and identifiers comply with the standards applicable under ESPR (ESPR **Art. 10(1)(c) / Annex III** standards in substance).
- Art. 23(2): ESPR **Art. 12(2)** applies; ESPR **Art. 12(4)** delegated acts apply.
- Art. 23(3): if also under an ESPR **Art. 4** delegated act, identifiers are the same.
- Art. 23(4): ESPR **Art. 11 fourth subparagraph** implementing acts (credentials) apply.
- Art. 23(5): ESPR **Art. 11 third subparagraph** delegated acts (service providers) apply.
- Art. 24(1): uploads into the registry established under ESPR **Art. 13(1)**.
- Art. 25(4): interconnection with the EU Customs Single Window Certificates Exchange System (ESPR Art. 15(3) in substance; the ESPR article is not cited by number here, unlike Toys).
- Not referenced: ESPR Art. 9, 10, 14, Annex III by name. No precedence clause. No "compatible with / based on" wording in the articles; alignment is achieved by copying ESPR Art. 10-11 into Art. 21-22 and by recital 48.
- Presumption of conformity for the DPP: **none**; the Regulation has no harmonised-standard presumption mechanism at all. The only standards hooks are Art. 21(10)(c) (implementing act names the elements for which European / international standards are used) and Art. 23(1).

### 5. Counts (Art. 21-25, Art. 30(2)-(3), Annex VI)

- Candidate Criteria: **77** (Art. 21: 33; Art. 22: 10; Art. 23: 5; Art. 24: 5; Art. 25: 7; Art. 30(2)-(3): 6; Annex VI: 11).
- Mirror ESPR: **51** (39 exact, 12 "with delta": Art. 21(1), 21(2)(a),(c),(f),(g), 21(3), 21(4)(a),(c),(f), 22(h), Annex VI(a),(b)). Of these 14 are Commission-shaped (Art. 21(10)(a),(b),(d),(e),(f), 24(1) second subparagraph, 24(2) second subparagraph, 24(3), 25(4), 25(7), 30(3) first subparagraph and (b)-(d)).
- Sector-specific software-enabling: **17** (Art. 21(2)(b) compliance statement, 21(2)(e) languages, 21(4)(b) indelible carrier, 21(4)(d) refill-station carrier, 21(4)(e) "please scan" statement, 21(5) single carrier, 21(6) single DPP, 21(7) batch / item override, 21(8) separation of extra data, 22(d) no registration / password, 23(3) identical identifiers; Annex VI(d),(e),(g),(h),(i), Part B).
- Organisational / Commission: **9** (Art. 21(9), 21(10) chapeau, 21(10)(c), 21(11), 25(1), 25(6), 30(2), 30(3)(a), Annex VI(h) carve-out).

---

## Summary table

| Law | Applies from (DPP duty) | Precondition acts | Candidate Criteria | Mirror ESPR | Distinct software-relevant additions |
|---|---|---|---|---|---|
| CPR 2024/3110 (Art. 75-80) | No calendar date: 18 months after the Art. 75(1) delegated act enters into force (Art. 22(7), 80(1)); system operational 6 months after; Regulation itself applies 8 Jan 2026 (Art. 96); per product family also gated by Art. 95(9) | Art. 75(1) delegated act (mandatory, no deadline); Art. 80(2) amending acts; Art. 15(5) Annex V amendment; Art. 16(3) ESO guidelines; ESPR Art. 12/13/14 by reference (Art. 79), overridable via Art. 75(2)(h); CPR prevails over ESPR (Art. 12(2)) | 55 | 42 / 55 = 76 % (19 with delta; 11 Commission-shaped) | product-type granularity with manufacturer code, declaration of performance and conformity with environmental data and REACH info embedded, technical documentation embedded, sustainability label, key-part DPP carriers (component linkage), Union-database links, BIM interoperability, 25-year system / 10-year operator retention from last product of type, carrier co-located with CE marking, declaration-format guidelines, trade-secret / IP protection as essential requirement, multi-language declaration (Art. 16(4)), manufacturer supplies carrier copy to online sellers |
| Toys 2025/2509 (Art. 19-24, 49(1)-(3), Annex VI) | 1 Aug 2030 (Art. 59); entry into force 1 Jan 2026; pre-2030 toys grandfathered (Art. 57(1)) | Art. 49(1) delegated act (technical requirements; no deadline; applies at least 18 months after its entry into force); Art. 49(2)-(3) amending acts; optional Art. 22(2) implementing act; ESPR Art. 13(1) registry; ESPR Art. 15(3) interconnection for customs (Art. 23(4)); ESPR Art. 11/12 acts by reference (Art. 21) | 83 | 52 / 83 = 63 % (8 with delta; 13 Commission-shaped) | model-level DPP fixed, DPP replaces EU declaration of conformity (own + AI Act / CRA / RoHS / EMC / LVD / RED / drones) with Annex VI fields (sole-responsibility statement, Union-law references, harmonised standards, notified body, CE marking, colour image), allergenic-fragrance list, consumer communication channel, Safety Gate Portal link on access, no registration / password, no usage tracking, Member-State languages, single carrier / single DPP with batch override, separation of non-regulated data, identical identifiers across regimes, 10-year availability, carrier placement priority fixed |
| Detergents 2026/405 (Art. 21-25, 30(2)-(3), Annex VI) | 23 Sep 2029 (Art. 37); entry into force 22 Mar 2026; one-year grace to 23 Sep 2030 for Reg. 648/2004-compliant products (Art. 36(2)) | Art. 21(10) implementing act (mandatory, no deadline; applies at least 18 months after its entry into force); Art. 30(2)-(3) delegated acts; optional Art. 24(2) implementing act; ESPR Art. 13(1) registry; customs interconnection from 23 Sep 2029 or later when operational (Art. 25(4)); Art. 30(10) digital-label act by 1 Oct 2028 (shares the carrier); ESPR Art. 11/12 acts by reference (Art. 23) | 77 | 51 / 77 = 66 % (12 with delta; 14 Commission-shaped) | model-level DPP fixed with batch / item override, DPP as declaration-of-conformity replacement (compliance statement, sole-responsibility indication, Union-law references), full intentionally-added ingredient list (CLP identification) with SDS carve-out, micro-organism taxonomy list, trade name plus colour image, telephone contact, optional label / dosage duplication, digital label reached through the same carrier, refill-station carrier, "please scan" statement, indelible machine-processable carrier, no registration / password, no usage tracking, Member-State languages, single carrier / single DPP, separation of non-regulated data, identical identifiers across regimes, 10-year availability |
