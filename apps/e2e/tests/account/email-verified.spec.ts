import { expect, test } from "@playwright/test";
import { EmailVerifiedPage } from "./email-verified.page";

// Anonymous (no auth needed): the page only reacts to the `error` query param
// better-auth appends on failure, so every state is reachable by navigating
// directly without performing a real verification flow.
test.describe("Email verified page", () => {
  test("shows the success message when no error is present", async ({ page }) => {
    const emailVerifiedPage = new EmailVerifiedPage(page);
    await emailVerifiedPage.goto();

    await emailVerifiedPage.expectSuccess();
    await expect(emailVerifiedPage.signInLink).toBeVisible();
  });

  test("shows the expired message for a TOKEN_EXPIRED error", async ({ page }) => {
    const emailVerifiedPage = new EmailVerifiedPage(page);
    await emailVerifiedPage.goto("TOKEN_EXPIRED");

    await emailVerifiedPage.expectExpired();
    await expect(emailVerifiedPage.signInLink).toBeVisible();
  });

  test("shows the invalid message for any other error code", async ({ page }) => {
    const emailVerifiedPage = new EmailVerifiedPage(page);
    await emailVerifiedPage.goto("INVALID_TOKEN");

    await emailVerifiedPage.expectInvalid();
    await expect(emailVerifiedPage.signInLink).toBeVisible();
  });
});
