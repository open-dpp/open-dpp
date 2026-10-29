# Product

<!-- impeccable:product-schema 1 -->

Shared product record for every UI in this repository: `apps/client` (back office and public passport view) and `docs` (documentation site). Each app may carry its own DESIGN.md.

## Platform

web

## Users

**Primary: product-data and compliance staff at manufacturers and importers**, often small and mid-sized companies without in-house DPP expertise. They work as Members of an Organization (role Owner or Member). Their job is to model templates, fill in and publish passports, manage identifiers, GS1 Digital Links, permalinks and QR codes, and import product data in bulk, so their products meet ESPR and sector duties such as the EU Batteries Regulation.

Secondary audiences that the product serves through its own surfaces:

- **Passport visitors**: consumers, repairers, recyclers and market surveillance authorities who open a published passport anonymously from a QR code or permalink (`/p/<permalink>`). They read the product data, can send a repair request, and can chat with the AI assistant when the Organization has enabled it.
- **Operators**: people who self-host an instance, configure it through environment variables, set the instance logo and administer it.
- **Integrators**: developers who read and write passports through the AAS API with API keys.

## Product Purpose

open-dpp is an open-source platform for creating, managing and publishing Digital Product Passports (DPPs) on the IEC 63278 Asset Administration Shell (AAS) data model. ESPR and sector legislation require structured, machine-readable product data across a product's lifecycle (material composition, provenance, emissions, repair, recyclability, compliance information). open-dpp gives an Organization one place to keep that data consistent and to make it reachable from the product itself.

Success: an Organization publishes a passport whose data is correct, that is reachable from its data carrier, and that both people and machines can read.

## Positioning

- **Open source and self-hostable.** AGPL-3.0. Runs on the customer's own infrastructure with Docker Compose, so the data and the deployment stay under the customer's control.
- **AAS-native (IEC 63278).** Every passport is an Asset Administration Shell with submodels, readable and writable through the standard AAS API rather than a proprietary schema.
- **Hosted EU cloud option.** cloud.open-dpp.de, hosted in the EU, for teams that do not want to run it themselves. Plans are Free, Starter, Scale and Enterprise; plan limits and prices live in the separate `landing-page` repository, not here.

The AI passport assistant is a capability (below), not a positioning claim.

## Operating Context

- **Back office** (authenticated, scoped to the active Organization): passports, templates, permalinks, unique product identifiers and GS1 links, media, bulk import runs, analytics, activity history, integrations (AI), API keys, members and invitations, organization settings and branding, usage against plan quotas, and instance administration.
- **Public passport view** (anonymous): `/p/<permalink>` and `/p/<permalink>/chat`. It shows the Organization's logo and primary color.
- **Lifecycle**: passports and templates move from Draft to Published to Archived; an archived one can be restored.
- **Data carriers**: QR codes are downloaded from the back office and printed on products or packaging. GS1 Digital Links resolve to the passport.
- **Deployment**: self-hosted with Docker Compose (the root `docker-compose.yml` is for local evaluation only, not production) or the hosted cloud. Mail, virus scanning (ClamAV) and AI are optional services; an instance runs without them.
- **Documentation**: docs.open-dpp.de, built from `docs/` (VitePress), for operators and users. The OpenAPI description is published at cloud.open-dpp.de/api.

## Capabilities and Constraints

- **Terminology**: `CONTEXT.md` is the glossary (User, Account, Profile, Member, Owner, Member Removal, Trusted Client, OAuth Provider, and others). Use its terms in UI copy, and avoid the words it lists under "Avoid".
- **Multi-tenancy**: every resource belongs to an Organization. A User can be a Member of several Organizations. Plan policies cap passports, members, media storage and AI tokens per Organization.
- **Branding**: an instance logo (`OPEN_DPP_INSTANCE_BRANDING`), and per Organization a logo and a primary color. The Organization's logo and primary color replace the instance defaults across its back office and all of its passports. The primary color can be any color an Owner picks.
- **AI assistant**: optional, enabled per Organization, needs an instance-level Mistral key. All Organizations on an instance share the same model.
- **Languages**: German (de-DE) and English (en-US). Each User's Preferred Language is persisted and mirrored to the browser locale.
- **Standards status**: conformance against ESPR, the Batteries Regulation, other sector laws and the CEN/CENELEC JTC 24 standards is assessed clause by clause and is partial. The platform supports compliance work; it does not deliver compliance.

## Brand Commitments

- **Name**: "open-dpp", lowercase, with a hyphen. Logo files: `docs/open-dpp-logo.svg`, `apps/client/src/assets/logo.svg`.
- **No compliance promise**: no UI, documentation or marketing text may say open-dpp, a passport or a customer is "compliant" or "certified". Say that the platform supports compliance, or describe a pilot.
- **The Organization's brand wins**: on an Organization's back office and passports, its logo and primary color take precedence over the instance branding.

## Evidence on Hand

- **Conformance Matrix** in `dpp-standards/`: clause-by-clause Met / Partial / Gap assessments with automated Checks (`apps/e2e/tests/conformance`). It is the honest source for any statement about standards coverage, and its results are mixed.
- **Documentation and API**: the `docs/` guides and the published OpenAPI description.
- **Absent, never fabricate**: customer names or logos, testimonials, case studies, usage numbers, benchmarks, press coverage, certifications, and readiness dates for any regulation.

## Product Principles

1. **Honest about compliance.** Show what the product covers and what it does not. Never let a screen imply a regulatory guarantee.
2. **The AAS standard underneath, the user's job on top.** The primary user is not an AAS expert. Speak in products, passports and lifecycle stages, and expose shells and submodels where they help rather than as the entry point.
3. **The customer controls data and deployment.** Every feature must work on a self-hosted instance, and optional services (mail, ClamAV, AI) degrade gracefully when they are absent.
4. **The passport belongs to the Organization.** The public view carries the Organization's identity, and any visitor can read it: accessible, bilingual, and reachable from a QR code.

## Accessibility & Inclusion

- **WCAG 2.1 AA on every surface**, both the public passport view and the back office. For the public view this is EN 301 549 clause 9, required by EN 18216; open gaps are tracked in issue #1035.
- **Arbitrary brand colors**: an Organization's primary color can be any value, so contrast and focus visibility must hold whatever color an Owner picks.
- **German and English parity**: every surface ships in de-DE and en-US. The page language follows the selected language, and layouts must survive the longer German strings.
