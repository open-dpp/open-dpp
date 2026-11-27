import { expect, type Locator, type Page } from "@playwright/test";

export type UploadFile = { name: string; mimeType: string; buffer: Buffer };

const MIN_RENDERED_SIZE_PX = 50;

/**
 * Waits until the image has loaded and is painted at a real size inside the container. That it
 * has loaded does not prove it is visible: an SVG that only has a `viewBox` has no size of its
 * own, so it depends on the layout whether it gets any room.
 */
export async function expectImageRenderedInside(image: Locator, container: Locator): Promise<void> {
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete)).toBe(true);

  const outer = await container.boundingBox();
  const inner = await image.boundingBox();
  expect(outer, "the container should be laid out").not.toBeNull();
  expect(inner, "the image should be laid out").not.toBeNull();

  expect(inner!.width).toBeGreaterThan(MIN_RENDERED_SIZE_PX);
  expect(inner!.height).toBeGreaterThan(MIN_RENDERED_SIZE_PX);
  expect(inner!.x).toBeGreaterThanOrEqual(outer!.x);
  expect(inner!.y).toBeGreaterThanOrEqual(outer!.y);
  expect(inner!.x + inner!.width).toBeLessThanOrEqual(outer!.x + outer!.width);
  expect(inner!.y + inner!.height).toBeLessThanOrEqual(outer!.y + outer!.height);
}

/** One file in the grid, addressed by its title, which is the name of the uploaded file. */
export class MediaItem {
  readonly previewImage: Locator;

  constructor(readonly root: Locator) {
    this.previewImage = root.locator("img");
  }

  async expectPreviewRendered(): Promise<void> {
    await expectImageRenderedInside(this.previewImage, this.root);
  }
}

/**
 * The media of the organization with their upload button, as the media library and the media
 * picker dialog both show them.
 */
export class MediaGrid {
  readonly uploadButton: Locator;
  /** The files of the shown page, newest first. */
  readonly items: Locator;
  private readonly nextPageButton: Locator;
  private readonly previousPageButton: Locator;

  constructor(
    private readonly page: Page,
    root: Page | Locator = page,
  ) {
    this.uploadButton = root.getByRole("button", { name: /Datei hochladen|Upload file/ });
    this.items = root.getByTestId("media-list-item");
    this.nextPageButton = root.getByRole("button", { name: /^(Nächste Seite|Next page)$/ });
    this.previousPageButton = root.getByRole("button", {
      name: /^(Vorherige Seite|Previous page)$/,
    });
  }

  /** Picks the file in the file dialog of the upload button; it is uploaded right away. */
  async upload(file: UploadFile): Promise<void> {
    const fileChooser = this.page.waitForEvent("filechooser");
    await this.uploadButton.click();
    await (await fileChooser).setFiles(file);
  }

  /**
   * The file with this title, once it is on screen. The newest files come first and an upload
   * shows the first page, so a file that was just uploaded is there without paging.
   */
  async reveal(title: string): Promise<MediaItem> {
    const item = new MediaItem(this.items.filter({ hasText: title }));
    await expect(item.root).toBeVisible();
    return item;
  }

  /** Shows the six files after the shown ones. */
  async nextPage(): Promise<void> {
    await this.nextPageButton.click();
  }

  /** Shows the six files before the shown ones. */
  async previousPage(): Promise<void> {
    await this.previousPageButton.click();
  }
}
