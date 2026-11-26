import { expect, type Locator, type Page } from "@playwright/test";
import { type PassportIds, passportUrl } from "../helpers/passport";
import { expectImageRenderedInside, MediaGrid, type UploadFile } from "./media-grid";
import type { ImageSize } from "./upload-files";

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
  /** One per product image in the gallery; a click on one brings its image on screen. */
  readonly galleryPositions: Locator;
  private readonly addButton: Locator;

  constructor(
    private readonly page: Page,
    private readonly ids: PassportIds,
  ) {
    this.gallery = page.getByTestId("product-image-galleria");
    // an empty gallery shows a bundled placeholder, a product image is a downloaded blob
    this.galleryImage = this.gallery.locator('img[src^="blob:"]');
    this.galleryPositions = this.gallery.getByRole("listitem");
    this.addButton = page.getByTestId("galleria-add-image");
  }

  /** Opens the editor of the passport. */
  async goto(): Promise<void> {
    await this.page.goto(passportUrl(this.ids));
    await expect(this.gallery).toBeVisible();
  }

  /** Opens the edit drawer of the passport, which lists the product images. */
  async openEditor(): Promise<void> {
    await this.page
      .getByRole("button", { name: /^(Editieren|Edit)$/ })
      .first()
      .click();
    await expect(this.addButton).toBeVisible();
  }

  /** Opens the edit drawer of the passport and, from it, the picker for a new product image. */
  async openPicker(): Promise<MediaPickerDialog> {
    await this.openEditor();
    await this.addButton.click();
    return new MediaPickerDialog(this.page);
  }

  /** Uploads the file in the media picker and adds it to the product images. The edit drawer is open. */
  async add(file: UploadFile): Promise<void> {
    await this.addButton.click();
    const picker = new MediaPickerDialog(this.page);
    await picker.media.upload(file);
    await picker.select(file.name);
    await expect(this.listedImage(file.name)).toBeVisible();
  }

  /** Removes the product image with this title from the list. The edit drawer is open. */
  async remove(title: string): Promise<void> {
    const listed = this.listedImage(title);
    await listed.getByRole("button", { name: /^(Entfernen|Remove)$/ }).click();
    await expect(listed).toBeHidden();
  }

  /** The row of the product image with this title in the edit drawer. */
  listedImage(title: string): Locator {
    return this.page.getByRole("row").filter({ hasText: title });
  }

  /** Saves the edit drawer. It closes once the gallery has loaded the saved product images. */
  async save(): Promise<void> {
    const saveButton = this.page.getByRole("button", { name: /^(Speichern|Save)$/ });
    await saveButton.click();
    await expect(saveButton).toBeHidden();
  }

  /** Brings the product image at this position, counted from 1, on screen in the gallery. */
  async showInGallery(position: number): Promise<void> {
    await this.galleryPositions
      .nth(position - 1)
      .getByRole("button")
      .click();
  }

  /** The image on screen in the gallery is the product image whose file has this size. */
  async expectGalleryShows(size: ImageSize): Promise<void> {
    await expect
      .poll(() =>
        this.galleryImage.evaluateAll((images: HTMLImageElement[]) =>
          images.map((image) => ({ width: image.naturalWidth, height: image.naturalHeight })),
        ),
      )
      .toEqual([size]);
  }

  async expectGalleryImageRendered(): Promise<void> {
    await expectImageRenderedInside(this.galleryImage, this.gallery);
  }
}
