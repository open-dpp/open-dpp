import { expect, type Locator, type Page } from "@playwright/test";
import { expectImageRenderedInside } from "./media-grid";
import type { ImageSize } from "./upload-files";

/** A corner of the overlay that no image covers, unless it has the proportions of the screen. */
const OUTSIDE_THE_IMAGE = { x: 5, y: 5 };

/**
 * The full-screen view of an image: an overlay over the whole page, opened with the zoom button
 * that lies over an image. It is the same wherever an image offers it.
 */
export class FullScreenImage {
  readonly overlay: Locator;
  readonly image: Locator;

  constructor(page: Page) {
    this.overlay = page.locator(".p-image-mask");
    this.image = this.overlay.locator("img");
  }

  /** Opens the view of the image inside the container. */
  async openFrom(container: Locator): Promise<void> {
    await container.getByRole("button", { name: /^(Bild vergrößern|Zoom Image)$/ }).click();
    await expect(this.overlay).toBeVisible();
  }

  async expectRendered(): Promise<void> {
    await expectImageRenderedInside(this.image, this.overlay);
  }

  /**
   * The image takes the full width or the full height of the overlay, whichever its proportions
   * reach first. The view scales in while it opens, hence the polling.
   */
  async expectScaledToFit(): Promise<void> {
    await expect
      .poll(async () => {
        const outer = await this.overlay.boundingBox();
        const inner = await this.image.boundingBox();
        if (!outer || !inner) return 0;
        return Math.max(inner.width / outer.width, inner.height / outer.height);
      })
      .toBeCloseTo(1);
  }

  /** The image is shown at exactly this size. The view scales in while it opens, hence the polling. */
  async expectSize(size: ImageSize): Promise<void> {
    await expect
      .poll(async () => {
        const box = await this.image.boundingBox();
        return box && { width: Math.round(box.width), height: Math.round(box.height) };
      })
      .toEqual(size);
  }

  /** Clicks next to the image, which closes the view. */
  async closeWithClickOutside(): Promise<void> {
    await this.overlay.click({ position: OUTSIDE_THE_IMAGE });
    await expect(this.overlay).toBeHidden();
  }
}
