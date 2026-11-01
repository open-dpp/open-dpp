---
"@open-dpp/main": patch
---

The backend now ships as a single ES module bundle (`dist/main.js`, built with Rspack) instead of one CommonJS file per source file. The container image sets `NODE_OPTIONS=--enable-source-maps`, so stack traces in the logs point to TypeScript source lines. If you override `NODE_OPTIONS` for the container, add `--enable-source-maps` to keep that.
