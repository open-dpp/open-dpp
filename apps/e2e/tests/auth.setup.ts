import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { EnvConfig, ExampleOrganisation, User } from './config';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate and create organization', async ({ page }) => {
  // Perform authentication steps. Replace these actions with your own.
  await page.goto(`${EnvConfig.OPEN_DPP_URL}/signin`);
  await page.getByRole('textbox', { name: 'E-Mail-Adresse' }).click();
  await page.getByRole('textbox', { name: 'E-Mail-Adresse' }).fill(User.E2E_USERNAME);
  await page.getByRole('textbox', { name: 'Passwort' }).click();
  await page.getByRole('textbox', { name: 'Passwort' }).fill(User.E2E_PASSWORD);
  await page.click('text=Anmelden');
  await page.waitForURL(`${EnvConfig.OPEN_DPP_URL}/organizations`);
  await page.getByRole('link', { name: 'Neue Organisation erstellen' }).click();
  await page.getByRole('textbox', { name: 'Name' }).click();
  await page.getByRole('textbox', { name: 'Name' }).fill(ExampleOrganisation);
  await page.getByRole('button', { name: 'Erstellen' }).click();
  await page.getByRole('link', { name: 'Passvorlagen', exact: true }).click();

  // // Alternatively, you can wait until the page reaches a state where all cookies are set.
  // //await expect(page.getByRole('button', { name: 'View profile and more' })).toBeVisible();
  //
  // // End of authentication steps.
  //
  await page.context().storageState({ path: authFile });
});