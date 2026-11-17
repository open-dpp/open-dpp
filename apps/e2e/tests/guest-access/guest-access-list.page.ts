import { Locator, Page } from "@playwright/test";
import { EnvConfig } from "../config";
import { expect } from "../fixtures";
import { pickSelectOption } from "../helpers/passport";

/** The owner's view of the guests of an organization. */
export class GuestAccessListPage {
  constructor(
    public readonly page: Page,
    private readonly orgaId: string,
  ) {}

  async goto() {
    await this.page.goto(`${EnvConfig.OPEN_DPP_URL}/organizations/${this.orgaId}/guests`);
  }

  table(): Locator {
    return this.page.getByTestId("guest-access-table");
  }

  statusOf(accessId: string): Locator {
    return this.page.getByTestId(`guest-status-${accessId}`);
  }

  async invite(email: string, roleName: RegExp) {
    await this.page.getByTestId("guest-invite-btn").click();
    await this.page.getByTestId("guest-invite-email").fill(email);
    await pickSelectOption(this.page, "guest-role-select", roleName);
    await this.page.getByTestId("guest-invite-submit").click();
    await expect(this.page.getByTestId("guest-invite-success")).toBeVisible();
    await this.page.keyboard.press("Escape");
    await expect(this.table()).toContainText(email);
  }

  async revoke(accessId: string) {
    await this.page.getByTestId(`guest-revoke-btn-${accessId}`).click();
    await this.page
      .locator('[role="alertdialog"]:visible')
      .getByRole("button", { name: /Zugriff entziehen|Revoke access/ })
      .click();
  }
}
