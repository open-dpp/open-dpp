import { expect, test } from "@playwright/test";
import { createBlankPassportViaApi } from "../helpers/passport";
import { PassportProductImages } from "./passport-product-images";
import { type ImageSize, uniquePngFile } from "./upload-files";

/** Two sizes, so the size of the image in the gallery tells which product image it is. */
const LANDSCAPE: ImageSize = { width: 120, height: 80 };
const PORTRAIT: ImageSize = { width: 80, height: 120 };

test("the gallery shows the product image that is left when the one it showed is removed", async ({
  page,
}) => {
  // Through the API: the gallery is under test here, not the dialog that creates a passport.
  const productImages = new PassportProductImages(page, await createBlankPassportViaApi(page));
  await productImages.goto();
  const first = await uniquePngFile(page, LANDSCAPE);
  const second = await uniquePngFile(page, PORTRAIT);
  await productImages.openEditor();
  await productImages.add(first);
  await productImages.add(second);
  await productImages.save();
  await productImages.showInGallery(2);
  await productImages.expectGalleryShows(PORTRAIT);

  await productImages.openEditor();
  await productImages.remove(second.name);
  await productImages.save();

  await productImages.expectGalleryShows(LANDSCAPE);
  await expect(productImages.galleryPositions).toHaveCount(1);
});
