/** Resolver behaviour: the GS1 Digital Link resolver at /gs1/v1, ported from the GS1 resolver test suite. */
import { EnvConfig } from "../config";
import { newAnonymousContext } from "../helpers/anonymous";
import { check, expect } from "./checks";
import { readSubject } from "./subject";

const scanUrl = (gtin: string, serial: string, query = ""): string =>
  `${EnvConfig.OPEN_DPP_URL}/gs1/v1/01/${gtin}/21/${serial}${query}`;

check(
  {
    id: "resolver.redirect-published",
    title:
      "a scanned key of a published passport redirects to its public view, query passed through",
    criteria: ["ESPR-Art10(1)(a)", "ESPR-Art9(2)(e)", "BATT-Art77(3)-sub1", "CPR-Art76(2)(c)", "DET-Art21(4)(f)", "TOYS-Art19(7)"],
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
    criteria: ["ESPR-Art10(1)(g)", "CPR-Art77(1)(g)"],
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
