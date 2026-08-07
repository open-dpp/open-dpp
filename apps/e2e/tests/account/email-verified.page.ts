import { expect, Locator, Page } from "@playwright/test";
import { EnvConfig } from "../config";

/**
 * Page object for the public /email-verified landing page (the callbackURL
 * target for both the admin-triggered and self-service resend-verification
 * flows). The page itself is purely reactive to the `error` query param —
 * better-auth appends `?error=<CODE>` on failure and adds nothing on success —
 * so tests can drive every state via goto() without performing a real
 * verification flow.
 */
export class EmailVerifiedPage {
  readonly page: Page;
  readonly successMessage: Locator;
  readonly expiredMessage: Locator;
  readonly invalidMessage: Locator;
  readonly signInLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.successMessage = page.getByTestId("verify-success");
    this.expiredMessage = page.getByTestId("verify-expired");
    this.invalidMessage = page.getByTestId("verify-invalid");
    this.signInLink = page.getByTestId("verify-signin-link");
  }

  /** Navigates to the page. Omit errorCode for the success state. */
  async goto(errorCode?: string): Promise<void> {
    const url = new URL("/email-verified", EnvConfig.OPEN_DPP_URL);
    if (errorCode) {
      url.searchParams.set("error", errorCode);
    }
    await this.page.goto(url.toString());
  }

  async expectSuccess(): Promise<void> {
    await expect(this.successMessage).toBeVisible();
    await expect(this.expiredMessage).toHaveCount(0);
    await expect(this.invalidMessage).toHaveCount(0);
  }

  async expectExpired(): Promise<void> {
    await expect(this.expiredMessage).toBeVisible();
    await expect(this.successMessage).toHaveCount(0);
    await expect(this.invalidMessage).toHaveCount(0);
  }

  async expectInvalid(): Promise<void> {
    await expect(this.invalidMessage).toBeVisible();
    await expect(this.successMessage).toHaveCount(0);
    await expect(this.expiredMessage).toHaveCount(0);
  }
}
