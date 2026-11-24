import { test } from "@playwright/test";
import { createBlankPassportViaApi } from "../helpers/passport";
import { FullScreenImage } from "./full-screen-image";
import { MediaLibraryPage } from "./media-library.page";
import { PassportProductImages } from "./passport-product-images";
import { type ImageSize, uniquePngFile, uniqueSvgFile } from "./upload-files";

/** Smaller than the screen in both directions, so the full-screen view has room to enlarge it. */
const SMALL_PHOTO: ImageSize = { width: 120, height: 80 };

test("an SVG without a size of its own fills the full-screen view of the media details", async ({
  page,
}) => {
  const library = new MediaLibraryPage(page);
  const fullScreen = new FullScreenImage(page);
  const file = uniqueSvgFile();
  await library.goto();
  await library.media.upload(file);
  await library.openDetails(await library.media.reveal(file.name));

  await fullScreen.openFrom(library.details);

  await fullScreen.expectRendered();
  await fullScreen.expectScaledToFit();
  await fullScreen.closeWithClickOutside();
});

test("an SVG without a size of its own fills the full-screen view of a product image", async ({
  page,
}) => {
  const file = uniqueSvgFile();
  const fullScreen = new FullScreenImage(page);
  // Through the API: the product images are under test here, not the dialog that creates a passport.
  const productImages = new PassportProductImages(page, await createBlankPassportViaApi(page));
  await productImages.goto();
  const picker = await productImages.openPicker();
  await picker.media.upload(file);
  await picker.select(file.name);

  await fullScreen.openFrom(productImages.listedImage(file.name));

  await fullScreen.expectRendered();
  await fullScreen.expectScaledToFit();
});

test("a photo smaller than the screen keeps its size in the full-screen view", async ({ page }) => {
  const library = new MediaLibraryPage(page);
  const fullScreen = new FullScreenImage(page);
  await library.goto();
  const file = await uniquePngFile(page, SMALL_PHOTO);
  await library.media.upload(file);
  await library.openDetails(await library.media.reveal(file.name));

  await fullScreen.openFrom(library.details);

  await fullScreen.expectSize(SMALL_PHOTO);
});
