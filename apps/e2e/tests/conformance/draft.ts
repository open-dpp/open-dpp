/**
 * A blank draft passport with one empty probe submodel, for Checks that write. Probes create the
 * draft, post to it and delete it again, also when the probe fails. Shared by the data-model and
 * metamodel Checks.
 */
import type { APIRequestContext } from "@playwright/test";
import { ApiBase } from "../config";
import { ORG_ID_HEADER } from "../helpers/passport";
import { expect } from "./checks";
import { readSubject } from "./subject";

export const orgHeaders = (orgId: string) => ({ [ORG_ID_HEADER]: orgId });
export const base64 = (id: string): string => Buffer.from(id).toString("base64");

export type Draft = {
  passportId: string;
  /** Base URL of the draft's empty probe submodel. */
  submodelUrl: string;
  addElement: (element: Record<string, unknown>) => ReturnType<APIRequestContext["post"]>;
  addSubmodel: (submodel: Record<string, unknown>) => ReturnType<APIRequestContext["post"]>;
  elementIdShorts: () => Promise<string[]>;
  remove: () => Promise<void>;
};

/** A blank draft passport with one empty submodel, deleted again by `remove`. */
export const blankDraft = async (request: APIRequestContext, orgId: string): Promise<Draft> => {
  const headers = orgHeaders(orgId);
  const created = await request.post(`${ApiBase}/passports`, {
    headers,
    data: { environment: { assetAdministrationShells: [{}] } },
  });
  expect(created.status(), "a blank draft passport should be created").toBe(201);
  const { id: passportId } = (await created.json()) as { id: string };
  const addSubmodel = (submodel: Record<string, unknown>) =>
    request.post(`${ApiBase}/passports/${passportId}/submodels`, { headers, data: submodel });
  const probe = await addSubmodel({ idShort: "ModelProbe", submodelElements: [] });
  expect(probe.status(), "the probe submodel should be added").toBe(201);
  const { id: submodelId } = (await probe.json()) as { id: string };
  const submodelUrl = `${ApiBase}/passports/${passportId}/submodels/${base64(submodelId)}`;
  return {
    passportId,
    submodelUrl,
    addSubmodel,
    addElement: (element) =>
      request.post(`${submodelUrl}/submodel-elements`, { headers, data: element }),
    elementIdShorts: async () => {
      const response = await request.get(`${submodelUrl}/submodel-elements`, { headers });
      const { result } = (await response.json()) as { result: { idShort: string }[] };
      return result.map((e) => e.idShort);
    },
    remove: async () => {
      const deleted = await request.delete(`${ApiBase}/passports/${passportId}`, { headers });
      expect(deleted.ok(), `the draft passport ${passportId} should be deleted again`).toBeTruthy();
    },
  };
};

/** Runs `probe` on a fresh blank draft and deletes the draft afterwards, also when the probe fails. */
export const withDraft = async (
  request: APIRequestContext,
  probe: (draft: Draft) => Promise<void>,
): Promise<void> => {
  const draft = await blankDraft(request, readSubject().orgId);
  try {
    await probe(draft);
  } finally {
    await draft.remove();
  }
};
