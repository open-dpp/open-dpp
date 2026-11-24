import { expect, type Locator, type Page } from "@playwright/test";
import { type PassportIds, passportUrl } from "../helpers/passport";
import { expectImageRenderedInside, MediaGrid } from "./media-grid";

/** The media picker dialog: the organization's media, one of which gets selected. */
export class MediaPickerDialog {
  readonly media: MediaGrid;
  private readonly dialog: Locator;

  constructor(page: Page) {
    this.dialog = page
      .getByRole("dialog")
      .filter({ has: page.getByRole("button", { name: /Datei hochladen|Upload file/ }) });
    this.media = new MediaGrid(page, this.dialog);
  }

  /** Selects the file with this title and confirms, which closes the dialog. */
  async select(title: string): Promise<void> {
    const item = await this.media.reveal(title);
    await item.root.click();
    await this.dialog.getByRole("button", { name: /^(Auswählen|Select)$/ }).click();
  }
}

/**
 * The product images of a passport in its editor: the gallery in the header shows them, the
 * edit drawer changes them.
 */
export class PassportProductImages {
  readonly gallery: Locator;
  readonly galleryImage: Locator;

  constructor(
    private readonly page: Page,
    private readonly ids: PassportIds,
  ) {
    this.gallery = page.getByTestId("product-image-galleria");
    // an empty gallery shows a bundled placeholder, a product image is a downloaded blob
    this.galleryImage = this.gallery.locator('img[src^="blob:"]');
  }

  /** Opens the editor of the passport. */
  async goto(): Promise<void> {
    await this.page.goto(passportUrl(this.ids));
    await expect(this.gallery).toBeVisible();
  }

  /** Opens the edit drawer of the passport and, from it, the picker for a new product image. */
  async openPicker(): Promise<MediaPickerDialog> {
    await this.page
      .getByRole("button", { name: /^(Editieren|Edit)$/ })
      .first()
      .click();
    await this.page.getByTestId("galleria-add-image").click();
    return new MediaPickerDialog(this.page);
  }

  /** The row of the product image with this title in the edit drawer. */
  listedImage(title: string): Locator {
    return this.page.getByRole("row").filter({ hasText: title });
  }

  /** Saves the edit drawer. */
  async save(): Promise<void> {
    await this.page.getByRole("button", { name: /^(Speichern|Save)$/ }).click();
  }

  async expectGalleryImageRendered(): Promise<void> {
    await expectImageRenderedInside(this.galleryImage, this.gallery);
  }
}
