import { test } from "@playwright/test";
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
