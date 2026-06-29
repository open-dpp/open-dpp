import { test as base } from "@playwright/test";
import { createDisposableUser, DisposableUser } from "./helpers/disposable-user";
import { MailpitClient } from "./helpers/mailpit";

type AccountFixtures = {
  mailpit: MailpitClient;
  makeDisposableUser: (opts?: {
    verified?: boolean;
    preferredLanguage?: string;
  }) => Promise<DisposableUser>;
};

/**
 * Account/email-change e2e fixtures. Destructive specs MUST import { test, expect }
 * from this file (not "@playwright/test") so disposable users are torn down.
 */
export const test = base.extend<AccountFixtures>({
  mailpit: async ({ request }, use) => {
    await use(new MailpitClient(request));
  },
  makeDisposableUser: async ({ browser, request, mailpit }, use) => {
    const created: DisposableUser[] = [];
    await use(async (opts) => {
      const u = await createDisposableUser(
        { browser, request, mailpit },
        { verified: opts?.verified ?? true, preferredLanguage: opts?.preferredLanguage },
      );
      created.push(u);
      return u;
    });
    for (const u of created) {
      try {
        await u.dispose();
      } catch {
        /* best-effort teardown */
      }
    }
  },
});

export { expect } from "@playwright/test";
