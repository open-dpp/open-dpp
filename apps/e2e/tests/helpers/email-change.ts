import { Page } from "@playwright/test";

/**
 * Drives the EmailChangeCard request flow: open the panel, fill the new email +
 * current password, submit. Assertions on the resulting pending state / mail are
 * left to the calling spec.
 */
export async function requestEmailChange(
  page: Page,
  newEmail: string,
  currentPassword: string,
): Promise<void> {
  await page.getByTestId("change-email").click();
  await page.getByTestId("new-email").fill(newEmail);
  await page.getByTestId("current-password").fill(currentPassword);
  await page.getByTestId("send-verification").click();
}
