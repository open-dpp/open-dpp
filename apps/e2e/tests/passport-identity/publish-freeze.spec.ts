import { expect, test, type Page } from "@playwright/test";
import { ApiBase } from "../config";
import { newAnonymousContext } from "../helpers/anonymous";
import {
  createBlankPassport,
  createGs1Upi,
  GTIN14,
  gotoPermalinkList,
  gotoUpiList,
  publishPassport,
  uniqueSerial,
} from "../helpers/passport";

function permalinkRows(page: Page) {
  return page
    .getByTestId("permalink-data-table")
    .locator("tbody tr:not(.p-datatable-empty-message)");
}

function upiRows(page: Page) {
  return page.getByTestId("upi-data-table").locator("tbody tr:not(.p-datatable-empty-message)");
}

async function rowPermalinkId(row: ReturnType<typeof permalinkRows>): Promise<string> {
  const testId = await row.locator("[data-testid^='permalink-kind-']").getAttribute("data-testid");
  expect(testId, "permalink row should expose its id through the kind cell").not.toBeNull();
  return testId!.replace("permalink-kind-", "");
}

test("publishing freezes the permalink and opens it to anonymous visitors", async ({
  page,
  context,
}) => {
  const ids = await createBlankPassport(page);
  await gotoPermalinkList(page, ids);

  const permalinkId = await rowPermalinkId(permalinkRows(page).first());
  const publicUrl = await page.getByTestId(`permalink-public-url-${permalinkId}`).innerText();
  await expect(page.getByTestId("permalink-frozen-info")).toHaveCount(0);

  const slug = publicUrl.split("/p/")[1];
  const anonymous = await newAnonymousContext(context.browser()!);
  const beforePublish = await anonymous.request.get(`${ApiBase}/p/${slug}`);
  expect(beforePublish.status(), "a draft passport stays hidden from anonymous visitors").toBe(404);

  await publishPassport(page, ids);
  await page.reload();

  await expect(page.getByTestId("permalink-frozen-info")).toBeVisible();
  await expect(page.getByTestId(`permalink-public-url-${permalinkId}`)).toHaveText(publicUrl);
  await page.getByTestId(`permalink-edit-btn-${permalinkId}`).click();
  await expect(page.getByTestId("permalink-edit-locked-banner")).toBeVisible();
  await expect(page.getByTestId("permalink-edit-save")).toBeDisabled();
  await expect(page.getByTestId("permalink-edit-slug")).toBeDisabled();

  const afterPublish = await anonymous.request.get(`${ApiBase}/p/${slug}`);
  expect(afterPublish.status(), `anonymous visitors should reach ${publicUrl}`).toBe(200);
  await anonymous.close();
});

test("a published passport still accepts new identifiers but no longer allows deleting them", async ({
  page,
}) => {
  const ids = await createBlankPassport(page);
  await publishPassport(page, ids);
  await gotoUpiList(page, ids);

  await expect(upiRows(page)).toHaveCount(1);
  const deleteButtons = upiRows(page).getByTestId("upi-delete-btn");
  await expect(deleteButtons).toHaveCount(1);
  await expect(deleteButtons.first()).toBeDisabled();
  await expect(deleteButtons.first()).toHaveAttribute(
    "title",
    /Produktidentifikatoren sind gesperrt|locked once the passport is published/i,
  );
  await expect(page.locator("body")).not.toContainText("uniqueProductIdentifiers.list.");

  const before = await upiRows(page).count();
  await page.getByTestId("upi-add-btn").click();
  await expect(page.getByTestId("upi-passport-published-note")).toBeVisible();
  await page.getByTestId("upi-create-gtin").fill(GTIN14);
  await page.getByTestId("upi-create-serial").fill(uniqueSerial());
  await page.getByTestId("upi-create-submit").click();
  await page.getByTestId("gs1-link-prompt-skip").click();

  await expect(upiRows(page)).toHaveCount(before + 1);
});

test("a permalink published with the passport cannot be deleted", async ({ page }) => {
  const ids = await createBlankPassport(page);
  await gotoUpiList(page, ids);
  await createGs1Upi(page, { gtin: GTIN14, serial: uniqueSerial() });
  await page.getByTestId("gs1-link-prompt-skip").click();

  await gotoPermalinkList(page, ids);
  await page.getByTestId("permalink-create-btn").click();
  await page.getByTestId("permalink-create-upi-select").getByRole("combobox").click();
  await page
    .getByRole("option", { name: new RegExp(GTIN14) })
    .first()
    .click();
  await page.getByTestId("permalink-create-submit").click();
  await expect(permalinkRows(page)).toHaveCount(2);

  await publishPassport(page, ids);
  await page.reload();

  const gs1LinkRow = permalinkRows(page).filter({ hasText: /GS1 Digital Link/i });
  const gs1LinkId = await rowPermalinkId(gs1LinkRow);
  await expect(page.getByTestId(`permalink-delete-btn-${gs1LinkId}`)).toBeDisabled();
});
