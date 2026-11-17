---
"@open-dpp/main": minor
"@open-dpp/dto": minor
"@open-dpp/client": minor
---

The media upload API accepts SVG images and detects every file's type from its content instead of the client's MIME type. SVGs stay vector images: scripts, event handlers and references to other files are removed on upload, and SVG downloads carry a sandboxing Content-Security-Policy. Photos are stored upright, and all image metadata, the GPS position included, is removed. HEIC uploads, which could never be decoded, and other unsupported or broken files are now rejected with a 400 instead of failing with a 500.

Replacing the file of a passport field now keeps its media: the id, the creator and the creation date stay, and the new `updatedByUserId` records who replaced the file (`null` until a file is replaced). If storing the new file fails, the passport field keeps the file it had; before, its media record was deleted first and lost.

The media library and the media picker now offer WebP and SVG files in the file dialog. When a file is rejected because its type is not supported, it is invalid or it is larger than 15 MB, both say so instead of showing a generic error, and the media picker shows its messages in the selected language. An SVG that only defines a `viewBox` is shown at the size of its container in previews, the product image gallery and the branding logo.
