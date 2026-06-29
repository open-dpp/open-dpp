import { EnvConfig } from "../config";
import { uniqueEmail } from "../helpers/disposable-user";
import { requestEmailChange } from "../helpers/email-change";
import { MailpitClient } from "../helpers/mailpit";
import { expect, test } from "../fixtures";

const PROFILE = `${EnvConfig.OPEN_DPP_URL}/profile`;

test("request shows the pending state and sends both verification + revoke-notification mail", async ({
  makeDisposableUser,
  mailpit,
}) => {
  const { page, user } = await makeDisposableUser();
  const newEmail = uniqueEmail("e2e-req-new");
  const since = new Date();

  await page.goto(PROFILE);
  await expect(page.getByText(user.email)).toBeVisible({ timeout: 15000 });

  await requestEmailChange(page, newEmail, user.password);

  await expect(page.getByText(`Wartet auf Bestätigung an ${newEmail}`)).toBeVisible();
  await expect(page.getByTestId("cancel-pending")).toBeVisible();
  await expect(page.getByTestId("change-email")).toHaveCount(0);

  const verification = await mailpit.waitForMessage({
    to: newEmail,
    subjectContains: "Confirm your new email address",
    since,
  });
  expect(MailpitClient.getVerifyLink(verification)).toContain("/verify-email?token");

  const notification = await mailpit.waitForMessage({
    to: user.email,
    subjectContains: "Your email is being changed",
    since,
  });
  expect(MailpitClient.getRevokeLink(notification)).toContain("/account/email-change-revoke?token");
});

test("hard-cancel clears the pending request and the captured verify link becomes a no-op", async ({
  makeDisposableUser,
  mailpit,
}) => {
  const { page, user } = await makeDisposableUser();
  const newEmail = uniqueEmail("e2e-cancel-new");
  const since = new Date();

  await page.goto(PROFILE);
  await expect(page.getByText(user.email)).toBeVisible({ timeout: 15000 });

  await requestEmailChange(page, newEmail, user.password);
  await expect(page.getByText(`Wartet auf Bestätigung an ${newEmail}`)).toBeVisible();

  // Capture the still-valid verify link BEFORE cancelling.
  const verification = await mailpit.waitForMessage({
    to: newEmail,
    subjectContains: "Confirm your new email address",
    since,
  });
  const verifyLink = MailpitClient.getVerifyLink(verification);

  // Cancel -> confirm dialog accept ("Änderung abbrechen", distinct from the
  // card's "Anfrage abbrechen" trigger button).
  await page.getByTestId("cancel-pending").click();
  await page.getByRole("button", { name: "Änderung abbrechen" }).click();
  await expect(page.getByTestId("change-email")).toBeVisible();
  await expect(page.getByTestId("cancel-pending")).toHaveCount(0);

  // The captured verify link must not change the email after a hard cancel.
  await page.goto(verifyLink);
  await page.goto(PROFILE);
  await expect(page.getByText(user.email)).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(newEmail)).toHaveCount(0);
  await mailpit.expectNoMessage({
    to: newEmail,
    subjectContains: "Your email address was changed",
  });
});

test("client-side validation blocks the request without calling the API", async ({
  makeDisposableUser,
}) => {
  const { page, user } = await makeDisposableUser();
  const apiCalls: string[] = [];
  page.on("request", (req) => {
    if (req.method() === "POST" && req.url().includes("/users/me/email-change")) {
      apiCalls.push(req.url());
    }
  });

  await page.goto(PROFILE);
  await expect(page.getByText(user.email)).toBeVisible({ timeout: 15000 });
  await page.getByTestId("change-email").click();

  // Case 1: invalid email -> inline email error, no API call.
  await page.getByTestId("new-email").fill("not-an-email");
  await page.getByTestId("current-password").fill("whatever");
  await page.getByTestId("send-verification").click();
  await expect(page.getByText("Bitte geben Sie eine gültige E-Mail Adresse ein.")).toBeVisible();
  expect(apiCalls).toHaveLength(0);

  // Case 2: valid email but empty password -> inline password error, no API call.
  await page.getByTestId("new-email").fill(uniqueEmail("e2e-val"));
  await page.getByTestId("current-password").fill("");
  await page.getByTestId("send-verification").click();
  await expect(page.getByText("Erforderlich, um diese Änderung zu bestätigen.")).toBeVisible();
  expect(apiCalls).toHaveLength(0);
});
