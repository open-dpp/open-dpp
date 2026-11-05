import { Locator, Page } from "@playwright/test";
import { expect } from "../fixtures";

export type GuestInvitationState = "unverified" | "pending" | "accepted";

/** The page an invited person lands on through the link of the invitation mail. */
export class GuestInvitationPage {
  constructor(public readonly page: Page) {}

  async waitForPage() {
    await this.page.waitForURL(/\/accept-guest-access\//);
  }

  invitation(): Locator {
    return this.page.getByTestId("guest-invitation");
  }

  async expectState(state: GuestInvitationState) {
    await expect(this.invitation()).toHaveAttribute("data-state", state);
  }

  async accept() {
    await this.page.getByTestId("guest-accept-btn").click();
  }
}
