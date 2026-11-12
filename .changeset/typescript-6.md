---
"@open-dpp/main": patch
"@open-dpp/dto": patch
"@open-dpp/api-client": patch
---

Build the project with TypeScript 6.0 instead of 5.9. TypeScript only type-checks here, so the Docker image, the web client and the published `@open-dpp/dto` and `@open-dpp/api-client` packages contain the same code as before, and nothing changes for projects that use the two packages. When you build from source, `pnpm install` installs TypeScript 6.0.3. The backend now type-checks in strict mode, so a `catch` variable is `unknown` until the code narrows it.
