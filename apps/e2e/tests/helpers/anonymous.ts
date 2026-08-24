import type { Browser, BrowserContext } from "@playwright/test";

/**
 * A truly cookie-less context. Inside @playwright/test, `browser.newContext()`
 * applies the project's configured context options — including the logged-in
 * `storageState` — so a bare `newContext()` silently carries the shared user's
 * session cookie. Overriding with an empty storage state is required for
 * anonymous-visitor assertions (draft passports must 404, etc.).
 */
export async function newAnonymousContext(browser: Browser): Promise<BrowserContext> {
  return browser.newContext({ storageState: { cookies: [], origins: [] } });
}
