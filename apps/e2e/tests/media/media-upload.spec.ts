import { expect, test } from "@playwright/test";
import { createBlankPassportViaApi } from "../helpers/passport";
import { MediaLibraryPage } from "./media-library.page";
import { PassportProductImages } from "./passport-product-images";
import { uniqueSvgFile } from "./upload-files";

test("an SVG can be uploaded in the media library and shows its preview", async ({ page }) => {
  const library = new MediaLibraryPage(page);
  const file = uniqueSvgFile();
  await library.goto();

  await library.media.upload(file);

  const uploaded = await library.media.reveal(file.name);
  await uploaded.expectPreviewRendered();
});

test("the media library shows the newest files first, six at a time", async ({ page }) => {
  const library = new MediaLibraryPage(page);
  // One more than a page holds: the first upload ends up on the second page
  const files = Array.from({ length: 7 }, () => uniqueSvgFile());
  await library.goto();
  for (const file of files) {
    await library.media.upload(file);
    await library.media.reveal(file.name);
  }
  const [oldest, ...newer] = files.map((file) => file.name);
  const newestSix = newer.toReversed();

  await expect(library.media.items).toContainText(newestSix);

  await library.media.nextPage();
  await expect(library.media.items.first()).toContainText(oldest);

  await library.media.previousPage();
  await expect(library.media.items).toContainText(newestSix);
});

test("a deleted file makes room on the shown page for the one after it", async ({ page }) => {
  const library = new MediaLibraryPage(page);
  // One more than a page holds: the first upload waits behind the first page
  const files = Array.from({ length: 7 }, () => uniqueSvgFile());
  await library.goto();
  for (const file of files) {
    await library.media.upload(file);
    await library.media.reveal(file.name);
  }
  const [oldest, ...newer] = files.map((file) => file.name);
  const [newest, ...others] = newer.toReversed();

  await library.delete(await library.media.reveal(newest));

  await expect(library.media.items).toContainText([...others, oldest]);
});

test("an SVG uploaded in the media picker is shown as a product image", async ({ page }) => {
  const file = uniqueSvgFile();
  // Through the API: the gallery is under test here, not the dialog that creates a passport.
  const productImages = new PassportProductImages(page, await createBlankPassportViaApi(page));
  await productImages.goto();

  const picker = await productImages.openPicker();
  await picker.media.upload(file);
  await picker.select(file.name);
  await productImages.save();

  await productImages.expectGalleryImageRendered();
});
