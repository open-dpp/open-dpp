# Conformance Review: Tier A criteria (EU law)

Research note for the open-dpp Conformance Review (map #749, ticket #752). Enumerates one Criterion per article paragraph, sub-point, sub-paragraph or annex point of the four Tier A texts, read from the Publications Office Cellar on **2026-09-03**. Companion notes: `public-sources.md` (source list and fetch recipe) and `capability-inventory.md` (the numbered open-dpp areas referenced in the `area` column).

## 0. Conventions

- **id** scheme: `ESPR-Art10(1)(c)`, `ESPR-AnnexIII(c)`, `BATT-Art77(3)`, `BATT-AnnexXIII-1(a)`, `REG1778-Art9(2)`, `DEC1736-EN18219`. Unnumbered sub-paragraphs are suffixed `-sub2`, `-sub3`; unnumbered dashes in Batteries Annex XIII point 2(c) are suffixed `-1` to `-6`; a paragraph's introductory sentence is the `chapeau` row and gets the bare paragraph id.
- **paraphrase** is in my own words; short quoted terms only. Always read the source clause before assessing.
- **applicability**:
  - `software`: open-dpp can satisfy or enable the clause on its own.
  - `operator`: purely organisational duty of the economic operator, DPP service provider or value chain actor. Will be assessed Not applicable.
  - `commission`: duty or power of the Commission, Member States, customs or market surveillance authorities. Will be assessed Not applicable.
  - `mixed`: an organisational or Commission duty that has a software precondition open-dpp must provide (for instance the DPP must expose a hashable version, or a registry client must exist). Assessed on the software part only.
- **area**: number(s) from `capability-inventory.md` sections 1-13 that the clause touches, even where applicability is `commission` (so that the later assessment can find the touch points). `—` when no area is touched.
- **EN**: the CEN/CENELEC JTC 24 standard that operationalises the clause where evident from its title and scope (EN 18219 identifiers, 18220 carriers, 18216 exchange protocols, 18222 APIs, 18223 interoperability, 18221 persistence, 18239 access and security, 18246 authentication and integrity). This column is an inference from titles and from the M/604 work split; the standards themselves are gated and their Annex ZA mappings were not read. `—` when none is evident.

## 1. ESPR, Regulation (EU) 2024/1781

Text used: consolidated CELEX **02024R1781-20240628** (Cellar, generated 2025-08-21), which incorporates Corrigenda C1 (OJ L, 7.8.2024) and C2 (OJ L, 28.4.2025). C2 rewrites Art. 10(1)(d). Source: `http://publications.europa.eu/resource/celex/02024R1781-20240628`.

Scope covered: Art. 7(2)(b), 7(5), 9, 10, 11, 12, 13, 14, 15 and Annex III (all points and the standards paragraph).

| id | clause | paraphrase | applicability | area | EN |
|---|---|---|---|---|---|
| ESPR-Art7(2)(b)(i) | Art. 7(2)(b)(i) | Products may have to be accompanied by performance information on Annex I parameters, including a repairability score, durability score, carbon footprint or environmental footprint. | software | 8 | — |
| ESPR-Art7(2)(b)(ii) | Art. 7(2)(b)(ii) | Information for customers and other actors on installing, using, maintaining and repairing the product, installing third-party operating systems, collection for refurbishment or remanufacture, and return or end-of-life handling. | software | 8, 11 | — |
| ESPR-Art7(2)(b)(iii) | Art. 7(2)(b)(iii) | Information for treatment facilities on disassembly, reuse, refurbishment, recycling or disposal at end-of-life. | software | 8, 5 | 18239 |
| ESPR-Art7(2)(b)(iv) | Art. 7(2)(b)(iv) | Other information that can influence sustainable purchasing choices or how parties other than the manufacturer handle the product. | software | 8 | — |
| ESPR-Art7(5) | Art. 7(5) chapeau | Information requirements must make "substances of concern" trackable through the whole product life cycle (unless another delegated act already does so), covering at least points (a) to (e). | software | 8, 9 | — |
| ESPR-Art7(5)(a)(i) | Art. 7(5)(a)(i) | IUPAC name of each substance of concern, or another international name if none. | software | 8 | — |
| ESPR-Art7(5)(a)(ii) | Art. 7(5)(a)(ii) | Other names of the substance: usual name, trade name, abbreviation. | software | 8 | — |
| ESPR-Art7(5)(a)(iii) | Art. 7(5)(a)(iii) | EC number (EINECS, ELINCS or NLP list) or ECHA-assigned number, where available and appropriate. | software | 8 | — |
| ESPR-Art7(5)(a)(iv) | Art. 7(5)(a)(iv) | CAS name and number, where available. | software | 8 | — |
| ESPR-Art7(5)(b) | Art. 7(5)(b) | Location of the substances of concern within the product. | software | 8 | — |
| ESPR-Art7(5)(c) | Art. 7(5)(c) | Concentration, maximum concentration or concentration range, at product, component or spare-part level. | software | 8 | — |
| ESPR-Art7(5)(d) | Art. 7(5)(d) | Relevant instructions for safe use of the product. | software | 8, 11 | — |
| ESPR-Art7(5)(e) | Art. 7(5)(e) | Information relevant to disassembly, preparation for reuse, reuse, recycling and environmentally sound end-of-life management. | software | 8 | — |
| ESPR-Art7(5)-sub2 | Art. 7(5) second subparagraph | The Commission may set thresholds below which the substances-of-concern requirement does not apply. | commission | — | — |
| ESPR-Art9(1) | Art. 9(1) | A product may only be placed on the market or put into service if a DPP exists per the delegated act and Arts. 10-11; DPP data must be accurate, complete and up to date. | mixed | 1, 6 | 18222 |
| ESPR-Art9(2) | Art. 9(2) chapeau | Delegated acts specify the DPP requirements per product group, covering points (a) to (i). | commission | — | — |
| ESPR-Art9(2)(a) | Art. 9(2)(a) | Which data from Annex III go into the DPP. | mixed | 8 | — |
| ESPR-Art9(2)(b) | Art. 9(2)(b) | Which data carrier(s) are to be used. | mixed | 4 | 18220 |
| ESPR-Art9(2)(c) | Art. 9(2)(c) | Layout and positioning of the data carrier. | operator | 4 | 18220 |
| ESPR-Art9(2)(d) | Art. 9(2)(d) | Whether the DPP is at model, batch or item level, and how those levels are defined. | mixed | 3, 8 | 18219 |
| ESPR-Art9(2)(e) | Art. 9(2)(e) | How customers can reach the DPP before being bound by a sale, hire or hire-purchase contract, including in distance selling. | mixed | 11, 3 | 18220 |
| ESPR-Art9(2)(f) | Art. 9(2)(f) | Which actors get access to which DPP data. | mixed | 5 | 18239 |
| ESPR-Art9(2)(g) | Art. 9(2)(g) | Which actors may create a DPP or update its data, and which data they may introduce or update. | mixed | 5 | 18239, 18222 |
| ESPR-Art9(2)(h) | Art. 9(2)(h) | Detailed arrangements for introducing or updating data. | mixed | 1, 5, 6 | 18222 |
| ESPR-Art9(2)(i) | Art. 9(2)(i) | The period the DPP must remain available, at least the product's expected lifetime. | mixed | 6 | 18221 |
| ESPR-Art9(3)(a) | Art. 9(3)(a) | The requirements must let value-chain actors easily access and understand the product information relevant to them. | commission | 11 | — |
| ESPR-Art9(3)(b) | Art. 9(3)(b) | They must facilitate compliance verification by competent national authorities. | commission | 5 | — |
| ESPR-Art9(3)(c) | Art. 9(3)(c) | They must improve product traceability along the value chain. | commission | 9 | — |
| ESPR-Art9(4)(a) | Art. 9(4)(a) | The Commission may exempt product groups where technical specifications for the Art. 10-11 essential requirements are unavailable. | commission | — | — |
| ESPR-Art9(4)(b) | Art. 9(4)(b) | The Commission may exempt product groups where other Union law already provides an equivalent digital information system. | commission | — | — |
| ESPR-Art10(1)(a) | Art. 10(1)(a) | The DPP is connected through a data carrier to a persistent unique product identifier. | software | 3, 4 | 18219, 18220 |
| ESPR-Art10(1)(b) | Art. 10(1)(b) | The data carrier is physically present on the product, its packaging or accompanying documentation, as the delegated act specifies. | mixed | 4 | 18220 |
| ESPR-Art10(1)(c) | Art. 10(1)(c) | Carrier and unique product identifier comply with the Annex III second-paragraph standards (ISO/IEC 15459 series) or equivalents until harmonised standards are cited in the OJ (now done by Decision 2026/1736 for six ENs). | software | 3, 4 | 18219, 18220 |
| ESPR-Art10(1)(d) | Art. 10(1)(d) (as corrected by C2) | All DPP data are based on open standards in an interoperable format and, as appropriate, machine-readable, structured, searchable and transferable through an open interoperable data exchange network "without vendor lock-in", per Arts. 10-11. | software | 1, 2, 13 | 18216, 18222, 18223 |
| ESPR-Art10(1)(e) | Art. 10(1)(e) | No customer personal data in the DPP without explicit consent under GDPR Art. 6. | mixed | 5, 10 | 18239 |
| ESPR-Art10(1)(f) | Art. 10(1)(f) | DPP data refer to the product model, batch or item as the delegated act specifies. | software | 3, 8 | 18219 |
| ESPR-Art10(1)(g) | Art. 10(1)(g) | Access to DPP data is regulated per the Art. 10-11 essential requirements and the product-group access rights in the delegated act. | software | 5 | 18239 |
| ESPR-Art10(1)-sub2 | Art. 10(1) second subparagraph | The Commission may amend Annex III point (c) and its second paragraph to replace or add identifier and carrier standards. | commission | — | — |
| ESPR-Art10(2) | Art. 10(2) | Data required or allowed by other Union law may be included in the DPP as the delegated act provides. | mixed | 8 | — |
| ESPR-Art10(3)(a) | Art. 10(3)(a) | The operator gives dealers and online marketplaces a digital copy of the data carrier or of the UPI so customers without physical access can reach the DPP. | mixed | 4, 3 | 18220 |
| ESPR-Art10(3)(b) | Art. 10(3)(b) | That digital copy or a web link is provided free of charge, promptly and within five working days of a request. | operator | — | — |
| ESPR-Art10(4) | Art. 10(4) | When placing the product on the market the operator makes a back-up copy of the DPP available through a DPP service provider. | mixed | 6, 2 | 18221 |
| ESPR-Art11(a) | Art. 11 first subparagraph (a) | The DPP is fully interoperable with other delegated-act DPPs in the technical, semantic and organisational aspects of end-to-end communication and data transfer. | software | 1, 2, 7, 8 | 18223, 18216 |
| ESPR-Art11(b) | Art. 11 first subparagraph (b) | Customers, all economic operators, repairers, refurbishers, recyclers, market surveillance and customs authorities, civil society, trade unions and other actors get free and easy DPP access per their delegated-act access rights. | software | 5, 11 | 18239, 18222 |
| ESPR-Art11(c) | Art. 11 first subparagraph (c) | The DPP is stored by the responsible economic operator or by DPP service providers. | mixed | 6 | 18221 |
| ESPR-Art11(d) | Art. 11 first subparagraph (d) | A new DPP created for a product that already has one is linked to the original DPP(s). | software | 3, 6 | 18219, 18223 |
| ESPR-Art11(e) | Art. 11 first subparagraph (e) | The DPP stays available for the delegated-act period, including after insolvency, liquidation or cessation of the operator's activity in the Union. | mixed | 6 | 18221 |
| ESPR-Art11(f) | Art. 11 first subparagraph (f) | Rights to introduce, modify or update DPP data are restricted per the delegated-act access rights. | software | 5 | 18239, 18222 |
| ESPR-Art11(g) | Art. 11 first subparagraph (g) | Data authentication, reliability and integrity are ensured. | software | 10 | 18246 |
| ESPR-Art11(h) | Art. 11 first subparagraph (h) | The DPP is designed and operated with a high level of security and privacy and so that fraud is avoided. | software | 10, 5 | 18239, 18246 |
| ESPR-Art11-sub2 | Art. 11 second subparagraph | DPP service providers may not sell, reuse or process DPP data beyond what the storage or processing service needs, unless the operator agrees. | operator | — | 18221 |
| ESPR-Art11-sub3 | Art. 11 third subparagraph | The Commission may set requirements for DPP service providers and an optional certification scheme by delegated act. | commission | — | 18221 |
| ESPR-Art11-sub4 | Art. 11 fourth subparagraph | The Commission may adopt implementing acts on issuing and verifying the digital credentials of actors with access rights. | commission | 5 | 18239 |
| ESPR-Art12(1) | Art. 12(1) | Unique operator identifiers (Annex III (g), (h)) and facility identifiers (Annex III (i)) comply with the Annex III standards or equivalents until harmonised standards are cited. | software | 3 | 18219 |
| ESPR-Art12(2) | Art. 12(2) incl. second subparagraph | Where an actor has no operator identifier, the operator creating or updating the DPP first confirms none exists, then requests one on the actor's behalf and passes on the details. | operator | 3 | 18219 |
| ESPR-Art12(3) | Art. 12(3) incl. second subparagraph | Same procedure for missing facility identifiers, on behalf of the actor responsible for the location or building. | operator | 3 | 18219 |
| ESPR-Art12(4)(a) | Art. 12(4)(a) | Delegated acts set rules for organisations wishing to become an issuing agency for unique identifiers and data carriers. | commission | — | 18219 |
| ESPR-Art12(4)(b) | Art. 12(4)(b) | Delegated acts set rules for operators creating their own identifiers and carriers without an issuing agency. | commission | 3 | 18219 |
| ESPR-Art12(5)(a) | Art. 12(5)(a) | Those acts set the criteria to become an issuing agency. | commission | — | 18219 |
| ESPR-Art12(5)(b) | Art. 12(5)(b) | They set the role of an issuing agency. | commission | — | 18219 |
| ESPR-Art12(5)(c) | Art. 12(5)(c) | They set rules ensuring identifiers and carriers are reliable, verifiable and globally unique. | commission | 3 | 18219 |
| ESPR-Art12(5)(d) | Art. 12(5)(d) | They set rules on creating, maintaining, updating and withdrawing identifiers and carriers. | commission | 3 | 18219 |
| ESPR-Art12(5)(e) | Art. 12(5)(e) | They set rules on data management. | commission | — | 18219 |
| ESPR-Art12(6)(a) | Art. 12(6)(a) | In doing so the Commission seeks interoperability between different approaches. | commission | — | — |
| ESPR-Art12(6)(b) | Art. 12(6)(b) | It takes existing technical solutions and standards into account. | commission | — | — |
| ESPR-Art12(6)(c) | Art. 12(6)(c) | It keeps the rules as technologically neutral as possible. | commission | — | — |
| ESPR-Art13(1) | Art. 13(1) (four subparagraphs) | By 19 July 2026 the Commission sets up and securely manages a registry storing at least the unique identifiers, the commodity code for goods released for free circulation, and battery identifiers under Reg. 2023/1542 Art. 77(3). | commission | 7 | — |
| ESPR-Art13(2) | Art. 13(2) chapeau | Delegated acts may name further DPP data to be stored in the registry, weighing points (a) to (c). | commission | 7 | — |
| ESPR-Art13(2)(a) | Art. 13(2)(a) | Criterion: the need to verify DPP authenticity. | commission | 10 | 18246 |
| ESPR-Art13(2)(b) | Art. 13(2)(b) | Criterion: relevance for market surveillance and customs efficiency. | commission | — | — |
| ESPR-Art13(2)(c) | Art. 13(2)(c) | Criterion: avoiding disproportionate burden on operators and customs. | commission | — | — |
| ESPR-Art13(3) | Art. 13(3) | The Commission is the data controller for registry personal data. | commission | — | — |
| ESPR-Art13(4) | Art. 13(4) | The operator placing the product on the market uploads the Art. 13(1)-(2) data into the registry. | mixed | 7, 3 | 18223 |
| ESPR-Art13(5) | Art. 13(5) first subparagraph | On upload the registry automatically returns a unique registration identifier tied to the uploaded identifiers; this is not proof of compliance. | mixed | 7 | 18223 |
| ESPR-Art13(5)-sub2 | Art. 13(5) second and third subparagraphs | The Commission adopts an implementing act on registry arrangements (this is Reg. 2026/1778). | commission | — | — |
| ESPR-Art13(6) | Art. 13(6) | The Commission, national and customs authorities have registry access for their duties. | commission | — | — |
| ESPR-Art14 | Art. 14 | The Commission runs a public web portal for searching and comparing DPP data, consistent with the delegated-act access rights. | commission | 1, 5 | 18222 |
| ESPR-Art15(1) | Art. 15(1) | Whoever declares a covered product for release for free circulation provides the Art. 13(5) registration identifier to customs, once the registry is operational. | mixed | 7 | — |
| ESPR-Art15(2) | Art. 15(2) | Customs release only after automatically verifying the registration identifier and commodity code against the registry; release is not proof of compliance. | commission | — | — |
| ESPR-Art15(3) | Art. 15(3) | The Commission interconnects the registry with EU CSW-CERTEX within four years of the implementing act's entry into force. | commission | — | — |
| ESPR-Art15(4) | Art. 15(4) | The Commission and customs may retrieve and use DPP and registry data for risk management, controls and release. | commission | 5 | 18239 |
| ESPR-Art15(5) | Art. 15(5) | Without prejudice to the Union Customs Code and market surveillance rules. | commission | — | — |
| ESPR-AnnexIII | Annex III first paragraph chapeau | Delegated acts specify which of the elements (a) to (l) must or may be included in the DPP. | commission | 8 | — |
| ESPR-AnnexIII(a) | Annex III (a) | Information required under Art. 7(2)(b), Art. 7(5) or other Union law for the product group. | software | 8 | — |
| ESPR-AnnexIII(b) | Annex III (b) | The unique product identifier at the level the delegated act sets. | software | 3 | 18219 |
| ESPR-AnnexIII(c) | Annex III (c) | The GTIN per ISO/IEC 15459-6 or equivalent, of the product or its parts. | software | 3 | 18219 |
| ESPR-AnnexIII(d) | Annex III (d) | Relevant commodity codes, such as a TARIC code. | software | 8 | — |
| ESPR-AnnexIII(e) | Annex III (e) | Compliance documentation: declaration of conformity, technical documentation, conformity certificates. | software | 8, 2 | — |
| ESPR-AnnexIII(f) | Annex III (f) | User manuals, instructions, warnings or safety information required by other Union law. | software | 8, 11 | — |
| ESPR-AnnexIII(g) | Annex III (g) | Manufacturer information, including its unique operator identifier and the Art. 27(7) details. | software | 3, 8 | 18219 |
| ESPR-AnnexIII(h) | Annex III (h) | Unique operator identifiers other than the manufacturer's. | software | 3 | 18219 |
| ESPR-AnnexIII(i) | Annex III (i) | Unique facility identifiers. | software | 3 | 18219 |
| ESPR-AnnexIII(j) | Annex III (j) | Importer information, including the Art. 29(3) details and EORI number. | software | 8 | — |
| ESPR-AnnexIII(k) | Annex III (k) | Name, contact details and operator identifier of the EU-established responsible economic operator (Reg. 2019/1020 Art. 4, Reg. 2023/988 Art. 15 or similar). | software | 3, 8 | 18219 |
| ESPR-AnnexIII(l) | Annex III (l) | Reference of the DPP service provider hosting the back-up copy. | software | 6, 8 | 18221 |
| ESPR-AnnexIII-para2 | Annex III second paragraph | Data carrier, UPI (b), operator identifiers (g), (h), (k) and facility identifiers (i) comply, where relevant, with ISO/IEC 15459-1:2014, -2:2015, -3:2014, -4:2014, -5:2014 and -6:2014. | software | 3, 4 | 18219, 18220 |
| ESPR-AnnexIII-para3 | Annex III third paragraph | Delegated acts identify voluntary ecodesign-relevant information manufacturers may add, including voluntary labels and whether an EU Ecolabel was awarded. | mixed | 8 | — |

## 2. Batteries Regulation, Regulation (EU) 2023/1542

Text used: consolidated CELEX **02023R1542-20250731** (Cellar, generated 2026-06-30), version 002.004, incorporating amendments M1 (Reg. 2024/1781) and M2 (Reg. 2025/1561) and Corrigenda C1 (17.4.2024), C2 (7.8.2024, to Reg. 2024/1781), C3 (8.10.2025) and C4 (10.4.2026). C2 marks Art. 77(10); C4 marks Annex XIII point 1(q). Source: `http://publications.europa.eu/resource/celex/02023R1542-20250731`.

Scope covered: Art. 13(6), 77, 78 and Annex XIII. The `access` column gives the access class of Annex XIII data: `public`, `legitimate interest` (persons with a legitimate interest, plus the Commission for point 2), `authorities` (notified bodies, market surveillance authorities, Commission).

| id | clause | paraphrase | access | applicability | area | EN |
|---|---|---|---|---|---|---|
| BATT-Art13(6) | Art. 13(6) chapeau | From 18 February 2027 every battery carries a QR code per Annex VI Part C (high contrast, readable by common hand-held QR readers). | — | mixed | 4 | 18220 |
| BATT-Art13(6)(a) | Art. 13(6)(a) | For LMT batteries, industrial batteries above 2 kWh and EV batteries the QR code gives access to the battery passport. | — | software | 4, 3, 11 | 18220, 18219 |
| BATT-Art13(6)(b) | Art. 13(6)(b) | For other batteries the QR code gives access to the Art. 13(1)-(5) label information, the declaration of conformity, the due-diligence report and the Art. 74(1)(a)-(f) waste information. | — | software | 11, 8 | 18220 |
| BATT-Art13(6)(c) | Art. 13(6)(c) | For SLI batteries the QR code gives the share of cobalt, lead, lithium and nickel recovered from waste in active materials, calculated per Art. 8. | — | software | 8 | — |
| BATT-Art13(6)-closing | Art. 13(6) closing sentence | The information behind the QR code is complete, up to date and accurate. | — | mixed | 6 | 18222 |
| BATT-Art77(1) | Art. 77(1) | From 18 February 2027 each LMT, industrial above 2 kWh and EV battery placed on the market or put into service has an electronic record, the battery passport. | — | mixed | 8, 1 | — |
| BATT-Art77(2)-sub1 | Art. 77(2) first subparagraph | The passport holds model-level information and individual-battery information, including data from use, as set out in Annex XIII. | — | software | 8, 3 | 18219 |
| BATT-Art77(2)(a) | Art. 77(2)(a) | Information open to the general public: Annex XIII point 1. | public | software | 5, 11 | 18239 |
| BATT-Art77(2)(b) | Art. 77(2)(b) | Information only for notified bodies, market surveillance authorities and the Commission: Annex XIII points 2 and 3. | authorities | software | 5 | 18239 |
| BATT-Art77(2)(c) | Art. 77(2)(c) | Information only for persons with a legitimate interest for the purposes in the third subparagraph: Annex XIII points 2 and 4. | legitimate interest | software | 5 | 18239 |
| BATT-Art77(2)-sub3(a) | Art. 77(2) third subparagraph (a) | Legitimate-interest purpose: dismantling (including safety measures) and detailed composition, essential for repairers, remanufacturers, second-life operators and recyclers. | legitimate interest | commission | 5 | 18239 |
| BATT-Art77(2)-sub3(b) | Art. 77(2) third subparagraph (b) | Legitimate-interest purpose: individual-battery data essential to the purchaser or its agents for offering the battery to energy aggregators or market participants. | legitimate interest | commission | 5 | 18239 |
| BATT-Art77(2)-sub4 | Art. 77(2) fourth subparagraph | Information is included only to the extent applicable to the battery category or sub-category. | — | operator | 8 | — |
| BATT-Art77(2)-sub5 | Art. 77(2) fifth subparagraph | The Commission may amend Annex XIII by delegated act. | — | commission | — | — |
| BATT-Art77(3)-sub1 | Art. 77(3) first subparagraph | The passport is reached through the Art. 13(6) QR code, which links to a unique identifier attributed by the operator placing the battery on the market. | — | software | 3, 4 | 18219, 18220 |
| BATT-Art77(3)-sub2 | Art. 77(3) second subparagraph | QR code and unique identifier comply with ISO/IEC 15459-1:2014, -2:2015, -3:2014, -4:2014, -5:2014, -6:2014 "or their equivalent". | — | software | 3, 4 | 18219, 18220 |
| BATT-Art77(3)-sub3 | Art. 77(3) third subparagraph | The Commission may replace or add those standards by delegated act. | — | commission | — | — |
| BATT-Art77(4) | Art. 77(4) | The operator placing the battery on the market keeps passport information accurate, complete and up to date; it may authorise another operator in writing. | — | operator | 6 | — |
| BATT-Art77(5) | Art. 77(5) | All passport information is based on open standards, in an interoperable format, transferable through an open interoperable network without vendor lock-in, machine-readable, structured and searchable, per Art. 78. | — | software | 1, 2, 13 | 18216, 18222, 18223 |
| BATT-Art77(6) | Art. 77(6) | Access to passport information is regulated per the Art. 78 essential requirements. | — | software | 5 | 18239 |
| BATT-Art77(7)-sub1 | Art. 77(7) first subparagraph | After preparation for re-use, preparation for repurposing, repurposing or remanufacturing, responsibility passes to the operator placing the battery on the market again; the battery gets a new passport linked to the original passport(s). | — | mixed | 3, 6 | 18219, 18223 |
| BATT-Art77(7)-sub2 | Art. 77(7) second subparagraph | When the battery becomes waste, responsibility passes to the producer, its producer responsibility organisation or the selected waste management operator. | — | operator | — | — |
| BATT-Art77(8) | Art. 77(8) | The passport ceases to exist once the battery has been recycled. | — | mixed | 6 | 18221, 18222 |
| BATT-Art77(9)-sub1 | Art. 77(9) first subparagraph | By 18 August 2026 the Commission defines by implementing act who has a legitimate interest, which point 2 and 4 data they can access, and how far they may download, share, publish and re-use it. | legitimate interest | commission | 5 | 18239 |
| BATT-Art77(9)(a) | Art. 77(9) second subparagraph (a) | Criterion: need to evaluate the battery's status, residual value and further-use capability. | — | commission | — | — |
| BATT-Art77(9)(b) | Art. 77(9) second subparagraph (b) | Criterion: need for re-use, repurposing, remanufacturing or recycling decisions. | — | commission | — | — |
| BATT-Art77(9)(c) | Art. 77(9) second subparagraph (c) | Criterion: limit access to commercially sensitive information to the minimum. | — | commission | — | — |
| BATT-Art77(10) | Art. 77(10) (marked C2) | The operator placing the battery on the market uploads the unique identifier into the ESPR Art. 13(1) registry. | — | mixed | 7, 3 | 18223 |
| BATT-Art78(a) | Art. 78(a) | The passport is fully interoperable with ecodesign DPPs in the technical, semantic and organisational aspects of end-to-end communication and data transfer. | — | software | 1, 2, 7, 8 | 18223, 18216 |
| BATT-Art78(b) | Art. 78(b) | Consumers, economic operators and other actors access the passport free of charge per Annex XIII and the Art. 77(9) act. | — | software | 5, 11 | 18239 |
| BATT-Art78(c) | Art. 78(c) | Passport data are stored by the responsible operator (Art. 77(4) or (7)) or by operators authorised to act on its behalf. | — | mixed | 6 | 18221 |
| BATT-Art78(d) | Art. 78(d) | Authorised operators may not sell, re-use or process the data beyond what the storage or processing service needs. | — | operator | — | 18221 |
| BATT-Art78(e) | Art. 78(e) | The passport remains available after the responsible operator ceases to exist or ceases activity in the Union. | — | mixed | 6 | 18221 |
| BATT-Art78(f) | Art. 78(f) | Rights to access, introduce, modify or update information are restricted per Annex XIII and the Art. 77(9) act. | — | software | 5 | 18239 |
| BATT-Art78(g) | Art. 78(g) | Data authentication, reliability and integrity are ensured. | — | software | 10 | 18246 |
| BATT-Art78(h) | Art. 78(h) | A high level of security and privacy is ensured and fraud is avoided. | — | software | 10, 5 | 18239, 18246 |
| BATT-AnnexXIII-1 | Annex XIII point 1 chapeau | All point 1 attributes are model-level and accessible to the public. | public | software | 5 | 18239 |
| BATT-AnnexXIII-1(a) | Annex XIII 1(a) | The Annex VI Part A label information: manufacturer identity, category and identification, place and date of manufacture, weight, capacity, chemistry, hazardous substances other than Hg/Cd/Pb, extinguishing agent, critical raw materials above 0,1 % w/w. | public | software | 8 | 18239 |
| BATT-AnnexXIII-1(b) | Annex XIII 1(b) | Material composition: chemistry, hazardous substances other than mercury, cadmium or lead, critical raw materials. | public | software | 8 | 18239 |
| BATT-AnnexXIII-1(c) | Annex XIII 1(c) | Carbon footprint information per Art. 7(1) and (2). | public | software | 8 | 18239 |
| BATT-AnnexXIII-1(d) | Annex XIII 1(d) | Responsible-sourcing information from the Art. 52(3) due-diligence report. | public | software | 8 | 18239 |
| BATT-AnnexXIII-1(e) | Annex XIII 1(e) | Recycled content per the Art. 8(1) documentation. | public | software | 8 | 18239 |
| BATT-AnnexXIII-1(f) | Annex XIII 1(f) | Share of renewable content. | public | software | 8 | 18239 |
| BATT-AnnexXIII-1(g) | Annex XIII 1(g) | Rated capacity in Ah. | public | software | 8 | 18239 |
| BATT-AnnexXIII-1(h) | Annex XIII 1(h) | Minimal, nominal and maximum voltage, with temperature ranges where relevant. | public | software | 8 | 18239 |
| BATT-AnnexXIII-1(i) | Annex XIII 1(i) | Original power capability in W and its limits, with temperature range where relevant. | public | software | 8 | 18239 |
| BATT-AnnexXIII-1(j) | Annex XIII 1(j) | Expected lifetime in cycles and the reference test used. | public | software | 8 | 18239 |
| BATT-AnnexXIII-1(k) | Annex XIII 1(k) | Capacity threshold for exhaustion (EV batteries only). | public | software | 8 | 18239 |
| BATT-AnnexXIII-1(l) | Annex XIII 1(l) | Temperature range the battery withstands when not in use, with reference test. | public | software | 8 | 18239 |
| BATT-AnnexXIII-1(m) | Annex XIII 1(m) | Period of the commercial warranty for calendar life. | public | software | 8 | 18239 |
| BATT-AnnexXIII-1(n) | Annex XIII 1(n) | Initial round-trip energy efficiency and the value at 50 % of cycle life. | public | software | 8 | 18239 |
| BATT-AnnexXIII-1(o) | Annex XIII 1(o) | Internal cell and pack resistance. | public | software | 8 | 18239 |
| BATT-AnnexXIII-1(p) | Annex XIII 1(p) | C-rate of the relevant cycle-life test. | public | software | 8 | 18239 |
| BATT-AnnexXIII-1(q) | Annex XIII 1(q) (as corrected by C4) | The Art. 13(4) and (5) marking requirements: separate-collection symbol and Cd/Pb symbols. | public | software | 8 | 18239 |
| BATT-AnnexXIII-1(r) | Annex XIII 1(r) | The EU declaration of conformity per Art. 18. | public | software | 8, 2 | 18239 |
| BATT-AnnexXIII-1(s) | Annex XIII 1(s) | The Art. 74(1)(a)-(f) information on preventing and managing waste batteries. | public | software | 8 | 18239 |
| BATT-AnnexXIII-2 | Annex XIII point 2 chapeau | All point 2 attributes are model-level and accessible only to persons with a legitimate interest and the Commission. | legitimate interest | software | 5 | 18239 |
| BATT-AnnexXIII-2(a) | Annex XIII 2(a) | Detailed composition, including cathode, anode and electrolyte materials. | legitimate interest | software | 8 | 18239 |
| BATT-AnnexXIII-2(b) | Annex XIII 2(b) | Part numbers for components and contact details of spare-part sources. | legitimate interest | software | 8 | 18239 |
| BATT-AnnexXIII-2(c) | Annex XIII 2(c) chapeau | Dismantling information, at least the six items below. | legitimate interest | software | 8 | 18239 |
| BATT-AnnexXIII-2(c)-1 | Annex XIII 2(c) first dash | Exploded diagrams of the system or pack showing cell locations. | legitimate interest | software | 8, 2 | 18239 |
| BATT-AnnexXIII-2(c)-2 | Annex XIII 2(c) second dash | Disassembly sequences. | legitimate interest | software | 8 | 18239 |
| BATT-AnnexXIII-2(c)-3 | Annex XIII 2(c) third dash | Type and number of fastening techniques to be unlocked. | legitimate interest | software | 8 | 18239 |
| BATT-AnnexXIII-2(c)-4 | Annex XIII 2(c) fourth dash | Tools required for disassembly. | legitimate interest | software | 8 | 18239 |
| BATT-AnnexXIII-2(c)-5 | Annex XIII 2(c) fifth dash | Warnings where parts risk damage. | legitimate interest | software | 8 | 18239 |
| BATT-AnnexXIII-2(c)-6 | Annex XIII 2(c) sixth dash | Number of cells used and their layout. | legitimate interest | software | 8 | 18239 |
| BATT-AnnexXIII-2(d) | Annex XIII 2(d) | Safety measures. | legitimate interest | software | 8 | 18239 |
| BATT-AnnexXIII-3 | Annex XIII point 3 chapeau | Point 3 information is model-level and accessible only to notified bodies, market surveillance authorities and the Commission. | authorities | software | 5 | 18239 |
| BATT-AnnexXIII-3-1 | Annex XIII 3 single dash | Results of test reports proving compliance with the Regulation and its delegated or implementing acts. | authorities | software | 8, 2 | 18239 |
| BATT-AnnexXIII-4 | Annex XIII point 4 chapeau | Point 4 data are individual-battery data accessible only to persons with a legitimate interest. | legitimate interest | software | 5, 3 | 18239 |
| BATT-AnnexXIII-4(a) | Annex XIII 4(a) | Values of the Art. 10(1) performance and durability parameters at placing on the market and at each status change. | legitimate interest | software | 8 | 18239 |
| BATT-AnnexXIII-4(b) | Annex XIII 4(b) | State-of-health information per Art. 14. | legitimate interest | software | 8 | 18239 |
| BATT-AnnexXIII-4(c) | Annex XIII 4(c) | Battery status: "original", "repurposed", "re-used", "remanufactured" or "waste". | legitimate interest | software | 8, 6 | 18239 |
| BATT-AnnexXIII-4(d) | Annex XIII 4(d) | Use data: charge and discharge cycle count, negative events such as accidents, periodically recorded operating conditions including temperature, and state of charge. | legitimate interest | software | 8, 9 | 18239 |

## 3. DPP registry, Commission Implementing Regulation (EU) 2026/1778

Text used: CELEX **32026R1778** (OJ L, 2026/1778, 17.7.2026; Cellar HTML generated 2026-07-16). No consolidated version exists. In force from the twentieth day after publication (Art. 24). Source: `http://publications.europa.eu/resource/celex/32026R1778`.

Scope covered: Art. 3, 8, 9, 10, 11, 12, 14, 15, 16, 19, 20. Definitions in Art. 2 (notably (8) semantic repository, (12) semantic conformity, (16) hash of the DPP version) were read for context.

| id | clause | paraphrase | applicability | area | EN |
|---|---|---|---|---|---|
| REG1778-Art3(a) | Art. 3(a) | The registry has a website with a secure user interface for operators, value chain actors, national and customs authorities. | commission | — | — |
| REG1778-Art3(b) | Art. 3(b) | The registry has an API for registering DPPs and receiving information from the registry. | mixed | 7 | 18223 |
| REG1778-Art3(c) | Art. 3(c) | The registry has a verification platform that confirms the existence and completeness of DPPs. | commission | 7 | — |
| REG1778-Art3(d) | Art. 3(d) | The registry has a scheme for generating unique registration identifiers. | commission | — | — |
| REG1778-Art3(e) | Art. 3(e) | The registry stores at least the unique identifiers and the commodity codes for goods released for free circulation. | commission | 7 | — |
| REG1778-Art3(f) | Art. 3(f) | The registry keeps a list of verified DPP service providers. | commission | 6 | 18221 |
| REG1778-Art3(g) | Art. 3(g) | The registry has a semantic repository. | mixed | 8, 7 | 18223 |
| REG1778-Art3(h) | Art. 3(h) | The registry has a log system. | commission | — | — |
| REG1778-Art3(i) | Art. 3(i) | The registry has identification and authorisation schemes for its users. | commission | 5 | — |
| REG1778-Art8(1) | Art. 8(1) | For ESPR delegated-act products a verified economic operator registers the DPP at the granularity (model, batch, item) the delegated act sets. | mixed | 7, 3 | 18223 |
| REG1778-Art8(2) | Art. 8(2) first subparagraph | For batteries, construction products, toys, detergents and other Union-law DPPs the relevant actor registers at the level that law sets. | mixed | 7 | 18223 |
| REG1778-Art8(2)-sub2 | Art. 8(2) second subparagraph | A third party allowed by Union law to act for those actors may register once verified under Art. 19(4). | operator | 7 | — |
| REG1778-Art8(3) | Art. 8(3) | Where different Union rules require different granularities for the same product, register at the most granular level. | mixed | 3, 7 | 18219 |
| REG1778-Art8(4) | Art. 8(4) | An item-level DPP links both the batch and the model identifier where those exist. | software | 3 | 18219 |
| REG1778-Art8(5) | Art. 8(5) | A batch-level DPP links the model identifier where a model exists. | software | 3 | 18219 |
| REG1778-Art8(6) | Art. 8(6) | Registration happens either through the secure user interface or through the API. | mixed | 7 | 18223 |
| REG1778-Art8(7) | Art. 8(7) chapeau | On submission the Commission reads the DPP content and automatically confirms points (a) to (e); the DPP must therefore be machine-readable by the registry. | mixed | 7, 1 | 18222, 18223 |
| REG1778-Art8(7)(a) | Art. 8(7)(a) | Semantic conformity of the DPP data with the applicable delegated acts or other Union law. | mixed | 8, 7 | 18223 |
| REG1778-Art8(7)(b) | Art. 8(7)(b) | Coherence of the mandatory registry data with the values inside the DPP. | mixed | 7, 3 | 18223 |
| REG1778-Art8(7)(c) | Art. 8(7)(c) | Conformity of the DPP with the required granularity level. | mixed | 3 | 18219 |
| REG1778-Art8(7)(d) | Art. 8(7)(d) | Validity of the commodity code against the permitted range for the product group. | mixed | 8 | — |
| REG1778-Art8(7)(e) | Art. 8(7)(e) | The link to the back-up hosted by a DPP service provider, where relevant. | mixed | 6 | 18221 |
| REG1778-Art8(8) | Art. 8(8) | After successful verification the registry generates and stores a unique, persistent registration identifier. | commission | 7 | — |
| REG1778-Art8(9)(a) | Art. 8(9)(a) | The registry stores the unique identifiers as registration data. | commission | 7, 3 | — |
| REG1778-Art8(9)(b) | Art. 8(9)(b) | The registry stores the commodity code. | commission | 8 | — |
| REG1778-Art8(9)(c) | Art. 8(9)(c) | The registry stores the reference to the DPP service provider. | commission | 6 | 18221 |
| REG1778-Art8(9)(d) | Art. 8(9)(d) | The registry stores registrant information, registration date and time, and the integrity of the DPP as evidence of the registration event. | mixed | 10, 6 | 18246 |
| REG1778-Art8(10) | Art. 8(10) | The unique registration identifier is returned automatically through the UI or the API response. | mixed | 7 | 18223 |
| REG1778-Art9(1) | Art. 9(1) | The registering operator (or its third party) can generate a proof of registration for its DPPs at any time. | mixed | 7 | — |
| REG1778-Art9(2) | Art. 9(2) chapeau | The proof is a downloadable secure electronic document evidencing, also towards third parties, that the registration duty was met; it holds at least (a) to (e). | commission | 7 | — |
| REG1778-Art9(2)(a) | Art. 9(2)(a) | The unique product identifier. | commission | 3 | 18219 |
| REG1778-Art9(2)(b) | Art. 9(2)(b) | The commodity code, where relevant. | commission | — | — |
| REG1778-Art9(2)(c) | Art. 9(2)(c) | Name and identity of the verified economic operator responsible. | commission | — | — |
| REG1778-Art9(2)(d) | Art. 9(2)(d) | Date and time of registration of the latest DPP version, validated by a Commission electronic time stamp. | commission | 6 | — |
| REG1778-Art9(2)(e) | Art. 9(2)(e) | A hash of the DPP version the proof covers (Art. 2(16): cryptographic output over the version's data). | mixed | 10, 6 | 18246 |
| REG1778-Art9(3) | Art. 9(3) | The proof carries a qualified electronic seal (eIDAS Art. 38) and the Commission time stamp. | commission | 10 | — |
| REG1778-Art9(4) | Art. 9(4) | The proof is available via UI or API for 90 calendar days after generation. | mixed | 7 | 18223 |
| REG1778-Art10(1) | Art. 10(1) | Every creation, modification or deletion of registration data is logged and reflected in the registration status. | commission | 6 | — |
| REG1778-Art10(2) | Art. 10(2) | The registry versions the registered data and time-stamps each update. | mixed | 6 | 18221, 18222 |
| REG1778-Art10(3) | Art. 10(3) | Registration data are deleted 10 years after registration unless Union law sets a DPP availability period, which then governs retention. | commission | 6 | 18221 |
| REG1778-Art10(4) | Art. 10(4) | Users may request deletion of their account when no longer responsible. | commission | — | — |
| REG1778-Art11(1) | Art. 11(1) | Each product group's data model is based on its delegated act or other applicable Union law. | commission | 8 | — |
| REG1778-Art11(2) | Art. 11(2) | Data models may build on existing Union semantic assets, controlled vocabularies and reference data models. | commission | 8 | — |
| REG1778-Art11(3) | Art. 11(3) | All data in a DPP are structured per the common data models and semantic definitions published in the semantic repository. | software | 8, 7, 2 | 18223 |
| REG1778-Art11(4) | Art. 11(4) | Data models are versioned. | mixed | 8 | 18223 |
| REG1778-Art12(1) | Art. 12(1) | The Commission maintains an authoritative, machine-readable semantic repository for all product groups, per the Interoperable Europe Act (Reg. 2024/903). | commission | 8 | — |
| REG1778-Art12(2)(a) | Art. 12(2)(a) | The repository holds the semantic meaning of required attributes and specifications for typed, resolvable links between DPPs and from attributes to value-chain evidence. | mixed | 7, 8, 3, 9 | 18223 |
| REG1778-Art12(2)(b) | Art. 12(2)(b) | It holds the data models and formats for the in-scope products. | mixed | 8, 2 | 18223 |
| REG1778-Art12(2)(c) | Art. 12(2)(c) | It holds metadata about those data models. | commission | — | — |
| REG1778-Art12(2)(d) | Art. 12(2)(d) | It holds the semantic meaning of the roles defined in delegated acts or other DPP legislation. | mixed | 5 | 18239 |
| REG1778-Art12(2)(e) | Art. 12(2)(e) | It holds multilingual labels and definitions for all mandatory attributes. | mixed | 8, 11 | 18223 |
| REG1778-Art12(3) | Art. 12(3) | Data-model metadata conform to DCAT-AP. | commission | — | — |
| REG1778-Art12(4) | Art. 12(4) | Newly introduced attributes get multilingual labels and definitions published. | commission | — | — |
| REG1778-Art12(5) | Art. 12(5) | The repository offers a search service for reading, searching and retrieving semantic definitions and data structures. | commission | — | — |
| REG1778-Art12(6) | Art. 12(6) | Repository content is accessible through publicly documented APIs supporting common formats and machine-readable semantic assets. | mixed | 7, 8 | 18223 |
| REG1778-Art12(7) | Art. 12(7) | Access to and use of the repository and its APIs are free of charge. | commission | — | — |
| REG1778-Art14(1) | Art. 14(1) | The Commission runs a log system that produces a complete, accurate and reliable audit trail. | commission | — | — |
| REG1778-Art14(2)(a) | Art. 14(2)(a) | Logged: access and authentication entries. | commission | — | — |
| REG1778-Art14(2)(b) | Art. 14(2)(b) | Logged: data modifications by all users, including ESPR Art. 13(4) uploads and other mandated uploads. | commission | 7 | — |
| REG1778-Art14(2)(c) | Art. 14(2)(c) | Logged: administrative actions, account changes, permission changes, configuration changes. | commission | — | — |
| REG1778-Art14(2)(d) | Art. 14(2)(d) | Logged: data exchange logs. | commission | — | — |
| REG1778-Art14(3)(a) | Art. 14(3)(a) | Access and authentication logs are kept six months. | commission | — | — |
| REG1778-Art14(3)(b) | Art. 14(3)(b) | Administrative and data-exchange logs are kept five years. | commission | — | — |
| REG1778-Art14(3)(c) | Art. 14(3)(c) | Data-modification logs are kept for the duration of the registration. | commission | — | — |
| REG1778-Art14(4) | Art. 14(4) | Logs are made available to national authorities for suspected incidents, audits and random security checks. | commission | — | — |
| REG1778-Art14(5) | Art. 14(5) | Technical and organisational measures protect the logs, ensuring at least their immutability and confidentiality. | commission | — | — |
| REG1778-Art15(1) | Art. 15(1) | The Commission publishes guidelines on registering and managing registry data. | commission | 7 | — |
| REG1778-Art15(2) | Art. 15(2) | The registry is accessible at all times except announced maintenance such as software releases. | commission | 7 | — |
| REG1778-Art15(3) | Art. 15(3) | The Commission may suspend availability without notice for malfunction, cyber-attack or urgent security need. | commission | 7 | — |
| REG1778-Art15(4) | Art. 15(4) | Where unavailability prevents registration, the Commission records the date and time and keeps that record available for at least five years. | commission | — | — |
| REG1778-Art16(1) | Art. 16(1) | The Commission ensures registry security and may run technical audits and random checks on its components. | commission | — | — |
| REG1778-Art16(2)(a) | Art. 16(2)(a) | Measures prevent unauthorised access to the registry. | commission | — | — |
| REG1778-Art16(2)(b) | Art. 16(2)(b) | Measures prevent unauthorised processing of registry data. | commission | — | — |
| REG1778-Art16(2)(c) | Art. 16(2)(c) | Measures detect unauthorised activities. | commission | — | — |
| REG1778-Art16(2)(d) | Art. 16(2)(d) | Measures prevent data breaches. | commission | — | — |
| REG1778-Art16(2)(e) | Art. 16(2)(e) | Security events are logged per the Commission's IT security standards. | commission | — | — |
| REG1778-Art19(1) | Art. 19(1) | The verified operator supplies all Art. 8 registration information and answers for its accuracy and completeness at registration. | operator | 7 | — |
| REG1778-Art19(2) | Art. 19(2) | The verified operator keeps the registry information about its DPP accurate, complete and up to date at all times. | mixed | 7, 6 | 18223 |
| REG1778-Art19(3) | Art. 19(3) | The verified operator implements technical and organisational security for the IT systems and credentials it uses to reach the registry, against unauthorised access or modification of registration data. | mixed | 10, 5 | 18239 |
| REG1778-Art19(4) | Art. 19(4) | A third party registering on the operator's behalf must be verified under Art. 5; the operator stays fully responsible. | operator | — | — |
| REG1778-Art19(5) | Art. 19(5) | The verified operator is the controller of the data it submits. | operator | — | — |
| REG1778-Art20(1) | Art. 20(1) | A verified value chain actor authorising a third party stays responsible for compliance. | operator | — | — |
| REG1778-Art20(2) | Art. 20(2) | A verified value chain actor secures the IT systems and credentials it uses to reach the registry. | mixed | 10, 5 | 18239 |
| REG1778-Art20(3) | Art. 20(3) | Where Union law lets value chain actors upload to the registry, each is the controller of the data it submits. | operator | — | — |

## 4. Harmonised standards, Commission Implementing Decision (EU) 2026/1736

Text used: CELEX **32026D1736** (OJ L, 2026/1736, 15.7.2026; Cellar HTML generated 2026-07-14). In force on the day of publication (Art. 2). Source: `http://publications.europa.eu/resource/celex/32026D1736`.

**Finding.** The Decision does not map individual ENs to individual ESPR clauses. Recital 5 and Art. 1 state that the six listed standards, as a set, "satisfy the requirements set out in Articles 10 and 11" of the ESPR, so each cited EN carries presumption of conformity (ESPR Art. 41(2)) for the Art. 10 and 11 requirements it covers. The clause-level coverage lives in each standard's Annex ZA, which is gated. The `primary clauses (inferred)` column is therefore my inference from the standard's title and the M/604 work split; treat it as a reading aid, not as the Decision's text. Recital 2 also confirms the amendment of the standardisation request as Implementing Decision C(2025) 8024 of 28 November 2025, which resolves open question 2 in `public-sources.md`.

| id | EN | title (Annex, No) | presumption per the Decision | primary clauses (inferred) | applicability | area |
|---|---|---|---|---|---|---|
| DEC1736-EN18216 | EN 18216:2026 | Digital product passport – Data exchange protocols (No 1) | ESPR Art. 10 and 11 | 10(1)(d), 11(a) | software | 1, 2, 13 |
| DEC1736-EN18219 | EN 18219:2026 | Digital product passport – Unique identifiers (No 2) | ESPR Art. 10 and 11 | 10(1)(a), 10(1)(c), 10(1)(f), 11(d), 12(1), Annex III (b), (c), (g)-(i), (k), second paragraph | software | 3 |
| DEC1736-EN18220 | EN 18220:2026 | Digital product passport – Data carriers (No 3) | ESPR Art. 10 and 11 | 10(1)(a), 10(1)(b), 10(1)(c), 10(3)(a), Annex III second paragraph | software | 4 |
| DEC1736-EN18221 | EN 18221:2026 | Digital product passport – Data storage, archiving, and persistence (No 4) | ESPR Art. 10 and 11 | 10(4), 11(c), 11(e), Annex III (l) | software | 6 |
| DEC1736-EN18222 | EN 18222:2026 | Digital Product Passport – Application Programming Interfaces (APIs) for product passport lifecycle management and searchability (No 5) | ESPR Art. 10 and 11 | 10(1)(d), 11(b), 11(f), 9(1) | software | 1, 13 |
| DEC1736-EN18223 | EN 18223:2026 | Digital Product Passport – System interoperability (No 6) | ESPR Art. 10 and 11 | 11(a), 11(d), 13(4)-(5) registry access | software | 1, 2, 7, 8 |

Not cited by this Decision (no presumption of conformity as of 2026-09-03; final texts due 2026-09-16, second OJ citation expected September 2026 per `public-sources.md`):

| id | EN | title | presumption per the Decision | primary clauses (inferred) | applicability | area |
|---|---|---|---|---|---|---|
| DEC1736-EN18239 | EN 18239 | Digital product passport – Access rights management, information system security, and business confidentiality | none yet | 10(1)(e), 10(1)(g), 11(b), 11(f), 11(h) | software | 5, 10 |
| DEC1736-EN18246 | EN 18246 | Digital product passport – Data authentication, reliability and integrity | none yet | 11(g), 11(h) | software | 10 |

## 5. Summary

Counts are rows in the tables above. The two uncited ENs in section 4 are listed for completeness and counted separately.

| text | software | mixed | operator | commission | total |
|---|---|---|---|---|---|
| ESPR 2024/1781 | 38 | 20 | 5 | 34 | 97 |
| Batteries 2023/1542 | 54 | 8 | 4 | 8 | 74 |
| Reg. 2026/1778 | 3 | 27 | 6 | 48 | 84 |
| Dec. 2026/1736 (cited) | 6 | 0 | 0 | 0 | 6 |
| **Tier A total** | **101** | **55** | **15** | **90** | **261** |
| Dec. 2026/1736 (not yet cited, listed only) | 2 | 0 | 0 | 0 | 2 |

Breakdown by open-dpp area (rows touching the area, `software` and `mixed` rows only, a row may touch several areas): 1 AAS API surface 11, 2 serialisation 13, 3 identifiers 31, 4 data carriers 11, 5 access rights 24, 6 persistence and versioning 20, 7 registry and discovery 23, 8 templates and semantic models 76, 9 traceability 3, 10 security and integrity 11, 11 public presentation 10, 12 conformance artifacts 0, 13 OpenAPI 4.

Counts were produced by parsing the tables (script kept out of the repo); re-run after any edit to a table.

## 6. Observations for the assessment

1. **Registry client is the largest `mixed` cluster.** ESPR Art. 13(4)-(5), Batteries Art. 77(10) and Reg. 2026/1778 Art. 3(b), 8, 9, 10(2), 12(6), 19(2) all presuppose that the DPP software can register a passport via the registry API, capture the unique registration identifier, keep the registry in sync on updates, and expose a version that the registry can hash (Art. 8(9)(d), 9(2)(e)). `capability-inventory.md` area 7 records no registry client, no `/description` endpoint and no descriptors.
2. **Semantic conformity is a data-model duty on the DPP side.** Reg. 2026/1778 Art. 11(3) requires all DPP data to follow the semantic repository's data models, and Art. 8(7)(a) has the Commission check this automatically at registration. Area 8 (templates) is the touch point; area 8 currently ships no IDTA submodel templates.
3. **Linking rules.** ESPR Art. 11(d), Batteries Art. 77(7) and Reg. 2026/1778 Art. 8(4)-(5) and 12(2)(a) require typed links between successor and original passports and between item, batch and model identifiers. Area 3 has UPI and GS1 identity but no link model between passports.
4. **Access classes for batteries are fixed in law.** Annex XIII gives three classes (public, legitimate interest, authorities); the Art. 77(9) implementing act (due 2026-08-18) refining legitimate interest was not found in the consolidated text and remains open (see `public-sources.md` section 7, item 3). Area 5's AAS ABAC model can express per-element visibility; the review should test whether the three classes can be configured.
5. **Corrigenda matter.** ESPR Art. 10(1)(d) reads differently after Corrigendum C2 (28.4.2025); Batteries Annex XIII 1(q) was corrected by C4 (10.4.2026) to reference Art. 13(4) and (5). Always cite the consolidated CELEX given in each section heading.
6. **Cross-reference quirks in Reg. 2026/1778.** Art. 8(8) refers to "verification in accordance with paragraph 6" and Art. 8(10) to an identifier "generated in accordance with paragraph 9"; from context these mean paragraphs 7 and 8. Noted as read; not corrected here.
7. **Out of the requested scope but relevant**, for a follow-up ticket: Reg. 2026/1778 Art. 4(4) and 5(4) (verified status expires after at most three years, after which registrations and edits are blocked), Art. 6a (transfer of registered DPPs to another verified operator), Art. 17 (fraud and massive download), Art. 18 (personal data stored); Batteries Art. 13(7) (QR printed or engraved, else on packaging and documents) and 13(9) (re-used or remanufactured batteries: change-of-status information reachable through the QR code).
8. **Decision 2026/1736 gives no clause map.** Per-clause presumption of conformity can only be established from each EN's Annex ZA (gated, see `public-sources.md` section 5).
