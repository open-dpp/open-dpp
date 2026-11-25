# @open-dpp/dto

## 7.3.3

## 7.3.2

## 7.3.1

## 7.3.0

### Minor Changes

- [#1154](https://github.com/open-dpp/open-dpp/pull/1154) [`dce00c0`](https://github.com/open-dpp/open-dpp/commit/dce00c037c6ce5089cd1013cb15133d87d0e3588) Thanks [@florianBieck](https://github.com/florianBieck)! - The media upload API accepts SVG images and detects every file's type from its content instead of the client's MIME type. SVGs stay vector images: scripts, event handlers and references to other files are removed on upload, and SVG downloads carry a sandboxing Content-Security-Policy. Photos are stored upright, and all image metadata, the GPS position included, is removed. HEIC uploads, which could never be decoded, and other unsupported or broken files are now rejected with a 400 instead of failing with a 500.

  The media library and the media picker now offer WebP and SVG files in the file dialog. When a file is rejected because its type is not supported, it is invalid or it is larger than 15 MB, both say so instead of showing a generic error, and the media picker shows its messages in the selected language. An SVG that only defines a `viewBox` is shown at the size of its container in previews, the product image gallery and the branding logo, and at the size of the screen in the full-screen view of an image.

  After the product images of a passport or template are saved, the gallery in the editor shows the saved images, whichever image it was on. Before, it kept the old images or stayed empty when it was not on its first image.

## 7.2.0

## 7.1.2

## 7.1.1

## 7.1.0

### Minor Changes

- [#1158](https://github.com/open-dpp/open-dpp/pull/1158) [`2bb9f5c`](https://github.com/open-dpp/open-dpp/commit/2bb9f5c6cc5d6f4a8a3e9805e4609eb1ff642000) Thanks [@Hentra](https://github.com/Hentra)! - Operators can link their privacy policy, terms of service and imprint through `OPEN_DPP_LEGAL_PRIVACY_POLICY_URL`, `OPEN_DPP_LEGAL_TERMS_OF_SERVICE_URL` and `OPEN_DPP_LEGAL_IMPRINT_URL`. The links show in a footer in the app sidebar, on the presentation view and on every sign-in and sign-up page, and `GET /instance-settings/public` returns them as `legalLinks` to everyone. While terms or a privacy policy are linked, sign-up requires a consent checkbox; the server rejects a sign-up without `termsAccepted: true` and records `termsAcceptedAt` on the user. Users created by an admin are not asked.

## 7.0.1

## 7.0.0

### Major Changes

- [#1192](https://github.com/open-dpp/open-dpp/pull/1192) [`fb90dc4`](https://github.com/open-dpp/open-dpp/commit/fb90dc4a259fb5bd653a6a60e3b7ca56b27e8280) Thanks [@mr42](https://github.com/mr42)! - - A template that is no longer a draft is read-only. A passport created from a published template after this change only allows overwriting data values (table rows can still be added and deleted). Existing passports keep their stored `Full` editing mode. Passports from draft templates or without a template stay fully editable.
  - The last remaining row of a table (its header row) cannot be deleted; deleting a row while others remain is allowed, and the next row becomes the header. Rows cannot be added to a table without columns.
  - Breaking: removed `PUT /templates/:id/passport-editing-mode` and `PUT /passports/:id/editing-mode`, the related DTOs and the api-client methods `setEditingMode` / `setPassportEditingMode`. The template field `passportEditingMode` is replaced by the derived `editingMode`.
  - Client: published templates open in a read-only editor, restricted passports hide column actions, and table rows get a "Clear row values" action.

## 6.6.2

## 6.6.1

### Patch Changes

- [#1179](https://github.com/open-dpp/open-dpp/pull/1179) [`ffbc851`](https://github.com/open-dpp/open-dpp/commit/ffbc85125b709a4603a84e7e6a2910a29615dc99) Thanks [@renovate](https://github.com/apps/renovate)! - Update dependencies:

  - @open-dpp/main: `@tsconfig/node-ts` ^23.6.4 → ^23.6.5 (dev)
  - @open-dpp/dto: `@tsconfig/node-ts` ^23.6.4 → ^23.6.5 (dev)
  - @open-dpp/env: `@tsconfig/node-ts` ^23.6.4 → ^23.6.5 (dev)
  - @open-dpp/exception: `@tsconfig/node-ts` ^23.6.4 → ^23.6.5 (dev)
  - @open-dpp/permission: `@tsconfig/node-ts` ^23.6.4 → ^23.6.5 (dev)
  - @open-dpp/testing: `@tsconfig/node-ts` ^23.6.4 → ^23.6.5 (dev)

## 6.6.0

### Minor Changes

- [#1185](https://github.com/open-dpp/open-dpp/pull/1185) [`0f33629`](https://github.com/open-dpp/open-dpp/commit/0f33629e5d528cda9f7477c89b1eea4414a10463) Thanks [@mr42](https://github.com/mr42)! - Fix tests in main and e2e

### Patch Changes

- [#1149](https://github.com/open-dpp/open-dpp/pull/1149) [`0d27e45`](https://github.com/open-dpp/open-dpp/commit/0d27e45ead4375e66fbd8e3751dcc4cc8b779eba) Thanks [@mr42](https://github.com/mr42)! - Add guest access for external verified users such as repairers. Organization owners invite a person by email and assign a guest role (Repairer, Recycler, Market Surveillance Authority, Independent Operator, Supplier). The invitation is accepted explicitly after sign-in or sign-up with the invited address. A guest is not a member: they can only read, via the presentation view of a passport, and only after the owner has granted access. A guest reads everything the public reads, plus the fields that the access rules allow for their role. Admins, owners, members and guests fall back to the rule of the public for objects without a rule of their own, so existing passports need no migration and new submodels no longer get a default rule per guest role. A guest-only field needs a Read rule for the guest role first, and then the public Read rule can be removed. A role's own rules win over the public rule, on the object and on its parents. Owners manage guests (invite, change role, revoke) in the new organization guests view, and guests are notified by email about invitations, role changes and revocations. The shared subject role hierarchy now lives in `@open-dpp/permission`.

## 6.5.5

## 6.5.4

## 6.5.3

## 6.5.2

## 6.5.1

## 6.5.0

## 6.4.4

## 6.4.3

## 6.4.2

### Patch Changes

- [#1142](https://github.com/open-dpp/open-dpp/pull/1142) [`c9645c1`](https://github.com/open-dpp/open-dpp/commit/c9645c19192819d953bf1b70d09d973544110789) Thanks [@florianBieck](https://github.com/florianBieck)! - Build the project with TypeScript 6.0 instead of 5.9. TypeScript only type-checks here, so the Docker image, the web client and the published `@open-dpp/dto` and `@open-dpp/api-client` packages contain the same code as before, and nothing changes for projects that use the two packages. When you build from source, `pnpm install` installs TypeScript 6.0.3. The backend now type-checks in strict mode, so a `catch` variable is `unknown` until the code narrows it.

## 6.4.1

## 6.4.0

### Minor Changes

- [#1130](https://github.com/open-dpp/open-dpp/pull/1130) [`6e81265`](https://github.com/open-dpp/open-dpp/commit/6e81265cb02deaef5f3279b971e8e57a80f2095e) Thanks [@florianBieck](https://github.com/florianBieck)! - Members can download the Carrier Export of a permalink as SVG (sized in mm) or PNG (at a chosen DPI) from `GET /permalinks/:id/carrier`, with a four-module quiet zone, a module size and an error-correction level. The api-client gains `permalinks.getCarrierExport`, and the back office shows and downloads the server-rendered Data Carrier instead of drawing its own.

## 6.3.6

## 6.3.5

## 6.3.4

### Patch Changes

- [#1108](https://github.com/open-dpp/open-dpp/pull/1108) [`f6f684e`](https://github.com/open-dpp/open-dpp/commit/f6f684ec12181df529a8f0aada265b21cb2cb7fe) Thanks [@Hentra](https://github.com/Hentra)! - A button to manage usage appears on the usage page when `OPEN_DPP_USAGE_MANAGEMENT_URL` is set. A `{organizationId}` placeholder in the URL is replaced with the current organization's ID.

## 6.3.3

## 6.3.2

## 6.3.1

## 6.3.0

## 6.2.4

## 6.2.3

## 6.2.2

## 6.2.1

### Patch Changes

- [#1019](https://github.com/open-dpp/open-dpp/pull/1019) [`7ad9670`](https://github.com/open-dpp/open-dpp/commit/7ad9670cf7eefa079fef8afbc9fa44e118e14a83) Thanks [@mr42](https://github.com/mr42)! - Published passports can be exported to upload them to the EU registry.

## 6.2.0

### Minor Changes

- [#1017](https://github.com/open-dpp/open-dpp/pull/1017) [`f4c6f7c`](https://github.com/open-dpp/open-dpp/commit/f4c6f7cd1d3e50dc1376a88d14818dee768ecc33) Thanks [@mr42](https://github.com/mr42)! - Templates and passports can be filterd by multiple status and by date range. In addition, passports can also be filtered by template. Further ui improvements for passport creation dialog for long template names.

## 6.1.4

### Patch Changes

- [#904](https://github.com/open-dpp/open-dpp/pull/904) [`71c16fc`](https://github.com/open-dpp/open-dpp/commit/71c16fc23c4ccf7f9b82d14e822ed6fbd71fac36) Thanks [@mr42](https://github.com/mr42)! - In the template editor a user can restrict editing of derived passports to data only. Meaning, the structure, layout and security rules of a passport created from a template with restriction enabled cannot be modified. Only the data values of such a passport can be modified.

## 6.1.3

## 6.1.2

### Patch Changes

- [#976](https://github.com/open-dpp/open-dpp/pull/976) [`d1dc6c7`](https://github.com/open-dpp/open-dpp/commit/d1dc6c7116f5eb999a730a41d662c5d6368a62ce) Thanks [@mr42](https://github.com/mr42)! - Official templates are imported into an organization automatically when it's created, and can be re-imported at any time via "Import official templates" on the templates. The Github repository where the official templates are loaded from is configurable via environment variable.

## 6.1.1

## 6.1.0

### Minor Changes

- [#967](https://github.com/open-dpp/open-dpp/pull/967) [`a7a6759`](https://github.com/open-dpp/open-dpp/commit/a7a675966ff4aae683a178cf5a7ab8f8e759823b) Thanks [@florianBieck](https://github.com/florianBieck)! - Optional OAuth Provider: open-dpp can act as an OpenID Connect provider for one operator-configured Trusted Client (for example a landing page), off by default.

  - `OPEN_DPP_OAUTH_PROVIDER_ENABLED` plus `OPEN_DPP_OAUTH_PROVIDER_CLIENT_ID`, `_CLIENT_SECRET`, `_REDIRECT_URIS` and optional `_CLIENT_NAME` configure it; the client variables are validated only while the provider is enabled. The Trusted Client is written on every startup; a failed write stops the startup.
  - The Trusted Client signs Users in through `{origin}/api/v2/auth` and calls the API on their behalf with a 15-minute JWT access token carrying `open-dpp:api`; refresh tokens last 7 days, sliding.
  - The sign-in and sign-up pages continue a pending authorization; the sign-up page does so through the new `POST /api/v2/oauth-provider/continue` (`apiClient.dpp.oauthProvider.continueAuthorization`).
  - Users created without a display name get one (first and last name, or `User`), and `GET /organizations/member` reads memberships from the database.

  See `docs/guides/production-setup.md#oauth-provider`.

## 6.0.0

### Major Changes

- [#876](https://github.com/open-dpp/open-dpp/pull/876) [`38a9a4c`](https://github.com/open-dpp/open-dpp/commit/38a9a4c0e5949e516222ca0937822ffd4402bf20) Thanks [@florianBieck](https://github.com/florianBieck)! - Organization slugs are an internal detail equal to the organization id, so organization names no longer need to be unique.

  - `POST /organizations` accepts `{ name }` only and validates it (non-empty after trimming). A `slug` in the body is ignored; `logo` and `metadata` are no longer part of the create type (they were never forwarded).
  - `OrganizationDto` is now a zod schema in `@open-dpp/dto` (re-exported by `@open-dpp/api-client`): `slug` is removed, the never-sent `updatedAt` is gone, and `createdAt` is an ISO string instead of `Date`.
  - Organization responses no longer include the always-empty `members` array.
  - Existing organizations are backfilled to `slug = id` on every startup.
  - The raw better-auth routes `/organization/update` and `/organization/check-slug` return 403, like `/organization/create` already did.

## 5.3.0

## 5.2.0

## 5.1.0

## 5.0.0

## 4.0.1

### Patch Changes

- [#725](https://github.com/open-dpp/open-dpp/pull/725) [`5f4fb21`](https://github.com/open-dpp/open-dpp/commit/5f4fb215013e05dd129217a71ed457296bd82d25) Thanks [@mr42](https://github.com/mr42)! - In the passport and template editors, sections, subsections, and data fields can be moved.

## 4.0.0

## 3.6.0

### Minor Changes

- [#722](https://github.com/open-dpp/open-dpp/pull/722) [`3720c86`](https://github.com/open-dpp/open-dpp/commit/3720c8615cf26e57492525cc2b7a7e090990efb7) Thanks [@florianBieck](https://github.com/florianBieck)! - API Keys are now manageable

## 3.5.0

## 3.4.0

## 3.3.0

## 3.2.0

### Minor Changes

- [#671](https://github.com/open-dpp/open-dpp/pull/671) [`7b398df`](https://github.com/open-dpp/open-dpp/commit/7b398dfdc15c76e0a2bd8a4691eb6c9c09d94e5b) Thanks [@mr42](https://github.com/mr42)! - Add bulk import feature such that a REO user can create up to 1000 passports at once.

## 3.1.4

## 3.1.3

## 3.1.2

## 3.1.1

## 3.1.0

### Minor Changes

- [#687](https://github.com/open-dpp/open-dpp/pull/687) [`6f6154f`](https://github.com/open-dpp/open-dpp/commit/6f6154f38b07290ec19595cbbe2eeda6939aa887) Thanks [@florianBieck](https://github.com/florianBieck)! - The GS1 Digital Link resolver moves from the origin root to the `/gs1/v1/` prefix

## 3.0.0

### Major Changes

- [#615](https://github.com/open-dpp/open-dpp/pull/615) [`ff5d0a2`](https://github.com/open-dpp/open-dpp/commit/ff5d0a2a8458b8d66a4fc8a706aad4dc6001feaa) Thanks [@florianBieck](https://github.com/florianBieck)! - Passport-first permalinks: the "Create GS1 link" flow becomes "Create Permalink" and open-dpp unique product identifiers can now carry permalinks.

  - The `presentation` permalink kind is renamed to `open-dpp` (wire-level; legacy documents are migrated on read).
  - Every permalink now carries a required `passportId`; `presentationConfigurationId` and `uniqueProductIdentifierId` are both optional on the open-dpp kind — a bare passport-bound permalink is valid.
  - Strict kind matching: `gs1-link` permalinks require a GS1 identifier, `open-dpp` permalinks may bind an OPEN_DPP_UUID identifier; an open-dpp identifier may carry any number of permalinks (gs1-links stay one-per-identifier).
  - `/p/{slug ?? id}` renders the permalink's own bound presentation configuration; a null binding renders the built-in standard view (`presentationConfiguration` in the bundle is now nullable, no config is auto-consulted or seeded on the render path).
  - The GS1 resolver redirects a scanned Digital Link to the gs1-link permalink's own viewer URL — the primary-permalink concept (including `POST /permalinks/:id/primary`) is removed; the passport editor QR shows the latest-created permalink.
  - Presentation configurations are shareable across permalinks (config-unique index dropped) and re-bindable pre-freeze via `PATCH /permalinks/:id`; the last-permalink delete guard is gone (the freeze rule remains the only guard).

## 2.10.0

### Minor Changes

- [#621](https://github.com/open-dpp/open-dpp/pull/621) [`29e3399`](https://github.com/open-dpp/open-dpp/commit/29e3399add99e620140e2d10dd4c33e999f33756) Thanks [@Hentra](https://github.com/Hentra)! - Add 26 more languages to multilanguage description

## 2.9.0

### Minor Changes

- [#666](https://github.com/open-dpp/open-dpp/pull/666) [`2ace889`](https://github.com/open-dpp/open-dpp/commit/2ace8898a659bcdf8112972e2cae8d288fb1150e) Thanks [@murphylan](https://github.com/murphylan)! - Add total item count to organization-scoped paginated lists

  Passport and template list endpoints now report a `total_count` in their
  `paging_metadata`, computed with an index-backed `countDocuments` against the
  same filter used for the page. The passport and template list views surface it
  in the table footer ("Showing: 1 - 10 of 42"). The field is optional, so other
  paginated endpoints keep their existing response shape.

## 2.8.0

### Minor Changes

- [#632](https://github.com/open-dpp/open-dpp/pull/632) [`b3d58fe`](https://github.com/open-dpp/open-dpp/commit/b3d58fe9ef20e14fa9abbd952e49e51789212800) Thanks [@mr42](https://github.com/mr42)! - Rename list to table. Multiple columns can be grouped. Nested tables are possible now.

## 2.7.0

### Minor Changes

- [#601](https://github.com/open-dpp/open-dpp/pull/601) [`403f74e`](https://github.com/open-dpp/open-dpp/commit/403f74ef849fe2fcb5d5fd0771783584fb801928) Thanks [@mr42](https://github.com/mr42)! - Represent links as Property with valueType AnyUri instead of using ReferenceElement. Add api versioning to REST-API.

## 2.6.0

### Minor Changes

- [#587](https://github.com/open-dpp/open-dpp/pull/587) [`f8ec4ed`](https://github.com/open-dpp/open-dpp/commit/f8ec4ed20a0e6e9ada5eec60465293b0585c726d) Thanks [@mr42](https://github.com/mr42)! - Organization owners can change the role of a member.

## 2.5.0

### Minor Changes

- [#585](https://github.com/open-dpp/open-dpp/pull/585) [`cdf8621`](https://github.com/open-dpp/open-dpp/commit/cdf8621873ca0d98abe101bcb320b8a08a34e360) Thanks [@mr42](https://github.com/mr42)! - Add support for boolean data field.

## 2.4.0

### Minor Changes

- [#580](https://github.com/open-dpp/open-dpp/pull/580) [`d5f0b69`](https://github.com/open-dpp/open-dpp/commit/d5f0b69cdd15f8d13b5bfe7f9c7e66534b79d2da) Thanks [@mr42](https://github.com/mr42)! - Add activity history to passports and templates.

## 2.3.0

### Major Changes

- Realign the `@open-dpp/*` fixed version group above npm's burned version range so `@open-dpp/api-client` can publish again (its `1.x`–`2.2.x` line is burned on npm). `@open-dpp/dto@1.0.0` already published; this entry moves the shared group to `2.3.0`. See [ADR 0001](../../docs/adr/0001-jump-published-packages-past-burned-npm-versions.md).

## 1.0.0

### Major Changes

- [#520](https://github.com/open-dpp/open-dpp/pull/520) [`cf7dbd0`](https://github.com/open-dpp/open-dpp/commit/cf7dbd0d01313e50d4eec39a65944d98f417ba88) Thanks [@florianBieck](https://github.com/florianBieck)! - Added granular passport UI customization capabilities and refactored presentation layer into permalink structure.

## 0.6.0

### Minor Changes

- [#575](https://github.com/open-dpp/open-dpp/pull/575) [`9e62648`](https://github.com/open-dpp/open-dpp/commit/9e62648707401f6d50dc54bbb1fd4f892a49dad6) Thanks [@mr42](https://github.com/mr42)! - Use swagger documentation instead of vitest open api documentation. Correct parameter syntax in open api documentation from :id to {id}.

## 0.5.0

### Minor Changes

- [#572](https://github.com/open-dpp/open-dpp/pull/572) [`4d5c918`](https://github.com/open-dpp/open-dpp/commit/4d5c9182459b9d46793b88fbd6193c512a1c3b9c) Thanks [@mr42](https://github.com/mr42)! - Add endpoint to modify value of submodel.

## 0.4.4

### Patch Changes

- [#544](https://github.com/open-dpp/open-dpp/pull/544) [`19bce7c`](https://github.com/open-dpp/open-dpp/commit/19bce7c2e336f8d4ec53eab6de48315188aaa04f) Thanks [@mr42](https://github.com/mr42)! - Add instance setting OPEN_DPP_INSTANCE_ORGANIZATION_CREATION_ENABLED. If it is disabled only administrators are allowed to add new organizations. In addition the list of pending invitations are shown for new registered users and also within the profile view. Furthermore, the routing flow for users without organization has been corrected.

- [#564](https://github.com/open-dpp/open-dpp/pull/564) [`8b0e301`](https://github.com/open-dpp/open-dpp/commit/8b0e30179a1d874e927b94be0877212985a97b69) Thanks [@Hentra](https://github.com/Hentra)! - Change Id and id to ID in frontend

## 0.4.3

## 0.4.2

## 0.4.1

## 0.4.0

### Minor Changes

- [#513](https://github.com/open-dpp/open-dpp/pull/513) [`ca55ba0`](https://github.com/open-dpp/open-dpp/commit/ca55ba0529752cdd852ba41fcc357dfc1b27bacb) Thanks [@florianBieck](https://github.com/florianBieck)! - Updated dependencies to minor and patch versions

## 0.3.0

## 0.2.2

### Patch Changes

- [#514](https://github.com/open-dpp/open-dpp/pull/514) [`5f8a7ff`](https://github.com/open-dpp/open-dpp/commit/5f8a7ff23a611237652e9bc9e01a5be97ef445d1) Thanks [@Hentra](https://github.com/Hentra)! - Add an option to set the branding color for an organization

## 0.2.1

## 0.2.0

### Minor Changes

- [#503](https://github.com/open-dpp/open-dpp/pull/503) [`40c772c`](https://github.com/open-dpp/open-dpp/commit/40c772c5015aff47c0e91c443860ae25941bd44f) Thanks [@mr42](https://github.com/mr42)! - Templates and passports have a status (Draft, Published, Archived) now.

  The following operations are possible:

  - publish (Draft -> Published)
  - archive (Draft -> Archived or Published -> Archived)
  - restore (Archived -> Published or Archived -> Draft)

  In addition, a user can delete templates/ passports with the status draft.

## 0.1.4

### Patch Changes

- [#464](https://github.com/open-dpp/open-dpp/pull/464) [`48fc474`](https://github.com/open-dpp/open-dpp/commit/48fc474a3e54a1aa0a1f0601fa9af1215dfea86c) Thanks [@florianBieck](https://github.com/florianBieck)! - Change lint and format tooling to oxlint and oxfmt.

## 0.1.3

## 0.1.2

## 0.1.1

### Patch Changes

- [#495](https://github.com/open-dpp/open-dpp/pull/495) [`69e6c29`](https://github.com/open-dpp/open-dpp/commit/69e6c2929e3a5d1a23fa85126dcf42478c28bc06) Thanks [@florianBieck](https://github.com/florianBieck)! - Implementing a status endpoint and UI changes to display a version.
