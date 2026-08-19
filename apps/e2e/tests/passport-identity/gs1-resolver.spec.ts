import { expect, test } from "@playwright/test";
import { EnvConfig } from "../config";
import {
  createBlankPassport,
  createGs1LinkPermalink,
  createGs1Upi,
  GTIN14,
  gotoPermalinkList,
  gotoUpiList,
  publishPassport,
  uniqueSerial,
} from "../helpers/passport";

function scanUrl(path: string): string {
  return `${EnvConfig.OPEN_DPP_URL}${path}`;
}

test("a scanned key on a published passport redirects to its presentation view", async ({
  page,
  context,
}) => {
  const ids = await createBlankPassport(page);
  await gotoUpiList(page, ids);
  const serial = uniqueSerial();
  await createGs1Upi(page, { gtin: GTIN14, serial });
  await page.getByTestId("gs1-link-prompt-skip").click();
  await gotoPermalinkList(page, ids);
  await createGs1LinkPermalink(page);
  await publishPassport(page, ids);

  const anonymous = await context.browser()!.newContext();

  const redirect = await anonymous.request.get(
    scanUrl(`/gs1/v1/01/${GTIN14}/21/${serial}?linkType=all`),
    {
      maxRedirects: 0,
    },
  );
  expect(redirect.status(), "a resolvable scan should redirect").toBe(302);
  const location = redirect.headers()["location"];
  expect(location).toContain("/p/");
  expect(location).toContain("linkType=all");

  const viewer = await anonymous.newPage();
  const response = await viewer.goto(scanUrl(`/gs1/v1/01/${GTIN14}/21/${serial}?linkType=all`));
  expect(response?.status(), "the redirect target should render").toBe(200);
  expect(viewer.url()).toMatch(/\/p\//);
  expect(viewer.url()).toContain("linkType=all");

  await anonymous.close();
});

test("a scanned key on an unpublished passport stays hidden", async ({ page, context }) => {
  const ids = await createBlankPassport(page);
  await gotoUpiList(page, ids);
  const serial = uniqueSerial();
  await createGs1Upi(page, { gtin: GTIN14, serial });
  await page.getByTestId("gs1-link-prompt-skip").click();
  await gotoPermalinkList(page, ids);
  await createGs1LinkPermalink(page);

  const anonymous = await context.browser()!.newContext();
  const response = await anonymous.request.get(scanUrl(`/gs1/v1/01/${GTIN14}/21/${serial}`), {
    maxRedirects: 0,
  });
  expect(response.status(), "a draft passport must not be reachable by scan").toBe(404);
  await anonymous.close();

  const memberScan = await page.request.get(scanUrl(`/gs1/v1/01/${GTIN14}/21/${serial}`), {
    maxRedirects: 0,
  });
  expect(memberScan.status(), "a member of the owning org should be redirected").toBe(302);
  expect(memberScan.headers()["location"]).toContain("/p/");

  const viewer = await context.newPage();
  const viewerResponse = await viewer.goto(scanUrl(`/gs1/v1/01/${GTIN14}/21/${serial}`));
  expect(viewerResponse?.status(), "the draft presentation view should render for a member").toBe(
    200,
  );
  expect(viewer.url()).toMatch(/\/p\//);
  await viewer.close();
});

test("unknown and malformed keys answer 404", async ({ page, context }) => {
  const ids = await createBlankPassport(page);
  await gotoUpiList(page, ids);
  const serial = uniqueSerial();
  await createGs1Upi(page, { gtin: GTIN14, serial });
  await page.getByTestId("gs1-link-prompt-skip").click();
  await gotoPermalinkList(page, ids);
  await createGs1LinkPermalink(page);
  await publishPassport(page, ids);

  const anonymous = await context.browser()!.newContext();

  for (const path of [
    `/gs1/v1/01/${GTIN14}/21/${uniqueSerial("nosuch")}`,
    `/gs1/v1/01/${GTIN14}/10/${uniqueSerial("nobatch")}/21/${serial}`,
    "/gs1/v1/01/123",
  ]) {
    const response = await anonymous.request.get(scanUrl(path), { maxRedirects: 0 });
    expect(response.status(), `${path} should not resolve`).toBe(404);
  }

  await anonymous.close();
});
