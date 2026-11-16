import { Page } from "@playwright/test";

const LAST_SELECTED_ORGANIZATION_ID_KEY = "open-dpp-local-last-selected-organization-id";

/**
 * The organization the client selected last. Read from the storage state of the context instead of
 * the page, so the page does not have to be on the application yet (a new page is on about:blank,
 * which has no local storage).
 */
export async function getOrganizationId(page: Page) {
  const { origins } = await page.context().storageState();
  const item = origins
    .flatMap((origin) => origin.localStorage)
    .find(({ name }) => name === LAST_SELECTED_ORGANIZATION_ID_KEY);

  return item?.value ?? null;
}
