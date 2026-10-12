/**
 * Life Cycle API (EN 18222): the standard's own REST paths, the all-or-nothing update, and the
 * status codes and error answers of the methods. The EN 18222 paths are relative ("v1/dpps/…"); a
 * DPP system names its API endpoint in the registry entry, so the Checks look for them under the
 * instance's API root. Added in wayfinder ticket #759.
 */
import type { APIRequestContext } from "@playwright/test";
import { ApiBase, EnvConfig } from "../config";
import { newAnonymousContext } from "../helpers/anonymous";
import { ORG_ID_HEADER } from "../helpers/passport";
import { check, expect } from "./checks";
import { readSubject } from "./subject";

/** Base of the EN 18222 paths of Table 16 ("v1/dpps/{dppId}", …) on this instance. */
const LifecycleBase = `${EnvConfig.OPEN_DPP_URL}/api`;

const orgHeaders = (orgId: string) => ({ [ORG_ID_HEADER]: orgId });

check(
  {
    id: "api.read-dpp-by-id",
    title: "anyone reads a published passport by its id at the EN 18222 path v1/dpps/{dppId}",
    criteria: ["EN18222-4.1(2)", "EN18222-4.2", "EN18222-8.2", "ESPR-Art11(a)"],
  },
  async ({ browser }) => {
    const subject = readSubject();
    const anonymous = await newAnonymousContext(browser);
    const response = await anonymous.request.get(
      `${LifecycleBase}/v1/dpps/${encodeURIComponent(subject.passportId)}`,
    );
    expect(response.status(), "ReadDPPById").toBe(200);
    expect(response.headers()["content-type"]).toMatch(/^application\/json/);
    expect(await response.text()).toContain(subject.passportId);
    await anonymous.close();
  },
);

check(
  {
    id: "api.read-dpp-ids-by-product-ids",
    title:
      "a set of product identifiers posted to v1/dppsByProductIds returns the ids of the matching passports",
    criteria: [
      "EN18222-4.1(2)",
      "EN18222-4.5(1)",
      "EN18222-8.2",
      "ESPR-Art10(1)(d)",
      "ESPR-Art11(a)",
      "ESPR-Art11(b)",
    ],
  },
  async ({ browser }) => {
    const subject = readSubject();
    const anonymous = await newAnonymousContext(browser);
    const response = await anonymous.request.post(`${LifecycleBase}/v1/dppsByProductIds`, {
      data: [subject.digitalLink],
    });
    expect(response.status(), "ReadDPPIdsByProductIds").toBe(200);
    expect(await response.text()).toContain(subject.passportId);
    await anonymous.close();
  },
);

/** A draft passport with one submodel of two properties, deleted again by the returned callback. */
const draftWithProperties = async (request: APIRequestContext, orgId: string) => {
  const created = await request.post(`${ApiBase}/passports`, {
    headers: orgHeaders(orgId),
    data: { environment: { assetAdministrationShells: [{}] } },
  });
  expect(created.status(), "a blank draft passport should be created").toBe(201);
  const { id: passportId } = (await created.json()) as { id: string };
  const submodel = await request.post(`${ApiBase}/passports/${passportId}/submodels`, {
    headers: orgHeaders(orgId),
    data: {
      idShort: "UpdateProbe",
      submodelElements: [
        { modelType: "Property", idShort: "Name", valueType: "String", value: "before" },
        { modelType: "Property", idShort: "Weight", valueType: "Double", value: "1.5" },
      ],
    },
  });
  expect(submodel.status(), "the probe submodel should be added").toBe(201);
  const { id: submodelId } = (await submodel.json()) as { id: string };
  return {
    submodelUrl: `${ApiBase}/passports/${passportId}/submodels/${Buffer.from(submodelId).toString("base64")}`,
    remove: async () => {
      const deleted = await request.delete(`${ApiBase}/passports/${passportId}`, {
        headers: orgHeaders(orgId),
      });
      expect(deleted.ok(), `the draft passport ${passportId} should be deleted again`).toBeTruthy();
    },
  };
};

check(
  {
    id: "api.update-all-or-nothing",
    title: "an update with one invalid part is refused as a whole and changes nothing",
    criteria: ["EN18222-4.7(3)"],
  },
  async ({ request }) => {
    const { orgId } = readSubject();
    const draft = await draftWithProperties(request, orgId);
    const update = await request.patch(`${draft.submodelUrl}/$value`, {
      headers: orgHeaders(orgId),
      data: { Name: "after", Weight: "not-a-number" },
    });
    expect(update.status(), "the update holding an invalid part").toBe(400);
    const name = await request.get(`${draft.submodelUrl}/submodel-elements/Name`, {
      headers: orgHeaders(orgId),
    });
    expect(((await name.json()) as { value: string }).value, "the valid part").toBe("before");
    await draft.remove();
  },
);

check(
  {
    id: "api.error-answer-error-only",
    title: "a failed request is answered with an error object and no payload",
    criteria: ["EN18222-7.2(2)"],
  },
  async ({ request }) => {
    const { orgId } = readSubject();
    const response = await request.get(
      `${ApiBase}/passports/00000000-0000-4000-8000-000000000000`,
      { headers: orgHeaders(orgId) },
    );
    expect(response.status()).toBe(404);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.message, "the error object explains the failure").toBeTruthy();
    for (const payloadKey of ["id", "environment", "result", "payload"]) {
      expect(body, `no payload field "${payloadKey}"`).not.toHaveProperty(payloadKey);
    }
  },
);

check(
  {
    id: "api.missing-credentials-answer-401",
    title: "a request without credentials to a members-only passport route is answered 401",
    criteria: ["EN18222-7.2(6)"],
  },
  async ({ browser }) => {
    const subject = readSubject();
    const anonymous = await newAnonymousContext(browser);
    const response = await anonymous.request.get(`${ApiBase}/passports/${subject.passportId}`, {
      headers: orgHeaders(subject.orgId),
    });
    // Table 15 maps missing or wrong credentials to 401 and a refused authorisation to 403.
    expect(response.status()).toBe(401);
    await anonymous.close();
  },
);
