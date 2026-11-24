---
"@open-dpp/client": patch
---

The media library and the media picker show the size of a file in the unit that fits it ("209 B", "33.2 KB", "1.5 MB"), with the decimal separator of the selected language. The tile and the details panel show the same text for the same file. Before, a small file read as "0.0 MB" in the details panel and as "0.00 MB" on the tile.
