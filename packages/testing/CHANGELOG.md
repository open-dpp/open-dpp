# @open-dpp/testing

## 3.6.0

### Patch Changes

- Updated dependencies [[`3720c86`](https://github.com/open-dpp/open-dpp/commit/3720c8615cf26e57492525cc2b7a7e090990efb7)]:
  - @open-dpp/dto@3.6.0
  - @open-dpp/env@3.6.0

## 3.5.0

### Patch Changes

- Updated dependencies []:
  - @open-dpp/dto@3.5.0
  - @open-dpp/env@3.5.0

## 3.4.0

### Patch Changes

- Updated dependencies []:
  - @open-dpp/dto@3.4.0
  - @open-dpp/env@3.4.0

## 3.3.0

### Patch Changes

- Updated dependencies []:
  - @open-dpp/dto@3.3.0
  - @open-dpp/env@3.3.0

## 3.2.0

### Patch Changes

- Updated dependencies [[`7b398df`](https://github.com/open-dpp/open-dpp/commit/7b398dfdc15c76e0a2bd8a4691eb6c9c09d94e5b)]:
  - @open-dpp/dto@3.2.0
  - @open-dpp/env@3.2.0

## 3.1.4

### Patch Changes

- Updated dependencies []:
  - @open-dpp/dto@3.1.4
  - @open-dpp/env@3.1.4

## 3.1.3

### Patch Changes

- Updated dependencies []:
  - @open-dpp/dto@3.1.3
  - @open-dpp/env@3.1.3

## 3.1.2

### Patch Changes

- Updated dependencies []:
  - @open-dpp/dto@3.1.2
  - @open-dpp/env@3.1.2

## 3.1.1

### Patch Changes

- Updated dependencies []:
  - @open-dpp/dto@3.1.1
  - @open-dpp/env@3.1.1

## 3.1.0

### Patch Changes

- Updated dependencies [[`6f6154f`](https://github.com/open-dpp/open-dpp/commit/6f6154f38b07290ec19595cbbe2eeda6939aa887)]:
  - @open-dpp/dto@3.1.0
  - @open-dpp/env@3.1.0

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
  - @open-dpp/env@3.0.0

## 2.10.0

### Minor Changes

- [#621](https://github.com/open-dpp/open-dpp/pull/621) [`29e3399`](https://github.com/open-dpp/open-dpp/commit/29e3399add99e620140e2d10dd4c33e999f33756) Thanks [@Hentra](https://github.com/Hentra)! - Add 26 more languages to multilanguage description

### Patch Changes

- Updated dependencies [[`29e3399`](https://github.com/open-dpp/open-dpp/commit/29e3399add99e620140e2d10dd4c33e999f33756)]:
  - @open-dpp/dto@2.10.0
  - @open-dpp/env@2.10.0

## 2.9.0

### Patch Changes

- Updated dependencies [[`2ace889`](https://github.com/open-dpp/open-dpp/commit/2ace8898a659bcdf8112972e2cae8d288fb1150e)]:
  - @open-dpp/dto@2.9.0
  - @open-dpp/env@2.9.0

## 2.8.0

### Patch Changes

- Updated dependencies [[`b3d58fe`](https://github.com/open-dpp/open-dpp/commit/b3d58fe9ef20e14fa9abbd952e49e51789212800)]:
  - @open-dpp/dto@2.8.0
  - @open-dpp/env@2.8.0

## 2.7.0

### Minor Changes

- [#601](https://github.com/open-dpp/open-dpp/pull/601) [`403f74e`](https://github.com/open-dpp/open-dpp/commit/403f74ef849fe2fcb5d5fd0771783584fb801928) Thanks [@mr42](https://github.com/mr42)! - Represent links as Property with valueType AnyUri instead of using ReferenceElement. Add api versioning to REST-API.

### Patch Changes

- Updated dependencies [[`403f74e`](https://github.com/open-dpp/open-dpp/commit/403f74ef849fe2fcb5d5fd0771783584fb801928)]:
  - @open-dpp/dto@2.7.0
  - @open-dpp/env@2.7.0

## 2.6.0

### Patch Changes

- Updated dependencies [[`f8ec4ed`](https://github.com/open-dpp/open-dpp/commit/f8ec4ed20a0e6e9ada5eec60465293b0585c726d)]:
  - @open-dpp/dto@2.6.0
  - @open-dpp/env@2.6.0

## 2.5.0

### Patch Changes

- Updated dependencies [[`cdf8621`](https://github.com/open-dpp/open-dpp/commit/cdf8621873ca0d98abe101bcb320b8a08a34e360)]:
  - @open-dpp/dto@2.5.0
  - @open-dpp/env@2.5.0

## 2.4.0

### Minor Changes

- [#580](https://github.com/open-dpp/open-dpp/pull/580) [`d5f0b69`](https://github.com/open-dpp/open-dpp/commit/d5f0b69cdd15f8d13b5bfe7f9c7e66534b79d2da) Thanks [@mr42](https://github.com/mr42)! - Add activity history to passports and templates.

### Patch Changes

- Updated dependencies [[`d5f0b69`](https://github.com/open-dpp/open-dpp/commit/d5f0b69cdd15f8d13b5bfe7f9c7e66534b79d2da)]:
  - @open-dpp/dto@2.4.0
  - @open-dpp/env@2.4.0

## 1.0.0

### Major Changes

- [#520](https://github.com/open-dpp/open-dpp/pull/520) [`cf7dbd0`](https://github.com/open-dpp/open-dpp/commit/cf7dbd0d01313e50d4eec39a65944d98f417ba88) Thanks [@florianBieck](https://github.com/florianBieck)! - Added granular passport UI customization capabilities and refactored presentation layer into permalink structure.

### Patch Changes

- Updated dependencies [[`cf7dbd0`](https://github.com/open-dpp/open-dpp/commit/cf7dbd0d01313e50d4eec39a65944d98f417ba88)]:
  - @open-dpp/dto@1.0.0
  - @open-dpp/env@1.0.0

## 0.6.0

### Minor Changes

- [#575](https://github.com/open-dpp/open-dpp/pull/575) [`9e62648`](https://github.com/open-dpp/open-dpp/commit/9e62648707401f6d50dc54bbb1fd4f892a49dad6) Thanks [@mr42](https://github.com/mr42)! - Use swagger documentation instead of vitest open api documentation. Correct parameter syntax in open api documentation from :id to {id}.

### Patch Changes

- Updated dependencies [[`9e62648`](https://github.com/open-dpp/open-dpp/commit/9e62648707401f6d50dc54bbb1fd4f892a49dad6)]:
  - @open-dpp/dto@0.6.0
  - @open-dpp/env@0.6.0

## 0.5.0

### Minor Changes

- [#572](https://github.com/open-dpp/open-dpp/pull/572) [`4d5c918`](https://github.com/open-dpp/open-dpp/commit/4d5c9182459b9d46793b88fbd6193c512a1c3b9c) Thanks [@mr42](https://github.com/mr42)! - Add endpoint to modify value of submodel.

### Patch Changes

- Updated dependencies [[`4d5c918`](https://github.com/open-dpp/open-dpp/commit/4d5c9182459b9d46793b88fbd6193c512a1c3b9c)]:
  - @open-dpp/dto@0.5.0
  - @open-dpp/env@0.5.0

## 0.4.4

### Patch Changes

- [#544](https://github.com/open-dpp/open-dpp/pull/544) [`19bce7c`](https://github.com/open-dpp/open-dpp/commit/19bce7c2e336f8d4ec53eab6de48315188aaa04f) Thanks [@mr42](https://github.com/mr42)! - Add instance setting OPEN_DPP_INSTANCE_ORGANIZATION_CREATION_ENABLED. If it is disabled only administrators are allowed to add new organizations. In addition the list of pending invitations are shown for new registered users and also within the profile view. Furthermore, the routing flow for users without organization has been corrected.

- [#564](https://github.com/open-dpp/open-dpp/pull/564) [`8b0e301`](https://github.com/open-dpp/open-dpp/commit/8b0e30179a1d874e927b94be0877212985a97b69) Thanks [@Hentra](https://github.com/Hentra)! - Change Id and id to ID in frontend

- Updated dependencies [[`19bce7c`](https://github.com/open-dpp/open-dpp/commit/19bce7c2e336f8d4ec53eab6de48315188aaa04f), [`8b0e301`](https://github.com/open-dpp/open-dpp/commit/8b0e30179a1d874e927b94be0877212985a97b69)]:
  - @open-dpp/dto@0.4.4
  - @open-dpp/env@0.4.4

## 0.4.3

### Patch Changes

- Updated dependencies []:
  - @open-dpp/dto@0.4.3
  - @open-dpp/env@0.4.3

## 0.4.2

### Patch Changes

- Updated dependencies []:
  - @open-dpp/dto@0.4.2
  - @open-dpp/env@0.4.2

## 0.4.1

### Patch Changes

- Updated dependencies []:
  - @open-dpp/dto@0.4.1
  - @open-dpp/env@0.4.1

## 0.4.0

### Minor Changes

- [#513](https://github.com/open-dpp/open-dpp/pull/513) [`ca55ba0`](https://github.com/open-dpp/open-dpp/commit/ca55ba0529752cdd852ba41fcc357dfc1b27bacb) Thanks [@florianBieck](https://github.com/florianBieck)! - Updated dependencies to minor and patch versions

### Patch Changes

- Updated dependencies [[`ca55ba0`](https://github.com/open-dpp/open-dpp/commit/ca55ba0529752cdd852ba41fcc357dfc1b27bacb)]:
  - @open-dpp/dto@0.4.0
  - @open-dpp/env@0.4.0

## 0.3.0

### Patch Changes

- Updated dependencies []:
  - @open-dpp/dto@0.3.0
  - @open-dpp/env@0.3.0

## 0.2.2

### Patch Changes

- Updated dependencies [[`5f8a7ff`](https://github.com/open-dpp/open-dpp/commit/5f8a7ff23a611237652e9bc9e01a5be97ef445d1)]:
  - @open-dpp/dto@0.2.2
  - @open-dpp/env@0.2.2

## 0.2.1

### Patch Changes

- Updated dependencies []:
  - @open-dpp/dto@0.2.1
  - @open-dpp/env@0.2.1

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
  - @open-dpp/dto@0.2.0
  - @open-dpp/env@0.2.0

## 0.1.4

### Patch Changes

- [#464](https://github.com/open-dpp/open-dpp/pull/464) [`48fc474`](https://github.com/open-dpp/open-dpp/commit/48fc474a3e54a1aa0a1f0601fa9af1215dfea86c) Thanks [@florianBieck](https://github.com/florianBieck)! - Change lint and format tooling to oxlint and oxfmt.

- Updated dependencies [[`48fc474`](https://github.com/open-dpp/open-dpp/commit/48fc474a3e54a1aa0a1f0601fa9af1215dfea86c)]:
  - @open-dpp/dto@0.1.4
  - @open-dpp/env@0.1.4

## 0.1.3

### Patch Changes

- Updated dependencies []:
  - @open-dpp/dto@0.1.3
  - @open-dpp/env@0.1.3

## 0.1.2

### Patch Changes

- Updated dependencies []:
  - @open-dpp/dto@0.1.2
  - @open-dpp/env@0.1.2

## 0.1.1

### Patch Changes

- Updated dependencies [[`69e6c29`](https://github.com/open-dpp/open-dpp/commit/69e6c2929e3a5d1a23fa85126dcf42478c28bc06)]:
  - @open-dpp/dto@0.1.1
  - @open-dpp/env@0.1.1
