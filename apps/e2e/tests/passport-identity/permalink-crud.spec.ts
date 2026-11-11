import { expect, test } from "@playwright/test";
import { v4 as uuid4 } from "uuid";
import { createBlankPassport, GTIN14, passportUrl, uniqueSerial } from "../helpers/passport";
import { PermalinkListViewPage } from "./permalink-list-view.page";
import { UniqueProductIdentifierListViewPage } from "./unique-product-identifier-list-view.page";

function uniqueShortName(): string {
  return `e2e-${uuid4().slice(0, 8)}`;
}

test("a new passport has exactly one open-dpp permalink with a QR code", async ({ page }) => {
  const permalinks = new PermalinkListViewPage(page, await createBlankPassport(page));
  await permalinks.goto();

  await expect(permalinks.rows).toHaveCount(1);
  const permalink = await permalinks.firstRow();
  const publicUrl = await permalink.publicUrl.innerText();
  expect(publicUrl).toContain("/p/");

  const dataCarrier = await permalink.openDataCarrier();
  await expect(dataCarrier.url).toHaveText(publicUrl);
  await expect(dataCarrier.copyButton).toBeVisible();
  await dataCarrier.expectImageLoaded();
});

test("a bare permalink can be created without selecting an identifier", async ({ page }) => {
  const permalinks = new PermalinkListViewPage(page, await createBlankPassport(page));
  await permalinks.goto();
  await expect(permalinks.rows).toHaveCount(1);

  await expect(permalinks.createButton).toBeEnabled();
  await permalinks.createBarePermalink();

  await expect(permalinks.rows).toHaveCount(2);
  await expect(permalinks.table.getByText(/open-dpp/).first()).toBeVisible();
});

test("a GS1 identifier can be linked once; its row swaps the CTA for the QR code", async ({
  page,
}) => {
  const ids = await createBlankPassport(page);
  const identifiers = new UniqueProductIdentifierListViewPage(page, ids);
  const permalinks = new PermalinkListViewPage(page, ids);
  const serial = uniqueSerial();

  await identifiers.goto();
  await identifiers.addGs1Identifier({ gtin: GTIN14, serial });
  await identifiers.skipGs1LinkPrompt();

  await permalinks.goto();
  await permalinks.createGs1DigitalLink(GTIN14);
  await expect(permalinks.rows).toHaveCount(2);

  await identifiers.goto();
  const gs1Identifier = identifiers.rowWithText(serial);
  await expect(gs1Identifier.qrButton).toBeVisible();
  await expect(gs1Identifier.createPermalinkButton).toHaveCount(0);
});

test("a presentation permalink accepts a custom short name", async ({ page }) => {
  const permalinks = new PermalinkListViewPage(page, await createBlankPassport(page));
  await permalinks.goto();
  const permalink = await permalinks.firstRow();
  const shortName = uniqueShortName();

  const editDialog = await permalink.edit();
  await expect(editDialog.lockedBanner).toHaveCount(0);
  await editDialog.saveShortName(shortName);

  await expect(permalink.publicUrl).toContainText(shortName);
});

test("a short name already taken by another passport is reported on the field", async ({
  page,
}) => {
  const shortName = uniqueShortName();

  const firstPassport = new PermalinkListViewPage(page, await createBlankPassport(page));
  await firstPassport.goto();
  const firstPermalink = await firstPassport.firstRow();
  await (await firstPermalink.edit()).saveShortName(shortName);
  await expect(firstPermalink.publicUrl).toContainText(shortName);

  const secondPassport = new PermalinkListViewPage(page, await createBlankPassport(page));
  await secondPassport.goto();
  const editDialog = await (await secondPassport.firstRow()).edit();
  await editDialog.saveShortName(shortName);

  await expect(editDialog.shortNameError).toBeVisible();
});

test("every unpublished permalink can be deleted — even the passport's last one", async ({
  page,
}) => {
  const ids = await createBlankPassport(page);
  const identifiers = new UniqueProductIdentifierListViewPage(page, ids);
  await identifiers.goto();
  await identifiers.addGs1Identifier({ gtin: GTIN14, serial: uniqueSerial() });
  await identifiers.skipGs1LinkPrompt();

  const permalinks = new PermalinkListViewPage(page, ids);
  await permalinks.goto();
  const presentation = await permalinks.firstRow();
  await permalinks.createGs1DigitalLink(GTIN14);
  await expect(permalinks.rows).toHaveCount(2);

  const gs1DigitalLink = await permalinks.rowWithText(/GS1 Digital Link/i);
  await gs1DigitalLink.delete();
  await expect(permalinks.rows).toHaveCount(1);

  await expect(presentation.deleteButton).toBeEnabled();
  await presentation.delete();
  await expect(permalinks.rows).toHaveCount(0);
});

test("creating a GS1 Digital Link does not publish the passport", async ({ page }) => {
  const ids = await createBlankPassport(page);
  const identifiers = new UniqueProductIdentifierListViewPage(page, ids);
  await identifiers.goto();
  await identifiers.addGs1Identifier({ gtin: GTIN14, serial: uniqueSerial() });
  await identifiers.skipGs1LinkPrompt();

  const permalinks = new PermalinkListViewPage(page, ids);
  await permalinks.goto();
  await permalinks.createGs1DigitalLink(GTIN14);
  await expect(permalinks.frozenInfo).toHaveCount(0);

  await permalinks.reload();
  await expect(permalinks.rows).toHaveCount(2);
  await expect(permalinks.frozenInfo).toHaveCount(0);

  await page.goto(passportUrl(ids));
  await expect(page.getByText(/Entwurf|Draft/).first()).toBeVisible();
});
