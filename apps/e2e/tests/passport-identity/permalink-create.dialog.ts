import { expect, type Locator, type Page } from "@playwright/test";
import { pickSelectOption } from "../helpers/passport";

export class PermalinkCreateDialog {
  readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    this.submitButton = page.getByTestId("permalink-create-submit");
  }

  /** Picks the product identifier whose label contains this GTIN. */
  async selectIdentifier(gtin: string): Promise<void> {
    await pickSelectOption(this.page, "permalink-create-upi-select", new RegExp(gtin));
  }

  /** Creates the permalink and waits for the dialog to close. */
  async submit(): Promise<void> {
    await this.submitButton.click();
    await expect(this.submitButton).toHaveCount(0);
  }
}
