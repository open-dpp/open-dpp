import { expect, type Page } from "@playwright/test";
import { v4 as uuid4 } from "uuid";
import { ApiBase, EnvConfig } from "../config";

export const GTIN14 = "04006381333931";

export const ORG_ID_HEADER = "x-open-dpp-organization-id";

export type PassportIds = { orgId: string; passportId: string };

export function uniqueSerial(prefix = "e2e"): string {
  return `${prefix}${uuid4().replace(/-/g, "").slice(0, 12)}`;
}

export async function createBlankPassport(page: Page): Promise<PassportIds> {
  await page.goto(EnvConfig.OPEN_DPP_URL);
  await page.getByRole("link", { name: /Pässe|Passports/i, exact: true }).click();
  await page.getByRole("button", { name: /Hinzufügen|Add/i }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByRole("radio", { name: /Leer|Blank/i }).check();
  await dialog.getByRole("button", { name: /^(Erstellen|Create)$/i }).click();

  await page.waitForURL(/\/organizations\/[0-9a-f]{24}\/passports\/[0-9a-f-]{36}/i);
  const match = page.url().match(/\/organizations\/([0-9a-f]{24})\/passports\/([0-9a-f-]{36})/i);
  expect(match, "passport editor URL should carry the organization and passport id").not.toBeNull();
  return { orgId: match![1], passportId: match![2] };
}

export function upiListUrl({ orgId, passportId }: PassportIds): string {
  return `${EnvConfig.OPEN_DPP_URL}/organizations/${orgId}/passports/${passportId}/unique-product-identifiers`;
}

export function permalinkListUrl({ orgId, passportId }: PassportIds): string {
  return `${EnvConfig.OPEN_DPP_URL}/organizations/${orgId}/passports/${passportId}/permalinks`;
}

export async function gotoUpiList(page: Page, ids: PassportIds): Promise<void> {
  await page.goto(upiListUrl(ids));
  await expect(page.getByTestId("upi-data-table")).toBeVisible();
}

export async function gotoPermalinkList(page: Page, ids: PassportIds): Promise<void> {
  await page.goto(permalinkListUrl(ids));
  await expect(page.getByTestId("permalink-data-table")).toBeVisible();
}

export async function createGs1Upi(
  page: Page,
  gs1: { gtin?: string; batch?: string; serial?: string },
): Promise<void> {
  await page.getByTestId("upi-add-btn").click();
  await page.getByTestId("upi-create-type").getByRole("button", { name: /^GS1$/ }).click();
  await page.getByTestId("upi-create-gtin").fill(gs1.gtin ?? GTIN14);
  if (gs1.batch) await page.getByTestId("upi-create-batch").fill(gs1.batch);
  if (gs1.serial) await page.getByTestId("upi-create-serial").fill(gs1.serial);
  await page.getByTestId("upi-create-submit").click();
  await expect(page.getByTestId("gs1-link-prompt-skip")).toBeVisible();
}

export async function publishPassport(
  page: Page,
  { orgId, passportId }: PassportIds,
): Promise<void> {
  const response = await page.request.put(`${ApiBase}/passports/${passportId}/status`, {
    headers: { [ORG_ID_HEADER]: orgId },
    data: { method: "Publish" },
  });
  expect(response.status(), `publishing passport ${passportId} should succeed`).toBe(200);
}

export async function pickSelectOption(page: Page, testId: string, option: RegExp): Promise<void> {
  const select = page.getByTestId(testId);
  await expect(async () => {
    await select.getByRole("combobox").click();
    await page.getByRole("option", { name: option }).first().click();
    await expect(select).toHaveText(option, { timeout: 2_000 });
  }).toPass({ timeout: 15_000 });
}

export async function createGs1LinkPermalink(page: Page): Promise<void> {
  await page.getByTestId("permalink-create-btn").click();
  await pickSelectOption(page, "permalink-create-upi-select", new RegExp(GTIN14));
  await page.getByTestId("permalink-create-submit").click();
  await expect(page.getByTestId("permalink-create-submit")).toHaveCount(0);
}

export async function acceptDeleteConfirm(page: Page): Promise<void> {
  await page
    .locator('[role="alertdialog"]:visible')
    .getByRole("button", { name: /Löschen|Delete/i })
    .last()
    .click();
}

/**
 * The public slug of the passport's default permalink, read from the permalink list. Every
 * passport gets that permalink on creation, so this needs no prior setup.
 */
export async function readDefaultPermalinkSlug(page: Page, ids: PassportIds): Promise<string> {
  await gotoPermalinkList(page, ids);
  const row = page
    .getByTestId("permalink-data-table")
    .locator("tbody tr:not(.p-datatable-empty-message)")
    .first();
  const kindTestId = await row
    .locator("[data-testid^='permalink-kind-']")
    .getAttribute("data-testid");
  expect(kindTestId, "permalink row should expose its id through the kind cell").not.toBeNull();
  const permalinkId = kindTestId!.replace("permalink-kind-", "");
  const publicUrl = await page.getByTestId(`permalink-public-url-${permalinkId}`).innerText();
  const slug = publicUrl.split("/p/")[1];
  expect(slug, `public url ${publicUrl} should end in the permalink slug`).toBeTruthy();
  return slug!;
}
