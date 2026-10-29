---
"@open-dpp/dto": minor
"@open-dpp/api-client": minor
"@open-dpp/main": minor
"@open-dpp/client": minor
---

Members can download the Carrier Export of a permalink as SVG (sized in mm) or PNG (at a chosen DPI) from `GET /permalinks/:id/carrier`, with a four-module quiet zone, a module size and an error-correction level. The api-client gains `permalinks.getCarrierExport`, and the back office shows and downloads the server-rendered QR code instead of drawing its own.
