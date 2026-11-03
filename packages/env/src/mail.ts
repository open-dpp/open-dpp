/**
 * Mail is configured once OPEN_DPP_MAIL_HOST is set. Without it no mail is sent and
 * every Mail Link is written to the server log instead. `""` counts as unset: env files
 * write it for "not set", and compose passes unset variables through as empty strings.
 */
export function isMailConfigured(env: { OPEN_DPP_MAIL_HOST?: string }): boolean {
  return !!env.OPEN_DPP_MAIL_HOST;
}
