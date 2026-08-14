import { expect, test } from "@playwright/test";
import {
  acceptDeleteConfirm,
  createBlankPassport,
  createGs1Upi,
  GTIN14,
  gotoUpiList,
  uniqueSerial,
} from "../helpers/passport";

function upiRows(page: import("@playwright/test").Page) {
  return page.getByTestId("upi-data-table").locator("tbody tr:not(.p-datatable-empty-message)");
}

test("a new passport is seeded with one internal identifier, reachable from the toolbar", async ({
  page,
}) => {
  await createBlankPassport(page);

  await page.locator("button.p-splitbutton-dropdown").click();
  await page.getByRole("menuitem", { name: /Produktidentifikatoren|Product identifiers/i }).click();
  await page.waitForURL(/\/unique-product-identifiers$/);

  await expect(page.getByTestId("upi-data-table")).toBeVisible();
  await expect(upiRows(page)).toHaveCount(1);
  await expect(upiRows(page).first()).toContainText("OPEN_DPP_UUID");
  await expect(upiRows(page).first().getByTestId("upi-delete-btn")).toBeEnabled();
});

test("creating a GS1 identifier and skipping the prompt adds a linkable row", async ({ page }) => {
  const ids = await createBlankPassport(page);
  await gotoUpiList(page, ids);

  const serial = uniqueSerial();
  await createGs1Upi(page, { gtin: GTIN14, serial });
  await page.getByTestId("gs1-link-prompt-skip").click();

  await expect(upiRows(page)).toHaveCount(2);
  const gs1Row = upiRows(page).filter({ hasText: serial });
  await expect(gs1Row).toHaveCount(1);
  await expect(gs1Row).toContainText(GTIN14);
  await expect(gs1Row.getByTestId("upi-permalink-create")).toBeVisible();
  await expect(gs1Row.getByTestId("upi-qr-btn")).toHaveCount(0);
});

test("the prompt's 'add link' hands the identifier over to the permalink list", async ({
  page,
}) => {
  const ids = await createBlankPassport(page);
  await gotoUpiList(page, ids);

  const serial = uniqueSerial();
  await createGs1Upi(page, { gtin: GTIN14, serial });
  await page.getByTestId("gs1-link-prompt-add").click();

  await page.waitForURL(/\/permalinks(\?|$)/i);
  await expect(async () => {
    await expect(page.getByTestId("permalink-create-upi-select")).toContainText(GTIN14, {
      timeout: 2_000,
    });
  }).toPass({ timeout: 15_000 });

  await page.getByTestId("permalink-create-submit").click();

  const gs1LinkRow = page
    .getByTestId("permalink-data-table")
    .locator("tbody tr")
    .filter({ hasText: /GS1 Digital Link/i });
  await expect(gs1LinkRow).toHaveCount(1);
});

test("an invalid GTIN is rejected and surfaced on the field", async ({ page }) => {
  const ids = await createBlankPassport(page);
  await gotoUpiList(page, ids);

  await page.getByTestId("upi-add-btn").click();
  await page.getByTestId("upi-create-gtin").fill("123");
  await page.getByTestId("upi-create-submit").click();

  await expect(page.getByTestId("upi-create-gtin-error")).toBeVisible();
  await expect(upiRows(page)).toHaveCount(1);
  await expect(upiRows(page).first()).toContainText("OPEN_DPP_UUID");
});

test("a GS1 identifier can be deleted while the passport is a draft", async ({ page }) => {
  const ids = await createBlankPassport(page);
  await gotoUpiList(page, ids);

  const serial = uniqueSerial();
  await createGs1Upi(page, { gtin: GTIN14, serial });
  await page.getByTestId("gs1-link-prompt-skip").click();
  await expect(upiRows(page)).toHaveCount(2);

  await upiRows(page).filter({ hasText: serial }).getByTestId("upi-delete-btn").click();
  await acceptDeleteConfirm(page);

  await expect(upiRows(page)).toHaveCount(1);
  await expect(upiRows(page).first()).toContainText("OPEN_DPP_UUID");
  await expect(upiRows(page).filter({ hasText: serial })).toHaveCount(0);
});
