# CRA applicability: is open-dpp GmbH a manufacturer, and what obligations follow?

Research note for the Security Review map ([#772](https://github.com/open-dpp/open-dpp/issues/772)),
ticket [#774](https://github.com/open-dpp/open-dpp/issues/774). Vocabulary: `CONTEXT.md` § Security Review
(Control, Control Register, Ring 1 software · Ring 2 reference deployment · Ring 3 operated instances · Ring 4 organisation).

Researched 2026-09-03 against primary sources only (Regulation text, Commission guidance and FAQ, ENISA, BSI).
Source keys such as `[CRA]`, `[GUID]` resolve in the Sources section at the end. EUR-Lex was behind a WAF
challenge on the research day; the Regulation text was read from the Publications Office Cellar copy of the same
OJ publication (OJ L 2024/2847, 20.11.2024). This note is not legal advice; see Open questions.

## Question

open-dpp is open source, but open-dpp GmbH sells it as a hosted SaaS, ships whitelabel instances to customers, and
the software is self-hostable by others. Under Regulation (EU) 2024/2847 (Cyber Resilience Act): is the GmbH a
**manufacturer**, an **open-source software steward**, or neither (and does SaaS-only use fall outside)? If in
scope: which Annex I Part I and Part II requirements bind us; what the Art. 14 reporting obligations mean from
11 September 2026; when full application starts; which product class we fall into and therefore which
conformity-assessment route applies. Output as a requirement list the organisational chapters can adopt as Controls.

## Short answer

1. **The hosted SaaS (cloud instance) and the GmbH-operated whitelabel instances are not "products with digital
   elements".** A web application accessed exclusively through a browser is not a product under the CRA; SaaS is
   the domain of NIS2 (Directive 2022/2555), not the CRA (Recital 12 `[CRA]`; `[GUID]` §20–21 and Example 5; `[FAQ]` 1.2).
   They are in CRA scope only as *remote data processing* for a product, which they are not: a self-hosted
   open-dpp instance does not depend on any GmbH-operated service (verified in code, Finding 4).
2. **The downloadable open-dpp software is a product with digital elements** (`ghcr.io/open-dpp/open-dpp` images,
   GitHub source releases, npm packages). Whether the GmbH is its *manufacturer* turns on "commercial activity":
   - any version supplied to a customer **under a paid agreement** (a whitelabel instance delivered as software, an
     enterprise/paid edition) is placed on the market and makes the GmbH a **manufacturer** for it, "irrespective of
     whether functionally equivalent software is also available free of charge" (`[GUID]` §57, Example 17);
   - for the **free public release of the same codebase**, the Commission's reading is that it is *not* placed on the
     market and the GmbH is its **open-source software steward** (`[GUID]` §52–53, §76) — unless the free release is
     the vehicle through which the GmbH monetises its hosting service (Recital 15; `[GUID]` §54). The Commission gives
     no example for "free download + paid hosting of the same software"; this is the one genuinely open legal point.
3. **Recommended posture for the Control Register: manufacturer-level, for the whole codebase.** The code is
   identical, so the cost is the same; any paid software delivery flips the role to manufacturer anyway; steward
   duties (Art. 24) are a strict subset; and Art. 14(1) vulnerability reporting binds the GmbH in either role because
   it develops the software (Art. 24(3)). Not adopting manufacturer-level Controls would need counsel to confirm that
   no whitelabel or other paid software delivery exists or will exist.
4. **Product class: default** (not Annex III/IV). Core functionality is DPP management; the embedded auth (Better
   Auth) and malware scanning (ClamAV) are integrated components, which by Art. 7(1) do not reclassify the product.
   Route: **Module A internal control** (self-assessment), EU declaration of conformity, CE marking on the
   declaration or the website (Art. 32(1), 30(1)).
5. **Dates.** Art. 14 reporting applies from **11 September 2026** to all products in scope, including versions
   placed on the market earlier (Art. 71(2), 69(3)). Full application **11 December 2027**; versions placed before
   that date fall under Annex I only once substantially modified — and for continuously released software, feature
   releases regularly are substantial modifications (`[GUID]` §107, Example 44), so plan for full compliance of every
   feature release from 11 December 2027. Registration on the ENISA Single Reporting Platform is an **immediate**
   action (Finding 15).

## Findings

### A. What the "product" is

1. **Scope hinges on "product with digital elements made available on the market".** Art. 2(1): the Regulation
   applies to "products with digital elements made available on the market, the intended purpose or reasonably
   foreseeable use of which includes a direct or indirect logical or physical data connection to a device or
   network." Art. 3(1): a product with digital elements is "a software or hardware product and its remote data
   processing solutions". `[CRA]`
2. **Browser-accessed web applications are not products; SaaS is NIS2 territory.** Recital 12: "Directive (EU)
   2022/2555 applies to cloud computing services and cloud service models, such as Software as a Service (SaaS)".
   Commission guidance §21: software "that executes remotely and is merely accessed by the user is not, on that basis
   alone, a product with digital elements ... This is typically the case for web applications, including progressive
   web apps, where they are accessed exclusively through a web browser." Example 5: "a web application accessed by
   the user exclusively through a web browser is not a product with digital elements." FAQ 1.2 says the same for
   "standalone Software-as-a-Service (SaaS)". `[CRA]` `[GUID]` `[FAQ]` The guidance is expressly "not binding"
   (`[GUID]` §8) but "set[s] out the Commission's interpretation of the CRA".
3. **Downloaded and locally executed software is a product.** `[GUID]` §20: software "downloaded, installed or
   otherwise supplied to the user and that executes on the user's electronic information system" is a product, "including
   ... an application developed using web technologies but supplied for local execution" (Example 4). open-dpp is
   supplied that way: `docker-compose.yml` pulls `ghcr.io/open-dpp/open-dpp:${VERSION}`; `RELEASING.md` documents the
   release flow that publishes the image, git tags, and `@open-dpp/dto` + `@open-dpp/api-client` to npm. The
   self-hosted instance is therefore a product with digital elements; the same applies to any whitelabel instance
   handed to a customer to run on its own infrastructure. Note Recital 20: "The sole act of hosting products with
   digital elements on open repositories, including through package managers ... does not in itself constitute the
   making available on the market" — publication alone is not the trigger; commercial activity is (Finding 6).
4. **No GmbH-operated remote data processing behind self-hosted instances.** Art. 3(2): remote data processing is
   processing "at a distance for which the software is designed and developed by the manufacturer ... and the absence
   of which would prevent the product ... from performing one of its functions". `[GUID]` §184 sets a three-part test.
   In code, the frontend routes every service URL to its own backend (`apps/client/src/const.ts`: `MARKETPLACE_URL`,
   `MEDIA_SERVICE_URL`, `AGENT_SERVER_URL`, `ANALYTICS_URL` all equal `API_URL`); the only GmbH hosts in the codebase
   are fallback `defaultBaseUrl`s inside the npm `@open-dpp/api-client` (`packages/api-client/src/*/…-api-client.ts`,
   `https://api.cloud.open-dpp.de`, `analytics.cloud.…`, `agent-server.cloud.…`), used only when a consumer sets no
   `baseURL`. The optional `OPEN_DPP_AUTH_CLOUD_*` variables (`packages/env/src/env.ts`) configure a generic OIDC
   provider, not a GmbH service. The Mistral LLM is a third-party service and counts as a *component* for due
   diligence, not as remote data processing (`[GUID]` §200–201). Consequence: the hosted SaaS does not enter CRA scope
   through the back door of Art. 3(1)/(2).

### B. Which role the GmbH holds

5. **Manufacturer definition.** Art. 3(13): "a natural or legal person who develops or manufactures products with
   digital elements or has [them] designed, developed or manufactured, and markets them under its name or trademark,
   whether for payment, monetisation or free of charge". Art. 3(22): making available on the market means supply "for
   distribution or use on the Union market in the course of a commercial activity, whether in return for payment or
   free of charge". "Commercial activity" is not defined in Art. 3; Recitals 15–18 describe it. `[CRA]`
6. **What makes FOSS supply commercial.** Recital 15: commercial activity "might be characterised not only by
   charging a price for a product with digital elements, but also by charging a price for technical support services
   where this does not serve only the recuperation of actual costs, by an intention to monetise, for instance by
   providing a software platform through which the manufacturer monetises other services, by requiring as a condition
   for use the processing of personal data [beyond security/compatibility/interoperability], or by accepting donations
   exceeding the costs". Recital 18: "the provision of products with digital elements qualifying as free and
   open-source software that are not monetised by their manufacturers should not be considered to be a commercial
   activity", and "the mere presence of regular releases should not in itself lead to the conclusion that a product
   ... is supplied in the course of a commercial activity." `[CRA]`
7. **Paid edition of the same codebase → manufacturer for that edition.** `[GUID]` §52: community and paid versions
   "are different products: the paid version is monetised in some way ... and therefore considered to be placed on the
   market, triggering the manufacturer's obligations. The version provided for free ... is not monetised and therefore
   is not considered to be placed on the market". §57: "access to a specific version ... including certain benefits
   such as technical assistance or performance optimisation, [that] is conditioned on remuneration ... is therefore
   considered placed on the market. This includes cases where a paid edition or enterprise version is made available
   under a commercial agreement, irrespective of whether functionally equivalent software is also available free of
   charge under a free and open-source licence." Example 30 (`[GUID]`): a company selling a paid version with technical
   assistance "is considered a manufacturer to that FOSS". Applied: a whitelabel instance *delivered as software* under
   a paid contract is exactly this case.
8. **Free version → steward, per the Commission.** `[GUID]` §53: "If the person supplying the community version is a
   legal person, that legal person is also subject to the obligations on stewards for the version it supplies for
   free". §76: "a legal entity that publishes a free (or community) version and a monetised version of the same FOSS,
   is deemed a steward to the free (or community) version, and a manufacturer to the monetised version." §74: steward
   status additionally requires that "the software is intended for commercial activities" and that the legal person
   sustains it (Art. 3(14)) — both true for open-dpp (DPP compliance software for businesses; GmbH hosts the source,
   governs and steers development, cf. §75). Recital 19 counts "entities that develop and publish free and open-source
   software in a business context" among stewards. `[CRA]` `[GUID]`
9. **The unresolved prong: does paid hosting monetise the free release?** Recital 15 / `[GUID]` §54 make FOSS placed
   on the market where the publisher "provides the software through which it monetises other products with digital
   elements or services". The Commission's examples (§54, Examples 14–16: marketplace app with commissions; free VPN
   client whose paid servers are reached through it; fitness app conditioned on ad data) all involve the *downloaded
   software itself* being the channel that produces revenue for the publisher. A self-hosted open-dpp instance
   generates no GmbH revenue and needs no GmbH service (Finding 4), so the prong is weak — but no Commission text
   addresses "free download + paid hosting of the same software" (checked: no such example in `[GUID]` or `[FAQ]`).
   Paid consulting/deployment help around a freely downloadable product does *not* make it commercial (`[GUID]` §55–56,
   Example 18).
10. **Steward obligations (if that is the role for the free release).** Art. 24(1): a documented, verifiable
    "cybersecurity policy to foster the development of a secure product ... as well as an effective handling of
    vulnerabilities", including "documenting, addressing and remediating vulnerabilities" and fostering voluntary
    reporting; Art. 24(2): cooperate with market surveillance authorities and hand over the policy on request;
    Art. 24(3): "The obligations laid down in Article 14(1) shall apply to open-source software stewards to the extent
    that they are involved in the development of the products" and Art. 14(3)/(8) to the extent severe incidents hit
    infrastructure the steward provides for development. Stewards affix no CE marking (Recital 19) and are exempt from
    administrative fines (Art. 64(10)(b); `[COM-OSS]`). `[CRA]` `[GUID]` §79–82 confirm: stewards providing engineering
    resources must notify actively exploited vulnerabilities under Art. 14(1).
11. **Steward becomes manufacturer on monetisation, prospectively.** `[GUID]` §84: an entity that starts monetising
    "qualifies as the manufacturer ... from the date on which it places it on the market (but not in respect of earlier
    versions for which it acted as a steward)".
12. **Integrator duties apply regardless of role.** Art. 13(5): due diligence when integrating third-party components
    "including when integrating components of free and open-source software that have not been made available on the
    market in the course of a commercial activity". Art. 13(6): on finding a vulnerability in a component "including in
    an open source-component", report it to the component's maintainer and share any fix "where appropriate in a
    machine-readable format". `[FAQ]` 4.4.4: integrating out-of-scope or steward-published FOSS is allowed. `[CRA]`

### C. Dates

13. **Application.** Art. 71(2): "This Regulation shall apply from 11 December 2027. However, Article 14 shall apply
    from 11 September 2026 and Chapter IV (Articles 35 to 51) shall apply from 11 June 2026." Entry into force
    10 December 2024 (20 days after OJ publication of 20.11.2024). `[CRA]` `[COM-IMPL]`
14. **Transition.** Art. 69(2): products placed on the market before 11 December 2027 "shall be subject to the
    requirements set out in this Regulation only if, from that date, those products are subject to a substantial
    modification." Art. 69(3): "By way of derogation ... the obligations laid down in Article 14 shall apply to all
    products with digital elements ... placed on the market before 11 December 2027." `[GUID]` §210 adds that reporting
    "continue[s] to apply after a product with digital elements is no longer supported", whereas Annex I Part II
    vulnerability handling runs only for the support period. `[CRA]` `[GUID]`
15. **The reporting platform is not live yet; register as soon as it is.** Art. 16(1): ENISA establishes a "single
    reporting platform". ENISA: "As of 11 September 2026 onwards, the SRP will be used by CSIRTs and manufacturers for
    mandatory reporting"; FAQ Q4 "The platform is scheduled to be operational by 11 September 2026"; Q9: the URL "will
    be communicated and published in due course on this page before the platform goes live"; access requires an EU
    Login account for an "Assigned Representative" (AR) of the manufacturer or steward, two-factor authentication, and a
    non-validated AR may file up to 20 notifications before validation is mandatory; Q15: no API "at this stage"; Q25:
    if the SRP is unavailable, wait and submit when it is back. No public URL was published as of 2026-09-03 (ENISA FAQ
    "Updated: 31 August 2026"). `[SRP]` `[SRP-FAQ]`
16. **Software releases and "placing on the market".** `[GUID]` §13–15: placing on the market occurs "at the moment
    of the first offering for distribution or use"; later iterations "are considered as newly placed on the market when
    those iterations qualify as a 'substantial modification'"; non-substantial updates "do not modify that software's
    date of placement on the market." Art. 3(30) defines substantial modification as a change "which affects the
    compliance ... with the essential cybersecurity requirements set out in Part I of Annex I or which results in a
    modification to the intended purpose". Recital 39 and `[GUID]` §108: security updates are generally not substantial
    modifications. `[GUID]` §107, Example 44: adding a "remember me"/persistent-login feature *is* a substantial
    modification because it introduces token-theft and session risks not covered by the risk assessment; Example 45:
    a log-export feature storing sensitive data unencrypted likewise. For open-dpp this means most feature minors will
    count, and the practical reading of Finding 14 is: every feature release after 11 December 2027 must be Annex I
    compliant. Pre-release alpha/beta/RC builds may ship non-compliant "with a visible sign" (`[FAQ]` 1.6). `[CRA]` `[GUID]` `[FAQ]`

### D. Product class and conformity route

17. **Default category.** Art. 7(1): products "which have the core functionality of a product category set out in
    Annex III shall be considered to be important ... The integration of a product with digital elements which has the
    core functionality of a product category set out in Annex III shall not in itself render the product in which it
    is integrated subject to the conformity assessment procedures referred to in Article 32(2) and (3)." Annex III
    Class I lists, among others, "Identity management systems and privileged access management software", "Software
    that searches for, removes, or quarantines malicious software", "Password managers", "Public key infrastructure
    and digital certificate issuance software", "Smart home general purpose virtual assistants"; Class II lists
    hypervisors/container runtimes and firewalls/IDS/IPS; Annex IV is hardware only. Implementing Regulation (EU)
    2025/2392 (adopted 28.11.2025, Art. 7(4)) describes identity management systems as products "that provide
    mechanisms for authentication or authorisation" (SSO, federated identity, MFA software) and antimalware as software
    that detects/removes malicious code "in order to maintain the integrity, confidentiality, or availability of such
    devices"; its recital 5 says a product that can perform such functions "but whose core functionality itself is
    different ... is not to be considered to meet the technical description", and recital 3 gives the embedded-browser-
    in-a-news-app example. open-dpp's core functionality is DPP/AAS data management; Better Auth (own accounts) and
    ClamAV (upload scanning) are integrated components; the LLM assistant is not a "smart home" assistant. Conclusion:
    default category. `[CRA]` `[IR]`
18. **Route.** Art. 32(1): default products may use "(a) the internal control procedure (based on module A)", or
    module B+C, module H, or an EU cybersecurity certification scheme. Annex VIII Part I Module A: the manufacturer
    "ensures and declares on its sole responsibility that the products ... satisfy all the essential cybersecurity
    requirements set out in Part I of Annex I and the manufacturer meets the essential cybersecurity requirements set out
    in Part II of Annex I." Art. 13(12): before placing on the market, draw up technical documentation (Art. 31,
    Annex VII), run the assessment, draw up the EU declaration of conformity (Art. 28, Annex V) and affix CE marking.
    Art. 30(1): for software "the CE marking shall be affixed either to the EU declaration of conformity ... or on the
    website accompanying the software product". Art. 32(5): FOSS even in Annex III categories may self-assess if the
    technical documentation is public — irrelevant here but a useful fallback if classification were contested.
    Art. 27(1): harmonised standards give presumption of conformity; none are cited in the OJEU yet — the Commission
    requested 15 horizontal standards (three deliverables, due 30 Aug 2026 / 30 Oct 2027 / 30 Aug 2026) and 26
    vertical ones under M/606 (`[FAQ]` 6.10, `[COM-STD]`). Until then the Annex I text itself, the JRC–ENISA
    requirements-standards mapping and BSI TR-03183 are the practical yardsticks (`[ENISA-MAP]` `[BSI-TR]`). `[CRA]`

### E. Manufacturer obligations that would bind us (Art. 13, Annex I, II, VII)

19. **Design and risk assessment.** Art. 13(1)–(4): design/develop per Annex I Part I; document a cybersecurity risk
    assessment covering "the intended purpose and reasonably foreseeable use", indicate how each Part I point (2)
    requirement applies and is implemented, justify non-applicable ones, keep it updated during the support period,
    include it in the technical documentation. `[CRA]`
20. **Annex I Part I, point (2)(a)–(m)** — the product must, where applicable: (a) ship "without known exploitable
    vulnerabilities"; (b) with "a secure by default configuration ... including the possibility to reset"; (c) allow
    fixing via security updates, with notification of available updates (auto-update where applicable); (d) protect
    against unauthorised access ("authentication, identity or access management systems") and report attempts;
    (e) confidentiality via "encrypting relevant data at rest or in transit by state of the art mechanisms";
    (f) integrity of data, commands, programs, configuration, and report corruptions; (g) data minimisation;
    (h) availability, incl. DoS resilience; (i) limit impact on other networks; (j) limit attack surface incl. external
    interfaces; (k) exploitation mitigation; (l) "recording and monitoring relevant internal activity, including the
    access to or modification of data, services or functions, with an opt-out mechanism for the user"; (m) let users
    "securely and easily remove on a permanent basis all data and settings". `[CRA]`
21. **Annex I Part II (vulnerability handling), all eight points:** (1) SBOM "in a commonly used and machine-readable
    format covering at the very least the top-level dependencies"; (2) remediate "without delay", and "where
    technically feasible, new security updates shall be provided separately from functionality updates"; (3) "effective
    and regular tests and reviews of the security of the product"; (4) once a fix is out, "publicly disclose information
    about fixed vulnerabilities, including a description ..., information allowing users to identify the product ...
    affected, the impacts ..., their severity and clear and accessible information helping users to remediate" — with a
    permitted delay "where manufacturers consider the security risks of publication to outweigh the security benefits
    ... until after users have been given the possibility to apply the relevant patch"; (5) "a policy on coordinated
    vulnerability disclosure"; (6) "a contact address for the reporting of the vulnerabilities"; (7) "mechanisms to
    securely distribute updates"; (8) security updates "disseminated without delay and ... free of charge, accompanied
    by advisory messages". `[CRA]`
22. **Support period and update availability.** Art. 13(8): handle vulnerabilities "for the support period", which
    "shall be at least five years" unless the product is expected to be in use for less; rationale goes in the
    technical documentation. Art. 13(9): each security update "remains available after it has been issued for a minimum
    of 10 years or for the remainder of the support period, whichever is longer". Art. 13(10): where substantially
    modified versions were placed on the market, patching only the latest version is allowed "provided that the users
    of the versions that were previously placed on the market have access to the version last placed on the market
    free of charge" — which FOSS satisfies. Art. 13(11): public archives of old versions are allowed if users "are
    clearly informed ... about risks associated with using unsupported software". Art. 13(19): the end date of the
    support period ("at least the month and the year") must be specified "at the time of purchase in an easily
    accessible manner", and where feasible the product displays an end-of-support notification. `[CRA]` `[GUID]` §126–130
23. **Identification, contact, user information.** Art. 13(15): a version/serial identifier. Art. 13(16): name and
    postal/email/web contact of the manufacturer on the product or accompanying document and in the Annex II
    information. Art. 13(17): "a single point of contact to enable users to communicate directly and rapidly", not
    limited to automated tools. Art. 13(18): Annex II information kept available "for at least 10 years ... or for the
    support period, whichever is longer". Annex II minimum content: manufacturer identity and contact; single point of
    contact for vulnerability reports and where the CVD policy is; product name/type/identification; intended purpose
    incl. "the security environment provided by the manufacturer" and "security properties"; known circumstances
    leading to significant risks; URL of the EU declaration of conformity; "the type of technical security support
    offered ... and the end-date of the support period"; instructions on secure commissioning, installing security
    updates, secure decommissioning and data removal, turning off automatic updates, and integrator information; and,
    if the SBOM is offered to users, where to find it. `[CRA]`
24. **Documentation, declaration, retention, corrective action, cessation.** Art. 13(12)–(13): technical documentation
    (Annex VII: description, architecture, vulnerability-handling processes incl. SBOM, CVD policy, evidence of the
    contact address, secure update distribution, the risk assessment, support-period rationale, standards applied,
    test reports, copy of the declaration) and the EU declaration of conformity kept "for at least 10 years after the
    product ... has been placed on the market or for the support period, whichever is longer". Art. 13(20): provide the
    declaration or a simplified one with the URL of the full text. Art. 13(21): corrective measures/withdrawal/recall
    for non-conformities during the support period. Art. 13(23): on cessation of operations, inform market surveillance
    authorities and users "to the extent possible". Art. 13(25): SBOM to a market surveillance authority on request. `[CRA]`

### F. Reporting (Art. 14) — what applies from 11 September 2026

25. **Triggers.** Art. 14(1): "any actively exploited vulnerability contained in the product with digital elements that
    it becomes aware of"; Art. 3(42): actively exploited means "reliable evidence that a malicious actor has exploited
    it in a system without permission of the system owner". Art. 14(3): "any severe incident having an impact on the
    security of the product"; Art. 14(5): severe where it affects "sensitive or important data or functions" or "has
    led or is capable of leading to the introduction or execution of malicious code in a product ... or in the network
    and information systems of a user". `[FAQ]` 5.2: zero-days without exploitation evidence, bug-bounty and lab
    findings are not reportable; 5.4: a vulnerable component that cannot be exploited in the product is not reportable.
    `[GUID]` §213: "becoming aware" is the point of "a reasonable degree of certainty" after initial assessment; §217:
    no retroactive reporting for exploitation known before 11 September 2026. `[CRA]` `[FAQ]` `[GUID]`
26. **Timelines and content.** Vulnerabilities, Art. 14(2): early warning "within 24 hours of the manufacturer
    becoming aware" (Member States concerned); vulnerability notification "within 72 hours" (product, nature of
    exploit and vulnerability, corrective/mitigating measures, sensitivity); final report "no later than 14 days after
    a corrective or mitigating measure is available" (description incl. severity and impact, malicious actor info if
    available, details of the fix). Severe incidents, Art. 14(4): 24 h early warning (incl. whether "suspected of being
    caused by unlawful or malicious acts"), 72 h incident notification, final report "within one month after the
    submission of the incident notification". Art. 14(6): the CSIRT may request intermediate status reports. `[CRA]`
27. **To whom, and how.** Art. 14(1)/(3): "simultaneously to the CSIRT designated as coordinator ... and to ENISA"
    via the single reporting platform. Art. 14(7): the end-point of the Member State of the manufacturer's "main
    establishment ... where the decisions related to the cybersecurity of its products with digital elements are
    predominantly taken" — for the GmbH, Germany. BSI states it "is the notifying authority for the Regulation (EU)
    2024/2847 ... in Germany" and that the national CRA implementing act (CRA-Durchführungsgesetz) "is going through the
    legislative process"; the SRP routes automatically to the coordinator CSIRT chosen at registration (`[SRP-FAQ]`
    Q8/Q20). Delegated Regulation (EU) 2026/881 specifies the cybersecurity grounds on which CSIRTs may delay
    dissemination of notifications (Art. 14(9)/16(2)). `[CRA]` `[BSI]` `[SRP-FAQ]` `[DR-881]`
28. **Users must be informed.** Art. 14(8): after becoming aware, "inform the impacted users ..., and where appropriate
    all users, of that vulnerability or incident and, where necessary, of any risk mitigation and corrective measures
    ..., where appropriate in a structured, machine-readable format". Art. 15: voluntary reporting of other
    vulnerabilities, incidents and near misses is possible and "shall not result in the imposition of any additional
    obligations" (SRP voluntary channel comes "in the next phase", `[SRP-FAQ]` Q6). `[CRA]`
29. **SaaS incidents vs product vulnerabilities.** An availability or data incident *on the cloud instance* is a
    service incident (NIS2 domain, out of this ticket). But an actively exploited vulnerability *in the open-dpp code*,
    however discovered (including via the SaaS instance), is a product vulnerability and reportable under Art. 14(1) for
    the product versions in scope. The incident-response runbook must make this distinction explicit.

### G. Penalties and SME relief

30. Art. 64(2): non-compliance with Annex I or Arts. 13–14: fines "up to EUR 15 000 000 or ... up to 2,5 % of [the]
    total worldwide annual turnover", whichever is higher; Art. 64(3): other listed articles up to EUR 10 000 000 / 2 %.
    Art. 64(10): no fines for "manufacturers that qualify as microenterprises or small enterprises with regard to any
    failure to meet the deadline referred to in Article 14(2), point (a), or Article 14(4), point (a)" (the 24 h early
    warnings), nor for "any infringement of this Regulation by open-source software stewards". Art. 17(6): CSIRTs
    "shall provide helpdesk support ... in particular manufacturers that qualify as microenterprises or as small or
    medium-sized enterprises." `[CRA]`

## Implications for the Control Register

Posture decision proposed for the register: **manufacturer-level Controls for the whole open-dpp codebase, default
product class, Module A self-assessment.** Steward duties (Finding 10) are covered by CRA-11, CRA-13, CRA-15 below.
IDs are provisional; #790 maps them to ASVS chapters, #788 adopts the Ring 4 items.

| ID | Control (adoptable wording) | CRA source | Ring |
|----|-----------------------------|------------|------|
| CRA-01 | Every release publishes an SBOM in CycloneDX or SPDX covering at least all top-level dependencies of backend, frontend and image; attached to the GitHub release and the OCI image; retained with the technical documentation. | Annex I II(1); Art. 13(25); BSI TR-03183-2 as format reference | 1 |
| CRA-02 | No release ships with a known exploitable vulnerability: dependency and image scanning gate on the release workflow; Critical/High must be fixed or documented as not exploitable before tagging. | Annex I I(2)(a) | 1 |
| CRA-03 | Secure-by-default configuration: the reference compose and `.env.dev.example` ship hardened defaults; deviations required for operation are listed in the Deployment Security Guide. | Annex I I(2)(b); Annex II 8(a) | 1, 2 |
| CRA-04 | Security fixes are released separately from feature work (patch releases on the current line) and marked as security releases in `CHANGELOG.md`. | Annex I II(2), II(8) | 1 |
| CRA-05 | Release integrity: signed git tags, signed OCI images with build provenance (e.g. cosign/SLSA attestation), pinned GitHub Actions; verification instructions published. | Annex I II(7) | 1, 4 |
| CRA-06 | Security-relevant activity (authentication, authorisation failures, data access/modification, admin actions) is logged, with a documented operator opt-out. | Annex I I(2)(l) | 1 |
| CRA-07 | Users can permanently remove all their data and settings (account, organisation, media); decommissioning of an instance is documented. | Annex I I(2)(m); Annex II 8(d) | 1, 2 |
| CRA-08 | Access control, encryption in transit/at rest, integrity, availability/DoS resilience, attack-surface limitation, exploitation mitigation, data minimisation: satisfied via the ASVS L2 chapters; #790 records the mapping Annex I I(2)(d)–(k) → ASVS. | Annex I I(2)(d)–(k) | 1 |
| CRA-09 | Regular security tests and reviews: the Review Run cadence already decided (per minor release or quarterly, plus after auth/permission/upload/deployment changes) is the evidence. | Annex I II(3); Art. 13(2)–(3) | 1, 4 |
| CRA-10 | Third-party component due diligence: dependency inventory (from CRA-01), automated vulnerability monitoring (Renovate/Dependabot + advisories), documented upstream-reporting practice for vulnerabilities found in components, incl. Mistral as a third-party service. | Art. 13(5)–(6); `[GUID]` §200–201 | 1, 4 |
| CRA-11 | Coordinated vulnerability disclosure: `SECURITY.md` with policy, scope, expected timelines and safe-harbour statement; GitHub private vulnerability reporting enabled; a monitored security contact address that is not only an automated tool; the same information in the docs. | Annex I II(5)–(6); Art. 13(17); Annex II pt 2 | 4 |
| CRA-12 | Public advisories for fixed vulnerabilities: a GitHub Security Advisory (CVE where warranted) per fixed vulnerability, stating description, affected versions, severity (CVSS v4.0), impact and remediation; publication may be delayed only until users could patch, with the reason recorded. This answers the map's open point on disclosing exploitable Findings. | Annex I II(4); Art. 14(8) | 4 |
| CRA-13 | Art. 14 reporting procedure: (a) an Assigned Representative registered on the ENISA SRP with EU Login and 2FA, plus a deputy, BSI selected as coordinator CSIRT — start as soon as the SRP URL is published, before 11 Sep 2026 if possible; (b) triage criteria for "actively exploited" and "severe incident" and a defined "becoming aware" moment; (c) clocks 24 h → 72 h → 14 d (vulnerability) / 1 month (incident) with templates for each stage; (d) user notification per Art. 14(8) in a machine-readable form (advisory + RSS/JSON feed); (e) service-vs-product incident distinction (Finding 29); (f) tabletop exercise once a year. | Art. 14(1)–(8); Art. 16; `[SRP-FAQ]` | 4 |
| CRA-14 | Support-period policy published: at least five years from placing on the market of the current supported line, security updates delivered via the latest release (free upgrade, Art. 13(10)), end-of-support month/year stated in the docs and in the app's about/version view, warning on unsupported versions, release artefacts kept available for ten years. | Art. 13(8)–(11), 13(19); Annex II pt 7 | 4, 1 |
| CRA-15 | A cybersecurity risk assessment document for the product (intended purpose, foreseeable use, threat model, applicability of each Annex I I(2) point with justification for any not applicable), reviewed per substantial modification and at each Review Run; it doubles as the steward "cybersecurity policy". | Art. 13(2)–(4); Art. 24(1); Annex VII pt 3 | 4 |
| CRA-16 | Technical documentation per Annex VII maintained in-repo (`security-review/` is the natural home), EU declaration of conformity per Annex V drafted and, once Annex I is met, published with the CE marking on the declaration or the docs site; retention ≥ 10 years. | Art. 13(12)–(13), 13(20); Art. 28, 30(1); Annex V, VII | 4 |
| CRA-17 | Annex II user information page in the docs: manufacturer identity and contact, security point of contact and CVD link, product identification, intended purpose and security environment, known risky configurations, declaration URL, support type and end date, secure commissioning/update/decommissioning instructions, SBOM location. | Art. 13(16), 13(18); Annex II | 4 |
| CRA-18 | Substantial-modification triage in the release checklist: each release is classified (security-only / minor non-substantial / substantial) against the risk assessment; a substantial release refreshes CRA-15 and CRA-16 and resets the placing-on-the-market date. | Art. 3(30); Recital 39; `[GUID]` §13–15, §107–108 | 4 |
| CRA-19 | Unambiguous version identification: semantic version in image tag, git tag, `/api` version endpoint and UI, so that advisories can name affected versions. | Art. 13(15); Annex II pt 3 | 1 |
| CRA-20 | Cessation-of-operations notice procedure (who informs users and the market surveillance authority, how, minimum notice). | Art. 13(23) | 4 |
| CRA-21 | Deployment Security Guide includes the Annex II 8(a)–(e) items for self-hosters (secure commissioning, update installation, disabling auto-update where offered, decommissioning) and states which Annex I properties depend on the deployment (TLS termination, backups, network exposure). | Annex II pt 8; Annex I I(2)(b),(e),(h) | 2 |

Fix-SLA compatibility: the map's SLAs (Critical ≤ 7 d, High ≤ 30 d, Medium ≤ 90 d) are consistent with "without
delay" in Annex I II(2); the Art. 14 clocks are notification deadlines and run in parallel with, not instead of, the fix SLA.

## Open questions

1. **Counsel:** does operating a paid hosted edition make the free download "software through which [the GmbH]
   monetises other services" (Recital 15; `[GUID]` §54)? If yes, the GmbH is a manufacturer for the free release too
   and the recommended manufacturer-level posture becomes mandatory rather than prudent. No Commission example exists.
2. **Fact check with sales/contracts:** are whitelabel instances ever *delivered as software* to a customer's
   infrastructure (→ manufacturer, Finding 7), or exclusively operated by the GmbH (→ service, outside CRA)? Are there
   any paid support, SLA or enterprise agreements conditioning access to versions, updates or binaries (Finding 7)?
3. **Company size:** confirm whether the GmbH is a micro or small enterprise (Art. 64(10)(a) relief for the 24 h
   deadline; Art. 33 SME support measures; Art. 17(6) CSIRT helpdesk).
4. **Licence hygiene:** `LICENSE` is AGPL-3.0, root `package.json` declares `LGPL-3.0-only`, and all workspace
   `package.json` files declare `ISC`. FOSS status under Art. 3(48) and `[GUID]` §46 requires source "openly shared"
   under a FOSS licence — any of these qualifies, but the inconsistency should be removed before any declaration cites
   the licence. Not a CRA blocker; a hygiene Finding for the baseline run.
5. **Support period design:** which line(s) are "supported", how the ≥ 5-year period interacts with a continuous
   release model relying on Art. 13(10) (patch only latest, free upgrade), and whether ESPR/DPP legislation counts as
   "relevant Union law determining the lifetime" (Art. 13(8)); ties into the ESPR/JTC 24 research ticket.
6. **Germany specifics:** final CRA-Durchführungsgesetz text, BSI's formal designation as coordinator CSIRT and
   market surveillance authority, and any national reporting particulars (`[BSI]` says the act is still in the
   legislative process).
7. **`@open-dpp/api-client` fallback hosts:** the npm package defaults to `*.cloud.open-dpp.de` when no `baseURL` is
   given (Finding 4). Not remote data processing for the product, but a third party embedding the client without
   configuration would talk to GmbH infrastructure; consider requiring `baseURL` or documenting it. Minor.
8. **Harmonised standards:** none cited in the OJEU as of 2026-09-03; revisit when the EN 40000-series deliverables
   (horizontal: secure development, Annex I properties, vulnerability handling) are cited, since they will give
   presumption of conformity (Art. 27(1)) and may reshape CRA-08/CRA-15.
9. **Interaction with NIS2** for the hosted instances (the service side that the CRA excludes) is covered by the
   separate NIS2 research ticket; this note only establishes that the CRA does not reach the SaaS as such.

## Sources

- `[CRA]` Regulation (EU) 2024/2847 (Cyber Resilience Act), OJ L 2024/2847, 20.11.2024. ELI:
  http://data.europa.eu/eli/reg/2024/2847/oj — read via the Publications Office Cellar copy
  http://publications.europa.eu/resource/celex/32024R2847 (EUR-Lex UI was WAF-gated on 2026-09-03).
- `[IR]` Commission Implementing Regulation (EU) 2025/2392 of 28 November 2025 on the technical description of the
  categories of important and critical products with digital elements, OJ L 2025/2392, 1.12.2025.
  http://data.europa.eu/eli/reg_impl/2025/2392/oj (read via http://publications.europa.eu/resource/celex/32025R2392).
- `[DR-881]` Commission Delegated Regulation (EU) 2026/881 of 11 December 2025 on cybersecurity-related grounds for
  delaying the dissemination of notifications. http://data.europa.eu/eli/reg_del/2026/881/oj
- `[GUID]` Commission guidance on the application of Regulation (EU) 2024/2847, Annex to C(2026) 5252 final,
  Brussels 27.7.2026 (84 pp). https://ec.europa.eu/newsroom/dae/redirection/document/131456 — announcement:
  https://digital-strategy.ec.europa.eu/en/library/commission-publishes-new-guidance-support-timely-cyber-resilience-act-implementation
- `[FAQ]` European Commission, "FAQs on the Cyber Resilience Act", v1.3, 01/07/2026.
  https://ec.europa.eu/newsroom/dae/redirection/document/122331 — landing page:
  https://digital-strategy.ec.europa.eu/en/library/cyber-resilience-act-implementation-frequently-asked-questions
- `[COM-OSS]` Commission, "CRA and open source", updated 31 Jul 2026. https://digital-strategy.ec.europa.eu/en/policies/cra-open-source
- `[COM-IMPL]` Commission, "Cyber Resilience Act implementation" factpage, updated 27 Jul 2026.
  https://digital-strategy.ec.europa.eu/en/factpages/cyber-resilience-act-implementation
- `[COM-STD]` Commission, "CRA standardisation", updated 31 Jul 2026. https://digital-strategy.ec.europa.eu/en/policies/cra-standardisation
- `[SRP]` ENISA, Single Reporting Platform (SRP).
  https://www.enisa.europa.eu/topics/product-security-and-certification/single-reporting-platform-srp
- `[SRP-FAQ]` ENISA, SRP Frequently Asked Questions, updated 31 August 2026.
  https://www.enisa.europa.eu/topics/product-security/single-reporting-platform-srp/frequently-asked-questions
- `[ENISA-MAP]` JRC–ENISA, "Cyber Resilience Act Requirements Standards Mapping", 4 Apr 2024.
  https://www.enisa.europa.eu/publications/cyber-resilience-act-requirements-standards-mapping-joint-research-centre-enisa-joint
- `[BSI]` BSI, Cyber Resilience Act pages incl. "Notifizierung CRA" ("BSI is the notifying authority for the
  Regulation (EU) 2024/2847 ... in Germany"; CRA-DG in the legislative process).
  https://www.bsi.bund.de/EN/Themen/Unternehmen-und-Organisationen/Informationen-und-Empfehlungen/Cyber_Resilience_Act/cyber_resilience_act_node.html
- `[BSI-TR]` BSI TR-03183 "Cyber Resilience Requirements for Manufacturers and Products" (Part 2: SBOM, v2.1.0;
  Part 3: Vulnerability Reports and Notifications, v1.0.0).
  https://www.bsi.bund.de/EN/Themen/Unternehmen-und-Organisationen/Standards-und-Zertifizierung/Technische-Richtlinien/TR-nach-Thema-sortiert/tr03183/TR-03183_node.html
- Repository facts: `LICENSE`, `package.json`, `docker-compose.yml`, `RELEASING.md`, `apps/client/src/const.ts`,
  `packages/api-client/src/api-client.ts`, `packages/env/src/env.ts` (this worktree, `main` at 9c560822).
