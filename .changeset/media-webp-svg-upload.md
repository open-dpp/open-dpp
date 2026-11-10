---
"@open-dpp/main": minor
"@open-dpp/dto": minor
---

The media upload API accepts SVG images and detects every file's type from its content instead of the client's MIME type. SVGs stay vector images: scripts, event handlers and references to other files are removed on upload, and SVG downloads carry a sandboxing Content-Security-Policy. Photos are stored upright, and all image metadata, the GPS position included, is removed. HEIC uploads, which could never be decoded, and other unsupported or broken files are now rejected with a 400 instead of failing with a 500.
