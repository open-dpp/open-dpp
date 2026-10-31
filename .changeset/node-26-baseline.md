---
"@open-dpp/main": patch
---

Upgrade the container's Node.js runtime from 24.22.1 to 26.13.0 LTS. Node 24 entered maintenance on 2026-10-20, and Node 26 is the active LTS line, supported until 2029-04-30. Building from source now requires Node.js 26.13.0 or later: `pnpm install` stops with an error on older versions.
