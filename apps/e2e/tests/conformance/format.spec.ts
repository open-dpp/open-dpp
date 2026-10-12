/** Data formats (EN 18216 clause 5): JSON as the exchange format, HTML by content negotiation. */
import { ApiBase } from "../config";
import { newAnonymousContext } from "../helpers/anonymous";
import { check, expect } from "./checks";
import { readSubject } from "./subject";
import { CONTENT_SUBMODEL_ID_SHORT } from "./subject-content";

const permalinkOf = (publicUrl: string): string => publicUrl.split("/p/")[1].split(/[?#]/)[0];

check(
  {
    id: "format.public-reads-are-json",
    title: "the public passport reads answer application/json with a conforming JSON text",
    criteria: [
      "EN18216-5(a)",
      "ISO21778-2(1)",
      "ISO21778-4",
      "ISO21778-5",
      "ISO21778-6",
      "ISO21778-7",
      "ISO21778-8",
      "ISO21778-9",
      "ESPR-Art10(1)(d)",
      "ESPR-Art11(a)",
    ],
  },
  async ({ browser }) => {
    const subject = readSubject();
    const anonymous = await newAnonymousContext(browser);
    const base = `${ApiBase}/p/${permalinkOf(subject.publicUrl)}`;
    const submodels = await anonymous.request.get(`${base}/submodels`);
    const { result } = (await submodels.json()) as { result: { id: string; idShort: string }[] };
    const content = result.find((s) => s.idShort === CONTENT_SUBMODEL_ID_SHORT);
    expect(content, "the subject carries its content submodel").toBeDefined();
    const encoded = Buffer.from(content!.id).toString("base64");
    for (const url of [
      base,
      `${base}/shells`,
      `${base}/submodels`,
      `${base}/submodels/${encoded}`,
      `${base}/submodels/${encoded}/submodel-elements`,
    ]) {
      const response = await anonymous.request.get(url);
      expect(response.status(), url).toBe(200);
      expect(response.headers()["content-type"], url).toMatch(/^application\/json/);
      // JSON.parse implements the ECMA-404 / ISO/IEC 21778 grammar: no NaN, no trailing commas.
      const text = await response.text();
      expect(() => JSON.parse(text), url).not.toThrow();
    }
    await anonymous.close();
  },
);

check(
  {
    id: "format.malformed-json-refused",
    title: "a request body that is not a conforming JSON text is refused with 400",
    criteria: ["ISO21778-2(2)"],
  },
  async ({ browser }) => {
    const anonymous = await newAnonymousContext(browser);
    // The page-view counter is the one anonymous route that accepts a JSON body.
    const response = await anonymous.request.post(`${ApiBase}/passport-metrics/page-views`, {
      headers: { "content-type": "application/json" },
      data: '{"passportId": NaN,}',
    });
    expect(response.status()).toBe(400);
    await anonymous.close();
  },
);

check(
  {
    id: "format.digital-link-negotiates-representation",
    title:
      "the passport's Digital Link answers HTML to a browser and JSON to a machine (content negotiation)",
    criteria: ["EN18216-5(d)", "EN18222-4.1(9)", "EN18222-4.3"],
  },
  async ({ browser }) => {
    const subject = readSubject();
    const anonymous = await newAnonymousContext(browser);
    const html = await anonymous.request.get(subject.digitalLink, {
      headers: { accept: "text/html" },
    });
    expect(html.headers()["content-type"], "browser representation").toMatch(/^text\/html/);
    const json = await anonymous.request.get(subject.digitalLink, {
      headers: { accept: "application/json" },
    });
    expect(json.headers()["content-type"], "machine representation").toMatch(/^application\/json/);
    await anonymous.close();
  },
);
