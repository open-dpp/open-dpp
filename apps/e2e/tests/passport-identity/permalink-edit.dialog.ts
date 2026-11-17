import { expect, type Locator, type Page } from "@playwright/test";

export class PermalinkEditDialog {
  readonly shortNameInput: Locator;
  readonly shortNameError: Locator;
  readonly lockedBanner: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.shortNameInput = page.getByTestId("permalink-edit-slug");
    this.shortNameError = page.getByTestId("permalink-edit-slug-error");
    this.lockedBanner = page.getByTestId("permalink-edit-locked-banner");
    this.saveButton = page.getByTestId("permalink-edit-save");
  }

  async isLoaded(): Promise<void> {
    await expect(this.shortNameInput).toBeVisible();
  }

  async saveShortName(shortName: string): Promise<void> {
    await this.shortNameInput.fill(shortName);
    await this.saveButton.click();
  }
}
