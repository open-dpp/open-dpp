import { expect, test, type Page } from "@playwright/test";
import { v4 as uuid4 } from "uuid";
import { EnvConfig } from "./config";

const TEMPLATE_NAME = `BigNumber-Template-${uuid4().slice(0, 8)}`;
const SUBMODEL_ID_SHORT = "Metrics";
const PROPERTY_ID_SHORT = "weight";
const PROPERTY_VALUE = "3.4";

/**
 * Expands a tree row if it is collapsed. The toggler is the unnamed button in the
 * row's first cell, and it toggles, so the current state has to be checked first.
 */
async function expandRow(page: Page, idShort: string): Promise<void> {
  const row = treeRow(page, idShort);
  await expect(row).toBeVisible();
  if ((await row.getAttribute("aria-expanded")) === "true") return;
  await row.getByRole("cell").first().getByRole("button").click();
}

/**
 * Reopens a property's editor drawer and switches to its presentation tab. The tab
 * only renders for properties with a numeric value type.
 */
async function openPresentationTab(page: Page, idShort: string): Promise<void> {
  await treeRow(page, idShort)
    .getByRole("button", { name: /Editieren|Edit/i })
    .click();
  // The editor resets the drawer to its data tab whenever the edited node loads,
  // so the switch can lose a race with that reset — retry until it sticks.
  await expect(async () => {
    await page.locator('[data-cy="drawer-tab-presentation"]').click();
    await expect(componentSelect(page)).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 15_000 });
}

function componentSelect(page: Page) {
  return page.locator('[data-cy="presentation-component-select"]').getByRole("combobox");
}

/**
 * Picks a presentation component. The picker is a PrimeVue Select rather than a
 * native one, so it is driven by opening it and clicking an option.
 */
async function selectPresentationComponent(page: Page, label: string): Promise<void> {
  // The panel drops the change without feedback while the presentation
  // configuration is still loading, so keep picking until the value sticks.
  await expect(async () => {
    await componentSelect(page).click();
    await page.getByRole("option", { name: label, exact: true }).click();
    await expect(componentSelect(page)).toHaveText(new RegExp(label), { timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
}

function treeRow(page: Page, idShort: string) {
  return page.getByRole("row", { name: new RegExp(`^${idShort}\\b`, "i") }).first();
}

/**
 * Drives the passport create dialog. The dialog carries no name field — a passport
 * takes its display name from the template — and its template Select stays disabled
 * until the "from template" mode is selected.
 */
async function selectTemplateAndCreatePassport(page: Page, templateName: string): Promise<void> {
  await page.getByRole("radio", { name: /Aus Produktpassvorlage|From template/i }).check();
  await page.getByRole("combobox", { name: /Passvorlage auswählen|Select template/i }).click();
  // The option renders the name next to a status tag, so match on a substring.
  await page.getByRole("option", { name: new RegExp(templateName) }).click();
  await page.getByRole("button", { name: /Erstellen|Create/i }).click();
}

// FIXME(#609): these two flows predate the current AAS editor and presentation
// configuration feature and do not pass yet. The selectors below have been brought
// up to date (sections instead of submodels, create-navigates-into-editor, the
// PrimeVue value/component inputs), and both tests now get as far as assigning the
// BigNumber component. What still fails is re-reading the assignment after a reload,
// which needs two upstream questions answered first:
//   * AASEditor.vue binds <Tabs :value="activeDrawerTab"> one-way, with no
//     v-model and no @update:value handler, so the parent never learns which
//     drawer tab is active.
//   * ElementPresentationPanel silently discards a component change while the
//     presentation configuration is still loading (patchActive returns early when
//     activeConfig is null), with no feedback in the UI.
// Re-enable by dropping the .fixme once those are settled.
test.fixme("template → BigNumber assignment → passport → viewer renders BigNumber", async ({
  page,
  context,
}) => {
  await page.goto(`${EnvConfig.OPEN_DPP_URL}`);
  await page.getByRole("link", { name: "Passvorlagen", exact: true }).click();
  await page.getByRole("button", { name: "Hinzufügen" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill(TEMPLATE_NAME);
  // The dialog's submit button shares its accessible name ("Hinzufügen") with the
  // add-language button inside it, so go through the test id.
  await page.getByTestId("create-template").click();
  // Creating a template or passport navigates straight into its editor.
  await page.waitForURL(/\/templates\/[0-9a-f-]{36}/i);

  await page.getByRole("button", { name: /Abschnitt hinzufügen|Add section/i }).click();
  await page.getByRole("textbox", { name: /Name/i }).first().fill(SUBMODEL_ID_SHORT);
  await page.getByRole("button", { name: /Speichern|Save/i }).click();

  const submodelRow = page.getByRole("row", { name: new RegExp(SUBMODEL_ID_SHORT, "i") }).first();
  await submodelRow.getByLabel(/Hinzufügen|Add/i).click();
  await page.getByRole("menuitem", { name: /Zahl|Number/i }).click();
  await page.getByRole("textbox", { name: /Name/i }).first().fill(PROPERTY_ID_SHORT);
  // The value input is a PrimeVue InputNumber (spinbutton) carrying no accessible
  // name — the "Wert" heading is a sibling of the field, not its label.
  await page.getByRole("dialog").getByRole("spinbutton").fill(PROPERTY_VALUE);
  await page.getByRole("button", { name: /Speichern|Save/i }).click();

  await expandRow(page, SUBMODEL_ID_SHORT);
  await openPresentationTab(page, PROPERTY_ID_SHORT);
  await selectPresentationComponent(page, "BigNumber");

  await expect
    .poll(
      async () => {
        await page.reload();
        await expandRow(page, SUBMODEL_ID_SHORT);
        await openPresentationTab(page, PROPERTY_ID_SHORT);
        return await componentSelect(page).textContent();
      },
      { timeout: 20_000 },
    )
    .toContain("BigNumber");

  await page.getByRole("link", { name: /Pässe|Passports/i, exact: true }).click();
  await page.getByRole("button", { name: "Hinzufügen" }).click();
  await selectTemplateAndCreatePassport(page, TEMPLATE_NAME);

  // Creating a template or passport navigates straight into its editor.
  await page.waitForURL(/\/passports\/[0-9a-f-]{36}/i);
  const uuidMatch = page.url().match(/\/passports\/([a-f0-9-]{36})/i);
  expect(uuidMatch, "passport uuid should appear in the editor URL").not.toBeNull();
  const passportId = uuidMatch![1];

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

  const anonymous = await context.browser()!.newContext();
  const viewerPage = await anonymous.newPage();
  await viewerPage.goto(`${EnvConfig.OPEN_DPP_URL}/p/${permalinkSlug ?? permalinkId}`);
  const bigNumber = viewerPage.locator('[data-cy="bignumber"]');
  await expect(bigNumber).toBeVisible();
  await expect(bigNumber.locator('[data-cy="bignumber-value"]')).toHaveText(PROPERTY_VALUE);
  await anonymous.close();
});

const NESTED_TEMPLATE_NAME = `BigNumber-NestedTemplate-${uuid4().slice(0, 8)}`;
const NESTED_SEC_ID_SHORT = "Dimensions";

// FIXME(#609): these two flows predate the current AAS editor and presentation
// configuration feature and do not pass yet. The selectors below have been brought
// up to date (sections instead of submodels, create-navigates-into-editor, the
// PrimeVue value/component inputs), and both tests now get as far as assigning the
// BigNumber component. What still fails is re-reading the assignment after a reload,
// which needs two upstream questions answered first:
//   * AASEditor.vue binds <Tabs :value="activeDrawerTab"> one-way, with no
//     v-model and no @update:value handler, so the parent never learns which
//     drawer tab is active.
//   * ElementPresentationPanel silently discards a component change while the
//     presentation configuration is still loading (patchActive returns early when
//     activeConfig is null), with no feedback in the UI.
// Re-enable by dropping the .fixme once those are settled.
test.fixme("BigNumber on a Property nested inside a SubmodelElementCollection", async ({
  page,
  context,
}) => {
  await page.goto(`${EnvConfig.OPEN_DPP_URL}`);
  await page.getByRole("link", { name: "Passvorlagen", exact: true }).click();
  await page.getByRole("button", { name: "Hinzufügen" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill(NESTED_TEMPLATE_NAME);
  // The dialog's submit button shares its accessible name ("Hinzufügen") with the
  // add-language button inside it, so go through the test id.
  await page.getByTestId("create-template").click();
  // Creating a template or passport navigates straight into its editor.
  await page.waitForURL(/\/templates\/[0-9a-f-]{36}/i);

  await page.getByRole("button", { name: /Abschnitt hinzufügen|Add section/i }).click();
  await page.getByRole("textbox", { name: /Name/i }).first().fill(SUBMODEL_ID_SHORT);
  await page.getByRole("button", { name: /Speichern|Save/i }).click();

  const submodelRow = page.getByRole("row", { name: new RegExp(SUBMODEL_ID_SHORT, "i") }).first();
  await submodelRow.getByLabel(/Hinzufügen|Add/i).click();
  await page.getByRole("menuitem", { name: /Unterabschnitt|Sub section/i }).click();
  await page.getByRole("textbox", { name: /Name/i }).first().fill(NESTED_SEC_ID_SHORT);
  await page.getByRole("button", { name: /Speichern|Save/i }).click();

  await expandRow(page, SUBMODEL_ID_SHORT);
  const secRow = treeRow(page, NESTED_SEC_ID_SHORT);
  await secRow.getByLabel(/Hinzufügen|Add/i).click();
  await page.getByRole("menuitem", { name: /Zahl|Number/i }).click();
  await page.getByRole("textbox", { name: /Name/i }).first().fill(PROPERTY_ID_SHORT);
  // The value input is a PrimeVue InputNumber (spinbutton) carrying no accessible
  // name — the "Wert" heading is a sibling of the field, not its label.
  await page.getByRole("dialog").getByRole("spinbutton").fill(PROPERTY_VALUE);
  await page.getByRole("button", { name: /Speichern|Save/i }).click();

  await expandRow(page, SUBMODEL_ID_SHORT);
  await expandRow(page, NESTED_SEC_ID_SHORT);
  await openPresentationTab(page, PROPERTY_ID_SHORT);
  await selectPresentationComponent(page, "BigNumber");

  await expect
    .poll(
      async () => {
        await page.reload();
        await expandRow(page, SUBMODEL_ID_SHORT);
        await expandRow(page, NESTED_SEC_ID_SHORT);
        await openPresentationTab(page, PROPERTY_ID_SHORT);
        return await componentSelect(page).textContent();
      },
      { timeout: 20_000 },
    )
    .toContain("BigNumber");

  await page.getByRole("link", { name: /Pässe|Passports/i, exact: true }).click();
  await page.getByRole("button", { name: "Hinzufügen" }).click();
  await selectTemplateAndCreatePassport(page, NESTED_TEMPLATE_NAME);

  // Creating a template or passport navigates straight into its editor.
  await page.waitForURL(/\/passports\/[0-9a-f-]{36}/i);
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

  const anonymous = await context.browser()!.newContext();
  const viewerPage = await anonymous.newPage();
  await viewerPage.goto(`${EnvConfig.OPEN_DPP_URL}/p/${permalinkSlug ?? permalinkId}`);

  await viewerPage.locator(`[data-cy="${NESTED_SEC_ID_SHORT}"]`).click();
  await expect(viewerPage).toHaveURL(/submodelPath=/);

  const bigNumber = viewerPage.locator('[data-cy="bignumber"]');
  await expect(bigNumber).toBeVisible();
  await expect(bigNumber.locator('[data-cy="bignumber-value"]')).toHaveText(PROPERTY_VALUE);
  await anonymous.close();
});
