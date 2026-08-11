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

/**
 * The public GS1 Digital Link resolver — what a scanner actually hits. It lives on
 * the bare origin outside `/api`, so every request here is anonymous: an
 * authenticated session would bypass the publish gate and hide a regression.
 */

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
  // Resolution is self-contained on the UPI's gs1-link permalink (no
  // primary/default fallback) — without one, every scan is a 404.
  await gotoPermalinkList(page, ids);
  await createGs1LinkPermalink(page);
  await publishPassport(page, ids);

  const anonymous = await context.browser()!.newContext();

  // GS1-Conformant Resolver §2.12: query pairs ride along to the target.
  const redirect = await anonymous.request.get(scanUrl(`/01/${GTIN14}/21/${serial}?linkType=all`), {
    maxRedirects: 0,
  });
  expect(redirect.status(), "a resolvable scan should redirect").toBe(302);
  const location = redirect.headers()["location"];
  expect(location).toContain("/p/");
  expect(location).toContain("linkType=all");

  // Following it has to land on the presentation view, not an error page.
  const viewer = await anonymous.newPage();
  const response = await viewer.goto(scanUrl(`/01/${GTIN14}/21/${serial}?linkType=all`));
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
  // Resolution is self-contained on the UPI's gs1-link permalink (no
  // primary/default fallback) — without one, every scan is a 404.
  await gotoPermalinkList(page, ids);
  await createGs1LinkPermalink(page);

  const anonymous = await context.browser()!.newContext();
  const response = await anonymous.request.get(scanUrl(`/01/${GTIN14}/21/${serial}`), {
    maxRedirects: 0,
  });
  expect(response.status(), "a draft passport must not be reachable by scan").toBe(404);
  await anonymous.close();
});

test("unknown and malformed keys answer 404", async ({ page, context }) => {
  const ids = await createBlankPassport(page);
  await gotoUpiList(page, ids);
  const serial = uniqueSerial();
  await createGs1Upi(page, { gtin: GTIN14, serial });
  await page.getByTestId("gs1-link-prompt-skip").click();
  // Resolution is self-contained on the UPI's gs1-link permalink (no
  // primary/default fallback) — without one, every scan is a 404.
  await gotoPermalinkList(page, ids);
  await createGs1LinkPermalink(page);
  await publishPassport(page, ids);

  const anonymous = await context.browser()!.newContext();

  // Resolution is on the exact full key: a serialized unit never shadows the bare
  // GTIN, and vice versa.
  for (const path of [
    `/01/${GTIN14}/21/${uniqueSerial("nosuch")}`,
    `/01/${GTIN14}/10/${uniqueSerial("nobatch")}/21/${serial}`,
    "/01/123",
  ]) {
    const response = await anonymous.request.get(scanUrl(path), { maxRedirects: 0 });
    expect(response.status(), `${path} should not resolve`).toBe(404);
  }

  await anonymous.close();
});
