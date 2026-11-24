---
"@open-dpp/main": major
"@open-dpp/api-client": major
"@open-dpp/dto": major
"@open-dpp/client": major
---

The media library and the media picker load the media of the organization one page at a time: six files, newest first. Before, they loaded the info of every file the organization has. An upload shows the first page, where the new file comes first. After a delete the shown page is loaded again, and the previews of the files that stay do not request their files again. The grid has the previous/next bar of the other lists, with the number of all files.

Breaking: `GET /media/by-organization` no longer answers a bare array with every file. It takes the query parameters `limit` (1 to 100, 100 when absent) and `cursor` and answers `{ paging_metadata: { cursor, total_count }, result }` like the other list endpoints, newest first. The api-client method `media.getMediaInfoByOrganization` takes `{ limit, cursor }` and returns that page. The api-client type `MediaInfoDto` now comes from `@open-dpp/dto` and has every field the backend returns.

The buttons of the previous/next bar below every list have an accessible name and a tooltip. After a list loads its page again, for example when an API key was revoked, a later page that was opened before no longer repeats an entry or shows a wrong range.
