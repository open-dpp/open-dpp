/** Resolver behaviour: the GS1 Digital Link resolver at /gs1/v1, ported from the GS1 resolver test suite. */
import type { APIRequestContext } from "@playwright/test";
import { ApiBase, EnvConfig } from "../config";
import { newAnonymousContext } from "../helpers/anonymous";
import { ORG_ID_HEADER, uniqueSerial } from "../helpers/passport";
import { check, expect } from "./checks";
import { readSubject } from "./subject";

const scanUrl = (gtin: string, serial: string, query = ""): string =>
  `${EnvConfig.OPEN_DPP_URL}/gs1/v1/01/${gtin}/21/${serial}${query}`;

check(
  {
    id: "resolver.redirect-published",
    title:
      "a scanned key of a published passport redirects to its public view, query passed through",
    criteria: [
      "ESPR-Art10(1)(a)",
      "ESPR-Art9(2)(e)",
      "BATT-Art77(3)-sub1",
      "CPR-Art76(2)(c)",
      "DET-Art21(4)(f)",
      "TOYS-Art19(7)",
      "EN18219-4.3.2(2)",
      "EN18219-4.4.3(2)",
      "EN18219-4.6.2(2)",
    ],
  },
  async ({ browser }) => {
    const subject = readSubject();
    const anonymous = await newAnonymousContext(browser);
    const response = await anonymous.request.get(
      scanUrl(subject.gtin, subject.serial, "?linkType=all"),
      {
        maxRedirects: 0,
      },
    );
    expect(response.status()).toBe(302);
    expect(response.headers()["location"]).toContain("/p/");
    expect(response.headers()["location"]).toContain("linkType=all");
    await anonymous.close();
  },
);

check(
  {
    id: "resolver.draft-hidden",
    title: "a scanned key of a draft passport is not resolvable anonymously",
    criteria: ["ESPR-Art10(1)(g)", "CPR-Art77(1)(g)", "EN18239-5.2(22)"],
  },
  async ({ browser }) => {
    const { gtin, draft } = readSubject();
    const anonymous = await newAnonymousContext(browser);
    const response = await anonymous.request.get(scanUrl(gtin, draft.serial), { maxRedirects: 0 });
    expect(response.status()).toBe(404);
    await anonymous.close();
  },
);

check(
  {
    id: "resolver.head-like-get",
    title: "HEAD on a resolvable key answers like GET (GS1-Conformant Resolver)",
    criteria: ["ESPR-Art10(1)(a)"],
  },
  async ({ browser }) => {
    const subject = readSubject();
    const anonymous = await newAnonymousContext(browser);
    const response = await anonymous.request.head(scanUrl(subject.gtin, subject.serial), {
      maxRedirects: 0,
    });
    expect(response.status()).toBe(302);
    expect(response.headers()["location"]).toContain("/p/");
    await anonymous.close();
  },
);

type Gs1LinkedDraft = { passportId: string; permalinkId: string; digitalLink: string };

/** A draft passport in the subject's organisation with a GS1 identity and its gs1-link permalink. */
const gs1LinkedDraft = async (
  request: APIRequestContext,
  orgId: string,
  gtin: string,
  serial: string,
): Promise<Gs1LinkedDraft> => {
  const headers = { [ORG_ID_HEADER]: orgId };
  const passport = await request.post(`${ApiBase}/passports`, {
    headers,
    data: { environment: { assetAdministrationShells: [] } },
  });
  expect(passport.status(), "a blank draft passport should be created").toBe(201);
  const { id: passportId } = (await passport.json()) as { id: string };
  const identity = await request.post(`${ApiBase}/unique-product-identifiers`, {
    headers,
    data: { referenceId: passportId, gtin, serial },
  });
  expect(identity.status(), `the GS1 identity with serial ${serial} should be created`).toBe(201);
  const { uuid } = (await identity.json()) as { uuid: string };
  const link = await request.post(`${ApiBase}/permalinks`, {
    headers,
    data: { kind: "gs1-link", passportId, uniqueProductIdentifierId: uuid },
  });
  expect(link.status(), `the gs1-link permalink for ${serial} should be created`).toBe(201);
  const { id: permalinkId, publicUrl } = (await link.json()) as { id: string; publicUrl: string };
  return { passportId, permalinkId, digitalLink: publicUrl };
};

check(
  {
    id: "resolver.percent-in-key-resolves-to-own-passport",
    title:
      "a Digital Link whose serial holds a percent sign (CSET 82) redirects to the passport of that serial",
    criteria: [
      "EN18220-5.2.1-sub1",
      "EN18220-5.2.1-sub2",
      "EN18219-4.5.2(1)",
      "EN18219-4.2.2(1)",
      "ESPR-Art10(1)(a)",
    ],
  },
  async ({ request }) => {
    const { orgId, gtin } = readSubject();
    const suffix = uniqueSerial("").slice(0, 8);
    // "A%41…" is percent-encoded to "A%2541…"; decoding that twice gives its twin "AA…".
    const twin = await gs1LinkedDraft(request, orgId, gtin, `AA${suffix}`);
    const own = await gs1LinkedDraft(request, orgId, gtin, `A%41${suffix}`);
    try {
      // Drafts resolve for members of the owning organisation, so the request context's session suffices.
      const scan = await request.get(own.digitalLink, { maxRedirects: 0 });
      expect(scan.status(), `${own.digitalLink} should resolve`).toBe(302);
      expect(scan.headers()["location"], "the scan lands on the passport of that serial").toContain(
        own.permalinkId,
      );
    } finally {
      for (const draft of [own, twin]) {
        const deleted = await request.delete(`${ApiBase}/passports/${draft.passportId}`, {
          headers: { [ORG_ID_HEADER]: orgId },
        });
        expect(deleted.ok(), `the draft passport ${draft.passportId} should be deleted again`).toBeTruthy();
      }
    }
  },
);
