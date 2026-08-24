import { expect, test, type Page } from "@playwright/test";
import { v4 as uuid4 } from "uuid";
import {
  acceptDeleteConfirm,
  createBlankPassport,
  createGs1LinkPermalink,
  createGs1Upi,
  GTIN14,
  gotoPermalinkList,
  gotoUpiList,
  uniqueSerial,
} from "../helpers/passport";

function permalinkRows(page: Page) {
  return page
    .getByTestId("permalink-data-table")
    .locator("tbody tr:not(.p-datatable-empty-message)");
}

async function rowPermalinkId(row: ReturnType<typeof permalinkRows>): Promise<string> {
  const testId = await row.locator("[data-testid^='permalink-kind-']").getAttribute("data-testid");
  expect(testId, "permalink row should expose its id through the kind cell").not.toBeNull();
  return testId!.replace("permalink-kind-", "");
}

test("a new passport has exactly one open-dpp permalink with a QR code", async ({ page }) => {
  const ids = await createBlankPassport(page);
  await gotoPermalinkList(page, ids);

  await expect(permalinkRows(page)).toHaveCount(1);
  const row = permalinkRows(page).first();
  const permalinkId = await rowPermalinkId(row);

  const publicUrl = await page.getByTestId(`permalink-public-url-${permalinkId}`).innerText();
  expect(publicUrl).toContain("/p/");

  await page.getByTestId(`permalink-show-qr-btn-${permalinkId}`).click();
  await expect(page.getByTestId("permalink-qr-url")).toHaveText(publicUrl);
  await expect(page.getByTestId("permalink-qr-copy-btn")).toBeVisible();
});

test("a bare permalink can be created without selecting an identifier", async ({ page }) => {
  const ids = await createBlankPassport(page);
  await gotoPermalinkList(page, ids);
  await expect(permalinkRows(page)).toHaveCount(1);

  await expect(page.getByTestId("permalink-create-btn")).toBeEnabled();
  await page.getByTestId("permalink-create-btn").click();
  await page.getByTestId("permalink-create-submit").click();
  await expect(page.getByTestId("permalink-create-submit")).toHaveCount(0);

  await expect(permalinkRows(page)).toHaveCount(2);
  await expect(
    page
      .getByTestId("permalink-data-table")
      .getByText(/open-dpp/)
      .first(),
  ).toBeVisible();
});

test("a GS1 identifier can be linked once; its row swaps the CTA for the QR code", async ({
  page,
}) => {
  const ids = await createBlankPassport(page);

  const serial = uniqueSerial();
  await gotoUpiList(page, ids);
  await createGs1Upi(page, { gtin: GTIN14, serial });
  await page.getByTestId("gs1-link-prompt-skip").click();

  await gotoPermalinkList(page, ids);
  await createGs1LinkPermalink(page);

  await expect(permalinkRows(page)).toHaveCount(2);

  await gotoUpiList(page, ids);
  const gs1Row = page.getByTestId("upi-data-table").locator("tbody tr").filter({ hasText: serial });
  await expect(gs1Row.getByTestId("upi-qr-btn")).toBeVisible();
  await expect(gs1Row.getByTestId("upi-permalink-create")).toHaveCount(0);
});

test("a presentation permalink accepts a custom short name", async ({ page }) => {
  const ids = await createBlankPassport(page);
  await gotoPermalinkList(page, ids);

  const permalinkId = await rowPermalinkId(permalinkRows(page).first());
  const slug = `e2e-${uuid4().slice(0, 8)}`;

  await page.getByTestId(`permalink-edit-btn-${permalinkId}`).click();
  await expect(page.getByTestId("permalink-edit-slug")).toBeVisible();
  await expect(page.getByTestId("permalink-edit-locked-banner")).toHaveCount(0);
  await page.getByTestId("permalink-edit-slug").fill(slug);
  await page.getByTestId("permalink-edit-save").click();

  await expect(page.getByTestId(`permalink-public-url-${permalinkId}`)).toContainText(slug);
});

test("a short name already taken by another passport is reported on the field", async ({
  page,
}) => {
  const slug = `e2e-${uuid4().slice(0, 8)}`;

  const first = await createBlankPassport(page);
  await gotoPermalinkList(page, first);
  const firstId = await rowPermalinkId(permalinkRows(page).first());
  await page.getByTestId(`permalink-edit-btn-${firstId}`).click();
  await page.getByTestId("permalink-edit-slug").fill(slug);
  await page.getByTestId("permalink-edit-save").click();
  await expect(page.getByTestId(`permalink-public-url-${firstId}`)).toContainText(slug);

  const second = await createBlankPassport(page);
  await gotoPermalinkList(page, second);
  const secondId = await rowPermalinkId(permalinkRows(page).first());
  await page.getByTestId(`permalink-edit-btn-${secondId}`).click();
  await page.getByTestId("permalink-edit-slug").fill(slug);
  await page.getByTestId("permalink-edit-save").click();

  await expect(page.getByTestId("permalink-edit-slug-error")).toBeVisible();
});

test("every unpublished permalink can be deleted — even the passport's last one", async ({
  page,
}) => {
  const ids = await createBlankPassport(page);
  await gotoUpiList(page, ids);
  await createGs1Upi(page, { gtin: GTIN14, serial: uniqueSerial() });
  await page.getByTestId("gs1-link-prompt-skip").click();

  await gotoPermalinkList(page, ids);
  const presentationId = await rowPermalinkId(permalinkRows(page).first());

  await createGs1LinkPermalink(page);
  await expect(permalinkRows(page)).toHaveCount(2);

  const gs1LinkRow = permalinkRows(page).filter({ hasText: /GS1 Digital Link/i });
  const gs1LinkId = await rowPermalinkId(gs1LinkRow);
  await page.getByTestId(`permalink-delete-btn-${gs1LinkId}`).click();
  await acceptDeleteConfirm(page);
  await expect(permalinkRows(page)).toHaveCount(1);

  await expect(page.getByTestId(`permalink-delete-btn-${presentationId}`)).toBeEnabled();
  await page.getByTestId(`permalink-delete-btn-${presentationId}`).click();
  await acceptDeleteConfirm(page);
  await expect(permalinkRows(page)).toHaveCount(0);
});

test("creating a GS1 Digital Link does not publish the passport", async ({ page }) => {
  const ids = await createBlankPassport(page);
  await gotoUpiList(page, ids);
  await createGs1Upi(page, { gtin: GTIN14, serial: uniqueSerial() });
  await page.getByTestId("gs1-link-prompt-skip").click();

  await gotoPermalinkList(page, ids);
  await createGs1LinkPermalink(page);

  await expect(page.getByTestId("permalink-frozen-info")).toHaveCount(0);
  await page.reload();
  await expect(permalinkRows(page)).toHaveCount(2);
  await expect(page.getByTestId("permalink-frozen-info")).toHaveCount(0);

  await page.goto(`${page.url().replace(/\/permalinks.*$/, "")}`);
  await expect(page.getByText(/Entwurf|Draft/).first()).toBeVisible();
});
