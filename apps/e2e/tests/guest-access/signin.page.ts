import { Locator, Page } from "@playwright/test";
import { expect } from "../fixtures";

/** The sign in form, which the link of an invitation opens for an address with an account. */
export class SigninPage {
  constructor(public readonly page: Page) {}

  async goto(link: string) {
    await this.page.goto(link);
  }

  async waitForPage() {
    await this.page.waitForURL(/\/signin/);
  }

  emailInput(): Locator {
    return this.page.locator('input[name="email"]');
  }

  /** The invited address is prefilled and cannot be changed. */
  async expectEmailLocked(email: string) {
    await expect(this.emailInput()).toHaveValue(email);
    await expect(this.emailInput()).toHaveAttribute("readonly", "");
  }

  async signIn(email: string, password: string) {
    await this.emailInput().fill(email);
    await this.page.locator('input[type="password"]').first().fill(password);
    await this.page.getByRole("button", { name: /sign in|anmelden/i }).click();
  }
}
