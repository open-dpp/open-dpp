---
"@open-dpp/env": minor
"@open-dpp/main": minor
---

Operators can let other websites show open-dpp in an iframe through `OPEN_DPP_EMBED_ORIGINS`, a comma-separated list of origins (`https://partner.example.com`). While it is set, open-dpp sends `Content-Security-Policy: frame-ancestors 'self'` plus those origins, so no other website can frame it, and sets the auth cookies with `SameSite=None; Secure; Partitioned`, so a user can sign in inside the iframe even where Chrome blocks third-party cookies. A sign-in inside an embed is separate from one at open-dpp itself. `OPEN_DPP_URL` must then be https (http only on loopback hosts). Unset, nothing changes.
