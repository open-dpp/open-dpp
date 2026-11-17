import { expect, type Page } from "@playwright/test";
import { EnvConfig } from "../config";
import { MediaGrid } from "./media-grid";

/** The media library of the selected organization. */
export class MediaLibraryPage {
  readonly media: MediaGrid;

  constructor(public readonly page: Page) {
    this.media = new MediaGrid(page);
  }

  async goto(): Promise<void> {
    await this.page.goto(`${EnvConfig.OPEN_DPP_URL}/media`);
    await expect(this.media.uploadButton).toBeVisible();
  }
}
