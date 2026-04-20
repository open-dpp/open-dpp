import { expect, test } from "@playwright/test";
import { v4 as uuid4 } from "uuid";
import { EnvConfig } from "./config";

/**
 * E2E coverage for issue open-dpp/open-dpp#494 — "Add Presentation Component
 * with example BigNumber". Exercises the full round-trip:
 *   1. Create a template with a Submodel and a numeric Property.
 *   2. Open the Presentation tab on the template's AAS Editor.
 *   3. Assign the BigNumber component to the numeric Property.
 *   4. Verify the patch persists (reload and re-check the select value).
 *   5. Create a passport from the template.
 *   6. Open the public passport viewer via its unique product identifier.
 *   7. Assert the BigNumber renders the Property's value.
 *
 * Prerequisites:
 *   - Docker test services running: `make test`
 *   - Matching E2E env: `E2E_USERNAME`, `E2E_PASSWORD`, `OPEN_DPP_URL`.
 */

const TEMPLATE_NAME = `BigNumber-Template-${uuid4().slice(0, 8)}`;
const PASSPORT_NAME = `BigNumber-Passport-${uuid4().slice(0, 8)}`;
const SUBMODEL_ID_SHORT = "Metrics";
const PROPERTY_ID_SHORT = "weight";
const PROPERTY_VALUE = "3.4";
const PROPERTY_PATH = `${SUBMODEL_ID_SHORT}.${PROPERTY_ID_SHORT}`;

test("template → BigNumber assignment → passport → viewer renders BigNumber", async ({
  page,
  context,
}) => {
  // 1. Create template from the templates list.
  await page.goto(`${EnvConfig.OPEN_DPP_URL}`);
  await page.getByRole("link", { name: "Passvorlagen", exact: true }).click();
  await page.getByRole("button", { name: "Hinzufügen" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill(TEMPLATE_NAME);
  await page.getByRole("button", { name: "Erstellen" }).click();
  await page.getByRole("cell", { name: TEMPLATE_NAME }).click();

  // 2. Add a Submodel, then a numeric Property inside it. Backend rejects
  //    unknown idShorts, so we set them explicitly.
  await page.getByRole("button", { name: /Submodel hinzufügen|Add Submodel/i }).click();
  await page
    .getByRole("textbox", { name: /idShort|id ?short|Kurz-ID/i })
    .first()
    .fill(SUBMODEL_ID_SHORT);
  await page.getByRole("button", { name: /Speichern|Save/i }).click();

  // Expand the new submodel in the tree, then use its row add-action.
  const submodelRow = page.getByRole("row", { name: new RegExp(SUBMODEL_ID_SHORT, "i") }).first();
  await submodelRow.getByLabel(/Hinzufügen|Add/i).click();
  await page.getByRole("menuitem", { name: /Zahl|Number/i }).click();
  await page
    .getByRole("textbox", { name: /idShort|id ?short|Kurz-ID/i })
    .first()
    .fill(PROPERTY_ID_SHORT);
  await page
    .getByRole("textbox", { name: /Wert|Value/i })
    .first()
    .fill(PROPERTY_VALUE);
  await page.getByRole("button", { name: /Speichern|Save/i }).click();

  // 3. Switch to the Presentation tab and assign BigNumber to the property.
  await page.getByRole("button", { name: /Darstellung|Presentation/i }).click();
  const select = page.locator(`[data-cy="presentation-select-${PROPERTY_PATH}"]`);
  await expect(select).toBeVisible();
  await select.selectOption("BigNumber");

  // 4. Verify persistence by reloading and confirming the select still reads "BigNumber".
  await expect
    .poll(
      async () => {
        await page.reload();
        await page.getByRole("button", { name: /Darstellung|Presentation/i }).click();
        return await page.locator(`[data-cy="presentation-select-${PROPERTY_PATH}"]`).inputValue();
      },
      { timeout: 10_000 },
    )
    .toBe("BigNumber");

  // 5. Create a passport from the template.
  await page.getByRole("link", { name: /Pässe|Passports/i, exact: true }).click();
  await page.getByRole("button", { name: "Hinzufügen" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill(PASSPORT_NAME);
  // Pick the template we just created from whatever selector is offered
  // (combobox or listbox — UI differs across locales).
  const templatePicker = page.getByRole("combobox", { name: /Vorlage|Template/i });
  if (await templatePicker.count()) {
    await templatePicker.click();
    await page.getByRole("option", { name: TEMPLATE_NAME }).click();
  } else {
    await page.getByText(TEMPLATE_NAME).click();
  }
  await page.getByRole("button", { name: /Erstellen|Create/i }).click();

  // 6. Open the public viewer for the new passport via its UPI permalink.
  await page.getByRole("cell", { name: PASSPORT_NAME }).click();
  const uuidMatch = page.url().match(/\/passports\/([a-f0-9-]{36})/i);
  expect(uuidMatch, "passport uuid should appear in the editor URL").not.toBeNull();
  const passportId = uuidMatch![1];

  // Request a unique product identifier for this passport (API exposes it at
  // /passports/:id/unique-product-identifier behind auth).
  const upiResponse = await page.request.get(
    `${EnvConfig.OPEN_DPP_URL}/api/passports/${passportId}/unique-product-identifier`,
  );
  expect(upiResponse.status(), "should be able to read a UPI for the passport").toBe(200);
  const { uuid: upiUuid } = (await upiResponse.json()) as { uuid: string };

  // 7. Open the public viewer in a fresh (unauthenticated) context and confirm BigNumber rendered.
  const anonymous = await context.browser()!.newContext();
  const viewerPage = await anonymous.newPage();
  await viewerPage.goto(`${EnvConfig.OPEN_DPP_URL}/view/${upiUuid}`);
  const bigNumber = viewerPage.locator('[data-cy="bignumber"]');
  await expect(bigNumber).toBeVisible();
  await expect(bigNumber).toHaveText(PROPERTY_VALUE);
  await anonymous.close();
});
