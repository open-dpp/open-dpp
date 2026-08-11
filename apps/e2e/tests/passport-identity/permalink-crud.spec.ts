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

/**
 * Permalinks of a draft passport: the seeded presentation permalink, creating
 * permalinks through the unified dialog (GS1 Digital Link and bare open-dpp),
 * editing the short name, and the freeze-only delete guard. Publication-related
 * behaviour lives in publish-freeze.spec.ts.
 */

// PrimeVue renders a placeholder row while the table has no data, so it has to be
// excluded — otherwise every `toHaveCount(1)` is satisfied by the empty table.
function permalinkRows(page: Page) {
  return page
    .getByTestId("permalink-data-table")
    .locator("tbody tr:not(.p-datatable-empty-message)");
}

/** The id suffix of the per-row test ids, read off the row's kind cell. */
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
  // Clicking it would need clipboard permissions, which are Chromium-only.
  await expect(page.getByTestId("permalink-qr-copy-btn")).toBeVisible();
});

test("a bare permalink can be created without selecting an identifier", async ({ page }) => {
  const ids = await createBlankPassport(page);
  await gotoPermalinkList(page, ids);
  await expect(permalinkRows(page)).toHaveCount(1);

  // The create button is never disabled — a bare passport-bound permalink is
  // always possible.
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

  // The identifier row swaps its "create a link" call to action for the QR code
  // of the link it now owns.
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
  // Wait for the dialog itself before asserting the banner is absent, otherwise the
  // absence is only true because nothing has rendered yet.
  await expect(page.getByTestId("permalink-edit-slug")).toBeVisible();
  // Draft passport: nothing is frozen yet.
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
  // Captured while it is still the only row: the presentation kind label ("open-dpp")
  // also occurs in every row's public URL on hosts that carry the project name.
  const presentationId = await rowPermalinkId(permalinkRows(page).first());

  await createGs1LinkPermalink(page);
  await expect(permalinkRows(page)).toHaveCount(2);

  const gs1LinkRow = permalinkRows(page).filter({ hasText: /GS1 Digital Link/i });
  const gs1LinkId = await rowPermalinkId(gs1LinkRow);
  await page.getByTestId(`permalink-delete-btn-${gs1LinkId}`).click();
  await acceptDeleteConfirm(page);
  await expect(permalinkRows(page)).toHaveCount(1);

  // The standard view keeps the passport renderable without any permalink, so
  // even the last row deletes freely on a draft.
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

  // The banner is driven by the passport's status, never by the presence of a
  // frozen-looking permalink row.
  await expect(page.getByTestId("permalink-frozen-info")).toHaveCount(0);
  await page.reload();
  // Let the reloaded view finish loading before asserting the banner stays away —
  // right after a reload the document is empty and any absence holds trivially.
  await expect(permalinkRows(page)).toHaveCount(2);
  await expect(page.getByTestId("permalink-frozen-info")).toHaveCount(0);

  await page.goto(`${page.url().replace(/\/permalinks.*$/, "")}`);
  await expect(page.getByText(/Entwurf|Draft/).first()).toBeVisible();
});
