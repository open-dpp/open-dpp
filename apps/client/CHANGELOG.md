# @open-dpp/client

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
