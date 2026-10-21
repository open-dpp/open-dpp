---
"@open-dpp/env": minor
"@open-dpp/dto": minor
"@open-dpp/main": minor
"@open-dpp/client": minor
---

Mail is optional. `OPEN_DPP_MAIL_HOST` is no longer required: without it the backend starts, warns once, and writes each mail's type, recipient, subject and links to the log instead of sending. `OPEN_DPP_MAIL_PORT` defaults to `587` (implicit TLS on `465`), `OPEN_DPP_MAIL_USER` / `OPEN_DPP_MAIL_PASSWORD` are optional (no `AUTH` when unset), and `OPEN_DPP_MAIL_SENDER_ADDRESS` is only required once a host is set. The Mailpit-only variables `OPEN_DPP_MAIL_MAILPIT_SMTP_AUTH` / `OPEN_DPP_MAIL_MAILPIT_SMTP_ALLOW_INSECURE` were dropped from the env schema (compose still reads them).

New admin instance setting `mailEnabled` (third toggle on the Settings page, lockable via `OPEN_DPP_INSTANCE_MAIL_ENABLED`, forced off while no SMTP host is set) and a 60 s per-replica cache for instance settings. The public instance-settings endpoint returns `mailEnabled`; when it is off the sign-in page hides "Forgot password?" and the profile hides change-email, resend-verification and the not-verified badge.

Mailpit was removed from the example deployment and moved behind the `mail` compose profile in the development stack (`COMPOSE_PROFILES=mail` in `.env.dev`). See the Production setup guide for SMTP setup and the security note on logged links.

**Upgrading:** an existing `.env` for the example deployment still points `OPEN_DPP_MAIL_HOST` at `mailpit`, a service that no longer exists, so every mail fails to send. Comment out the `OPEN_DPP_MAIL_*` block (mail off, links logged) or point it at your SMTP server. `scripts/setup.sh` leaves an existing `.env` untouched, so re-running it does not fix this. In the development stack, an existing `.env.dev` with the mail variables set needs `COMPOSE_PROFILES=mail` added, or `make dev` no longer starts Mailpit.
