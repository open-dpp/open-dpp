import { APIRequestContext, Browser, BrowserContext, Page } from "@playwright/test";
import { v4 as uuidv4 } from "uuid";
import { AuthBase, EnvConfig } from "../config";
import { MailpitClient } from "./mailpit";

export const DEFAULT_PASSWORD = "E2ePassw0rd!";

export function uniqueEmail(prefix = "e2e"): string {
  return `${prefix}.${uuidv4()}@example.test`;
}

export interface DisposableUser {
  user: { email: string; password: string; firstName: string; lastName: string };
  context: BrowserContext;
  page: Page;
  dispose: () => Promise<void>;
}

async function signUpViaApi(
  request: APIRequestContext,
  u: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    preferredLanguage: string;
  },
): Promise<void> {
  const res = await request.post(`${AuthBase}/sign-up/email`, {
    data: {
      email: u.email,
      password: u.password,
      firstName: u.firstName,
      lastName: u.lastName,
      name: `${u.firstName} ${u.lastName}`,
      preferredLanguage: u.preferredLanguage,
      callbackURL: "/",
    },
  });
  if (!res.ok()) {
    throw new Error(`Sign-up failed (${res.status()}): ${await res.text()}`);
  }
}

async function signInViaUi(page: Page, email: string, password: string): Promise<void> {
  await page.goto(`${EnvConfig.OPEN_DPP_URL}/signin`);
  // Locale-agnostic selectors (the signin form labels are i18n'd): the email
  // InputText has name="email"; the PrimeVue Password renders input[type=password].
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole("button", { name: /sign in|anmelden/i }).click();
  await page.waitForURL((url) => !url.pathname.endsWith("/signin"), { timeout: 15000 });
}

/**
 * Mints a brand-new throwaway user in its own browser context so destructive
 * email/locale changes never touch any shared user. `verified: true` (default)
 * clicks the signup verification link from Mailpit first — required because
 * better-auth only emails the NEW address on changeEmail when the current
 * email is already verified.
 */
export async function createDisposableUser(
  deps: { browser: Browser; request: APIRequestContext; mailpit: MailpitClient },
  opts: { verified: boolean; preferredLanguage?: string },
): Promise<DisposableUser> {
  const since = new Date();
  const user = {
    email: uniqueEmail(),
    password: DEFAULT_PASSWORD,
    firstName: "E2E",
    lastName: "User",
  };
  await signUpViaApi(deps.request, { ...user, preferredLanguage: opts.preferredLanguage ?? "de" });

  // de-DE so the app i18n renders German throughout (matches the German UI
  // assertions in the account specs); without it a fresh context defaults to en-US.
  const context = await deps.browser.newContext({ locale: "de-DE" });
  const page = await context.newPage();

  if (opts.verified) {
    const msg = await deps.mailpit.waitForMessage({
      to: user.email,
      subjectContains: "Verify E-Mail address",
      since,
    });
    await page.goto(MailpitClient.getVerifyLink(msg));
  }

  await signInViaUi(page, user.email, user.password);
  return { user, context, page, dispose: () => context.close() };
}
