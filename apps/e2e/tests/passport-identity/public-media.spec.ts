import { expect, test, type Locator, type Page } from "@playwright/test";
import { ApiBase, EnvConfig } from "../config";
import { newAnonymousContext } from "../helpers/anonymous";
import {
  createBlankPassport,
  ORG_ID_HEADER,
  type PassportIds,
  publishPassport,
  readDefaultPermalinkSlug,
} from "../helpers/passport";

// A real 1×1 PNG: the upload sniffs the bytes and re-encodes images to webp.
const PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);
const IMAGE_NAME = "pixel.png";
const FILE_ELEMENT_ID_SHORT = "ProductImage";

async function uploadImage(page: Page, { orgId }: PassportIds): Promise<string> {
  const response = await page.request.post(`${ApiBase}/media/upload`, {
    headers: { [ORG_ID_HEADER]: orgId },
    multipart: { file: { name: IMAGE_NAME, mimeType: "image/png", buffer: PIXEL_PNG } },
  });
  expect(response.status(), "uploading the image should succeed").toBe(201);
  const { mediaId } = (await response.json()) as { mediaId: string };
  return mediaId;
}

async function attachAsDefaultThumbnail(
  page: Page,
  { orgId, passportId }: PassportIds,
  mediaId: string,
): Promise<void> {
  const headers = { [ORG_ID_HEADER]: orgId };
  const shells = await page.request.get(`${ApiBase}/passports/${passportId}/shells`, { headers });
  expect(shells.status(), "listing the passport's shells should succeed").toBe(200);
  const { result } = (await shells.json()) as { result: { id: string }[] };
  const aasId = result[0]?.id;
  expect(aasId, "a blank passport has exactly one shell").toBeTruthy();

  const response = await page.request.patch(`${ApiBase}/passports/${passportId}/shells/${aasId}`, {
    headers,
    data: {
      assetInformation: { defaultThumbnails: [{ path: mediaId, contentType: "image/webp" }] },
    },
  });
  expect(response.status(), "setting the default thumbnail should succeed").toBe(200);
}

async function attachAsFileElement(
  page: Page,
  { orgId, passportId }: PassportIds,
  mediaId: string,
): Promise<void> {
  const headers = { [ORG_ID_HEADER]: orgId };
  const submodel = await page.request.post(`${ApiBase}/passports/${passportId}/submodels`, {
    headers,
    data: { idShort: "Media", displayName: [{ language: "de", text: "Medien" }] },
  });
  expect(submodel.status(), "creating a submodel should succeed").toBe(201);
  const { id: submodelId } = (await submodel.json()) as { id: string };

  const element = await page.request.post(
    `${ApiBase}/passports/${passportId}/submodels/${submodelId}/submodel-elements`,
    {
      headers,
      data: {
        modelType: "File",
        idShort: FILE_ELEMENT_ID_SHORT,
        contentType: "image/webp",
        value: mediaId,
      },
    },
  );
  expect(element.status(), "creating the File element should succeed").toBe(201);
}

function galleriaImage(page: Page): Locator {
  return page.getByTestId("product-image-galleria").locator("img").first();
}

function fileElementImage(page: Page): Locator {
  return page.locator(`[data-cy="${FILE_ELEMENT_ID_SHORT}"] img`).first();
}

/** Both images come from blob URLs built from the permalink-gated download, and actually decode. */
async function expectImagesRendered(page: Page): Promise<void> {
  for (const image of [galleriaImage(page), fileElementImage(page)]) {
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute("src", /^blob:/);
    await expect
      .poll(() => image.evaluate((el) => (el as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
  }
}

test("a passport's images are served through its permalink, never by bare media id", async ({
  page,
  context,
}) => {
  const ids = await createBlankPassport(page);
  const mediaId = await uploadImage(page, ids);
  await attachAsDefaultThumbnail(page, ids, mediaId);
  await attachAsFileElement(page, ids, mediaId);
  const slug = await readDefaultPermalinkSlug(page, ids);

  const publicPageUrl = `${EnvConfig.OPEN_DPP_URL}/p/${slug}`;
  const permalinkMediaUrl = `${ApiBase}/media/permalink/${slug}/by-id/${mediaId}/download`;
  const bareMediaUrl = `${ApiBase}/media/${mediaId}/download`;
  const anonymous = await newAnonymousContext(context.browser()!);

  // Draft: hidden from anonymous visitors, but a member of the organization can preview it.
  const draftMedia = await anonymous.request.get(permalinkMediaUrl);
  expect(draftMedia.status(), "a draft's media stays hidden from anonymous visitors").toBe(404);
  await page.goto(publicPageUrl);
  await expectImagesRendered(page);

  await publishPassport(page, ids);

  const anonymousPage = await anonymous.newPage();
  await anonymousPage.goto(publicPageUrl);
  await expectImagesRendered(anonymousPage);

  const publishedMedia = await anonymous.request.get(permalinkMediaUrl);
  expect(publishedMedia.status(), "published media is public through the permalink").toBe(200);
  const bareMedia = await anonymous.request.get(bareMediaUrl);
  expect(bareMedia.status(), "the bare media route stays closed to anonymous visitors").toBe(403);
  await anonymous.close();
});
