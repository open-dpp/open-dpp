---
"@open-dpp/main": patch
---

Report the real application version again. CI passed the primary Docker tag as `APP_VERSION`, so images built from `main` reported the branch name — the UI rendered `vmain` instead of a version. The version is now derived from the package version (with `+sha.<short-sha>` on non-release builds), the backend falls back to the `package.json` bundled in the image when `APP_VERSION` is absent, and a non-semver `APP_VERSION` is ignored with a warning instead of being shown to users.
