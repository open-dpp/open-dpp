# Production

The example deployment (`docker-compose.yml`, started by `scripts/setup.sh`) is for trying open-dpp out locally. It is **not** a production setup: run production with high availability (load balancer, multiple replicas, managed MongoDB and S3) and add the services described here.

All environment variables are listed in the [configuration reference](/reference/configuration).

## Mail (SMTP)

open-dpp sends mail for signup verification, password resets, email changes and organization invitations. Neither the example nor the development stack includes a mail server; connect your SMTP relay through these variables:

```
OPEN_DPP_MAIL_HOST="smtp.example.com"
OPEN_DPP_MAIL_PORT="587"                     # default; 465 = implicit TLS
OPEN_DPP_MAIL_USER="mailer"                  # omit for an unauthenticated relay
OPEN_DPP_MAIL_PASSWORD="..."
OPEN_DPP_MAIL_SENDER_ADDRESS="open-dpp <noreply@example.com>"
```

- `OPEN_DPP_MAIL_SENDER_ADDRESS` is required as soon as `OPEN_DPP_MAIL_HOST` is set; startup fails otherwise.
- Port `587` (the default) connects in plain text and upgrades to TLS via STARTTLS when the server offers it. Port `465` uses implicit TLS from the first byte. Leave `OPEN_DPP_MAIL_USER` unset to send without an `AUTH` handshake.

### Disabled mode

When `OPEN_DPP_MAIL_HOST` is unset (or empty) the backend starts normally, logs a warning at startup and, instead of sending, writes one line per mail to its log with the mail type, recipient, subject and the contained links, for example:

```
WARN [EmailService] Mail not sent (mail disabled): type=VERIFY_EMAIL to=ada@example.com subject="Verify E-Mail address" links=https://dpp.example.com/api/v1/auth/verify-email?token=…
```

An operator can complete the flow by handing that link to the user. The same happens when an admin switches the **Sending mail enabled** toggle off on the admin Settings page while SMTP is configured.

::: warning Links in the log
In disabled mode the log contains live verification, password-reset, email-change-revoke and invitation links. Anyone who can read the log can act on them. Restrict log access accordingly, or configure SMTP.
:::

### Admin toggle and env lock

`mailEnabled` is an instance setting (default on) shown as the third toggle on the admin Settings page. Precedence, highest first:

1. `OPEN_DPP_MAIL_HOST` unset ⇒ mail is off and the toggle is locked, whatever else is set.
2. `OPEN_DPP_INSTANCE_MAIL_ENABLED="true"` / `"false"` ⇒ that value, toggle locked.
3. Otherwise the value stored by the admin toggle.

Instance settings are cached in memory per replica for 60 seconds and refreshed immediately on update, so a toggle takes effect at once on the replica that handled it and within a minute on the others.

### What changes while mail is off

The backend keeps every route; only delivery changes. The frontend hides the self-service actions that can only complete by mail:

- sign-in: the "Forgot password?" link
- profile: the change-email button, the resend-verification button and the "not verified" badge

Admin actions — creating or inviting users, resending reset or verification mails — stay visible, since an admin can pick the link from the log. Signing in with an unverified address is allowed either way.
