/** Identifier syntax: every GS1 identifier the instance exposes validates in the GS1 Syntax Engine. */
import { ApiBase } from "../config";
import { ORG_ID_HEADER } from "../helpers/passport";
import { check, expect } from "./checks";
import { readSubject } from "./subject";

type Permalink = { kind: string; publicUrl: string };
type PermalinkList =
  | Permalink[]
  | { result?: Permalink[]; data?: Permalink[]; items?: Permalink[] };

check(
  {
    id: "identifiers.gs1-syntax-valid",
    title:
      "the GTIN, the Digital Link URI and every GS1-link permalink validate in the GS1 Syntax Engine",
    criteria: ["ESPR-Art10(1)(a)", "ESPR-AnnexIII-para2", "BATT-Art77(3)-sub2", "CPR-Art77(1)(c)", "CPR-Art79(1)", "DET-Art23(1)", "TOYS-Art21(1)"],
  },
  async ({ request }) => {
    const subject = readSubject();
    const list = await request.get(`${ApiBase}/passports/${subject.passportId}/permalinks`, {
      headers: { [ORG_ID_HEADER]: subject.orgId },
    });
    expect(list.ok()).toBeTruthy();
    const body = (await list.json()) as PermalinkList;
    const permalinks = Array.isArray(body) ? body : (body.result ?? body.data ?? body.items ?? []);
    expect(permalinks.length, "the subject has at least one permalink").toBeGreaterThan(0);
    const gs1 = permalinks.filter((p) => p.kind === "gs1-link" || p.kind === "GS1_LINK");
    const uris = [subject.digitalLink, ...gs1.map((p) => p.publicUrl)];

    const { GS1encoder } = await import("gs1encoder");
    const engine = await GS1encoder.create();
    const problems: string[] = [];
    const tryParse = (label: string, apply: () => void): void => {
      try {
        apply();
      } catch (error) {
        problems.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    tryParse(`GTIN ${subject.gtin}`, () => {
      engine.aiDataStr = `(01)${subject.gtin}`;
    });
    for (const uri of uris) {
      tryParse(uri, () => {
        engine.dataStr = uri;
      });
    }
    engine.free();
    expect(problems, `${uris.length} URIs checked`).toEqual([]);
  },
);
