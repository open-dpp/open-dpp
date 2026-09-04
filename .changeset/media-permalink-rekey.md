---
"@open-dpp/main": major
"@open-dpp/api-client": major
"@open-dpp/client": minor
"e2e": patch
---

Public passport media is now keyed on permalinks, and bare media access is locked down.

**Breaking API changes**

- Removed the identifier-keyed media routes `POST /media/dpp/{upi}/{dataFieldId}`, `GET /media/dpp/{upi}/{dataFieldId}/info` and `GET /media/dpp/{upi}/{dataFieldId}/download`, together with the api-client methods `uploadDppMedia`, `getMediaInfoOfDataField` and `downloadMediaOfDataField`.
- `GET /media/{id}/info`, `GET /media/{id}/download` and `DELETE /media/{id}` now require a session and membership of the organization that owns the media. Anonymous embeds of these URLs stop working.
- New passports no longer receive an auto-created internal (`OPEN_DPP_UUID`) identifier. Internal identifiers remain available as user-created records and are deletable while the passport is a draft. Existing auto-created rows are left untouched.
- Removed `GET /passports/{id}/unique-product-identifier`; the AI chat resolves the passport through the permalink instead.

**New**

- `GET /media/permalink/{permalinkIdOrSlug}/by-id/{mediaId}/info` and `.../download` serve a passport's media anonymously through one of its permalinks. Only media the passport references (a File element value or a shell default thumbnail) is reachable, and access ends when the permalink is deleted or the passport unpublished. Members of the owning organization can preview a draft's media the same way. api-client: `getPermalinkMediaInfo`, `downloadPermalinkMedia`.
- `GET /branding/logo/{mediaId}` serves an organization's designated logo anonymously. api-client: `branding.downloadLogo`.
- Media responses carry hardened headers (`X-Content-Type-Options: nosniff`, content type clamped to the upload allowlist).
