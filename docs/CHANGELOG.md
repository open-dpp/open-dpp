# @open-dpp/docs

## 7.5.3

## 7.5.2

## 7.5.1

## 7.5.0

## 7.4.2

## 7.4.1

## 7.4.0

### Minor Changes

- [#1259](https://github.com/open-dpp/open-dpp/pull/1259) [`cbe2287`](https://github.com/open-dpp/open-dpp/commit/cbe22870a52602914fa3d7b2ffcaa2218244cb33) Thanks [@mr42](https://github.com/mr42)! - The bulk import overview shows each config ID, which is copied on click. The template ID links to the template and opens in a new tab. All copy actions now confirm success and report failures.

## 7.3.4

## 7.3.3

## 7.3.2

## 7.3.1

## 7.3.0

## 7.2.0

## 7.1.2

## 7.1.1

## 7.1.0

## 7.0.1

## 7.0.0

### Major Changes

- [#1192](https://github.com/open-dpp/open-dpp/pull/1192) [`fb90dc4`](https://github.com/open-dpp/open-dpp/commit/fb90dc4a259fb5bd653a6a60e3b7ca56b27e8280) Thanks [@mr42](https://github.com/mr42)! - - A template that is no longer a draft is read-only. A passport created from a published template after this change only allows overwriting data values (table rows can still be added and deleted). Existing passports keep their stored `Full` editing mode. Passports from draft templates or without a template stay fully editable.
  - The last remaining row of a table (its header row) cannot be deleted; deleting a row while others remain is allowed, and the next row becomes the header. Rows cannot be added to a table without columns.
  - Breaking: removed `PUT /templates/:id/passport-editing-mode` and `PUT /passports/:id/editing-mode`, the related DTOs and the api-client methods `setEditingMode` / `setPassportEditingMode`. The template field `passportEditingMode` is replaced by the derived `editingMode`.
  - Client: published templates open in a read-only editor, restricted passports hide column actions, and table rows get a "Clear row values" action.

## 6.6.2

## 6.6.1

## 6.6.0

### Minor Changes

- [#1185](https://github.com/open-dpp/open-dpp/pull/1185) [`0f33629`](https://github.com/open-dpp/open-dpp/commit/0f33629e5d528cda9f7477c89b1eea4414a10463) Thanks [@mr42](https://github.com/mr42)! - Fix tests in main and e2e

### Patch Changes

- [#1149](https://github.com/open-dpp/open-dpp/pull/1149) [`0d27e45`](https://github.com/open-dpp/open-dpp/commit/0d27e45ead4375e66fbd8e3751dcc4cc8b779eba) Thanks [@mr42](https://github.com/mr42)! - Add guest access for external verified users such as repairers. Organization owners invite a person by email and assign a guest role (Repairer, Recycler, Market Surveillance Authority, Independent Operator, Supplier). The invitation is accepted explicitly after sign-in or sign-up with the invited address. A guest is not a member: they can only read, via the presentation view of a passport, and only after the owner has granted access. A guest reads everything the public reads, plus the fields that the access rules allow for their role. Admins, owners, members and guests fall back to the rule of the public for objects without a rule of their own, so existing passports need no migration and new submodels no longer get a default rule per guest role. A guest-only field needs a Read rule for the guest role first, and then the public Read rule can be removed. A role's own rules win over the public rule, on the object and on its parents. Owners manage guests (invite, change role, revoke) in the new organization guests view, and guests are notified by email about invitations, role changes and revocations. The shared subject role hierarchy now lives in `@open-dpp/permission`.

## 6.5.5

## 6.5.4

## 6.5.3

## 6.5.2

### Patch Changes

- [#1129](https://github.com/open-dpp/open-dpp/pull/1129) [`ccebbd0`](https://github.com/open-dpp/open-dpp/commit/ccebbd01b2a75aafc8c983d0b2fb3645948a8ca0) Thanks [@renovate](https://github.com/apps/renovate)! - Update dependencies:

  - @open-dpp/docs: `vitepress` 2.0.0-alpha.20 → 2.0.0-alpha.21 (dev)

## 6.5.1

## 6.5.0

## 6.4.4

## 6.4.3

## 6.4.2

## 6.4.1

## 6.4.0

## 6.3.6

## 6.3.5

## 6.3.4

## 6.3.3

## 6.3.2

### Patch Changes

- [#1076](https://github.com/open-dpp/open-dpp/pull/1076) [`6707a40`](https://github.com/open-dpp/open-dpp/commit/6707a403bfd9ff5b6c91bb3357748f815e759c64) Thanks [@Hentra](https://github.com/Hentra)! - Log every request, including frontend page visits and `/gs1` resolver hits, with a correlation id that is returned in the `x-correlation-id` response header. A caller-supplied `x-correlation-id` is reused when it is a plain token of up to 128 characters; otherwise a new one is generated. Request logs record the path without the query string, so tokens in links such as `/password-reset?token=…` stay out of the logs.

  Two new settings: `OPEN_DPP_LOG_LEVEL` sets the most verbose level that is printed (default `debug`, which hides `verbose` output printed before), and `OPEN_DPP_TRUST_PROXY` sets Express's `trust proxy` so the real client IP is logged and used for rate limiting behind a reverse proxy. Invalid `OPEN_DPP_TRUST_PROXY` values are rejected at startup.

## 6.3.1

## 6.3.0

### Minor Changes

- [#1071](https://github.com/open-dpp/open-dpp/pull/1071) [`aa82258`](https://github.com/open-dpp/open-dpp/commit/aa822584c6f463d15b6a4d1a0c07ccdfc901a334) Thanks [@Hentra](https://github.com/Hentra)! - Create a migration process on startup

## 6.2.4

### Patch Changes

- [#1101](https://github.com/open-dpp/open-dpp/pull/1101) [`33baad7`](https://github.com/open-dpp/open-dpp/commit/33baad70829eb17f2a518194465d1dac649e3d32) Thanks [@Hentra](https://github.com/Hentra)! - Remove line about stability

## 6.2.3

## 6.2.2

## 6.2.1

## 6.2.0

### Minor Changes

- [#1017](https://github.com/open-dpp/open-dpp/pull/1017) [`f4c6f7c`](https://github.com/open-dpp/open-dpp/commit/f4c6f7cd1d3e50dc1376a88d14818dee768ecc33) Thanks [@mr42](https://github.com/mr42)! - Templates and passports can be filterd by multiple status and by date range. In addition, passports can also be filtered by template. Further ui improvements for passport creation dialog for long template names.

## 6.1.4

## 6.1.3

## 6.1.2

### Patch Changes

- [#976](https://github.com/open-dpp/open-dpp/pull/976) [`d1dc6c7`](https://github.com/open-dpp/open-dpp/commit/d1dc6c7116f5eb999a730a41d662c5d6368a62ce) Thanks [@mr42](https://github.com/mr42)! - Official templates are imported into an organization automatically when it's created, and can be re-imported at any time via "Import official templates" on the templates. The Github repository where the official templates are loaded from is configurable via environment variable.

## 6.1.1

## 6.1.0

## 6.0.0

## 5.3.0

## 5.2.0

## 5.1.0

## 5.0.0

## 4.0.1

## 4.0.0

### Patch Changes

- [#716](https://github.com/open-dpp/open-dpp/pull/716) [`e3a23b6`](https://github.com/open-dpp/open-dpp/commit/e3a23b6804ff11fb57fd3471aec790185ef03ae6) Thanks [@Hentra](https://github.com/Hentra)! - Simplified installation with breaking configuration changes.

  The Ollama AI provider was removed; Mistral (`codestral-latest`) is now the only supported provider. `OPEN_DPP_OLLAMA_URL` was dropped from the env schema and the `ollama` value was removed from the `AiProvider` enum in the API client. Existing AI configurations using Ollama must be migrated to Mistral (set `OPEN_DPP_MISTRAL_API_KEY`).

  MongoDB configuration now accepts either a connection URI or individual connection settings: provide `OPEN_DPP_MONGODB_URI`, or all of `OPEN_DPP_MONGODB_HOST`, `OPEN_DPP_MONGODB_PORT`, `OPEN_DPP_MONGODB_USER` and `OPEN_DPP_MONGODB_PASSWORD`. Host/port setups without credentials no longer pass validation. `OPEN_DPP_MONGODB_USER`, `OPEN_DPP_MONGODB_PASSWORD` and `OPEN_DPP_MONGODB_DATABASE` are optional when using a URI; `OPEN_DPP_MONGODB_DATABASE` defaults to `management`.

  The example deployment was simplified (MongoDB single-node replica set with Mailpit for local development) and a new production setup guide covers MongoDB, SMTP and S3-compatible storage.

## 3.6.0

### Minor Changes

- [#722](https://github.com/open-dpp/open-dpp/pull/722) [`3720c86`](https://github.com/open-dpp/open-dpp/commit/3720c8615cf26e57492525cc2b7a7e090990efb7) Thanks [@florianBieck](https://github.com/florianBieck)! - API Keys are now manageable

## 3.5.0

## 3.4.0

## 3.3.0

## 3.2.0

## 3.1.4

## 3.1.3

### Patch Changes

- [#694](https://github.com/open-dpp/open-dpp/pull/694) [`28fc7e9`](https://github.com/open-dpp/open-dpp/commit/28fc7e9479259b56aebdca3ca8db9eb6f4d3f961) Thanks [@florianBieck](https://github.com/florianBieck)! - Remove generated OpenAPI documentation pages from the docs app. The docs build ran out of memory rendering the full spec; the REST API is documented via the online Swagger UI at https://cloud.open-dpp.de/api, which remains linked in the navigation.

## 3.1.2

## 3.1.1

## 3.1.0

## 3.0.0

## 2.10.0

## 2.9.0

## 2.8.0

## 2.7.0

### Minor Changes

- [#601](https://github.com/open-dpp/open-dpp/pull/601) [`403f74e`](https://github.com/open-dpp/open-dpp/commit/403f74ef849fe2fcb5d5fd0771783584fb801928) Thanks [@mr42](https://github.com/mr42)! - Represent links as Property with valueType AnyUri instead of using ReferenceElement. Add api versioning to REST-API.

## 2.6.0

## 2.5.0

## 2.4.0

### Minor Changes

- [#580](https://github.com/open-dpp/open-dpp/pull/580) [`d5f0b69`](https://github.com/open-dpp/open-dpp/commit/d5f0b69cdd15f8d13b5bfe7f9c7e66534b79d2da) Thanks [@mr42](https://github.com/mr42)! - Add activity history to passports and templates.

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
