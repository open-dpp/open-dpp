---
"@open-dpp/env": major
"@open-dpp/main": major
---

BREAKING: `OPEN_DPP_CLAMAV_PORT` was removed — put the port into `OPEN_DPP_CLAMAV_URL` (e.g. `http://clamav-rest:9000`). Existing deployments must update their `.env`, otherwise scans target the wrong port and every upload is rejected.

`OPEN_DPP_CLAMAV_URL` is now optional: unset (or empty) disables virus scanning — uploads are accepted unscanned and a warning is logged at startup. The `clamav-rest` service was removed from the example and development compose files; see the Production setup guide (`docs/guides/production-setup.md`) to add it back.
