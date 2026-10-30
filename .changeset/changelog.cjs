// Changelog generator: `@changesets/changelog-github` without the
// "Updated dependencies" entries. Every `@open-dpp/*` package is in one
// `fixed` group, so those entries only restate that everything moved to the
// same version. Dropping them keeps each CHANGELOG.md to real changes, which
// `scripts/release-notes.mjs` combines into the single GitHub release.
const github = require("@changesets/changelog-github").default;

module.exports = {
  getReleaseLine: github.getReleaseLine,
  getDependencyReleaseLine: async () => "",
};
