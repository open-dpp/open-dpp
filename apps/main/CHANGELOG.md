# @open-dpp/main

## 3.1.2

### Patch Changes

- Updated dependencies []:
  - @open-dpp/api-client@3.1.2
  - @open-dpp/dto@3.1.2
  - @open-dpp/env@3.1.2
  - @open-dpp/exception@3.1.2
  - @open-dpp/permission@3.1.2

## 3.1.1

### Patch Changes

- [#689](https://github.com/open-dpp/open-dpp/pull/689) [`fc43933`](https://github.com/open-dpp/open-dpp/commit/fc4393362f0aaba2be0de3fa57d5d16fa4fd68b8) Thanks [@florianBieck](https://github.com/florianBieck)! - Passthrough optional authentication in GS1 resolver endpoints

- Updated dependencies []:
  - @open-dpp/api-client@3.1.1
  - @open-dpp/dto@3.1.1
  - @open-dpp/env@3.1.1
  - @open-dpp/exception@3.1.1
  - @open-dpp/permission@3.1.1

## 3.1.0

### Minor Changes

- [#687](https://github.com/open-dpp/open-dpp/pull/687) [`6f6154f`](https://github.com/open-dpp/open-dpp/commit/6f6154f38b07290ec19595cbbe2eeda6939aa887) Thanks [@florianBieck](https://github.com/florianBieck)! - The GS1 Digital Link resolver moves from the origin root to the `/gs1/v1/` prefix

### Patch Changes

- Updated dependencies [[`6f6154f`](https://github.com/open-dpp/open-dpp/commit/6f6154f38b07290ec19595cbbe2eeda6939aa887)]:
  - @open-dpp/dto@3.1.0
  - @open-dpp/api-client@3.1.0
  - @open-dpp/env@3.1.0
  - @open-dpp/exception@3.1.0
  - @open-dpp/permission@3.1.0

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
  - @open-dpp/env@3.0.0
  - @open-dpp/exception@3.0.0
  - @open-dpp/permission@3.0.0

## 2.10.0

### Minor Changes

- [#621](https://github.com/open-dpp/open-dpp/pull/621) [`29e3399`](https://github.com/open-dpp/open-dpp/commit/29e3399add99e620140e2d10dd4c33e999f33756) Thanks [@Hentra](https://github.com/Hentra)! - Add 26 more languages to multilanguage description

### Patch Changes

- [#678](https://github.com/open-dpp/open-dpp/pull/678) [`43ef264`](https://github.com/open-dpp/open-dpp/commit/43ef2641d8bbc722ae7c47592f91be23d85879cb) Thanks [@florianBieck](https://github.com/florianBieck)! - Simplified email footers

- Updated dependencies [[`29e3399`](https://github.com/open-dpp/open-dpp/commit/29e3399add99e620140e2d10dd4c33e999f33756)]:
  - @open-dpp/api-client@2.10.0
  - @open-dpp/dto@2.10.0
  - @open-dpp/env@2.10.0
  - @open-dpp/exception@2.10.0
  - @open-dpp/permission@2.10.0

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

- Updated dependencies [[`3cc4e84`](https://github.com/open-dpp/open-dpp/commit/3cc4e84841d551aa8b15bf2e5ddce08764c7cca6), [`2ace889`](https://github.com/open-dpp/open-dpp/commit/2ace8898a659bcdf8112972e2cae8d288fb1150e)]:
  - @open-dpp/api-client@2.9.0
  - @open-dpp/dto@2.9.0
  - @open-dpp/env@2.9.0
  - @open-dpp/exception@2.9.0
  - @open-dpp/permission@2.9.0

## 2.8.0

### Minor Changes

- [#632](https://github.com/open-dpp/open-dpp/pull/632) [`b3d58fe`](https://github.com/open-dpp/open-dpp/commit/b3d58fe9ef20e14fa9abbd952e49e51789212800) Thanks [@mr42](https://github.com/mr42)! - Rename list to table. Multiple columns can be grouped. Nested tables are possible now.

### Patch Changes

- Updated dependencies [[`b3d58fe`](https://github.com/open-dpp/open-dpp/commit/b3d58fe9ef20e14fa9abbd952e49e51789212800)]:
  - @open-dpp/api-client@2.8.0
  - @open-dpp/dto@2.8.0
  - @open-dpp/env@2.8.0
  - @open-dpp/exception@2.8.0
  - @open-dpp/permission@2.8.0

## 2.7.0

### Minor Changes

- [#601](https://github.com/open-dpp/open-dpp/pull/601) [`403f74e`](https://github.com/open-dpp/open-dpp/commit/403f74ef849fe2fcb5d5fd0771783584fb801928) Thanks [@mr42](https://github.com/mr42)! - Represent links as Property with valueType AnyUri instead of using ReferenceElement. Add api versioning to REST-API.

### Patch Changes

- Updated dependencies [[`403f74e`](https://github.com/open-dpp/open-dpp/commit/403f74ef849fe2fcb5d5fd0771783584fb801928)]:
  - @open-dpp/api-client@2.7.0
  - @open-dpp/permission@2.7.0
  - @open-dpp/exception@2.7.0
  - @open-dpp/dto@2.7.0
  - @open-dpp/env@2.7.0

## 2.6.0

### Minor Changes

- [#587](https://github.com/open-dpp/open-dpp/pull/587) [`f8ec4ed`](https://github.com/open-dpp/open-dpp/commit/f8ec4ed20a0e6e9ada5eec60465293b0585c726d) Thanks [@mr42](https://github.com/mr42)! - Organization owners can change the role of a member.

### Patch Changes

- Updated dependencies [[`f8ec4ed`](https://github.com/open-dpp/open-dpp/commit/f8ec4ed20a0e6e9ada5eec60465293b0585c726d)]:
  - @open-dpp/api-client@2.6.0
  - @open-dpp/dto@2.6.0
  - @open-dpp/env@2.6.0
  - @open-dpp/exception@2.6.0
  - @open-dpp/permission@2.6.0

## 2.5.0

### Minor Changes

- [#585](https://github.com/open-dpp/open-dpp/pull/585) [`cdf8621`](https://github.com/open-dpp/open-dpp/commit/cdf8621873ca0d98abe101bcb320b8a08a34e360) Thanks [@mr42](https://github.com/mr42)! - Add support for boolean data field.

### Patch Changes

- Updated dependencies [[`cdf8621`](https://github.com/open-dpp/open-dpp/commit/cdf8621873ca0d98abe101bcb320b8a08a34e360)]:
  - @open-dpp/dto@2.5.0
  - @open-dpp/api-client@2.5.0
  - @open-dpp/env@2.5.0
  - @open-dpp/exception@2.5.0
  - @open-dpp/permission@2.5.0

## 2.4.0

### Minor Changes

- [#580](https://github.com/open-dpp/open-dpp/pull/580) [`d5f0b69`](https://github.com/open-dpp/open-dpp/commit/d5f0b69cdd15f8d13b5bfe7f9c7e66534b79d2da) Thanks [@mr42](https://github.com/mr42)! - Add activity history to passports and templates.

### Patch Changes

- Updated dependencies [[`d5f0b69`](https://github.com/open-dpp/open-dpp/commit/d5f0b69cdd15f8d13b5bfe7f9c7e66534b79d2da)]:
  - @open-dpp/api-client@2.4.0
  - @open-dpp/permission@2.4.0
  - @open-dpp/exception@2.4.0
  - @open-dpp/dto@2.4.0
  - @open-dpp/env@2.4.0

## 1.0.0

### Major Changes

- [#520](https://github.com/open-dpp/open-dpp/pull/520) [`cf7dbd0`](https://github.com/open-dpp/open-dpp/commit/cf7dbd0d01313e50d4eec39a65944d98f417ba88) Thanks [@florianBieck](https://github.com/florianBieck)! - Added granular passport UI customization capabilities and refactored presentation layer into permalink structure.

### Patch Changes

- Updated dependencies [[`cf7dbd0`](https://github.com/open-dpp/open-dpp/commit/cf7dbd0d01313e50d4eec39a65944d98f417ba88)]:
  - @open-dpp/api-client@1.0.0
  - @open-dpp/permission@1.0.0
  - @open-dpp/exception@1.0.0
  - @open-dpp/dto@1.0.0
  - @open-dpp/env@1.0.0

## 0.6.0

### Minor Changes

- [#575](https://github.com/open-dpp/open-dpp/pull/575) [`9e62648`](https://github.com/open-dpp/open-dpp/commit/9e62648707401f6d50dc54bbb1fd4f892a49dad6) Thanks [@mr42](https://github.com/mr42)! - Use swagger documentation instead of vitest open api documentation. Correct parameter syntax in open api documentation from :id to {id}.

### Patch Changes

- Updated dependencies [[`9e62648`](https://github.com/open-dpp/open-dpp/commit/9e62648707401f6d50dc54bbb1fd4f892a49dad6)]:
  - @open-dpp/api-client@0.6.0
  - @open-dpp/permission@0.6.0
  - @open-dpp/exception@0.6.0
  - @open-dpp/dto@0.6.0
  - @open-dpp/env@0.6.0

## 0.5.0

### Minor Changes

- [#572](https://github.com/open-dpp/open-dpp/pull/572) [`4d5c918`](https://github.com/open-dpp/open-dpp/commit/4d5c9182459b9d46793b88fbd6193c512a1c3b9c) Thanks [@mr42](https://github.com/mr42)! - Add endpoint to modify value of submodel.

### Patch Changes

- Updated dependencies [[`4d5c918`](https://github.com/open-dpp/open-dpp/commit/4d5c9182459b9d46793b88fbd6193c512a1c3b9c)]:
  - @open-dpp/api-client@0.5.0
  - @open-dpp/permission@0.5.0
  - @open-dpp/exception@0.5.0
  - @open-dpp/dto@0.5.0
  - @open-dpp/env@0.5.0

## 0.4.4

### Patch Changes

- [#544](https://github.com/open-dpp/open-dpp/pull/544) [`19bce7c`](https://github.com/open-dpp/open-dpp/commit/19bce7c2e336f8d4ec53eab6de48315188aaa04f) Thanks [@mr42](https://github.com/mr42)! - Add instance setting OPEN_DPP_INSTANCE_ORGANIZATION_CREATION_ENABLED. If it is disabled only administrators are allowed to add new organizations. In addition the list of pending invitations are shown for new registered users and also within the profile view. Furthermore, the routing flow for users without organization has been corrected.

- [#564](https://github.com/open-dpp/open-dpp/pull/564) [`8b0e301`](https://github.com/open-dpp/open-dpp/commit/8b0e30179a1d874e927b94be0877212985a97b69) Thanks [@Hentra](https://github.com/Hentra)! - Change Id and id to ID in frontend

- Updated dependencies [[`19bce7c`](https://github.com/open-dpp/open-dpp/commit/19bce7c2e336f8d4ec53eab6de48315188aaa04f), [`8b0e301`](https://github.com/open-dpp/open-dpp/commit/8b0e30179a1d874e927b94be0877212985a97b69)]:
  - @open-dpp/api-client@0.4.4
  - @open-dpp/permission@0.4.4
  - @open-dpp/exception@0.4.4
  - @open-dpp/dto@0.4.4
  - @open-dpp/env@0.4.4

## 0.4.3

### Patch Changes

- [#556](https://github.com/open-dpp/open-dpp/pull/556) [`d5c6ddf`](https://github.com/open-dpp/open-dpp/commit/d5c6ddf976cf87947cacc2b59aaaf2666501d5b1) Thanks [@Hentra](https://github.com/Hentra)! - Allow deletion of media files

- Updated dependencies [[`d5c6ddf`](https://github.com/open-dpp/open-dpp/commit/d5c6ddf976cf87947cacc2b59aaaf2666501d5b1)]:
  - @open-dpp/api-client@0.4.3
  - @open-dpp/dto@0.4.3
  - @open-dpp/env@0.4.3
  - @open-dpp/exception@0.4.3
  - @open-dpp/permission@0.4.3

## 0.4.2

### Patch Changes

- Updated dependencies []:
  - @open-dpp/api-client@0.4.2
  - @open-dpp/dto@0.4.2
  - @open-dpp/env@0.4.2
  - @open-dpp/exception@0.4.2
  - @open-dpp/permission@0.4.2

## 0.4.1

### Patch Changes

- Updated dependencies []:
  - @open-dpp/api-client@0.4.1
  - @open-dpp/dto@0.4.1
  - @open-dpp/env@0.4.1
  - @open-dpp/exception@0.4.1
  - @open-dpp/permission@0.4.1

## 0.4.0

### Minor Changes

- [#513](https://github.com/open-dpp/open-dpp/pull/513) [`ca55ba0`](https://github.com/open-dpp/open-dpp/commit/ca55ba0529752cdd852ba41fcc357dfc1b27bacb) Thanks [@florianBieck](https://github.com/florianBieck)! - Updated dependencies to minor and patch versions

### Patch Changes

- Updated dependencies [[`ca55ba0`](https://github.com/open-dpp/open-dpp/commit/ca55ba0529752cdd852ba41fcc357dfc1b27bacb)]:
  - @open-dpp/api-client@0.4.0
  - @open-dpp/permission@0.4.0
  - @open-dpp/exception@0.4.0
  - @open-dpp/dto@0.4.0
  - @open-dpp/env@0.4.0

## 0.3.0

### Patch Changes

- Updated dependencies []:
  - @open-dpp/api-client@0.3.0
  - @open-dpp/dto@0.3.0
  - @open-dpp/env@0.3.0
  - @open-dpp/exception@0.3.0
  - @open-dpp/permission@0.3.0

## 0.2.2

### Patch Changes

- [#514](https://github.com/open-dpp/open-dpp/pull/514) [`5f8a7ff`](https://github.com/open-dpp/open-dpp/commit/5f8a7ff23a611237652e9bc9e01a5be97ef445d1) Thanks [@Hentra](https://github.com/Hentra)! - Add an option to set the branding color for an organization

- Updated dependencies [[`5f8a7ff`](https://github.com/open-dpp/open-dpp/commit/5f8a7ff23a611237652e9bc9e01a5be97ef445d1)]:
  - @open-dpp/api-client@0.2.2
  - @open-dpp/dto@0.2.2
  - @open-dpp/env@0.2.2
  - @open-dpp/exception@0.2.2
  - @open-dpp/permission@0.2.2

## 0.2.1

### Patch Changes

- Updated dependencies []:
  - @open-dpp/api-client@0.2.1
  - @open-dpp/dto@0.2.1
  - @open-dpp/env@0.2.1
  - @open-dpp/exception@0.2.1
  - @open-dpp/permission@0.2.1

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
  - @open-dpp/env@0.2.0
  - @open-dpp/exception@0.2.0
  - @open-dpp/permission@0.2.0

## 0.1.4

### Patch Changes

- [#464](https://github.com/open-dpp/open-dpp/pull/464) [`48fc474`](https://github.com/open-dpp/open-dpp/commit/48fc474a3e54a1aa0a1f0601fa9af1215dfea86c) Thanks [@florianBieck](https://github.com/florianBieck)! - Change lint and format tooling to oxlint and oxfmt.

- Updated dependencies [[`48fc474`](https://github.com/open-dpp/open-dpp/commit/48fc474a3e54a1aa0a1f0601fa9af1215dfea86c)]:
  - @open-dpp/api-client@0.1.4
  - @open-dpp/permission@0.1.4
  - @open-dpp/exception@0.1.4
  - @open-dpp/dto@0.1.4
  - @open-dpp/env@0.1.4

## 0.1.3

### Patch Changes

- [#465](https://github.com/open-dpp/open-dpp/pull/465) [`2d7f141`](https://github.com/open-dpp/open-dpp/commit/2d7f141ed7f5c2745bc171d0972b8383e83f1c87) Thanks [@florianBieck](https://github.com/florianBieck)! - Refactored DDD usage in user domain

- Updated dependencies []:
  - @open-dpp/api-client@0.1.3
  - @open-dpp/dto@0.1.3
  - @open-dpp/env@0.1.3
  - @open-dpp/exception@0.1.3
  - @open-dpp/permission@0.1.3

## 0.1.2

### Patch Changes

- [#490](https://github.com/open-dpp/open-dpp/pull/490) [`0769773`](https://github.com/open-dpp/open-dpp/commit/0769773e9b14973d02725e975f0ac0d00fdc8251) Thanks [@florianBieck](https://github.com/florianBieck)! - Added support for DateTime fields in passports and templates.

- Updated dependencies []:
  - @open-dpp/api-client@0.1.2
  - @open-dpp/dto@0.1.2
  - @open-dpp/env@0.1.2
  - @open-dpp/exception@0.1.2
  - @open-dpp/permission@0.1.2

## 0.1.1

### Patch Changes

- [#495](https://github.com/open-dpp/open-dpp/pull/495) [`69e6c29`](https://github.com/open-dpp/open-dpp/commit/69e6c2929e3a5d1a23fa85126dcf42478c28bc06) Thanks [@florianBieck](https://github.com/florianBieck)! - Implementing a status endpoint and UI changes to display a version.

- Updated dependencies [[`69e6c29`](https://github.com/open-dpp/open-dpp/commit/69e6c2929e3a5d1a23fa85126dcf42478c28bc06)]:
  - @open-dpp/api-client@0.1.1
  - @open-dpp/dto@0.1.1
  - @open-dpp/env@0.1.1
  - @open-dpp/exception@0.1.1
  - @open-dpp/permission@0.1.1
