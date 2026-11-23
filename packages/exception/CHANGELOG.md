# @open-dpp/exception

## 7.1.1

## 7.1.0

## 7.0.1

### Patch Changes

- [#1194](https://github.com/open-dpp/open-dpp/pull/1194) [`04de404`](https://github.com/open-dpp/open-dpp/commit/04de4046fe49091bb938f18c24d364b6398548c9) Thanks [@renovate](https://github.com/apps/renovate)! - Update dependencies:

  - @open-dpp/main: `@nestjs/common` ^12.5.0 → ^12.5.1
  - @open-dpp/main: `@nestjs/core` ^12.5.0 → ^12.5.1
  - @open-dpp/main: `@nestjs/platform-express` ^12.5.0 → ^12.5.1
  - @open-dpp/main: `@nestjs/platform-socket.io` ^12.5.0 → ^12.5.1
  - @open-dpp/main: `@nestjs/websockets` ^12.5.0 → ^12.5.1
  - @open-dpp/main: `@nestjs/cli` ^12.0.12 → ^12.0.13 (dev)
  - @open-dpp/main: `@nestjs/testing` ^12.5.0 → ^12.5.1 (dev)
  - @open-dpp/env: `@nestjs/common` ^12.5.0 → ^12.5.1
  - @open-dpp/env: `@nestjs/core` ^12.5.0 → ^12.5.1
  - @open-dpp/exception: `@nestjs/common` ^12.5.0 → ^12.5.1
  - @open-dpp/exception: `@nestjs/core` ^12.5.0 → ^12.5.1
  - @open-dpp/exception: `@nestjs/testing` ^12.5.0 → ^12.5.1 (dev)
  - @open-dpp/testing: `@nestjs/common` ^12.5.0 → ^12.5.1
  - @open-dpp/testing: `@nestjs/core` ^12.5.0 → ^12.5.1

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

### Patch Changes

- [#1015](https://github.com/open-dpp/open-dpp/pull/1015) [`f5a87c4`](https://github.com/open-dpp/open-dpp/commit/f5a87c4b1aa846d02795db69c585aaa8de0432ae) Thanks [@renovate](https://github.com/apps/renovate)! - Update dependencies:

  - @open-dpp/main: `@nestjs/common` ^12.3.2 → ^12.5.0
  - @open-dpp/main: `@nestjs/config` ^12.0.1 → ^12.1.1
  - @open-dpp/main: `@nestjs/core` ^12.3.2 → ^12.5.0
  - @open-dpp/main: `@nestjs/platform-express` ^12.3.2 → ^12.5.0
  - @open-dpp/main: `@nestjs/platform-socket.io` ^12.3.2 → ^12.5.0
  - @open-dpp/main: `@nestjs/websockets` ^12.3.2 → ^12.5.0
  - @open-dpp/main: `@nestjs/cli` ^12.0.11 → ^12.0.12 (dev)
  - @open-dpp/main: `@nestjs/schematics` ^12.0.12 → ^12.0.13 (dev)
  - @open-dpp/main: `@nestjs/testing` ^12.3.2 → ^12.5.0 (dev)
  - @open-dpp/env: `@nestjs/common` ^12.3.2 → ^12.5.0
  - @open-dpp/env: `@nestjs/config` ^12.0.1 → ^12.1.1
  - @open-dpp/env: `@nestjs/core` ^12.3.2 → ^12.5.0
  - @open-dpp/exception: `@nestjs/common` ^12.3.2 → ^12.5.0
  - @open-dpp/exception: `@nestjs/core` ^12.3.2 → ^12.5.0
  - @open-dpp/exception: `@nestjs/testing` ^12.3.2 → ^12.5.0 (dev)
  - @open-dpp/testing: `@nestjs/common` ^12.3.2 → ^12.5.0
  - @open-dpp/testing: `@nestjs/config` ^12.0.1 → ^12.1.1
  - @open-dpp/testing: `@nestjs/core` ^12.3.2 → ^12.5.0

## 6.5.4

## 6.5.3

## 6.5.2

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

## 6.3.1

## 6.3.0

## 6.2.4

## 6.2.3

## 6.2.2

## 6.2.1

## 6.2.0

### Minor Changes

- [#1017](https://github.com/open-dpp/open-dpp/pull/1017) [`f4c6f7c`](https://github.com/open-dpp/open-dpp/commit/f4c6f7cd1d3e50dc1376a88d14818dee768ecc33) Thanks [@mr42](https://github.com/mr42)! - Templates and passports can be filterd by multiple status and by date range. In addition, passports can also be filtered by template. Further ui improvements for passport creation dialog for long template names.

## 6.1.4

## 6.1.3

## 6.1.2

## 6.1.1

## 6.1.0

## 6.0.0

## 5.3.0

## 5.2.0

## 5.1.0

## 5.0.0

## 4.0.1

### Patch Changes

- [#725](https://github.com/open-dpp/open-dpp/pull/725) [`5f4fb21`](https://github.com/open-dpp/open-dpp/commit/5f4fb215013e05dd129217a71ed457296bd82d25) Thanks [@mr42](https://github.com/mr42)! - In the passport and template editors, sections, subsections, and data fields can be moved.

## 4.0.0

## 3.6.0

## 3.5.0

## 3.4.0

## 3.3.0

## 3.2.0

## 3.1.4

## 3.1.3

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

## 0.2.1

## 0.2.0

## 0.1.4

### Patch Changes

- [#464](https://github.com/open-dpp/open-dpp/pull/464) [`48fc474`](https://github.com/open-dpp/open-dpp/commit/48fc474a3e54a1aa0a1f0601fa9af1215dfea86c) Thanks [@florianBieck](https://github.com/florianBieck)! - Change lint and format tooling to oxlint and oxfmt.

## 0.1.3

## 0.1.2

## 0.1.1
