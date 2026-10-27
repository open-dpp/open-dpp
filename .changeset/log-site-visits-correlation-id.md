---
"@open-dpp/main": patch
"@open-dpp/env": patch
"@open-dpp/docs": patch
---

Log every request, including frontend page visits and `/gs1` resolver hits, with a correlation id that is returned in the `x-correlation-id` response header. A caller-supplied `x-correlation-id` is reused when it is a plain token of up to 128 characters; otherwise a new one is generated. Request logs record the path without the query string, so tokens in links such as `/password-reset?token=…` stay out of the logs.

Two new settings: `OPEN_DPP_LOG_LEVEL` sets the most verbose level that is printed (default `debug`, which hides `verbose` output printed before), and `OPEN_DPP_TRUST_PROXY` sets Express's `trust proxy` so the real client IP is logged and used for rate limiting behind a reverse proxy. Invalid `OPEN_DPP_TRUST_PROXY` values are rejected at startup.
