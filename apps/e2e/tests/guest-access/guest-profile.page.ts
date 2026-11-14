import { Locator, Page } from "@playwright/test";
import { expect } from "../fixtures";

/** The profile of a user without an organization, opened from a product page. */
export class GuestProfilePage {
  constructor(public readonly page: Page) {}

  async waitForPage() {
    await this.page.waitForURL(/\/guest-profile(\?|$)/);
  }

  profile(): Locator {
    return this.page.getByTestId("guest-profile");
  }

  async expectShown() {
    await expect(this.profile()).toBeVisible();
    await expect(this.profile().getByRole("textbox").first()).toBeVisible();
  }

  async goBack() {
    await this.page.getByTestId("guest-profile-back").click();
  }
}
