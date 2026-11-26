import { expect, type Locator, type Page } from "@playwright/test";
import { EnvConfig } from "../config";
import { MediaGrid, type MediaItem } from "./media-grid";

/** The media library of the selected organization. */
export class MediaLibraryPage {
  readonly media: MediaGrid;
  /** The drawer with the details of the selected file. */
  readonly details: Locator;

  constructor(public readonly page: Page) {
    this.media = new MediaGrid(page);
    this.details = page.locator("#media-sidebar");
  }

  async goto(): Promise<void> {
    await this.page.goto(`${EnvConfig.OPEN_DPP_URL}/media`);
    await expect(this.media.uploadButton).toBeVisible();
  }

  /** Selects the file, which opens its details. */
  async openDetails(item: MediaItem): Promise<void> {
    await item.root.click();
    await expect(this.details).toBeVisible();
  }
}
