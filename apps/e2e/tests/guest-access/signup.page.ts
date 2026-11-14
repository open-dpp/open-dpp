import { Locator, Page } from "@playwright/test";
import { expect } from "../fixtures";

/** The sign up form, which the link of an invitation opens for an address without an account. */
export class SignupPage {
  constructor(public readonly page: Page) {}

  async goto(link: string) {
    await this.page.goto(link);
  }

  emailInput(): Locator {
    return this.page.locator('input[name="email"]');
  }

  /** The invited address is prefilled and cannot be changed. */
  async expectEmailLocked(email: string) {
    await expect(this.emailInput()).toHaveValue(email);
    await expect(this.emailInput()).toHaveAttribute("readonly", "");
  }

  async signUp(firstName: string, lastName: string, password: string) {
    await this.page.locator('input[name="given-name"]').fill(firstName);
    await this.page.locator('input[name="lastName"]').fill(lastName);
    await this.page.locator('input[type="password"]').first().fill(password);
    await this.page.locator('form button[type="submit"]').click();
  }
}
