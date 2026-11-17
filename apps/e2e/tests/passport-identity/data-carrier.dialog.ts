import { expect, type Locator, type Page } from "@playwright/test";

/** The QR code dialog of a permalink: the server-rendered Data Carrier and its URL. */
export class DataCarrierDialog {
  readonly image: Locator;
  readonly url: Locator;
  readonly copyButton: Locator;

  constructor(page: Page) {
    this.image = page.getByTestId("data-carrier-image");
    this.url = page.getByTestId("data-carrier-url");
    this.copyButton = page.getByTestId("data-carrier-copy-btn");
  }

  /** Waits until the server-rendered SVG has loaded, not just its placeholder. */
  async expectImageLoaded(): Promise<void> {
    await expect(this.image).toBeVisible();
    await expect
      .poll(() => this.image.evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBeGreaterThan(0);
  }
}
