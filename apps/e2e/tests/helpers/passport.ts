import { expect, type Page } from "@playwright/test";
import { v4 as uuid4 } from "uuid";
import { ApiBase, EnvConfig } from "../config";

/**
 * GTIN-14 form of the shared test GTIN-13 `4006381333931`
 * (packages/testing/src/fixtures/unique-product-identifier/gtin.fixtures.ts).
 * Hardcoded rather than imported: the e2e package deliberately takes no workspace
 * dependency beyond `@open-dpp/env`, the same reason `API_VERSION` is a literal.
 */
export const GTIN14 = "04006381333931";

/** Header the backend reads the acting organization from (ORGANIZATION_ID_HEADER). */
export const ORG_ID_HEADER = "x-open-dpp-organization-id";

export type PassportIds = { orgId: string; passportId: string };

/**
 * A unique batch/serial component.
 *
 * The gs1-key (gtin + batch + serial) carries an instance-wide unique index, and
 * every spec reuses the single valid `GTIN14`. Tests therefore MUST vary the
 * batch/serial instead — a bare-GTIN UPI could only ever be created once per
 * database and would poison every later run against a persistent dev instance.
 * CSET-82 permits the alphanumerics used here.
 */
export function uniqueSerial(prefix = "e2e"): string {
  return `${prefix}${uuid4().replace(/-/g, "").slice(0, 12)}`;
}

/**
 * Creates an empty passport through the UI and returns the ids from the editor URL.
 *
 * The backend seeds every new passport with one internal (OPEN_DPP_UUID) unique
 * product identifier and one primary presentation permalink, which is the starting
 * point all permalink/UPI specs assume.
 */
export async function createBlankPassport(page: Page): Promise<PassportIds> {
  await page.goto(EnvConfig.OPEN_DPP_URL);
  await page.getByRole("link", { name: /Pässe|Passports/i, exact: true }).click();
  await page.getByRole("button", { name: /Hinzufügen|Add/i }).click();

  const dialog = page.getByRole("dialog");
  // "Blank" is the dialog's default mode; checking it explicitly keeps the helper
  // honest if that default ever changes.
  await dialog.getByRole("radio", { name: /Leer|Blank/i }).check();
  await dialog.getByRole("button", { name: /^(Erstellen|Create)$/i }).click();

  // Creating a passport navigates straight into its editor. The organization id is
  // a Mongo ObjectId while the passport id is a uuid, hence the two shapes.
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

/**
 * Drives the create dialog on the UPI list to mint a GS1 identifier.
 *
 * Leaves the follow-up "create a GS1 Digital Link?" prompt OPEN — the caller
 * decides between `gs1-link-prompt-skip` and `gs1-link-prompt-add`, which is the
 * fork the specs are actually about.
 */
export async function createGs1Upi(
  page: Page,
  gs1: { gtin?: string; batch?: string; serial?: string },
): Promise<void> {
  await page.getByTestId("upi-add-btn").click();
  // GS1 is the dialog's default type; the SelectButton option is a plain button.
  await page.getByTestId("upi-create-type").getByRole("button", { name: /^GS1$/ }).click();
  await page.getByTestId("upi-create-gtin").fill(gs1.gtin ?? GTIN14);
  if (gs1.batch) await page.getByTestId("upi-create-batch").fill(gs1.batch);
  if (gs1.serial) await page.getByTestId("upi-create-serial").fill(gs1.serial);
  await page.getByTestId("upi-create-submit").click();
  await expect(page.getByTestId("gs1-link-prompt-skip")).toBeVisible();
}

/**
 * Publishes a passport over the API instead of the toolbar button.
 *
 * Publishing is only ever an arrange step in these specs — the request reuses the
 * signed-in browser context's cookies and skips a UI round trip that has its own
 * coverage elsewhere.
 */
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

/**
 * Picks an option from a PrimeVue Select.
 *
 * The panel can drop a click while the underlying options are still loading, so
 * the interaction is retried until the value sticks (same approach as
 * `selectPresentationComponent` in presentation-bignumber.spec.ts).
 */
export async function pickSelectOption(page: Page, testId: string, option: RegExp): Promise<void> {
  const select = page.getByTestId(testId);
  await expect(async () => {
    await select.getByRole("combobox").click();
    await page.getByRole("option", { name: option }).first().click();
    await expect(select).toHaveText(option, { timeout: 2_000 });
  }).toPass({ timeout: 15_000 });
}

/**
 * Confirms a PrimeVue ConfirmDialog whose accept button is labelled "Löschen"/"Delete".
 *
 * The list views mount their own `<ConfirmDialog />` on top of the global one in
 * App.vue, so a confirmation currently opens twice. Both run the same callback, but
 * only the topmost one is clickable — the other sits under its modal mask. `.last()`
 * keeps this working once that duplication is removed.
 */
export async function acceptDeleteConfirm(page: Page): Promise<void> {
  await page
    .locator('[role="alertdialog"]:visible')
    .getByRole("button", { name: /Löschen|Delete/i })
    .last()
    .click();
}
