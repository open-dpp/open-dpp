import { expect, type Page, test as setup } from "@playwright/test";
import { ApiBase, EnvConfig } from "../config";
import {
  createBlankPassport,
  createGs1LinkPermalink,
  createGs1Upi,
  GTIN14,
  gotoPermalinkList,
  gotoUpiList,
  ORG_ID_HEADER,
  type PassportIds,
  publishPassport,
  uniqueSerial,
} from "../helpers/passport";
import { writeSubject } from "./subject";

const withGs1Identity = async (page: Page, serial: string): Promise<PassportIds> => {
  const ids = await createBlankPassport(page);
  await gotoUpiList(page, ids);
  await createGs1Upi(page, { gtin: GTIN14, serial });
  await page.getByTestId("gs1-link-prompt-skip").click();
  await gotoPermalinkList(page, ids);
  await createGs1LinkPermalink(page);
  return ids;
};

setup("create the conformance subject", async ({ page }) => {
  const serial = uniqueSerial("conf");
  const ids = await withGs1Identity(page, serial);
  await publishPassport(page, ids);

  const scan = await page.request.get(
    `${EnvConfig.OPEN_DPP_URL}/gs1/v1/01/${GTIN14}/21/${serial}`,
    {
      maxRedirects: 0,
    },
  );
  expect(scan.status(), "the published subject should resolve").toBe(302);
  const location = scan.headers()["location"];
  expect(location).toContain("/p/");

  const identity = await page.request.get(`${ApiBase}/passports/${ids.passportId}/gs1-identity`, {
    headers: { [ORG_ID_HEADER]: ids.orgId },
  });
  expect(identity.ok(), "the subject should report its GS1 identity").toBeTruthy();
  const { digitalLink } = (await identity.json()) as { digitalLink: string };

  const draftSerial = uniqueSerial("draft");
  const draft = await withGs1Identity(page, draftSerial);

  writeSubject({
    orgId: ids.orgId,
    passportId: ids.passportId,
    gtin: GTIN14,
    serial,
    publicUrl: location.startsWith("http") ? location : `${EnvConfig.OPEN_DPP_URL}${location}`,
    digitalLink,
    draft: { passportId: draft.passportId, serial: draftSerial },
  });
});
