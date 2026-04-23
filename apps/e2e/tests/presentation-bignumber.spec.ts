import { expect, test } from "@playwright/test";
import { v4 as uuid4 } from "uuid";
import { EnvConfig } from "./config";

/**
 * Full BigNumber round-trip: template → assign component → passport → public viewer.
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
  await page.goto(`${EnvConfig.OPEN_DPP_URL}`);
  await page.getByRole("link", { name: "Passvorlagen", exact: true }).click();
  await page.getByRole("button", { name: "Hinzufügen" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill(TEMPLATE_NAME);
  await page.getByRole("button", { name: "Erstellen" }).click();
  await page.getByRole("cell", { name: TEMPLATE_NAME }).click();

  // Backend rejects unknown idShorts, so we set them explicitly.
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

  await page.getByRole("button", { name: /Darstellung|Presentation/i }).click();
  const select = page.locator(`[data-cy="presentation-select-${PROPERTY_PATH}"]`);
  await expect(select).toBeVisible();
  await select.selectOption("BigNumber");

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

  await page.getByRole("cell", { name: PASSPORT_NAME }).click();
  const uuidMatch = page.url().match(/\/passports\/([a-f0-9-]{36})/i);
  expect(uuidMatch, "passport uuid should appear in the editor URL").not.toBeNull();
  const passportId = uuidMatch![1];

  // Authenticated `page.request` is required — the permalink listing endpoint is not public.
  const permalinkResponse = await page.request.get(
    `${EnvConfig.OPEN_DPP_URL}/api/p?passportId=${passportId}`,
  );
  expect(permalinkResponse.status(), "should be able to read the permalink for the passport").toBe(
    200,
  );
  const permalinks = (await permalinkResponse.json()) as Array<{
    id: string;
    slug: string | null;
  }>;
  expect(permalinks.length, "passport should have a permalink").toBeGreaterThan(0);
  const { id: permalinkId, slug: permalinkSlug } = permalinks[0];

  // Use a fresh unauthenticated context to confirm the public viewer works for anonymous users.
  const anonymous = await context.browser()!.newContext();
  const viewerPage = await anonymous.newPage();
  await viewerPage.goto(`${EnvConfig.OPEN_DPP_URL}/p/${permalinkSlug ?? permalinkId}`);
  const bigNumber = viewerPage.locator('[data-cy="bignumber"]');
  await expect(bigNumber).toBeVisible();
  await expect(bigNumber).toHaveText(PROPERTY_VALUE);
  await anonymous.close();
});

// Nested-property coverage: places the numeric Property inside a
// SubmodelElementCollection and verifies the viewer resolves the
// fully-qualified path across the SEC navigation step.
const NESTED_TEMPLATE_NAME = `BigNumber-NestedTemplate-${uuid4().slice(0, 8)}`;
const NESTED_PASSPORT_NAME = `BigNumber-NestedPassport-${uuid4().slice(0, 8)}`;
const NESTED_SEC_ID_SHORT = "Dimensions";
const NESTED_PROPERTY_PATH = `${SUBMODEL_ID_SHORT}.${NESTED_SEC_ID_SHORT}.${PROPERTY_ID_SHORT}`;

test("BigNumber on a Property nested inside a SubmodelElementCollection", async ({
  page,
  context,
}) => {
  await page.goto(`${EnvConfig.OPEN_DPP_URL}`);
  await page.getByRole("link", { name: "Passvorlagen", exact: true }).click();
  await page.getByRole("button", { name: "Hinzufügen" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill(NESTED_TEMPLATE_NAME);
  await page.getByRole("button", { name: "Erstellen" }).click();
  await page.getByRole("cell", { name: NESTED_TEMPLATE_NAME }).click();

  // Submodel
  await page.getByRole("button", { name: /Submodel hinzufügen|Add Submodel/i }).click();
  await page
    .getByRole("textbox", { name: /idShort|id ?short|Kurz-ID/i })
    .first()
    .fill(SUBMODEL_ID_SHORT);
  await page.getByRole("button", { name: /Speichern|Save/i }).click();

  // Nested SubmodelElementCollection
  const submodelRow = page.getByRole("row", { name: new RegExp(SUBMODEL_ID_SHORT, "i") }).first();
  await submodelRow.getByLabel(/Hinzufügen|Add/i).click();
  await page.getByRole("menuitem", { name: /Sammlung|Collection/i }).click();
  await page
    .getByRole("textbox", { name: /idShort|id ?short|Kurz-ID/i })
    .first()
    .fill(NESTED_SEC_ID_SHORT);
  await page.getByRole("button", { name: /Speichern|Save/i }).click();

  // Numeric Property inside the SEC
  const secRow = page.getByRole("row", { name: new RegExp(NESTED_SEC_ID_SHORT, "i") }).first();
  await secRow.getByLabel(/Hinzufügen|Add/i).click();
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

  // Presentation tab: the nested path must now appear
  await page.getByRole("button", { name: /Darstellung|Presentation/i }).click();
  const select = page.locator(`[data-cy="presentation-select-${NESTED_PROPERTY_PATH}"]`);
  await expect(select).toBeVisible();
  await select.selectOption("BigNumber");

  await expect
    .poll(
      async () => {
        await page.reload();
        await page.getByRole("button", { name: /Darstellung|Presentation/i }).click();
        return await page
          .locator(`[data-cy="presentation-select-${NESTED_PROPERTY_PATH}"]`)
          .inputValue();
      },
      { timeout: 10_000 },
    )
    .toBe("BigNumber");

  // Persist + passport
  await page.getByRole("link", { name: /Pässe|Passports/i, exact: true }).click();
  await page.getByRole("button", { name: "Hinzufügen" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill(NESTED_PASSPORT_NAME);
  const templatePicker = page.getByRole("combobox", { name: /Vorlage|Template/i });
  if (await templatePicker.count()) {
    await templatePicker.click();
    await page.getByRole("option", { name: NESTED_TEMPLATE_NAME }).click();
  } else {
    await page.getByText(NESTED_TEMPLATE_NAME).click();
  }
  await page.getByRole("button", { name: /Erstellen|Create/i }).click();

  await page.getByRole("cell", { name: NESTED_PASSPORT_NAME }).click();
  const uuidMatch = page.url().match(/\/passports\/([a-f0-9-]{36})/i);
  expect(uuidMatch).not.toBeNull();
  const passportId = uuidMatch![1];

  const permalinkResponse = await page.request.get(
    `${EnvConfig.OPEN_DPP_URL}/api/p?passportId=${passportId}`,
  );
  expect(permalinkResponse.status()).toBe(200);
  const permalinks = (await permalinkResponse.json()) as Array<{
    id: string;
    slug: string | null;
  }>;
  expect(permalinks.length).toBeGreaterThan(0);
  const { id: permalinkId, slug: permalinkSlug } = permalinks[0];

  // Viewer: drill into the SEC, then assert BigNumber renders the nested value.
  const anonymous = await context.browser()!.newContext();
  const viewerPage = await anonymous.newPage();
  await viewerPage.goto(`${EnvConfig.OPEN_DPP_URL}/p/${permalinkSlug ?? permalinkId}`);

  // The SEC renders a "view details" link; follow it. The link carries
  // ?submodelPath=Metrics.Dimensions which the viewer threads into the
  // resolver lookup.
  await viewerPage.locator(`[data-cy="${NESTED_SEC_ID_SHORT}"]`).click();
  await expect(viewerPage).toHaveURL(/submodelPath=/);

  const bigNumber = viewerPage.locator('[data-cy="bignumber"]');
  await expect(bigNumber).toBeVisible();
  await expect(bigNumber).toHaveText(PROPERTY_VALUE);
  await anonymous.close();
});
