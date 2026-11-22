---
"@open-dpp/main": minor
---

Replacing the file of a passport field now keeps its media: the id, the creator and the creation date stay, and the new `updatedByUserId` records who replaced the file (`null` until a file is replaced). If storing the new file fails, the passport field keeps the file it had; before, its media record was deleted first and lost.

A passport field now holds one media at most. A migration removes the further media that concurrent first uploads could create for one field and keeps the one every download already served; the ids of the removed media answer with a 404.

Media downloads are no longer cached for a year without a check. The browser asks whether its copy is still the current file (`ETag`), so a replaced file is shown right away.
