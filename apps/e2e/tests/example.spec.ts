import { expect, test } from '@playwright/test';
import { EnvConfig, ExampleOrganisation } from './config';

test('Create passport template', async ({ page }) => {
  await page.goto(`${EnvConfig.OPEN_DPP_URL}`);
  await page.getByRole('link', { name: 'Passvorlagen', exact: true }).click();
  await page.getByRole('button', { name: 'Hinzufügen' }).click();
  // Expect a title "to contain" a substring.
});

test('get started link', async ({ page }) => {
  await page.goto(`${EnvConfig.OPEN_DPP_URL}`);
  await expect(page.getByRole('link', { name: 'Passvorlagen', exact: true })).toBeVisible();
});
