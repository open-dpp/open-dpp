# @open-dpp/api-client

## 0.4.4

### Patch Changes

- [#544](https://github.com/open-dpp/open-dpp/pull/544) [`19bce7c`](https://github.com/open-dpp/open-dpp/commit/19bce7c2e336f8d4ec53eab6de48315188aaa04f) Thanks [@mr42](https://github.com/mr42)! - Add instance setting OPEN_DPP_INSTANCE_ORGANIZATION_CREATION_ENABLED. If it is disabled only administrators are allowed to add new organizations. In addition the list of pending invitations are shown for new registered users and also within the profile view. Furthermore, the routing flow for users without organization has been corrected.

- [#564](https://github.com/open-dpp/open-dpp/pull/564) [`8b0e301`](https://github.com/open-dpp/open-dpp/commit/8b0e30179a1d874e927b94be0877212985a97b69) Thanks [@Hentra](https://github.com/Hentra)! - Change Id and id to ID in frontend

- Updated dependencies [[`19bce7c`](https://github.com/open-dpp/open-dpp/commit/19bce7c2e336f8d4ec53eab6de48315188aaa04f), [`8b0e301`](https://github.com/open-dpp/open-dpp/commit/8b0e30179a1d874e927b94be0877212985a97b69)]:
  - @open-dpp/dto@0.4.4

## 0.4.3

### Patch Changes

- [#556](https://github.com/open-dpp/open-dpp/pull/556) [`d5c6ddf`](https://github.com/open-dpp/open-dpp/commit/d5c6ddf976cf87947cacc2b59aaaf2666501d5b1) Thanks [@Hentra](https://github.com/Hentra)! - Allow deletion of media files

- Updated dependencies []:
  - @open-dpp/dto@0.4.3

## 0.4.2

### Patch Changes

- Updated dependencies []:
  - @open-dpp/dto@0.4.2

## 0.4.1

### Patch Changes

- Updated dependencies []:
  - @open-dpp/dto@0.4.1

## 0.4.0

### Minor Changes

- [#513](https://github.com/open-dpp/open-dpp/pull/513) [`ca55ba0`](https://github.com/open-dpp/open-dpp/commit/ca55ba0529752cdd852ba41fcc357dfc1b27bacb) Thanks [@florianBieck](https://github.com/florianBieck)! - Updated dependencies to minor and patch versions

### Patch Changes

- Updated dependencies [[`ca55ba0`](https://github.com/open-dpp/open-dpp/commit/ca55ba0529752cdd852ba41fcc357dfc1b27bacb)]:
  - @open-dpp/dto@0.4.0

## 0.3.0

### Patch Changes

- Updated dependencies []:
  - @open-dpp/dto@0.3.0

## 0.2.2

### Patch Changes

- [#514](https://github.com/open-dpp/open-dpp/pull/514) [`5f8a7ff`](https://github.com/open-dpp/open-dpp/commit/5f8a7ff23a611237652e9bc9e01a5be97ef445d1) Thanks [@Hentra](https://github.com/Hentra)! - Add an option to set the branding color for an organization

- Updated dependencies [[`5f8a7ff`](https://github.com/open-dpp/open-dpp/commit/5f8a7ff23a611237652e9bc9e01a5be97ef445d1)]:
  - @open-dpp/dto@0.2.2

## 0.2.1

### Patch Changes

- Updated dependencies []:
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
  - @open-dpp/dto@0.2.0

## 0.1.4

### Patch Changes

- [#464](https://github.com/open-dpp/open-dpp/pull/464) [`48fc474`](https://github.com/open-dpp/open-dpp/commit/48fc474a3e54a1aa0a1f0601fa9af1215dfea86c) Thanks [@florianBieck](https://github.com/florianBieck)! - Change lint and format tooling to oxlint and oxfmt.

- Updated dependencies [[`48fc474`](https://github.com/open-dpp/open-dpp/commit/48fc474a3e54a1aa0a1f0601fa9af1215dfea86c)]:
  - @open-dpp/dto@0.1.4

## 0.1.3

### Patch Changes

- Updated dependencies []:
  - @open-dpp/dto@0.1.3

## 0.1.2

### Patch Changes

- Updated dependencies []:
  - @open-dpp/dto@0.1.2

## 0.1.1

### Patch Changes

- [#495](https://github.com/open-dpp/open-dpp/pull/495) [`69e6c29`](https://github.com/open-dpp/open-dpp/commit/69e6c2929e3a5d1a23fa85126dcf42478c28bc06) Thanks [@florianBieck](https://github.com/florianBieck)! - Implementing a status endpoint and UI changes to display a version.

- Updated dependencies [[`69e6c29`](https://github.com/open-dpp/open-dpp/commit/69e6c2929e3a5d1a23fa85126dcf42478c28bc06)]:
  - @open-dpp/dto@0.1.1
