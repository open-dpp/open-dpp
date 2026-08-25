import { Page } from "@playwright/test";

export async function getOrganizationId(page: Page) {
  const orgaId = await page.evaluate(() =>
    localStorage.getItem("open-dpp-local-last-selected-organization-id"),
  );

  return orgaId;
}
