import { Buffer } from "node:buffer";
import { test } from "@playwright/test";
import { v4 as uuid4 } from "uuid";
import { createBlankPassport } from "../helpers/passport";
import type { UploadFile } from "./media-grid";
import { MediaLibraryPage } from "./media-library.page";
import { PassportProductImages } from "./passport-product-images";

/** Has a `viewBox` but no `width`/`height`, the form design tools export by default. */
const VIEWBOX_ONLY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
  <rect width="200" height="100" fill="#6bad87"/>
  <circle cx="100" cy="50" r="30" fill="#ffffff"/>
</svg>`;

function uniqueSvgFile(): UploadFile {
  return {
    name: `e2e-${uuid4().slice(0, 8)}.svg`,
    mimeType: "image/svg+xml",
    buffer: Buffer.from(VIEWBOX_ONLY_SVG),
  };
}

test("an SVG can be uploaded in the media library and shows its preview", async ({ page }) => {
  const library = new MediaLibraryPage(page);
  const file = uniqueSvgFile();
  await library.goto();

  await library.media.upload(file);

  const uploaded = await library.media.reveal(file.name);
  await uploaded.expectPreviewRendered();
});

test("an SVG uploaded in the media picker is shown as a product image", async ({ page }) => {
  const productImages = new PassportProductImages(page);
  const file = uniqueSvgFile();
  await createBlankPassport(page);

  const picker = await productImages.openPicker();
  await picker.media.upload(file);
  await picker.select(file.name);
  await productImages.save();

  await productImages.expectGalleryImageRendered();
});
