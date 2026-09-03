# NIS2 applicability of open-dpp GmbH as a hosted-DPP (SaaS) operator

Research note for wayfinder map [#772](https://github.com/open-dpp/open-dpp/issues/772), ticket [#776](https://github.com/open-dpp/open-dpp/issues/776).
Vocabulary (Control, Control Register, Ring) per `CONTEXT.md` § Security Review. Research date: 2026-09-03.

## Question

Under NIS2 (Directive (EU) 2022/2555) and its German transposition (NIS2UmsuCG → new BSIG), is a company operating a
hosted DPP platform for customers an **essential or important entity** (e.g. as a cloud computing service provider under
Annex I "digital infrastructure"), and do the size thresholds exempt a company of open-dpp GmbH's size? If out of direct
scope, what **supply-chain requirements** do NIS2-regulated customers pass down to a SaaS supplier (Art. 21(2)(d))? If in
scope, which Art. 21 measures and Art. 23 reporting duties become Controls?

Assumed facts: open-dpp GmbH is a German GmbH with a handful of employees, well below 50 staff and below EUR 10 m
turnover; it operates 3 instances (own multi-tenant SaaS, one whitelabel instance per customer, demo) for business
customers; production access is held by 3 people.

## Short answer

1. **Not in direct scope today.** Cloud computing service providers (Annex I point 8 / BSIG Anlage 1 Nr. 6.1.4) and
   managed service providers (Annex I point 9 / Anlage 1 Nr. 6.1.10) are subject to the **size-cap rule**: only
   medium-sized or larger entities are covered (NIS2 Art. 2(1); BSIG § 28(1) Nr. 4, § 28(2) Nr. 3). They are **not**
   among the entity types covered regardless of size (NIS2 Art. 2(2)(a) lists only public electronic-communications
   providers, trust service providers, TLD registries and DNS providers; BSIG § 28(1) Nr. 1–3 and § 28(2) Nr. 1–2 mirror
   this). Germany has not used the Art. 2(2)(b)–(e) option to designate individual small entities beyond the KRITIS
   mechanism. With < 50 staff and turnover *and* balance sheet ≤ EUR 10 m, open-dpp GmbH is neither a *besonders
   wichtige* nor a *wichtige Einrichtung* — **provided** it is an autonomous enterprise (no ≥ 25 % enterprise
   shareholder whose data would be aggregated under BSIG § 28(4) / Recommendation 2003/361/EC).
2. **German law is in force and stable.** The BSIG in its NIS2 version (Art. 1 of the NIS2UmsuCG, BGBl. 2025 I Nr. 301,
   promulgated 5 Dec 2025) entered into force on **6 Dec 2025** and has since been amended three times in 2026
   (KRITIS-Dachgesetz of 11 Mar 2026 and two July 2026 acts) without changing the scope rule in § 28. Obligations apply
   immediately; registration is due within 3 months of first qualifying (§ 33(1)).
3. **Classification is moot for scope but matters later.** A multi-tenant SaaS is plausibly a "cloud computing service"
   (NIS2 recital 33 names SaaS expressly; BSIG § 2 Nr. 4 uses the same definition; the BSI reads "skalierbar" broadly),
   while per-customer whitelabel operation matches the "Managed Service Provider" definition (BSIG § 2 Nr. 26). Either
   way open-dpp lands in Anlage 1, so crossing **50 staff, or > EUR 10 m turnover and > EUR 10 m balance sheet**, makes
   it a *wichtige Einrichtung* (≥ 250 staff or > 50 m/43 m: *besonders wichtige*), with special EU-wide registration
   (§ 34) and BSI as central EU authority (§ 60).
4. **Indirect exposure is real.** Typical DPP customers (battery, electrical-equipment, electronics, machinery, vehicle
   manufacturers) are Annex II / Anlage 2 Nr. 5 *wichtige Einrichtungen* once they have ≥ 50 staff. They must manage
   supply-chain security (Art. 21(2)(d), (3); BSIG § 30(2) Nr. 4) and — where they are themselves digital-infrastructure
   entities — must contractually impose the clauses of Implementing Regulation (EU) 2024/2690 Annex point 5.1.4 on
   suppliers. The BSI FAQ confirms suppliers are not regulated directly but face contractual pass-down. **The Control
   Register should therefore carry a "NIS2 supplier-readiness" set of Controls (below), not the full Art. 21/Art. 23
   regime.**

## Findings

### 1. Size-cap rule (EU)

> "This Directive applies to public or private entities of a type referred to in Annex I or II which qualify as
> medium-sized enterprises under Article 2 of the Annex to Recommendation 2003/361/EC, or exceed the ceilings for
> medium-sized enterprises provided for in paragraph 1 of that Article […]. Article 3(4) of the Annex to that
> Recommendation shall not apply for the purposes of this Directive."

Recital 7 names this the "size-cap rule".
Source: [Directive (EU) 2022/2555, Art. 2(1)](https://eur-lex.europa.eu/eli/dir/2022/2555/oj/eng#art_2), recital 7.

### 2. Size-independent inclusions (EU) do not include cloud or MSP

> "Regardless of their size, this Directive also applies to entities of a type referred to in Annex I or II, where:
> (a) services are provided by: (i) providers of public electronic communications networks or of publicly available
> electronic communications services; (ii) trust service providers; (iii) top-level domain name registries and domain
> name system service providers; (b) the entity is the sole provider in a Member State of a service which is essential
> […]; (c) disruption of the service […] could have a significant impact on public safety, public security or public
> health; (d) […] significant systemic risk […]; (e) the entity is critical because of its specific importance at
> national or regional level […]; (f) the entity is a public administration entity […]"

Art. 2(3) (CER critical entities) and Art. 2(4) (domain name registration services) are the only other size-independent
hooks. Cloud computing service providers, data centre providers and MSPs appear nowhere in Art. 2(2)–(4).
Source: [Art. 2(2)–(4)](https://eur-lex.europa.eu/eli/dir/2022/2555/oj/eng#art_2).

### 3. Essential vs important (EU)

Art. 3(1)(a): Annex I entities that "exceed the ceilings for medium-sized enterprises" are essential.
Art. 3(2): "entities of a type referred to in Annex I or II which do not qualify as essential entities pursuant to
paragraph 1 of this Article shall be considered to be important entities." Medium-sized cloud providers are therefore
*important*, large ones *essential*.
Source: [Art. 3](https://eur-lex.europa.eu/eli/dir/2022/2555/oj/eng#art_3).

### 4. SME thresholds (Recommendation 2003/361/EC)

- Annex Art. 2(1): SME = "fewer than 250 persons and […] annual turnover not exceeding EUR 50 million, and/or an annual
  balance sheet total not exceeding EUR 43 million".
- Annex Art. 2(2): small = "fewer than 50 persons and whose annual turnover and/or annual balance sheet total does not
  exceed EUR 10 million".
- Annex Art. 2(3): micro = "fewer than 10 persons and […] does not exceed EUR 2 million".
- Annex Art. 4(2): status changes only if ceilings are exceeded "over two consecutive accounting periods".
- Annex Art. 5: headcount in annual work units, including owner-managers and active partners.
- Annex Art. 6(2): partner enterprises (≥ 25 % holdings) are added proportionally, linked enterprises 100 %.

Source: [Recommendation 2003/361/EC, Annex](https://eur-lex.europa.eu/eli/reco/2003/361/oj/eng).

### 5. "Cloud computing service", SaaS and "managed service provider" (EU definitions)

> Art. 6(30): "'cloud computing service' means a digital service that enables on-demand administration and broad remote
> access to a scalable and elastic pool of shareable computing resources, including where such resources are distributed
> across several locations;"

> Recital 33: "The service models of cloud computing include, inter alia, Infrastructure as a Service (IaaS), Platform
> as a Service (PaaS), Software as a Service (SaaS) and Network as a Service (NaaS)." On-demand administration is the
> user's ability to "unilaterally self-provision computing capabilities […] without any human interaction by the cloud
> computing service provider".

> Art. 6(39): "'managed service provider' means an entity that provides services related to the installation,
> management, operation or maintenance of ICT products, networks, infrastructure, applications or any other network and
> information systems, via assistance or active administration carried out either on customers' premises or remotely;"

Source: [Art. 6](https://eur-lex.europa.eu/eli/dir/2022/2555/oj/eng#art_6),
[recital 33](https://eur-lex.europa.eu/eli/dir/2022/2555/oj/eng#rct_33).

### 6. Annex I points 8 and 9; Annex II point 5

- Annex I point 8 "Digital infrastructure": inter alia "Cloud computing service providers", "Data centre service
  providers", "Content delivery network providers".
- Annex I point 9 "ICT service management (business-to-business)": "Managed service providers", "Managed security
  service providers".
- Annex II point 5 "Manufacturing": medical devices, NACE Rev. 2 divisions C26 (computer, electronic, optical),
  C27 (electrical equipment), C28 (machinery), C29 (motor vehicles), C30 (other transport equipment). NACE group 27.2 is
  "manufacture of batteries and accumulators" (NACE Rev. 2 classification; not re-fetched here).

Source: [Annex I](https://eur-lex.europa.eu/eli/dir/2022/2555/oj/eng#anx_I),
[Annex II](https://eur-lex.europa.eu/eli/dir/2022/2555/oj/eng#anx_II).

### 7. German transposition — legal status as of 2026-09-03

- Title: "Gesetz zur Umsetzung der NIS-2-Richtlinie und zur Regelung wesentlicher Grundzüge des
  Informationssicherheitsmanagements in der Bundesverwaltung"; signed 2 Dec 2025; promulgated **BGBl. 2025 I Nr. 301
  on 5 Dec 2025**.
- Consolidated BSIG header: "Das G wurde als Artikel 1 des G v. 2.12.2025 I Nr. 301 vom Bundestag beschlossen. Es tritt
  gem. Art. 30 dieses G am 6.12.2025 in Kraft."
- Current citation: "BSI-Gesetz vom 2. Dezember 2025 (BGBl. 2025 I Nr. 301, S. 2), das zuletzt durch Artikel 8 Absatz 1
  des Gesetzes vom 23. Juli 2026 (BGBl. 2026 I Nr. 226) geändert worden ist"; Stand: "Geändert durch Art. 4 G v.
  11.3.2026 I Nr. 66" (KRITIS-Dachgesetz, in force 17 Mar 2026) and "Art. 9 G v. 21.7.2026 I Nr. 221".
- § 66 (transitional) shows the 2026 amendments concern KRITIS registration (§ 33(2), (5)), not the scope rule.

Sources: [BGBl. 2025 I Nr. 301](https://www.recht.bund.de/bgbl/1/2025/301/VO.html),
[BSIG consolidated header](https://www.gesetze-im-internet.de/bsig_2025/BJNR12D0B0025.html),
[§ 66 BSIG](https://www.gesetze-im-internet.de/bsig_2025/__66.html),
[BGBl. 2026 I Nr. 66](https://www.recht.bund.de/bgbl/1/2026/66/regelungstext.pdf) (located via search; not read in
full). The two July 2026 amending acts were not examined individually.

### 8. German scope rule (§ 28 BSIG)

> § 28(1) — *besonders wichtige Einrichtungen*: "1. Betreiber kritischer Anlagen, 2. qualifizierte
> Vertrauensdiensteanbieter, Top Level Domain Name Registries oder DNS-Diensteanbieter, 3. Anbieter öffentlich
> zugänglicher Telekommunikationsdienste oder Betreiber öffentlicher Telekommunikationsnetze, die a) mindestens 50
> Mitarbeiter beschäftigen oder b) einen Jahresumsatz und eine Jahresbilanzsumme von jeweils über 10 Millionen Euro
> aufweisen, 4. sonstige natürliche oder juristische Personen […], die einer der in Anlage 1 bestimmten Einrichtungsarten
> zuzuordnen sind, und a) mindestens 250 Mitarbeiter beschäftigen oder b) einen Jahresumsatz von über 50 Millionen Euro
> und zudem eine Jahresbilanzsumme von über 43 Millionen Euro aufweisen."

> § 28(2) — *wichtige Einrichtungen*: "1. Vertrauensdiensteanbieter, 2. [small public telecoms providers], 3. sonstige
> natürliche oder juristische Personen […], die einer der in den Anlagen 1 und 2 bestimmten Einrichtungsarten zuzuordnen
> sind und a) mindestens 50 Mitarbeiter beschäftigen oder b) einen Jahresumsatz und eine Jahresbilanzsumme von jeweils
> über 10 Millionen Euro aufweisen."

Cloud and MSP appear only via Anlage 1, i.e. only with the size cap. § 28 contains no general power to designate
individual small entities (Art. 2(2)(b)–(e) is implemented only through the KRITIS mechanism, Nr. 1).
Source: [§ 28 BSIG](https://www.gesetze-im-internet.de/bsig_2025/__28.html).

### 9. Group aggregation and negligible activities (§ 28(3)–(4) BSIG)

> § 28(4): "[…] ist […] die Empfehlung der Kommission (2003/361/EG) mit Ausnahme von Artikel 3 Absatz 4 des Anhangs
> anzuwenden. Die Daten von Partner- oder verbundenen Unternehmen im Sinne der Empfehlung der Kommission (2003/361/EG)
> sind nicht hinzuzurechnen, wenn das Unternehmen unter Berücksichtigung der rechtlichen, wirtschaftlichen und
> tatsächlichen Umstände mit Blick auf die Beschaffenheit und den Betrieb der informationstechnischen Systeme,
> Komponenten und Prozesse unabhängig von seinen Partner- oder verbundenen Unternehmen ist."

§ 28(3): activities that are "vernachlässigbar" relative to the whole may be ignored when assigning an Einrichtungsart.
BSI FAQ: headcount in "Jahresarbeitseinheiten (JAE)", data from the "letzten festgestellten Jahresabschluss", and the
two-consecutive-years rule.
Sources: [§ 28 BSIG](https://www.gesetze-im-internet.de/bsig_2025/__28.html),
[BSI FAQ zu NIS-2](https://www.bsi.bund.de/DE/Themen/Regulierte-Wirtschaft/NIS-2-regulierte-Unternehmen/NIS-2-FAQ/NIS-2-FAQ-allgemein/FAQ-zu-NIS-2.html).

### 10. German definitions (§ 2 BSIG)

> Nr. 4: "'Cloud-Computing-Dienst' ein digitaler Dienst, der auf Abruf die Verwaltung eines skalierbaren und elastischen
> Pools gemeinsam nutzbarer Rechenressourcen sowie den umfassenden Fernzugang zu diesem Pool ermöglicht, auch wenn die
> Rechenressourcen auf mehrere Standorte verteilt sind;"

> Nr. 26: "'Managed Service Provider' oder 'MSP' ein Anbieter von Diensten im Zusammenhang mit der Installation, der
> Verwaltung, dem Betrieb oder der Wartung von IKT-Produkten, -Netzen, -Infrastruktur, -Anwendungen oder jeglicher
> anderer Netz- und Informationssysteme durch Unterstützung oder aktive Verwaltung in den Räumlichkeiten der Kunden oder
> aus der Ferne;"

> Nr. 11: "'erheblicher Sicherheitsvorfall' ein Sicherheitsvorfall, der a) schwerwiegende Betriebsstörungen der Dienste
> oder finanzielle Verluste für die betreffende Einrichtung verursacht hat oder verursachen kann oder b) andere
> natürliche oder juristische Personen durch erhebliche materielle oder immaterielle Schäden beeinträchtigt hat oder
> beeinträchtigen kann, sofern durch die Rechtsverordnung nach § 56 Absatz 5 keine konkretisierende Begriffsbestimmung
> erfolgt;"

Source: [§ 2 BSIG](https://www.gesetze-im-internet.de/bsig_2025/__2.html).

### 11. Anlage 1 / Anlage 2 BSIG

- Anlage 1 Nr. 6 "Digitale Infrastruktur": 6.1.4 "Anbieter von Cloud-Computing-Diensten", 6.1.5 "Anbieter von
  Rechenzentrumsdiensten", 6.1.10 "Managed Services Provider", 6.1.11 "Managed Security Services Provider".
- Anlage 2 Nr. 5 "Verarbeitendes Gewerbe/Herstellung von Waren": 5.1 Medizinprodukte, 5.2 NACE C26, 5.3 NACE C27
  ("Herstellung von elektrischen Ausrüstungen"), 5.4 NACE C28, 5.5 NACE C29, 5.6 NACE C30; Nr. 3 chemicals (REACH
  registrants, NACE 20); Nr. 6 "Anbieter digitaler Dienste" (marketplaces, search engines, social networks).
- Anlage 2 entities are only ever *wichtig* (§ 28(1) Nr. 4 refers to Anlage 1 only).

Sources: [Anlage 1](https://www.gesetze-im-internet.de/bsig_2025/anlage_1.html),
[Anlage 2](https://www.gesetze-im-internet.de/bsig_2025/anlage_2.html).

### 12. BSI on hosting vs cloud (sector FAQ "Digitale Infrastruktur")

> "Nein, reines Webhosting zählt in der Regel nicht zu Einrichtungsarten wie Cloudanbieter oder MSP."

> On cloud without auto-scaling: "Das BSIG spricht nicht von 'auto-skalierbar', sondern nur von 'skalierbar'. Somit
> würde auch ein solcher Cloud-Computing-Dienst unter das BSIG-E fallen."

> Subsidiaries running a group's central IT "dürften in der Regel als Managed Services Provider (MSP) oder Managed
> Security Service Provider (MSSP) anzusehen sein."

The BSI self-check "dient lediglich als Orientierungshilfe und ihr Ergebnis [ist] rechtlich nicht bindend".
Sources: [BSI sektorspezifische FAQ](https://www.bsi.bund.de/DE/Themen/Regulierte-Wirtschaft/NIS-2-regulierte-Unternehmen/NIS-2-FAQ/NIS-2-FAQ-sektorspezifisch/NIS-2-Sektorspezifische-FAQ.html),
[BSI Betroffenheitsprüfung](https://www.bsi.bund.de/DE/Themen/Regulierte-Wirtschaft/NIS-2-regulierte-Unternehmen/BSI-Portal/NIS-2-Betroffenheitspruefung/nis-2-betroffenheitspruefung_node.html),
tool: <https://betroffenheitspruefung-nis-2.bsi.de/>.

### 13. Classification of open-dpp's three instances (assessment, not a legal opinion)

- Multi-tenant SaaS instance: remote access to a shared, scalable pool with self-service organisation onboarding →
  fits § 2 Nr. 4 / recital 33 SaaS.
- Single-VM whitelabel instance deployed and operated per customer by open-dpp: lacks user self-provisioning
  ("on-demand administration") but is squarely "Installation, Verwaltung, Betrieb oder Wartung von […] Anwendungen […]
  aus der Ferne" → MSP (§ 2 Nr. 26).
- Both are Anlage 1 types; neither is size-independent. Identical scope result; once in scope, both trigger § 34
  special registration and § 60 central BSI jurisdiction (Finding 18).

### 14. Suppliers are not regulated directly; pass-down is contractual

> BSI FAQ: "Bei Geschäftsbeziehungen zu von NIS-2 betroffenen Unternehmen können Regelungen des BSIG sich mittelbar auch
> auf nicht von NIS-2 betroffene Unternehmen auswirken" — via contractual requirements comparable to § 30 measures.

> NIS2 recital 85: entities "should in particular be encouraged to incorporate cybersecurity risk-management measures
> into contractual arrangements with their direct suppliers and service providers" and should "assess and take into
> account the overall quality and resilience of products and services, the cybersecurity risk-management measures
> embedded in them, and the cybersecurity practices of their suppliers and service providers, including their secure
> development procedures".

Sources: [BSI FAQ](https://www.bsi.bund.de/DE/Themen/Regulierte-Wirtschaft/NIS-2-regulierte-Unternehmen/NIS-2-FAQ/NIS-2-FAQ-allgemein/FAQ-zu-NIS-2.html),
[recital 85](https://eur-lex.europa.eu/eli/dir/2022/2555/oj/eng#rct_85).

### 15. What regulated customers must do about suppliers

> NIS2 Art. 21(2)(d): "supply chain security, including security-related aspects concerning the relationships between
> each entity and its direct suppliers or service providers;"

> Art. 21(3): entities "take into account the vulnerabilities specific to each direct supplier and service provider and
> the overall quality of products and cybersecurity practices of their suppliers and service providers, including their
> secure development procedures."

> BSIG § 30(2) Nr. 4: "Sicherheit der Lieferkette einschließlich sicherheitsbezogener Aspekte der Beziehungen zu
> unmittelbaren Anbietern oder Diensteanbietern," Nr. 5: "Sicherheitsmaßnahmen bei Erwerb, Entwicklung und Wartung von
> informationstechnischen Systemen, Komponenten und Prozessen, einschließlich Management und Offenlegung von
> Schwachstellen,"

Sources: [Art. 21](https://eur-lex.europa.eu/eli/dir/2022/2555/oj/eng#art_21),
[§ 30 BSIG](https://www.gesetze-im-internet.de/bsig_2025/__30.html).

### 16. Implementing Regulation (EU) 2024/2690 — the concrete supplier clause list

Applies to "the relevant entities" (DNS, TLD, cloud, data centre, CDN, MSP, MSSP, marketplaces, search engines, social
networks, trust services) "as covered by Article 3 of Directive (EU) 2022/2555" (recital 1, Art. 1); BSIG § 30(3) gives
it precedence for those types. Entered into force 20 days after OJ publication of 18 Oct 2024 (Art. 16).

Annex point 5.1.2 — supplier selection criteria:
> "(a) the cybersecurity practices of the suppliers and service providers, including their secure development
> procedures; (b) the ability of the suppliers and service providers to meet cybersecurity specifications set by the
> relevant entities; (c) the overall quality and resilience of ICT products and ICT services and the cybersecurity
> risk-management measures embedded in them, including the risks and classification level of the ICT products and ICT
> services; (d) the ability of the relevant entities to diversify sources of supply and limit vendor lock-in, where
> applicable."

Annex point 5.1.4 — mandatory contract content ("where appropriate through service level agreements"):
> "(a) cybersecurity requirements for the suppliers or service providers, including requirements as regards the
> security in acquisition of ICT services or ICT products set out in point 6.1; (b) requirements regarding awareness,
> skills and training, and where appropriate certifications, required from the suppliers' or service providers'
> employees; (c) requirements regarding the verification of the background of the suppliers' and service providers'
> employees; (d) an obligation on suppliers and service providers to notify, without undue delay, the relevant entities
> of incidents that present a risk to the security of the network and information systems of those entities; (e) the
> right to audit or right to receive audit reports; (f) an obligation on suppliers and service providers to handle
> vulnerabilities that present a risk to the security of the network and information systems of the relevant entities;
> (g) requirements regarding subcontracting and, where the relevant entities allow subcontracting, cybersecurity
> requirements for subcontractors […]; (h) obligations on the suppliers and service providers at the termination of the
> contract, such as retrieval and disposal of the information obtained by the suppliers and service providers in the
> exercise of their tasks."

Further Annex points that shape supplier expectations:
- 5.1.7(a)–(b): customers "regularly monitor reports on the implementation of the service level agreements" and
  "review incidents related to ICT products and ICT services from suppliers and service providers".
- 5.2: customers keep a registry of direct suppliers with "contact points" and "a list of ICT products, ICT services,
  and ICT processes provided".
- 6.1.2: acquisition requirements include "(b) requirements regarding security updates throughout the entire lifetime
  of the ICT services or ICT products", "(c) information describing the hardware and software components used", "(d)
  information describing the implemented cybersecurity functions […] and the configuration required for their secure
  operation".
- 3.3.1: "a simple mechanism allowing their employees, suppliers, and customers to report suspicious events".
- 6.10.2(e): "a procedure for disclosing vulnerabilities in accordance with the applicable national coordinated
  vulnerability disclosure policy".

Source: [Implementing Regulation (EU) 2024/2690](https://eur-lex.europa.eu/eli/reg_impl/2024/2690/oj/eng) (text
retrieved via Publications Office cellar, see Method).

### 17. Customer reporting clocks that drive supplier notification speed

> BSIG § 32(1): report to the joint BSI/BBK Meldestelle "1. unverzüglich, spätestens jedoch innerhalb von 24 Stunden nach
> Kenntniserlangung von einem erheblichen Sicherheitsvorfall, eine frühe Erstmeldung […]; 2. unverzüglich, spätestens
> jedoch innerhalb von 72 Stunden […], eine Meldung über diesen Sicherheitsvorfall […] einschließlich seines
> Schweregrads und seiner Auswirkungen, sowie gegebenenfalls die Kompromittierungsindikatoren […]; 3. auf Ersuchen des
> Bundesamtes eine Zwischenmeldung […]; 4. spätestens einen Monat nach Übermittlung der Meldung […] eine
> Abschlussmeldung" (or a "Fortschrittsmeldung" if ongoing, § 32(2)).

NIS2 Art. 23(4) is identical (24 h early warning, 72 h notification, 1 month final report).
2024/2690 Art. 3(1) makes an incident significant for digital-infrastructure customers inter alia on "direct financial
loss […] that exceeds EUR 500 000 or 5 % of the relevant entity's total annual turnover", "exfiltration of trade
secrets", or "a successful, suspectedly malicious and unauthorised access […] capable of causing severe operational
disruption"; Art. 7 adds for cloud providers "completely unavailable for more than 30 minutes" and data
integrity/confidentiality compromise "as a result of a suspectedly malicious action".
§ 35(2) BSIG obliges digital-infrastructure and ICT-management entities to inform recipients of significant cyber
threats and available remedies.
Sources: [§ 32 BSIG](https://www.gesetze-im-internet.de/bsig_2025/__32.html),
[§ 35 BSIG](https://www.gesetze-im-internet.de/bsig_2025/__35.html),
[Art. 23](https://eur-lex.europa.eu/eli/dir/2022/2555/oj/eng#art_23),
[2024/2690 Art. 3, 7](https://eur-lex.europa.eu/eli/reg_impl/2024/2690/oj/eng).

### 18. If thresholds are crossed (for the record)

- Registration within 3 months via the joint BSI/BBK facility with name, address, contact data incl. "öffentliche
  IP-Adressbereiche", sector, EU Member States served (§ 33(1)); changes within two weeks (§ 33(5)).
- Cloud/MSP additionally file the § 34 special registration (main EU establishment, IP ranges; forwarded to ENISA
  except IP ranges, § 34(3)).
- BSI is "in der gesamten Europäischen Union zentral zuständig" if the main establishment is in Germany (§ 60(1)–(2)).
- Risk-management measures § 30(1)–(2): ten areas mirroring Art. 21(2)(a)–(j); 2024/2690 takes precedence for
  cloud/MSP (§ 30(3)); compliance "ist durch die Einrichtungen zu dokumentieren" (§ 30(1) S. 3).
- Management: § 38(1) "umzusetzen und ihre Umsetzung zu überwachen", § 38(2) liability under company law, § 38(3)
  mandatory regular training.
- Supervision of *wichtige Einrichtungen* is reactive only (§ 62: "Rechtfertigen Tatsachen die Annahme […]");
  proactive Nachweise (§ 39) apply to KRITIS operators only.
- Fines § 65(5): up to EUR 10 m (*besonders wichtig*) / EUR 7 m (*wichtig*) for § 30/§ 32 breaches, or 2 % / 1.4 % of
  worldwide turnover where turnover exceeds EUR 500 m (§ 65(6)–(7)); registration breaches up to EUR 500 000
  (§ 65(5) Nr. 5).

Sources: [§ 33](https://www.gesetze-im-internet.de/bsig_2025/__33.html),
[§ 34](https://www.gesetze-im-internet.de/bsig_2025/__34.html),
[§ 38](https://www.gesetze-im-internet.de/bsig_2025/__38.html),
[§ 39](https://www.gesetze-im-internet.de/bsig_2025/__39.html),
[§ 60](https://www.gesetze-im-internet.de/bsig_2025/__60.html),
[§ 62](https://www.gesetze-im-internet.de/bsig_2025/__62.html),
[§ 65 BSIG](https://www.gesetze-im-internet.de/bsig_2025/__65.html).

### 19. Proportionality for small entities (relevant when adopting 2024/2690 voluntarily)

> Art. 2(2): entities "take due account of the degree of their exposure to risks, their size and the likelihood of
> occurrence of incidents and their severity".

> Recital 26: "micro-sized entities might find it difficult to segregate conflicting duties and conflicting areas of
> responsibility. Such entities should be able to consider compensating measures such as targeted oversight by the
> entity's management or increased monitoring and logging."

Annex 2.3: independent reviews may use "alternative measures to guarantee the impartiality of the reviews" where size
prevents separation of line of authority.
Source: [2024/2690](https://eur-lex.europa.eu/eli/reg_impl/2024/2690/oj/eng).

### 20. ENISA implementation guidance (non-binding)

ENISA published the "Technical Implementation Guidance on Cybersecurity Risk Management Measures" (v1.0, 26 Jun 2025)
for 2024/2690: per requirement it gives guidance, "examples of evidence" and tips, plus a mapping to ISO/IEC 27001,
NIST CSF, ETSI EN 319 401 and CEN/TS 18026 — a ready evidence catalogue for answering customer questionnaires.
Source: [ENISA news, 26 Jun 2025](https://www.enisa.europa.eu/news/supporting-nis2-implementation-through-actionable-guidance);
PDF: <https://www.enisa.europa.eu/sites/default/files/2025-06/ENISA_Technical_implementation_guidance_on_cybersecurity_risk_management_measures_version_1.0.pdf>
(not read in full).

### 21. Expected population and portals

> BSI FAQ: "Für rund 29.500 Unternehmen in Deutschland und Institutionen der Bundesverwaltung gelten seit Inkrafttreten
> des NIS-2-Umsetzungsgesetzes neue gesetzliche Pflichten."

Registration runs in two stages: "Mein Unternehmenskonto" (mein-unternehmenskonto.de), then the BSI portal
(portal.bsi.bund.de); incident reporting via the BSI portal.
Source: [BSI FAQ](https://www.bsi.bund.de/DE/Themen/Regulierte-Wirtschaft/NIS-2-regulierte-Unternehmen/NIS-2-FAQ/NIS-2-FAQ-allgemein/FAQ-zu-NIS-2.html).

### Method note

EUR-Lex HTML endpoints answered with an AWS-WAF JavaScript challenge to non-browser clients; the Directive,
Recommendation and Implementing Regulation texts were retrieved from the Publications Office cellar
(`publications.europa.eu/resource/celex/32022L2555`, `…/celex/32003H0361`,
`…/cellar/28f15de8-8ce9-11ef-a130-01aa75ed71a1.0006.03/DOC_1`), which serves the same Official Journal rendering EUR-Lex
displays. German texts were read from gesetze-im-internet.de (BMJV) and recht.bund.de (BGBl.) directly. Quotes are
verbatim from those renderings; EUR-Lex anchors (`#art_N`, `#rct_N`, `#anx_I`) follow the OJ HTML ids.

## Implications for the Control Register

open-dpp GmbH is **out of direct NIS2 scope**, so Art. 21/Art. 23 are **not** binding Controls. The register should
instead carry a **NIS2 supplier-readiness** set: what a regulated customer (Anlage 2 manufacturer with ≥ 50 staff, or
any digital-infrastructure entity bound by 2024/2690 Annex 5.1.4) will ask of open-dpp as a "direct supplier or
service provider". Each item is phrased as a status-free Control with its legal anchor and Ring (1 software ·
2 reference deployment · 3 operated instances · 4 organisation). IDs are proposals for the register.

| ID | Control (statement) | Anchor | Ring |
|---|---|---|---|
| NIS2-SC-01 | open-dpp maintains a written **security statement for customers** describing the platform's cybersecurity practices and secure development procedures (SDLC, code review, dependency scanning, release signing), refreshed per Review Run. | NIS2 Art. 21(3); 2024/2690 Annex 5.1.2(a), (c) | 4 |
| NIS2-SC-02 | A **component inventory (SBOM)** of the deployed software and its third-party services (MongoDB, MinIO, ClamAV, Caddy, Mistral, SMTP) is producible per release and shared with customers on request. | 2024/2690 Annex 6.1.2(c); BSIG § 30(2) Nr. 5 | 1, 2 |
| NIS2-SC-03 | A **secure-operation guide** documents implemented security functions and the configuration required for secure operation (the Deployment Security Guide of this plan). | 2024/2690 Annex 6.1.2(d) | 2 |
| NIS2-SC-04 | **Customer incident notification**: security incidents affecting a customer's tenant or instance are notified to the customer's named contact without undue delay and early enough for the customer's 24 h early-warning clock (target ≤ 12 h from confirmation), with follow-up at 72 h and a final report ≤ 1 month. | 2024/2690 Annex 5.1.4(d); BSIG § 32(1); NIS2 Art. 23(4) | 3, 4 |
| NIS2-SC-05 | An **incident classification** procedure records for each incident whether it meets a customer-relevant significance criterion (unavailability > 30 min, confidentiality/integrity compromise by malicious action, exfiltration of customer trade secrets, financial loss) so the customer can classify on its side. | 2024/2690 Art. 3(1), Art. 7; BSIG § 2 Nr. 11 | 3, 4 |
| NIS2-SC-06 | **Cyber-threat advisories**: customers are informed of significant cyber threats to the platform and of remedies they can take (e.g. credential rotation, API-key revocation). | BSIG § 35(2); NIS2 Art. 23(2) | 3, 4 |
| NIS2-SC-07 | A published **coordinated vulnerability disclosure policy** (security.txt, intake channel, SLA) exists, and vulnerabilities presenting a risk to customers are handled within the map's fix SLAs (Critical ≤ 7 d, High ≤ 30 d, Medium ≤ 90 d). | 2024/2690 Annex 5.1.4(f), 6.10.2(e); BSIG § 30(2) Nr. 5 | 1, 4 |
| NIS2-SC-08 | A **simple event-reporting channel** for customers and suppliers to report suspicious events is published and monitored. | 2024/2690 Annex 3.3.1–3.3.2 | 4 |
| NIS2-SC-09 | **Audit evidence on request**: the customer may receive the current Review Run report (redacted) or an equivalent third-party attestation; contracts state whether a right to audit or a right to audit reports is granted. | 2024/2690 Annex 5.1.4(e) | 4 |
| NIS2-SC-10 | **Subcontractor register**: all sub-processors/subcontractors with access to customer data (hosting, AI provider, mail, storage) are listed with the cybersecurity requirements imposed on them, and the list is shared with customers. | 2024/2690 Annex 5.1.4(g), 5.2 | 4 |
| NIS2-SC-11 | **Termination obligations**: on contract end, customer data are exported and deleted within a defined period and deletion is confirmed in writing. | 2024/2690 Annex 5.1.4(h) | 3, 4 |
| NIS2-SC-12 | **Personnel controls**: the 3 people with production access have documented security training and, where a customer requires it, background verification; access is removed on role change. | 2024/2690 Annex 5.1.4(b)–(c), 10.2, 10.3 | 4 |
| NIS2-SC-13 | **Lifetime security updates**: a support policy states how long each minor release receives security patches and that operated instances are patched within the fix SLAs. | 2024/2690 Annex 6.1.2(b), 6.6 | 1, 3 |
| NIS2-SC-14 | **SLA reporting**: availability and incident statistics per instance are recorded so a customer can "regularly monitor reports on the implementation of the service level agreements". | 2024/2690 Annex 5.1.7(a) | 3 |
| NIS2-SC-15 | **Named security contact point** per customer relationship (for the customer's supplier registry). | 2024/2690 Annex 5.2(a); NIS2 Art. 27 data model | 4 |
| NIS2-ORG-01 | **Scope watch**: at each annual close, headcount (AWU), turnover, balance sheet and shareholder structure are checked against BSIG § 28(2) Nr. 3 and § 28(4); if the 50-staff or 10 m/10 m line is crossed in two consecutive years, the § 33/§ 34 registration (3 months) and the full § 30/§ 32 regime are activated. | BSIG § 28(2), (4), § 33(1), § 34(1); Rec. 2003/361/EC Annex Art. 4(2) | 4 |
| NIS2-ORG-02 | **Voluntary alignment**: the Control Register maps its ASVS chapters to the ten Art. 21(2)(a)–(j) areas (2024/2690 Annex 1–13), so that a later in-scope switch or a customer questionnaire is answered by cross-reference rather than new work. | NIS2 Art. 21(2); BSIG § 30(2) | 4 |

Notes for the register author:

- The pass-down clauses above are legally required in customer contracts only for customers who are themselves
  digital-infrastructure / ICT-management entities under 2024/2690; for Anlage 2 manufacturers they are the natural
  reading of § 30(2) Nr. 4 and Art. 21(3) and mirror ENISA's evidence examples (Finding 20). Treat them as the expected
  questionnaire, not as a statute binding open-dpp.
- Self-hosted deployments by regulated entities see open-dpp as an *ICT product*: NIS2-SC-02/03/07/13 are what they
  need under 6.1.2 and 6.10. This overlaps with the CRA research (#774); reconcile SBOM and CVD Controls there.
- Nothing above requires registration with the BSI or reporting to the Meldestelle today; adding either would be
  over-compliance and would create a false record of applicability.

## Open questions

1. **Ownership / aggregation.** Does any enterprise (not natural person) hold ≥ 25 % of open-dpp GmbH, or is open-dpp
   linked to another enterprise via a controlling natural person active in the same or adjacent market? If yes,
   § 28(4) BSIG requires aggregation unless open-dpp is independent "mit Blick auf die Beschaffenheit und den Betrieb
   der informationstechnischen Systeme" — document the independence assessment (Finding 9).
2. **Headcount method.** Confirm the AWU count includes owner-managers and active partners (Rec. 2003/361/EC Annex
   Art. 5) and record the last two adopted annual accounts to evidence the two-consecutive-years rule.
3. **Classification choice.** For the eventual in-scope case, decide whether open-dpp registers as cloud computing
   service provider (SaaS instance), MSP (whitelabel instances) or both; both are Anlage 1, both trigger § 34 and § 60.
   Only relevant to the registration form, not to scope.
4. **Customer census.** Which current or target customers are NIS2 entities (Anlage 2 Nr. 5 manufacturers ≥ 50 staff;
   any Anlage 1 entity)? Their contractual demands decide how many of NIS2-SC-01…15 must be evidenced in the baseline
   run.
5. **Trade-secret status of DPP data.** Whether customers regard unpublished passport content (bill of materials,
   supplier lists) as trade secrets under Directive (EU) 2016/943 determines whether a confidentiality breach at
   open-dpp is a *significant incident* for them (2024/2690 Art. 3(1)(b)) — this shapes NIS2-SC-05 and the data
   classification in the threat model.
6. **Rechtsverordnungen.** BSIG § 56(5) allows a Rechtsverordnung to sharpen "erheblicher Sicherheitsvorfall"; § 30(5)
   allows one to extend measures. None was checked for 2026 — re-verify at the next Review Run.
7. **Public-sector customers.** If a Bundesverwaltung body hosts DPPs with open-dpp, the § 29/§ 43 regime and BSI
   IT-Grundschutz expectations apply on the customer side — covered by ticket #777.
8. **Overlap with CRA (#774) and ESPR/JTC 24 (#775).** CVD policy, SBOM and update-support Controls appear in all
   three; the register should hold one Control each with multiple anchors.
9. **July 2026 BSIG amendments.** BGBl. 2026 I Nr. 221 and Nr. 226 were not read; the consolidated text used here
   already incorporates them, but the amending acts should be skimmed once to confirm nothing touched §§ 28–35.
