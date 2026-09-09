/** Export format: the passport export carries an AAS environment that verifies against the metamodel. */
import { jsonization, verification } from "@aas-core-works/aas-core3.0-typescript";
import { ApiBase } from "../config";
import { ORG_ID_HEADER } from "../helpers/passport";
import { check, expect } from "./checks";
import { readSubject } from "./subject";

check(
  {
    id: "export.aas-environment-verifies",
    title:
      "the JSON export holds an AAS environment that deserialises and verifies against IEC 63278-1 (V3.0)",
    criteria: ["ESPR-Art10(1)(d)", "BATT-Art77(5)", "REG1778-Art8(7)", "CPR-Art77(1)(d)"],
  },
  async ({ request }) => {
    const subject = readSubject();
    const response = await request.get(`${ApiBase}/passports/${subject.passportId}/export`, {
      headers: { [ORG_ID_HEADER]: subject.orgId },
    });
    expect(response.status()).toBe(200);
    const body = (await response.json()) as {
      format?: string;
      version?: string;
      environment?: unknown;
    };
    expect(body.environment, "export envelope carries an environment").toBeDefined();

    // The AAS JSON serialisation omits absent optional attributes; open-dpp emits explicit null
    // (e.g. assetInformation.assetType). Normalise null to omitted so the Check verifies the
    // metamodel constraints rather than that serialisation choice.
    const stripNulls = (value: unknown): unknown =>
      Array.isArray(value)
        ? value.map(stripNulls)
        : value && typeof value === "object"
          ? Object.fromEntries(
              Object.entries(value as Record<string, unknown>)
                .filter(([, v]) => v !== null)
                .map(([k, v]) => [k, stripNulls(v)]),
            )
          : value;

    const either = jsonization.environmentFromJsonable(stripNulls(body.environment) as never);
    expect(
      either.error,
      `deserialisation: ${either.error?.message ?? ""} at ${either.error?.path ?? ""}`,
    ).toBeNull();
    const errors = [...verification.verify(either.mustValue())].map(
      (e) => `${e.path}: ${e.message}`,
    );
    expect(errors.slice(0, 10), `${errors.length} metamodel constraint violations`).toEqual([]);
  },
);
