# @open-dpp/client

## 7.5.0

### Minor Changes

- [#1236](https://github.com/open-dpp/open-dpp/pull/1236) [`668e1e1`](https://github.com/open-dpp/open-dpp/commit/668e1e16c6fdd3d95721de7f91c0130889cd12f4) Thanks [@florianBieck](https://github.com/florianBieck)! - The media library and the media picker load the media of the organization one page at a time: six files, newest first. Before, they loaded the info of every file the organization has. An upload shows the first page, where the new file comes first. After a delete the shown page is loaded again, and the previews of the files that stay do not request their files again. The grid has the previous/next bar of the other lists, with the number of all files.

  Breaking: `GET /media/by-organization` no longer answers a bare array with every file. It takes the query parameters `limit` (1 to 100, 100 when absent) and `cursor` and answers `{ paging_metadata: { cursor, total_count }, result }` like the other list endpoints, newest first. The api-client method `media.getMediaInfoByOrganization` takes `{ limit, cursor }` and returns that page. The api-client type `MediaInfoDto` now comes from `@open-dpp/dto` and has every field the backend returns.

  The buttons of the previous/next bar below every list have an accessible name and a tooltip. After a list loads its page again, for example when an API key was revoked, a later page that was opened before no longer repeats an entry or shows a wrong range.

## 7.4.2

### Patch Changes

- [#1268](https://github.com/open-dpp/open-dpp/pull/1268) [`e83cdf7`](https://github.com/open-dpp/open-dpp/commit/e83cdf748dbd310d6b2854f7f789e6e9e2f10ecf) Thanks [@florianBieck](https://github.com/florianBieck)! - Update dependencies:

  - @open-dpp/client: `vue-tsc` ^3.3.11 → ^3.3.14 (dev)

## 7.4.1

### Patch Changes

- [#1264](https://github.com/open-dpp/open-dpp/pull/1264) [`9ce3b1d`](https://github.com/open-dpp/open-dpp/commit/9ce3b1dfbbf0cf57c512944f20c916bd127584ed) Thanks [@renovate](https://github.com/apps/renovate)! - Update dependencies:

  - @open-dpp/client: `@vueuse/core` ^14.3.0 → ^14.4.0

- [#1265](https://github.com/open-dpp/open-dpp/pull/1265) [`b7723ed`](https://github.com/open-dpp/open-dpp/commit/b7723eda8996e67be57b3aa7b22126ae74cfd937) Thanks [@renovate](https://github.com/apps/renovate)! - Update dependencies:

  - @open-dpp/client: `axios` ^1.20.0 → ^1.21.1
  - @open-dpp/main: `axios` ^1.20.0 → ^1.21.1
  - @open-dpp/api-client: `axios` ^1.20.0 → ^1.21.1

- [#1266](https://github.com/open-dpp/open-dpp/pull/1266) [`e3ac8f4`](https://github.com/open-dpp/open-dpp/commit/e3ac8f47e3bf325fe115c05b81b4770a3870386a) Thanks [@renovate](https://github.com/apps/renovate)! - Update dependencies:

  - @open-dpp/client: `chart.js` ^4.5.1 → ^4.6.2

## 7.4.0

### Minor Changes

- [#1259](https://github.com/open-dpp/open-dpp/pull/1259) [`cbe2287`](https://github.com/open-dpp/open-dpp/commit/cbe22870a52602914fa3d7b2ffcaa2218244cb33) Thanks [@mr42](https://github.com/mr42)! - The bulk import overview shows each config ID, which is copied on click. The template ID links to the template and opens in a new tab. All copy actions now confirm success and report failures.

## 7.3.4

## 7.3.3

## 7.3.2

### Patch Changes

- [#1240](https://github.com/open-dpp/open-dpp/pull/1240) [`0982bf1`](https://github.com/open-dpp/open-dpp/commit/0982bf1e28f68f2bc6bb172d0dda9b5dda37a8fe) Thanks [@renovate](https://github.com/apps/renovate)! - Update dependencies:

  - @open-dpp/client: `@vue/test-utils` ^2.5.1 → ^2.6.0 (dev)

- [#1241](https://github.com/open-dpp/open-dpp/pull/1241) [`8d99c5c`](https://github.com/open-dpp/open-dpp/commit/8d99c5c37b5e2cca546a9e06e658199c8e970c10) Thanks [@renovate](https://github.com/apps/renovate)! - Update dependencies:

  - @open-dpp/client: `autoprefixer` ^10.6.2 → ^10.7.0 (dev)

## 7.3.1

### Patch Changes

- [#1234](https://github.com/open-dpp/open-dpp/pull/1234) [`ad119e4`](https://github.com/open-dpp/open-dpp/commit/ad119e4233f26dc5f278f9a914608e1f59e7c78b) Thanks [@florianBieck](https://github.com/florianBieck)! - The media library and the media picker show the size of a file in the unit that fits it ("209 B", "33.2 KB", "1.5 MB"), with the decimal separator of the selected language. The tile and the details panel show the same text for the same file. Before, a small file read as "0.0 MB" in the details panel and as "0.00 MB" on the tile.

## 7.3.0

### Minor Changes

- [#1154](https://github.com/open-dpp/open-dpp/pull/1154) [`dce00c0`](https://github.com/open-dpp/open-dpp/commit/dce00c037c6ce5089cd1013cb15133d87d0e3588) Thanks [@florianBieck](https://github.com/florianBieck)! - The media upload API accepts SVG images and detects every file's type from its content instead of the client's MIME type. SVGs stay vector images: scripts, event handlers and references to other files are removed on upload, and SVG downloads carry a sandboxing Content-Security-Policy. Photos are stored upright, and all image metadata, the GPS position included, is removed. HEIC uploads, which could never be decoded, and other unsupported or broken files are now rejected with a 400 instead of failing with a 500.

  The media library and the media picker now offer WebP and SVG files in the file dialog. When a file is rejected because its type is not supported, it is invalid or it is larger than 15 MB, both say so instead of showing a generic error, and the media picker shows its messages in the selected language. An SVG that only defines a `viewBox` is shown at the size of its container in previews, the product image gallery and the branding logo, and at the size of the screen in the full-screen view of an image.

  After the product images of a passport or template are saved, the gallery in the editor shows the saved images, whichever image it was on. Before, it kept the old images or stayed empty when it was not on its first image.

## 7.2.0

### Patch Changes

- [#1221](https://github.com/open-dpp/open-dpp/pull/1221) [`af4b219`](https://github.com/open-dpp/open-dpp/commit/af4b219a149bcea32383ab0ddc089c032338f5cf) Thanks [@renovate](https://github.com/apps/renovate)! - Update dependencies:

  - @open-dpp/client: `vue` ^3.5.44 → ^3.5.46

- [#1222](https://github.com/open-dpp/open-dpp/pull/1222) [`e2748cd`](https://github.com/open-dpp/open-dpp/commit/e2748cd472857a16623e64208df4a9f82485caa8) Thanks [@renovate](https://github.com/apps/renovate)! - Update dependencies:

  - @open-dpp/client: `vue-chartjs` ^5.3.4 → ^5.3.7

- [#1223](https://github.com/open-dpp/open-dpp/pull/1223) [`18891e3`](https://github.com/open-dpp/open-dpp/commit/18891e34a748dc5280f1ffb7bdbaa1e8048d465c) Thanks [@renovate](https://github.com/apps/renovate)! - Update dependencies:

  - @open-dpp/client: `vue-i18n` ^11.4.14 → ^11.4.23

## 7.1.2

## 7.1.1

### Patch Changes

- [#1208](https://github.com/open-dpp/open-dpp/pull/1208) [`34f29a6`](https://github.com/open-dpp/open-dpp/commit/34f29a6e0b8c0f3259db2dd39e8628c9988bffc4) Thanks [@renovate](https://github.com/apps/renovate)! - Update dependencies:

  - @open-dpp/client: `@tailwindcss/postcss` ^4.3.3 → ^4.3.5 (dev)
  - @open-dpp/client: `tailwindcss` ^4.3.3 → ^4.3.5 (dev)

- [#1212](https://github.com/open-dpp/open-dpp/pull/1212) [`421a97f`](https://github.com/open-dpp/open-dpp/commit/421a97f7457090ddd8cffbf8a33876ed4b14e0c7) Thanks [@renovate](https://github.com/apps/renovate)! - Update dependencies:

  - @open-dpp/client: `dompurify` ^3.4.17 → ^3.4.18

## 7.1.0

### Minor Changes

- [#1158](https://github.com/open-dpp/open-dpp/pull/1158) [`2bb9f5c`](https://github.com/open-dpp/open-dpp/commit/2bb9f5c6cc5d6f4a8a3e9805e4609eb1ff642000) Thanks [@Hentra](https://github.com/Hentra)! - Operators can link their privacy policy, terms of service and imprint through `OPEN_DPP_LEGAL_PRIVACY_POLICY_URL`, `OPEN_DPP_LEGAL_TERMS_OF_SERVICE_URL` and `OPEN_DPP_LEGAL_IMPRINT_URL`. The links show in a footer in the app sidebar, on the presentation view and on every sign-in and sign-up page, and `GET /instance-settings/public` returns them as `legalLinks` to everyone. While terms or a privacy policy are linked, sign-up requires a consent checkbox; the server rejects a sign-up without `termsAccepted: true` and records `termsAcceptedAt` on the user. Users created by an admin are not asked.

## 7.0.1

### Patch Changes

- [#1195](https://github.com/open-dpp/open-dpp/pull/1195) [`ba4982b`](https://github.com/open-dpp/open-dpp/commit/ba4982b9d7e5d6f66b1613a3cbd5218dfc904d9c) Thanks [@renovate](https://github.com/apps/renovate)! - Update dependencies:

  - @open-dpp/client: `postcss` ^8.5.32 → ^8.5.33 (dev)

## 7.0.0

### Major Changes

- [#1192](https://github.com/open-dpp/open-dpp/pull/1192) [`fb90dc4`](https://github.com/open-dpp/open-dpp/commit/fb90dc4a259fb5bd653a6a60e3b7ca56b27e8280) Thanks [@mr42](https://github.com/mr42)! - - A template that is no longer a draft is read-only. A passport created from a published template after this change only allows overwriting data values (table rows can still be added and deleted). Existing passports keep their stored `Full` editing mode. Passports from draft templates or without a template stay fully editable.
  - The last remaining row of a table (its header row) cannot be deleted; deleting a row while others remain is allowed, and the next row becomes the header. Rows cannot be added to a table without columns.
  - Breaking: removed `PUT /templates/:id/passport-editing-mode` and `PUT /passports/:id/editing-mode`, the related DTOs and the api-client methods `setEditingMode` / `setPassportEditingMode`. The template field `passportEditingMode` is replaced by the derived `editingMode`.
  - Client: published templates open in a read-only editor, restricted passports hide column actions, and table rows get a "Clear row values" action.

### Patch Changes

- [#1193](https://github.com/open-dpp/open-dpp/pull/1193) [`1db2735`](https://github.com/open-dpp/open-dpp/commit/1db2735e8b79488341957c20b9891cdfcb46385e) Thanks [@Hentra](https://github.com/Hentra)! - Rename usage page title to Nutzungskontingente / Usage quotas

## 6.6.2

### Patch Changes

- [#1180](https://github.com/open-dpp/open-dpp/pull/1180) [`abf4ec1`](https://github.com/open-dpp/open-dpp/commit/abf4ec1e6136d8513fb06e9609ffc6953b36655b) Thanks [@renovate](https://github.com/apps/renovate)! - Update dependencies:

  - @open-dpp/client: `@vitejs/plugin-vue` ^6.0.10 → ^6.0.11 (dev)

## 6.6.1

## 6.6.0

### Minor Changes

- [#1185](https://github.com/open-dpp/open-dpp/pull/1185) [`0f33629`](https://github.com/open-dpp/open-dpp/commit/0f33629e5d528cda9f7477c89b1eea4414a10463) Thanks [@mr42](https://github.com/mr42)! - Fix tests in main and e2e

### Patch Changes

- [#1149](https://github.com/open-dpp/open-dpp/pull/1149) [`0d27e45`](https://github.com/open-dpp/open-dpp/commit/0d27e45ead4375e66fbd8e3751dcc4cc8b779eba) Thanks [@mr42](https://github.com/mr42)! - Add guest access for external verified users such as repairers. Organization owners invite a person by email and assign a guest role (Repairer, Recycler, Market Surveillance Authority, Independent Operator, Supplier). The invitation is accepted explicitly after sign-in or sign-up with the invited address. A guest is not a member: they can only read, via the presentation view of a passport, and only after the owner has granted access. A guest reads everything the public reads, plus the fields that the access rules allow for their role. Admins, owners, members and guests fall back to the rule of the public for objects without a rule of their own, so existing passports need no migration and new submodels no longer get a default rule per guest role. A guest-only field needs a Read rule for the guest role first, and then the public Read rule can be removed. A role's own rules win over the public rule, on the object and on its parents. Owners manage guests (invite, change role, revoke) in the new organization guests view, and guests are notified by email about invitations, role changes and revocations. The shared subject role hierarchy now lives in `@open-dpp/permission`.

## 6.5.5

## 6.5.4

### Patch Changes

- [#1004](https://github.com/open-dpp/open-dpp/pull/1004) [`664de6e`](https://github.com/open-dpp/open-dpp/commit/664de6eb83f102ea385d93aa88d03dcaa99d839b) Thanks [@renovate](https://github.com/apps/renovate)! - Update dependencies:

  - @open-dpp/client: `jest-diff` ^30.4.1 → ^30.5.2 (dev)

## 6.5.3

### Patch Changes

- [#1174](https://github.com/open-dpp/open-dpp/pull/1174) [`c3a790e`](https://github.com/open-dpp/open-dpp/commit/c3a790efde5a6a6d3e718dee4165f029164a6d1a) Thanks [@renovate](https://github.com/apps/renovate)! - Update dependencies:

  - @open-dpp/client: `vite` ^8.3.5 → ^8.3.8 (dev)

## 6.5.2

### Patch Changes

- [#1138](https://github.com/open-dpp/open-dpp/pull/1138) [`884c025`](https://github.com/open-dpp/open-dpp/commit/884c0256dfebcad01022810c4e5efc8ec66667d1) Thanks [@renovate](https://github.com/apps/renovate)! - Update dependencies:

  - @open-dpp/client: `autoprefixer` ^10.6.1 → ^10.6.2 (dev)

## 6.5.1

### Patch Changes

- [#1139](https://github.com/open-dpp/open-dpp/pull/1139) [`3465b2a`](https://github.com/open-dpp/open-dpp/commit/3465b2afc6dc18b1bb99aeb9fb33d9c31beeef47) Thanks [@renovate](https://github.com/apps/renovate)! - Update dependencies:

  - @open-dpp/client: `postcss` ^8.5.31 → ^8.5.32 (dev)

## 6.5.0

### Minor Changes

- [#1163](https://github.com/open-dpp/open-dpp/pull/1163) [`c97a7c4`](https://github.com/open-dpp/open-dpp/commit/c97a7c4ae87d4f0cb0ba44eb9bf34bf7f53fda7e) Thanks [@Hentra](https://github.com/Hentra)! - Add password confirmation field

## 6.4.4

### Patch Changes

- [#1164](https://github.com/open-dpp/open-dpp/pull/1164) [`33b32c2`](https://github.com/open-dpp/open-dpp/commit/33b32c213d84c6192c4ca69cd83226aaaad0cf8d) Thanks [@Hentra](https://github.com/Hentra)! - Remove legacy logo

## 6.4.3

## 6.4.2

## 6.4.1

## 6.4.0

### Minor Changes

- [#1130](https://github.com/open-dpp/open-dpp/pull/1130) [`6e81265`](https://github.com/open-dpp/open-dpp/commit/6e81265cb02deaef5f3279b971e8e57a80f2095e) Thanks [@florianBieck](https://github.com/florianBieck)! - Members can download the Carrier Export of a permalink as SVG (sized in mm) or PNG (at a chosen DPI) from `GET /permalinks/:id/carrier`, with a four-module quiet zone, a module size and an error-correction level. The api-client gains `permalinks.getCarrierExport`, and the back office shows and downloads the server-rendered Data Carrier instead of drawing its own.

## 6.3.6

## 6.3.5

### Patch Changes

- Updated dependencies []:
  - @open-dpp/api-client@6.3.5
  - @open-dpp/dto@6.3.5

## 6.3.4

### Patch Changes

- [#1108](https://github.com/open-dpp/open-dpp/pull/1108) [`f6f684e`](https://github.com/open-dpp/open-dpp/commit/f6f684ec12181df529a8f0aada265b21cb2cb7fe) Thanks [@Hentra](https://github.com/Hentra)! - A button to manage usage appears on the usage page when `OPEN_DPP_USAGE_MANAGEMENT_URL` is set. A `{organizationId}` placeholder in the URL is replaced with the current organization's ID.

- Updated dependencies [[`f6f684e`](https://github.com/open-dpp/open-dpp/commit/f6f684ec12181df529a8f0aada265b21cb2cb7fe)]:
  - @open-dpp/dto@6.3.4
  - @open-dpp/api-client@6.3.4

## 6.3.3

### Patch Changes

- Updated dependencies [[`23201ff`](https://github.com/open-dpp/open-dpp/commit/23201ffe3c041ecdc24e1fa28bb6805614a66c05)]:
  - @open-dpp/api-client@6.3.3
  - @open-dpp/dto@6.3.3

## 6.3.2

### Patch Changes

- Updated dependencies []:
  - @open-dpp/api-client@6.3.2
  - @open-dpp/dto@6.3.2

## 6.3.1

### Patch Changes

- [#1102](https://github.com/open-dpp/open-dpp/pull/1102) [`8e2596f`](https://github.com/open-dpp/open-dpp/commit/8e2596f7605fcf0e18ce3bbc503ff303840cb935) Thanks [@Hentra](https://github.com/Hentra)! - Show last time a user logged in in the admin overview

- Updated dependencies []:
  - @open-dpp/api-client@6.3.1
  - @open-dpp/dto@6.3.1

## 6.3.0

### Patch Changes

- Updated dependencies []:
  - @open-dpp/api-client@6.3.0
  - @open-dpp/dto@6.3.0

## 6.2.4

### Patch Changes

- Updated dependencies []:
  - @open-dpp/api-client@6.2.4
  - @open-dpp/dto@6.2.4

## 6.2.3

### Patch Changes

- Updated dependencies []:
  - @open-dpp/api-client@6.2.3
  - @open-dpp/dto@6.2.3

## 6.2.2

### Patch Changes

- Updated dependencies []:
  - @open-dpp/api-client@6.2.2
  - @open-dpp/dto@6.2.2

## 6.2.1

### Patch Changes

- [#1019](https://github.com/open-dpp/open-dpp/pull/1019) [`7ad9670`](https://github.com/open-dpp/open-dpp/commit/7ad9670cf7eefa079fef8afbc9fa44e118e14a83) Thanks [@mr42](https://github.com/mr42)! - Published passports can be exported to upload them to the EU registry.

- Updated dependencies [[`7ad9670`](https://github.com/open-dpp/open-dpp/commit/7ad9670cf7eefa079fef8afbc9fa44e118e14a83)]:
  - @open-dpp/api-client@6.2.1
  - @open-dpp/dto@6.2.1

## 6.2.0

### Minor Changes

- [#1017](https://github.com/open-dpp/open-dpp/pull/1017) [`f4c6f7c`](https://github.com/open-dpp/open-dpp/commit/f4c6f7cd1d3e50dc1376a88d14818dee768ecc33) Thanks [@mr42](https://github.com/mr42)! - Templates and passports can be filterd by multiple status and by date range. In addition, passports can also be filtered by template. Further ui improvements for passport creation dialog for long template names.

### Patch Changes

- Updated dependencies [[`f4c6f7c`](https://github.com/open-dpp/open-dpp/commit/f4c6f7cd1d3e50dc1376a88d14818dee768ecc33)]:
  - @open-dpp/api-client@6.2.0
  - @open-dpp/dto@6.2.0

## 6.1.4

### Patch Changes

- [#904](https://github.com/open-dpp/open-dpp/pull/904) [`71c16fc`](https://github.com/open-dpp/open-dpp/commit/71c16fc23c4ccf7f9b82d14e822ed6fbd71fac36) Thanks [@mr42](https://github.com/mr42)! - In the template editor a user can restrict editing of derived passports to data only. Meaning, the structure, layout and security rules of a passport created from a template with restriction enabled cannot be modified. Only the data values of such a passport can be modified.

- Updated dependencies [[`71c16fc`](https://github.com/open-dpp/open-dpp/commit/71c16fc23c4ccf7f9b82d14e822ed6fbd71fac36)]:
  - @open-dpp/api-client@6.1.4
  - @open-dpp/dto@6.1.4

## 6.1.3

### Patch Changes

- [#980](https://github.com/open-dpp/open-dpp/pull/980) [`edb4deb`](https://github.com/open-dpp/open-dpp/commit/edb4deb19fbc4d93db7b592efca9d7f3c47f678a) Thanks [@florianBieck](https://github.com/florianBieck)! - Signing in with email and password while a Trusted Client waits for the OAuth Provider sends the browser to the Trusted Client once again. It went there twice with the same single-use code, so the second code exchange failed and the User saw the Trusted Client's sign-in error.

- Updated dependencies []:
  - @open-dpp/api-client@6.1.3
  - @open-dpp/dto@6.1.3

## 6.1.2

### Patch Changes

- [#976](https://github.com/open-dpp/open-dpp/pull/976) [`d1dc6c7`](https://github.com/open-dpp/open-dpp/commit/d1dc6c7116f5eb999a730a41d662c5d6368a62ce) Thanks [@mr42](https://github.com/mr42)! - Official templates are imported into an organization automatically when it's created, and can be re-imported at any time via "Import official templates" on the templates. The Github repository where the official templates are loaded from is configurable via environment variable.

- Updated dependencies [[`d1dc6c7`](https://github.com/open-dpp/open-dpp/commit/d1dc6c7116f5eb999a730a41d662c5d6368a62ce)]:
  - @open-dpp/api-client@6.1.2
  - @open-dpp/dto@6.1.2

## 6.1.1

### Patch Changes

- [#955](https://github.com/open-dpp/open-dpp/pull/955) [`5735fe6`](https://github.com/open-dpp/open-dpp/commit/5735fe63b8b99cff63f4e14f5f35dd6923bf397c) Thanks [@Hentra](https://github.com/Hentra)! - The organization creation page now focuses exclusively on creating an organization

- Updated dependencies []:
  - @open-dpp/api-client@6.1.1
  - @open-dpp/dto@6.1.1

## 6.1.0

### Minor Changes

- [#967](https://github.com/open-dpp/open-dpp/pull/967) [`a7a6759`](https://github.com/open-dpp/open-dpp/commit/a7a675966ff4aae683a178cf5a7ab8f8e759823b) Thanks [@florianBieck](https://github.com/florianBieck)! - Optional OAuth Provider: open-dpp can act as an OpenID Connect provider for one operator-configured Trusted Client (for example a landing page), off by default.

  - `OPEN_DPP_OAUTH_PROVIDER_ENABLED` plus `OPEN_DPP_OAUTH_PROVIDER_CLIENT_ID`, `_CLIENT_SECRET`, `_REDIRECT_URIS` and optional `_CLIENT_NAME` configure it; the client variables are validated only while the provider is enabled. The Trusted Client is written on every startup; a failed write stops the startup.
  - The Trusted Client signs Users in through `{origin}/api/v2/auth` and calls the API on their behalf with a 15-minute JWT access token carrying `open-dpp:api`; refresh tokens last 7 days, sliding.
  - The sign-in and sign-up pages continue a pending authorization; the sign-up page does so through the new `POST /api/v2/oauth-provider/continue` (`apiClient.dpp.oauthProvider.continueAuthorization`).
  - Users created without a display name get one (first and last name, or `User`), and `GET /organizations/member` reads memberships from the database.

  See `docs/guides/production-setup.md#oauth-provider`.

### Patch Changes

- Updated dependencies [[`a7a6759`](https://github.com/open-dpp/open-dpp/commit/a7a675966ff4aae683a178cf5a7ab8f8e759823b)]:
  - @open-dpp/dto@6.1.0
  - @open-dpp/api-client@6.1.0

## 6.0.0

### Minor Changes

- [#876](https://github.com/open-dpp/open-dpp/pull/876) [`38a9a4c`](https://github.com/open-dpp/open-dpp/commit/38a9a4c0e5949e516222ca0937822ffd4402bf20) Thanks [@florianBieck](https://github.com/florianBieck)! - Organization slugs are an internal detail equal to the organization id, so organization names no longer need to be unique.

  - `POST /organizations` accepts `{ name }` only and validates it (non-empty after trimming). A `slug` in the body is ignored; `logo` and `metadata` are no longer part of the create type (they were never forwarded).
  - `OrganizationDto` is now a zod schema in `@open-dpp/dto` (re-exported by `@open-dpp/api-client`): `slug` is removed, the never-sent `updatedAt` is gone, and `createdAt` is an ISO string instead of `Date`.
  - Organization responses no longer include the always-empty `members` array.
  - Existing organizations are backfilled to `slug = id` on every startup.
  - The raw better-auth routes `/organization/update` and `/organization/check-slug` return 403, like `/organization/create` already did.

### Patch Changes

- Updated dependencies [[`38a9a4c`](https://github.com/open-dpp/open-dpp/commit/38a9a4c0e5949e516222ca0937822ffd4402bf20)]:
  - @open-dpp/dto@6.0.0
  - @open-dpp/api-client@6.0.0

## 5.3.0

### Patch Changes

- Updated dependencies []:
  - @open-dpp/api-client@5.3.0
  - @open-dpp/dto@5.3.0

## 5.2.0

### Minor Changes

- [#848](https://github.com/open-dpp/open-dpp/pull/848) [`fe4ad17`](https://github.com/open-dpp/open-dpp/commit/fe4ad177e8ece990b57ebf274454ac74d99de411) Thanks [@Hentra](https://github.com/Hentra)! - Add descriptions to table columns

### Patch Changes

- Updated dependencies []:
  - @open-dpp/api-client@5.2.0
  - @open-dpp/dto@5.2.0

## 5.1.0

### Minor Changes

- [#850](https://github.com/open-dpp/open-dpp/pull/850) [`76ee0cc`](https://github.com/open-dpp/open-dpp/commit/76ee0cc4b9a6d45d84c783d4c32e010fe67aead6) Thanks [@mr42](https://github.com/mr42)! - Fix qr code for firefox screens smaller then 930 pixels.

### Patch Changes

- Updated dependencies []:
  - @open-dpp/api-client@5.1.0
  - @open-dpp/dto@5.1.0

## 5.0.0

### Patch Changes

- Updated dependencies []:
  - @open-dpp/api-client@5.0.0
  - @open-dpp/dto@5.0.0

## 4.0.1

### Patch Changes

- [#725](https://github.com/open-dpp/open-dpp/pull/725) [`5f4fb21`](https://github.com/open-dpp/open-dpp/commit/5f4fb215013e05dd129217a71ed457296bd82d25) Thanks [@mr42](https://github.com/mr42)! - In the passport and template editors, sections, subsections, and data fields can be moved.

- Updated dependencies [[`5f4fb21`](https://github.com/open-dpp/open-dpp/commit/5f4fb215013e05dd129217a71ed457296bd82d25)]:
  - @open-dpp/api-client@4.0.1
  - @open-dpp/dto@4.0.1

## 4.0.0

### Patch Changes

- Updated dependencies [[`e3a23b6`](https://github.com/open-dpp/open-dpp/commit/e3a23b6804ff11fb57fd3471aec790185ef03ae6)]:
  - @open-dpp/api-client@4.0.0
  - @open-dpp/dto@4.0.0

## 3.6.0

### Minor Changes

- [#722](https://github.com/open-dpp/open-dpp/pull/722) [`3720c86`](https://github.com/open-dpp/open-dpp/commit/3720c8615cf26e57492525cc2b7a7e090990efb7) Thanks [@florianBieck](https://github.com/florianBieck)! - API Keys are now manageable

### Patch Changes

- Updated dependencies [[`3720c86`](https://github.com/open-dpp/open-dpp/commit/3720c8615cf26e57492525cc2b7a7e090990efb7)]:
  - @open-dpp/api-client@3.6.0
  - @open-dpp/dto@3.6.0

## 3.5.0

### Minor Changes

- [#707](https://github.com/open-dpp/open-dpp/pull/707) [`3372e4f`](https://github.com/open-dpp/open-dpp/commit/3372e4fed94f7217fb3a60036dd044dc8cfe483d) Thanks [@florianBieck](https://github.com/florianBieck)! - Organization owners can remove members. New `DELETE /organizations/members/:id` endpoint (owner-only, cross-organization guarded); owners and the acting user cannot be removed. Removing a member clears the organization from their sessions' active organization. The members list gains a remove button with a confirmation dialog.

### Patch Changes

- Updated dependencies [[`3372e4f`](https://github.com/open-dpp/open-dpp/commit/3372e4fed94f7217fb3a60036dd044dc8cfe483d)]:
  - @open-dpp/api-client@3.5.0
  - @open-dpp/dto@3.5.0

## 3.4.0

### Patch Changes

- Updated dependencies []:
  - @open-dpp/api-client@3.4.0
  - @open-dpp/dto@3.4.0

## 3.3.0

### Minor Changes

- [#667](https://github.com/open-dpp/open-dpp/pull/667) [`64b4097`](https://github.com/open-dpp/open-dpp/commit/64b40972ce85ef36ce9041118a407f1153d522fd) Thanks [@murphylan](https://github.com/murphylan)! - Add a multi-language description to data fields in the AAS editor. Every submodel
  element (property, file, collection, list, submodel, shell) can now be given an
  optional description alongside its display name, and the description is shown as
  muted helper text under the field name in the presentation view. Section
  (submodel) descriptions are rendered under the section heading, and languages
  that only occur in descriptions are offered in the presentation language picker.
  The display-name editor was generalized into a reusable language-text array
  editor to back both fields.

### Patch Changes

- Updated dependencies []:
  - @open-dpp/api-client@3.3.0
  - @open-dpp/dto@3.3.0

## 3.2.0

### Minor Changes

- [#671](https://github.com/open-dpp/open-dpp/pull/671) [`7b398df`](https://github.com/open-dpp/open-dpp/commit/7b398dfdc15c76e0a2bd8a4691eb6c9c09d94e5b) Thanks [@mr42](https://github.com/mr42)! - Add bulk import feature such that a REO user can create up to 1000 passports at once.

### Patch Changes

- [#700](https://github.com/open-dpp/open-dpp/pull/700) [`115b3af`](https://github.com/open-dpp/open-dpp/commit/115b3af6a71ad46bc89cf53b16393f9d0dd26a2f) Thanks [@Hentra](https://github.com/Hentra)! - Remove Headless UI components

- Updated dependencies [[`7b398df`](https://github.com/open-dpp/open-dpp/commit/7b398dfdc15c76e0a2bd8a4691eb6c9c09d94e5b)]:
  - @open-dpp/api-client@3.2.0
  - @open-dpp/dto@3.2.0

## 3.1.4

### Patch Changes

- Updated dependencies []:
  - @open-dpp/api-client@3.1.4
  - @open-dpp/dto@3.1.4

## 3.1.3

### Patch Changes

- Updated dependencies []:
  - @open-dpp/api-client@3.1.3
  - @open-dpp/dto@3.1.3

## 3.1.2

### Patch Changes

- [#692](https://github.com/open-dpp/open-dpp/pull/692) [`318aa1c`](https://github.com/open-dpp/open-dpp/commit/318aa1c959cd31403b8da64c18f6c2969984c8ca) Thanks [@florianBieck](https://github.com/florianBieck)! - Removed select field for presentation configuration on permalinks as presentation configurations canot be managed at the moment.

- Updated dependencies []:
  - @open-dpp/api-client@3.1.2
  - @open-dpp/dto@3.1.2

## 3.1.1

### Patch Changes

- Updated dependencies []:
  - @open-dpp/api-client@3.1.1
  - @open-dpp/dto@3.1.1

## 3.1.0

### Minor Changes

- [#687](https://github.com/open-dpp/open-dpp/pull/687) [`6f6154f`](https://github.com/open-dpp/open-dpp/commit/6f6154f38b07290ec19595cbbe2eeda6939aa887) Thanks [@florianBieck](https://github.com/florianBieck)! - The GS1 Digital Link resolver moves from the origin root to the `/gs1/v1/` prefix

### Patch Changes

- Updated dependencies [[`6f6154f`](https://github.com/open-dpp/open-dpp/commit/6f6154f38b07290ec19595cbbe2eeda6939aa887)]:
  - @open-dpp/dto@3.1.0
  - @open-dpp/api-client@3.1.0

## 3.0.0

### Minor Changes

- [#615](https://github.com/open-dpp/open-dpp/pull/615) [`ff5d0a2`](https://github.com/open-dpp/open-dpp/commit/ff5d0a2a8458b8d66a4fc8a706aad4dc6001feaa) Thanks [@florianBieck](https://github.com/florianBieck)! - Passport-first permalinks: the "Create GS1 link" flow becomes "Create Permalink" and open-dpp unique product identifiers can now carry permalinks.

  - The `presentation` permalink kind is renamed to `open-dpp` (wire-level; legacy documents are migrated on read).
  - Every permalink now carries a required `passportId`; `presentationConfigurationId` and `uniqueProductIdentifierId` are both optional on the open-dpp kind — a bare passport-bound permalink is valid.
  - Strict kind matching: `gs1-link` permalinks require a GS1 identifier, `open-dpp` permalinks may bind an OPEN_DPP_UUID identifier; an open-dpp identifier may carry any number of permalinks (gs1-links stay one-per-identifier).
  - `/p/{slug ?? id}` renders the permalink's own bound presentation configuration; a null binding renders the built-in standard view (`presentationConfiguration` in the bundle is now nullable, no config is auto-consulted or seeded on the render path).
  - The GS1 resolver redirects a scanned Digital Link to the gs1-link permalink's own viewer URL — the primary-permalink concept (including `POST /permalinks/:id/primary`) is removed; the passport editor QR shows the latest-created permalink.
  - Presentation configurations are shareable across permalinks (config-unique index dropped) and re-bindable pre-freeze via `PATCH /permalinks/:id`; the last-permalink delete guard is gone (the freeze rule remains the only guard).

### Patch Changes

- Updated dependencies [[`ff5d0a2`](https://github.com/open-dpp/open-dpp/commit/ff5d0a2a8458b8d66a4fc8a706aad4dc6001feaa)]:
  - @open-dpp/dto@3.0.0
  - @open-dpp/api-client@3.0.0

## 2.10.0

### Minor Changes

- [#621](https://github.com/open-dpp/open-dpp/pull/621) [`29e3399`](https://github.com/open-dpp/open-dpp/commit/29e3399add99e620140e2d10dd4c33e999f33756) Thanks [@Hentra](https://github.com/Hentra)! - Add 26 more languages to multilanguage description

### Patch Changes

- Updated dependencies [[`29e3399`](https://github.com/open-dpp/open-dpp/commit/29e3399add99e620140e2d10dd4c33e999f33756)]:
  - @open-dpp/api-client@2.10.0
  - @open-dpp/dto@2.10.0

## 2.9.0

### Minor Changes

- [#673](https://github.com/open-dpp/open-dpp/pull/673) [`3cc4e84`](https://github.com/open-dpp/open-dpp/commit/3cc4e84841d551aa8b15bf2e5ddce08764c7cca6) Thanks [@mr42](https://github.com/mr42)! - Allow admin to resend reset or verification email. Allow users to resend verification email in their profile. Add email verification page to give user feedback about verification success/ error

- [#666](https://github.com/open-dpp/open-dpp/pull/666) [`2ace889`](https://github.com/open-dpp/open-dpp/commit/2ace8898a659bcdf8112972e2cae8d288fb1150e) Thanks [@murphylan](https://github.com/murphylan)! - Add total item count to organization-scoped paginated lists

  Passport and template list endpoints now report a `total_count` in their
  `paging_metadata`, computed with an index-backed `countDocuments` against the
  same filter used for the page. The passport and template list views surface it
  in the table footer ("Showing: 1 - 10 of 42"). The field is optional, so other
  paginated endpoints keep their existing response shape.

### Patch Changes

- [#661](https://github.com/open-dpp/open-dpp/pull/661) [`f5868c6`](https://github.com/open-dpp/open-dpp/commit/f5868c6019d694afd9895fcc6293140afae280c2) Thanks [@murphylan](https://github.com/murphylan)! - Fix blank page when entering an invalid hex value in the organization primary color field. The color palette now falls back to the default color for invalid input, the field shows an inline validation error, and saving is blocked until a valid hex color is entered.

- Updated dependencies [[`3cc4e84`](https://github.com/open-dpp/open-dpp/commit/3cc4e84841d551aa8b15bf2e5ddce08764c7cca6), [`2ace889`](https://github.com/open-dpp/open-dpp/commit/2ace8898a659bcdf8112972e2cae8d288fb1150e)]:
  - @open-dpp/api-client@2.9.0
  - @open-dpp/dto@2.9.0

## 2.8.0

### Minor Changes

- [#632](https://github.com/open-dpp/open-dpp/pull/632) [`b3d58fe`](https://github.com/open-dpp/open-dpp/commit/b3d58fe9ef20e14fa9abbd952e49e51789212800) Thanks [@mr42](https://github.com/mr42)! - Rename list to table. Multiple columns can be grouped. Nested tables are possible now.

### Patch Changes

- Updated dependencies [[`b3d58fe`](https://github.com/open-dpp/open-dpp/commit/b3d58fe9ef20e14fa9abbd952e49e51789212800)]:
  - @open-dpp/api-client@2.8.0
  - @open-dpp/dto@2.8.0

## 2.7.0

### Minor Changes

- [#601](https://github.com/open-dpp/open-dpp/pull/601) [`403f74e`](https://github.com/open-dpp/open-dpp/commit/403f74ef849fe2fcb5d5fd0771783584fb801928) Thanks [@mr42](https://github.com/mr42)! - Represent links as Property with valueType AnyUri instead of using ReferenceElement. Add api versioning to REST-API.

### Patch Changes

- Updated dependencies [[`403f74e`](https://github.com/open-dpp/open-dpp/commit/403f74ef849fe2fcb5d5fd0771783584fb801928)]:
  - @open-dpp/api-client@2.7.0
  - @open-dpp/dto@2.7.0

## 2.6.0

### Minor Changes

- [#587](https://github.com/open-dpp/open-dpp/pull/587) [`f8ec4ed`](https://github.com/open-dpp/open-dpp/commit/f8ec4ed20a0e6e9ada5eec60465293b0585c726d) Thanks [@mr42](https://github.com/mr42)! - Organization owners can change the role of a member.

### Patch Changes

- Updated dependencies [[`f8ec4ed`](https://github.com/open-dpp/open-dpp/commit/f8ec4ed20a0e6e9ada5eec60465293b0585c726d)]:
  - @open-dpp/api-client@2.6.0
  - @open-dpp/dto@2.6.0

## 2.5.0

### Minor Changes

- [#585](https://github.com/open-dpp/open-dpp/pull/585) [`cdf8621`](https://github.com/open-dpp/open-dpp/commit/cdf8621873ca0d98abe101bcb320b8a08a34e360) Thanks [@mr42](https://github.com/mr42)! - Add support for boolean data field.

### Patch Changes

- Updated dependencies [[`cdf8621`](https://github.com/open-dpp/open-dpp/commit/cdf8621873ca0d98abe101bcb320b8a08a34e360)]:
  - @open-dpp/dto@2.5.0
  - @open-dpp/api-client@2.5.0

## 2.4.0

### Minor Changes

- [#580](https://github.com/open-dpp/open-dpp/pull/580) [`d5f0b69`](https://github.com/open-dpp/open-dpp/commit/d5f0b69cdd15f8d13b5bfe7f9c7e66534b79d2da) Thanks [@mr42](https://github.com/mr42)! - Add activity history to passports and templates.

### Patch Changes

- Updated dependencies [[`d5f0b69`](https://github.com/open-dpp/open-dpp/commit/d5f0b69cdd15f8d13b5bfe7f9c7e66534b79d2da)]:
  - @open-dpp/api-client@2.4.0
  - @open-dpp/dto@2.4.0

## 1.0.0

### Major Changes

- [#520](https://github.com/open-dpp/open-dpp/pull/520) [`cf7dbd0`](https://github.com/open-dpp/open-dpp/commit/cf7dbd0d01313e50d4eec39a65944d98f417ba88) Thanks [@florianBieck](https://github.com/florianBieck)! - Added granular passport UI customization capabilities and refactored presentation layer into permalink structure.

### Patch Changes

- Updated dependencies [[`cf7dbd0`](https://github.com/open-dpp/open-dpp/commit/cf7dbd0d01313e50d4eec39a65944d98f417ba88)]:
  - @open-dpp/api-client@1.0.0
  - @open-dpp/dto@1.0.0

## 0.6.0

### Minor Changes

- [#575](https://github.com/open-dpp/open-dpp/pull/575) [`9e62648`](https://github.com/open-dpp/open-dpp/commit/9e62648707401f6d50dc54bbb1fd4f892a49dad6) Thanks [@mr42](https://github.com/mr42)! - Use swagger documentation instead of vitest open api documentation. Correct parameter syntax in open api documentation from :id to {id}.

### Patch Changes

- Updated dependencies [[`9e62648`](https://github.com/open-dpp/open-dpp/commit/9e62648707401f6d50dc54bbb1fd4f892a49dad6)]:
  - @open-dpp/api-client@0.6.0
  - @open-dpp/dto@0.6.0

## 0.5.0

### Minor Changes

- [#572](https://github.com/open-dpp/open-dpp/pull/572) [`4d5c918`](https://github.com/open-dpp/open-dpp/commit/4d5c9182459b9d46793b88fbd6193c512a1c3b9c) Thanks [@mr42](https://github.com/mr42)! - Add endpoint to modify value of submodel.

### Patch Changes

- Updated dependencies [[`4d5c918`](https://github.com/open-dpp/open-dpp/commit/4d5c9182459b9d46793b88fbd6193c512a1c3b9c)]:
  - @open-dpp/api-client@0.5.0
  - @open-dpp/dto@0.5.0

## 0.4.4

### Patch Changes

- [#544](https://github.com/open-dpp/open-dpp/pull/544) [`19bce7c`](https://github.com/open-dpp/open-dpp/commit/19bce7c2e336f8d4ec53eab6de48315188aaa04f) Thanks [@mr42](https://github.com/mr42)! - Add instance setting OPEN_DPP_INSTANCE_ORGANIZATION_CREATION_ENABLED. If it is disabled only administrators are allowed to add new organizations. In addition the list of pending invitations are shown for new registered users and also within the profile view. Furthermore, the routing flow for users without organization has been corrected.

- [#564](https://github.com/open-dpp/open-dpp/pull/564) [`8b0e301`](https://github.com/open-dpp/open-dpp/commit/8b0e30179a1d874e927b94be0877212985a97b69) Thanks [@Hentra](https://github.com/Hentra)! - Change Id and id to ID in frontend

- Updated dependencies [[`19bce7c`](https://github.com/open-dpp/open-dpp/commit/19bce7c2e336f8d4ec53eab6de48315188aaa04f), [`8b0e301`](https://github.com/open-dpp/open-dpp/commit/8b0e30179a1d874e927b94be0877212985a97b69)]:
  - @open-dpp/api-client@0.4.4
  - @open-dpp/dto@0.4.4

## 0.4.3

### Patch Changes

- [#519](https://github.com/open-dpp/open-dpp/pull/519) [`76dcc6b`](https://github.com/open-dpp/open-dpp/commit/76dcc6bd5961f93df2bf902543a2f2cf4d05963b) Thanks [@florianBieck](https://github.com/florianBieck)! - UX Improvements for the AAS Editor

- [#556](https://github.com/open-dpp/open-dpp/pull/556) [`d5c6ddf`](https://github.com/open-dpp/open-dpp/commit/d5c6ddf976cf87947cacc2b59aaaf2666501d5b1) Thanks [@Hentra](https://github.com/Hentra)! - Allow deletion of media files

- [#553](https://github.com/open-dpp/open-dpp/pull/553) [`6cc122c`](https://github.com/open-dpp/open-dpp/commit/6cc122cf3f1cc5f1964dba211a7e2b4aad08a185) Thanks [@Hentra](https://github.com/Hentra)! - Switch id and name in AAS Table and remove chat button

- Updated dependencies [[`d5c6ddf`](https://github.com/open-dpp/open-dpp/commit/d5c6ddf976cf87947cacc2b59aaaf2666501d5b1)]:
  - @open-dpp/api-client@0.4.3
  - @open-dpp/dto@0.4.3

## 0.4.2

### Patch Changes

- [#546](https://github.com/open-dpp/open-dpp/pull/546) [`924af38`](https://github.com/open-dpp/open-dpp/commit/924af38588c3c8b891b3ab3d19b87edf9548b0cf) Thanks [@Hentra](https://github.com/Hentra)! - Refactor sidebar to reduce duplication

- [#551](https://github.com/open-dpp/open-dpp/pull/551) [`ad33c39`](https://github.com/open-dpp/open-dpp/commit/ad33c39da5d7cc1bb6327e885e905a81d06d52cf) Thanks [@Hentra](https://github.com/Hentra)! - Set default language to be loaded from browser settings

- Updated dependencies []:
  - @open-dpp/api-client@0.4.2
  - @open-dpp/dto@0.4.2

## 0.4.1

### Patch Changes

- [#548](https://github.com/open-dpp/open-dpp/pull/548) [`2126c6a`](https://github.com/open-dpp/open-dpp/commit/2126c6adf8aa330233dd3b6dd9dd8b82878b88ad) Thanks [@Hentra](https://github.com/Hentra)! - Set the analytics y axis to never show below zero

- Updated dependencies []:
  - @open-dpp/api-client@0.4.1
  - @open-dpp/dto@0.4.1

## 0.4.0

### Minor Changes

- [#513](https://github.com/open-dpp/open-dpp/pull/513) [`ca55ba0`](https://github.com/open-dpp/open-dpp/commit/ca55ba0529752cdd852ba41fcc357dfc1b27bacb) Thanks [@florianBieck](https://github.com/florianBieck)! - Updated dependencies to minor and patch versions

### Patch Changes

- Updated dependencies [[`ca55ba0`](https://github.com/open-dpp/open-dpp/commit/ca55ba0529752cdd852ba41fcc357dfc1b27bacb)]:
  - @open-dpp/api-client@0.4.0
  - @open-dpp/dto@0.4.0

## 0.3.0

### Minor Changes

- [#530](https://github.com/open-dpp/open-dpp/pull/530) [`d0959ed`](https://github.com/open-dpp/open-dpp/commit/d0959edc7a592bc46b83acfd397a011ae7412d08) Thanks [@mr42](https://github.com/mr42)! - Fix product image gallery in the presentation view such that all images regardless of their size fit the view.

### Patch Changes

- Updated dependencies []:
  - @open-dpp/api-client@0.3.0
  - @open-dpp/dto@0.3.0

## 0.2.2

### Patch Changes

- [#514](https://github.com/open-dpp/open-dpp/pull/514) [`5f8a7ff`](https://github.com/open-dpp/open-dpp/commit/5f8a7ff23a611237652e9bc9e01a5be97ef445d1) Thanks [@Hentra](https://github.com/Hentra)! - Add an option to set the branding color for an organization

- Updated dependencies [[`5f8a7ff`](https://github.com/open-dpp/open-dpp/commit/5f8a7ff23a611237652e9bc9e01a5be97ef445d1)]:
  - @open-dpp/api-client@0.2.2
  - @open-dpp/dto@0.2.2

## 0.2.1

### Patch Changes

- [#529](https://github.com/open-dpp/open-dpp/pull/529) [`daa1f4e`](https://github.com/open-dpp/open-dpp/commit/daa1f4e9ff07ce4e6d826c1a0490af4dcc3843e1) Thanks [@florianBieck](https://github.com/florianBieck)! - Fixed trusted publishing

- Updated dependencies []:
  - @open-dpp/api-client@0.2.1
  - @open-dpp/dto@0.2.1

## 0.2.0

### Minor Changes

- [#503](https://github.com/open-dpp/open-dpp/pull/503) [`40c772c`](https://github.com/open-dpp/open-dpp/commit/40c772c5015aff47c0e91c443860ae25941bd44f) Thanks [@mr42](https://github.com/mr42)! - Templates and passports have a status (Draft, Published, Archived) now.

  The following operations are possible:

  - publish (Draft -> Published)
  - archive (Draft -> Archived or Published -> Archived)
  - restore (Archived -> Published or Archived -> Draft)

  In addition, a user can delete templates/ passports with the status draft.

### Patch Changes

- Updated dependencies [[`40c772c`](https://github.com/open-dpp/open-dpp/commit/40c772c5015aff47c0e91c443860ae25941bd44f)]:
  - @open-dpp/api-client@0.2.0
  - @open-dpp/dto@0.2.0

## 0.1.4

### Patch Changes

- [#464](https://github.com/open-dpp/open-dpp/pull/464) [`48fc474`](https://github.com/open-dpp/open-dpp/commit/48fc474a3e54a1aa0a1f0601fa9af1215dfea86c) Thanks [@florianBieck](https://github.com/florianBieck)! - Change lint and format tooling to oxlint and oxfmt.

- Updated dependencies [[`48fc474`](https://github.com/open-dpp/open-dpp/commit/48fc474a3e54a1aa0a1f0601fa9af1215dfea86c)]:
  - @open-dpp/api-client@0.1.4
  - @open-dpp/dto@0.1.4

## 0.1.3

### Patch Changes

- Updated dependencies []:
  - @open-dpp/api-client@0.1.3
  - @open-dpp/dto@0.1.3

## 0.1.2

### Patch Changes

- [#490](https://github.com/open-dpp/open-dpp/pull/490) [`0769773`](https://github.com/open-dpp/open-dpp/commit/0769773e9b14973d02725e975f0ac0d00fdc8251) Thanks [@florianBieck](https://github.com/florianBieck)! - Added support for DateTime fields in passports and templates.

- Updated dependencies []:
  - @open-dpp/api-client@0.1.2
  - @open-dpp/dto@0.1.2

## 0.1.1

### Patch Changes

- [#495](https://github.com/open-dpp/open-dpp/pull/495) [`69e6c29`](https://github.com/open-dpp/open-dpp/commit/69e6c2929e3a5d1a23fa85126dcf42478c28bc06) Thanks [@florianBieck](https://github.com/florianBieck)! - Implementing a status endpoint and UI changes to display a version.

- Updated dependencies [[`69e6c29`](https://github.com/open-dpp/open-dpp/commit/69e6c2929e3a5d1a23fa85126dcf42478c28bc06)]:
  - @open-dpp/api-client@0.1.1
  - @open-dpp/dto@0.1.1
