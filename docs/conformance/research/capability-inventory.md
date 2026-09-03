# open-dpp capability inventory (factual, no conformance judgement)

Surveyed 2026-09-03 on `main` at 9c560822 for the Conformance Review. Lists what exists and where; it does not rate anything. Re-survey when re-validating.


## 1. AAS API surface
- No standalone AAS controller; AAS routes via decorator factories in apps/main/src/aas/presentation/aas.decorators.ts, mounted on passport.controller.ts, template.controller.ts, permalink.controller.ts.
- Global prefix /api, URI versioning v1/v2 (apps/main/src/main.ts; packages/dto/src/api-version.dto.ts).
- Route families under /api/v{1,2}/passports/:id, /templates/:id, read-only /p/:id:
  shells (GET, PATCH :aasId); submodels (GET/POST, GET/PATCH/DELETE :submodelId, $value); submodel-elements (GET/POST, GET/PATCH/DELETE/POST :idShortPath, $value); DELETE security/policies; non-standard table ext: columns/groups/rows/move.
- Contracts: aas/presentation/aas.endpoints.ts; orchestration environment.service.ts.
- Full AAS metamodel in aas/domain (Environment, AAS, AssetInformation, Submodel, ConceptDescription, all SME types, Qualifier, Extension, EmbeddedDataSpecification, AdministrativeInformation, Reference/Key, IdShortPath).
- NOT FOUND: /description endpoint, top-level /shells repository, lookup/shells, shell/submodel descriptors, /serialization, level/extent/content modifiers as routes (level-type.ts exists in domain), attachment endpoints.

## 2. Serialization / interop
- JSON only; custom versioned export envelope v1..v5 (aas/infrastructure/serialization/export-schemas/, aas-export-migration.ts); AasSerializationService, aas-import.mapper.ts.
- Endpoints: GET /passports/:id/export, POST /passports/import, GET /templates/:id/export, POST /templates/import.
- Bulk import JSON/CSV/XLSX 10MB (apps/main/src/bulk-import/): parse-file, configs, runs, items, interrupt.
- NOT FOUND: AASX, XML, JSON-LD, RDF, aas-core/BaSyx dep.

## 3. Identifiers
- UPI module apps/main/src/unique-product-identifier/: /unique-product-identifiers CRUD + POST /internal; GET /passports/:id/unique-product-identifiers; types incl GS1.
- GS1 Digital Link: full AI table/parser/builder in packages/dto/src/unique-product-identifiers/gs1/ (GTIN-14 normalisation, CSET-82 validation).
- GS1 resolver gs1-resolver.controller.ts prefix gs1/v1: GET /gs1/v1/01/:gtin[/10/:batch][/21/:serial] -> 302 to public presentation URL, query forwarded. GET /passports/:id/gs1-identity.
- Permalinks apps/main/src/permalink/: kinds OPEN_DPP, GS1_LINK; per-org permalinkBaseUrl (branding).
- Operator/facility ids: only Organization tenant; no legal-entity id scheme.
- NOT FOUND: DID, ISO 15459, IEC 61406, .well-known/gs1resolver, linkset, GLN/SSCC minting ("open-dpp never mints GS1 identifiers").

## 4. Data carriers
- QR client-side via qrcode npm: apps/client/src/components/QrCode.vue, permalinks/PermalinkQrCode.vue, presentation/PassportQrCodeDialog.vue.
- NOT FOUND: GS1 2D/DataMatrix, NFC, RFID, print layout/quiet zone, server-side rendering.

## 5. Access rights
- Better Auth (identity/auth/auth.provider.ts) organization/admin/apiKey plugins; email+password; x-api-key header, 100 req/min built-in.
- Roles: instance admin|user|anonymous; org owner|member; header x-open-dpp-organization-id.
- AAS-native ABAC in aas/domain/security/: Security, AccessControl, AccessPermissionRule, PermissionPerObject, Permission (CRED, Allow), SubjectAttributes (role hierarchy incl anonymous), AasAbility, AccessAllowed, SubmodelSecurityContext, PolicyTargetValidity; per-submodel/per-element visibility via idShortPath targets; DELETE .../security/policies.
- Quota/cap: apps/main/src/policy/. CASL packages/permission (organization subject only).
- Throttling @nestjs/throttler 1000/60s global; UserOrIpThrottlerGuard; email-change 3/h.
- API key CRUD /users/me/api-keys. AllowAnonymous/OptionalAuth decorators.

## 6. Persistence / versioning
- Lifecycle Draft -> Published -> Archived -> Restore (digital-product-document/domain/digital-product-document-status.ts); PUT /{passports,templates}/:id/status; docs/guides/digital-product-document/lifecycle.md.
- Permalink freeze on publish (permalink.application.service.ts freezePermalink, freezeAllForPassport).
- Audit trail apps/main/src/activity-history/ ~25 change events; GET /{passports|templates}/:id/activities (+/download).
- AdministrativeInformation version/revision exists.
- NOT FOUND: backup/snapshot, retention, soft-delete, append-only/immutable storage, content hashing. Hard DELETE /passports/:id.

## 7. Registry / discovery
- NOT FOUND: EU DPP registry client, AAS Registry/Discovery/Submodel Registry, descriptors, /description.
- semanticId + supplementalSemanticIds modelled on all SMEs (aas/domain/common/has-semantics.ts).
- ConceptDescription domain/repo/schema + export/import, but NO HTTP endpoint.

## 8. Templates / semantic models
- Template = reusable AAS Environment per org (templates/domain/template.ts; /templates CRUD + AAS routes + export/import + status).
- NO shipped IDTA submodel templates (Nameplate, TechnicalData, ContactInfo, HandoverDoc, PCF). Only test fixtures (submodel.spec.ts PCF ids; apps/e2e/tests/api/battery-passport.ts hand-built).
- MultiLanguageProperty + LanguageText; Language enum fixed 31 entries (packages/dto/src/aas/enums/language-enum.ts); BcpLanguageTagSchema exists, no non-test consumer.
- NOT FOUND: ECLASS/IEC CDD, IRDI handling, textile/steel templates.

## 9. Traceability
- apps/main/src/traceability-events/ (EVENTS.md); POST /dpp-events, GET /dpp-events/:id; enum OPENEPCIS|UNTP|OPEN_DPP; opaque JSON wrappers, no EPCIS 2.0/UNTP schema validation, no JSON-LD, no query.
- Analytics page views apps/main/src/analytics/.

## 10. Security & integrity
- ClamAV upload scanning (media/presentation/virus-scan.file-validator.ts).
- HMAC-SHA256 only for email-change revoke token.
- Activity history; correlation IDs; LoggerMiddleware JSON logs.
- CORS hardcoded localhost:5173 in main.ts.
- NOT FOUND: signatures/JWS, VCs, content hashing, Helmet, CSP, HSTS.

## 11. Public presentation
- /p/:permalink public view (client router presentation.ts; backend permalink.controller.ts GET /p, /p/:id, PATCH /p/:id).
- Presentation configurations module (per-element component mapping).
- Branding per org (logo, primaryColor, permalinkBaseUrl).
- UI i18n en-US, de-DE only; preferredLanguage en|de.
- Accessibility: ad-hoc aria-label; no WCAG/EN 301 549 policy or tests.

## 12. Conformance artifacts
- Only CLAUDE.md mentions IEC 63278. CONTEXT.md glossary identity-only. No docs/adr. No ESPR/CEN/JTC24/CIRPASS/DIN/ISO/conformance docs or tests. Workflows: build, docs, e2e, release.
- E2E: apps/e2e/tests/passport-identity/{gs1-resolver,permalink-crud,upi-crud,publish-freeze}.spec.ts, bulk-import/*, presentation-bignumber, account/*. Postman workspace postman/.

## 13. OpenAPI
- zod-openapi createDocument, OpenAPI 3.1.0, info.version v2: apps/main/src/open-api-docs/index.ts (+ *.paths.ts). Output docs/api-docs.json, 95 paths; `pnpm --filter @open-dpp/main export-api-doc`. Swagger at /api/swagger when OPEN_DPP_BUILD_API_DOC.
- Servers cloud/demo/localhost; security apiKeyAuth + sessionAuth; required x-open-dpp-organization-id.
- NOT in spec: /gs1/v1/*, /dpp-events, /status, /media/*, /instance-settings, /configurations.
