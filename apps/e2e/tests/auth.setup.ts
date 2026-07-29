import { test as setup } from "@playwright/test";
import * as path from "path";
import { EnvConfig, ExampleOrganisation } from "./config";
import { createDisposableUser } from "./helpers/disposable-user";
import { MailpitClient } from "./helpers/mailpit";

const authFile = path.join(__dirname, "../playwright/.auth/user.json");

setup("authenticate and create organization", async ({ browser, request }) => {
  // Mint and verify a throwaway user rather than logging in as a pre-provisioned
  // account: nothing in the repo seeds one, and CI starts from an empty database.
  // preferredLanguage "de" keeps the German assertions in the specs that consume
  // this storage state valid, since the app resolves its locale from the profile.
  const { page, context } = await createDisposableUser(
    { browser, request, mailpit: new MailpitClient(request) },
    { verified: true, preferredLanguage: "de" },
  );

  // Straight to the form: a user with no organizations lands on /organizations/create
  // rather than on the /organizations list that carries the "create" link.
  await page.goto(`${EnvConfig.OPEN_DPP_URL}/organizations/create`);
  await page.getByRole("textbox", { name: "Name" }).fill(ExampleOrganisation);
  await page.getByRole("button", { name: "Erstellen" }).click();
  await page.getByRole("link", { name: "Passvorlagen", exact: true }).click();

  await context.storageState({ path: authFile });
  await context.close();
});
