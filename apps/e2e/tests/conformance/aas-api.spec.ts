/**
 * AAS API (IDTA-01002 Part 2 V3.2.0, a declared standard of open-dpp): the HTTP conventions of the
 * AAS Repository and Submodel Repository service specifications (identifier encoding, idShortPath,
 * pagination, serialization modifiers, status codes and the Result object) and the operations of the
 * two Full profiles, against the per-passport base URL open-dpp serves them at. Reads use the
 * published subject as a member; probes that write create a blank draft passport and delete it again.
 * Added in wayfinder ticket #1045.
 */
import type { APIRequestContext } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { ApiBase } from "../config";
import { check, expect } from "./checks";
import { base64, type Draft, orgHeaders, withDraft } from "./draft";
import { readSubject, type Subject } from "./subject";
import { CONTENT_SUBMODEL_ID_SHORT } from "./subject-content";

const base64url = (id: string): string => Buffer.from(id).toString("base64url");

type Paged<T> = { result: T[]; paging_metadata?: { cursor?: string | null } };

/** 1x1 PNG, the Blob content of the extent probe. */
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

/** The member base of the subject passport: an AAS Repository and a Submodel Repository at one base. */
const subjectBase = (subject: Subject): string => `${ApiBase}/passports/${subject.passportId}`;

const memberHeaders = () => orgHeaders(readSubject().orgId);

const draftBase = (draft: Draft): string => `${ApiBase}/passports/${draft.passportId}`;

const property = (idShort: string, value = "probe") => ({
  modelType: "Property",
  idShort,
  valueType: "String",
  value,
});

const languageText = (text: string) => [{ language: "en", text }];

/** The subject's content submodel: its id and its URL below the member base. */
const contentSubmodel = async (
  request: APIRequestContext,
): Promise<{ id: string; url: string }> => {
  const subject = readSubject();
  const response = await request.get(`${subjectBase(subject)}/submodels`, {
    headers: memberHeaders(),
  });
  expect(response.status(), "list the subject's submodels").toBe(200);
  const { result } = (await response.json()) as Paged<{ id: string; idShort: string }>;
  const content = result.find((s) => s.idShort === CONTENT_SUBMODEL_ID_SHORT);
  expect(content, "the subject carries its content submodel").toBeDefined();
  return { id: content!.id, url: `${subjectBase(subject)}/submodels/${base64(content!.id)}` };
};

/** The id of the subject's one shell. */
const subjectShellId = async (request: APIRequestContext): Promise<string> => {
  const response = await request.get(`${subjectBase(readSubject())}/shells`, {
    headers: memberHeaders(),
  });
  expect(response.status(), "list the subject's shells").toBe(200);
  const { result } = (await response.json()) as Paged<{ id: string }>;
  expect(result.length, "the subject has one shell").toBeGreaterThan(0);
  return result[0].id;
};

/** Walks a listing page by page and returns the idShorts in the order the pages gave them. */
const walkPages = async (
  request: APIRequestContext,
  url: string,
  limit: number,
): Promise<string[]> => {
  const seen: string[] = [];
  let cursor: string | null | undefined;
  for (let page = 0; page < 20; page++) {
    const query = cursor
      ? `?limit=${limit}&cursor=${encodeURIComponent(cursor)}`
      : `?limit=${limit}`;
    const response = await request.get(`${url}${query}`, { headers: memberHeaders() });
    expect(response.status(), `page ${page}`).toBe(200);
    const body = (await response.json()) as Paged<{ idShort: string }>;
    expect(body.result.length, `page ${page} holds at most limit items`).toBeLessThanOrEqual(limit);
    seen.push(...body.result.map((e) => e.idShort));
    cursor = body.paging_metadata?.cursor;
    if (!cursor || body.result.length === 0) break;
  }
  return seen;
};

// HTTP/REST API: addressing

check(
  {
    id: "aasapi.base64url-identifier-accepted",
    title: "a submodel is reached by its base64url-encoded identifier, without padding",
    criteria: ["IDTA01002-IdentifierEncoding"],
  },
  async ({ request }) => {
    await withDraft(request, async (draft) => {
      // An id whose base64url form differs from standard base64 ('+' and '=' in the latter).
      const id = "urn:open-dpp:conformance:~~~~";
      expect(base64url(id), "the probe id tells base64url from base64").not.toBe(base64(id));
      const created = await draft.addSubmodel({ id, idShort: "Encoded", submodelElements: [] });
      expect(created.status(), "a submodel with an own id is created").toBe(201);
      const response = await request.get(`${draftBase(draft)}/submodels/${base64url(id)}`, {
        headers: memberHeaders(),
      });
      expect(response.status(), "GET /submodels/{base64url id}").toBe(200);
      expect(((await response.json()) as { id: string }).id).toBe(id);
    });
  },
);

check(
  {
    id: "aasapi.idshortpath-list-index",
    title: "a SubmodelElementList item is addressed by its index in square brackets",
    criteria: ["IDTA01002-IdShortPath"],
  },
  async ({ request }) => {
    const content = await contentSubmodel(request);
    const response = await request.get(`${content.url}/submodel-elements/Materials%5B0%5D`, {
      headers: memberHeaders(),
    });
    expect(response.status(), "GET …/submodel-elements/Materials[0]").toBe(200);
    expect(((await response.json()) as { modelType: string }).modelType).toBe(
      "SubmodelElementCollection",
    );
  },
);

check(
  {
    id: "aasapi.idshort-case-sensitive",
    title: "idShorts in paths are compared case-sensitively",
    criteria: ["IDTA01002-IdShortCaseSensitive"],
  },
  async ({ request }) => {
    const content = await contentSubmodel(request);
    const exact = await request.get(`${content.url}/submodel-elements/TradeName`, {
      headers: memberHeaders(),
    });
    expect(exact.status(), "the exact idShort").toBe(200);
    const lowered = await request.get(`${content.url}/submodel-elements/tradename`, {
      headers: memberHeaders(),
    });
    expect(lowered.status(), "the idShort in another case").toBe(404);
  },
);

// Description interface and the AAS Repository

check(
  {
    id: "aasapi.description-lists-profiles",
    title: "GET /description lists the service specification profiles the base URL implements",
    criteria: ["IDTA01002-GetSelfDescription"],
  },
  async ({ request }) => {
    const response = await request.get(`${subjectBase(readSubject())}/description`, {
      headers: memberHeaders(),
    });
    expect(response.status(), "GET /description").toBe(200);
    const { profiles } = (await response.json()) as { profiles?: string[] };
    expect(Array.isArray(profiles), "a profiles array").toBe(true);
    expect(profiles!.some((p) => p.startsWith("https://admin-shell.io/aas/API/3/"))).toBe(true);
  },
);

check(
  {
    id: "aasapi.shells-paged-result",
    title: "GET /shells answers a paged Result with result and paging_metadata",
    criteria: ["IDTA01002-GetAllAssetAdministrationShells", "IDTA01002-Pagination"],
  },
  async ({ request }) => {
    const response = await request.get(`${subjectBase(readSubject())}/shells`, {
      headers: memberHeaders(),
    });
    expect(response.status(), "GET /shells").toBe(200);
    const body = (await response.json()) as Paged<{ id: string }>;
    expect(Array.isArray(body.result), "result array").toBe(true);
    expect(typeof body.paging_metadata, "paging_metadata object").toBe("object");
  },
);

check(
  {
    id: "aasapi.shell-by-id",
    title: "GET /shells/{aasIdentifier} returns the shell with that identifier",
    criteria: ["IDTA01002-GetAssetAdministrationShellById"],
  },
  async ({ request }) => {
    const id = await subjectShellId(request);
    const response = await request.get(`${subjectBase(readSubject())}/shells/${base64url(id)}`, {
      headers: memberHeaders(),
    });
    expect(response.status(), "GET /shells/{aasIdentifier}").toBe(200);
    expect(((await response.json()) as { id: string }).id).toBe(id);
  },
);

check(
  {
    id: "aasapi.submodel-refs-superpath",
    title:
      "GET /shells/{aasIdentifier}/submodel-refs returns the shell's submodel references, paged",
    criteria: ["IDTA01002-GetAllSubmodelReferences", "IDTA01002-Superpaths"],
  },
  async ({ request }) => {
    const id = await subjectShellId(request);
    const response = await request.get(
      `${subjectBase(readSubject())}/shells/${base64url(id)}/submodel-refs`,
      { headers: memberHeaders() },
    );
    expect(response.status(), "GET …/submodel-refs").toBe(200);
    const { result } = (await response.json()) as Paged<{ keys: unknown[] }>;
    expect(Array.isArray(result), "result array").toBe(true);
    expect(result.length, "the subject's submodels are referenced").toBeGreaterThan(0);
    expect(Array.isArray(result[0].keys), "a Reference has keys").toBe(true);
  },
);

check(
  {
    id: "aasapi.asset-information",
    title: "GET /shells/{aasIdentifier}/asset-information returns the shell's asset information",
    criteria: ["IDTA01002-GetAssetInformation"],
  },
  async ({ request }) => {
    const id = await subjectShellId(request);
    const response = await request.get(
      `${subjectBase(readSubject())}/shells/${base64url(id)}/asset-information`,
      { headers: memberHeaders() },
    );
    expect(response.status(), "GET …/asset-information").toBe(200);
    expect(((await response.json()) as { assetKind?: string }).assetKind).toBeDefined();
  },
);

// Pagination

check(
  {
    id: "aasapi.pagination-end-without-cursor",
    title: "the last page of a listing carries no cursor",
    criteria: ["IDTA01002-Pagination"],
  },
  async ({ request }) => {
    const content = await contentSubmodel(request);
    const response = await request.get(`${content.url}/submodel-elements?limit=100`, {
      headers: memberHeaders(),
    });
    expect(response.status()).toBe(200);
    const body = (await response.json()) as Paged<{ idShort: string }>;
    expect(body.result.length, "one page holds the whole submodel").toBeGreaterThan(0);
    expect(body.paging_metadata?.cursor ?? null, "no cursor after the last item").toBeNull();
  },
);

check(
  {
    id: "aasapi.pagination-walk-deterministic",
    title: "pages of at most limit items walk the whole listing in a stable order",
    criteria: ["IDTA01002-Pagination-order", "IDTA01002-Pagination"],
  },
  async ({ request }) => {
    const content = await contentSubmodel(request);
    const url = `${content.url}/submodel-elements`;
    const whole = await request.get(url, { headers: memberHeaders() });
    const all = ((await whole.json()) as Paged<{ idShort: string }>).result.map((e) => e.idShort);
    expect(all.length, "the content submodel has several elements").toBeGreaterThan(3);
    const first = await walkPages(request, url, 3);
    expect(first, "the pages add up to the listing, in its order").toEqual(all);
    const second = await walkPages(request, url, 3);
    expect(second, "a second walk gives the same order").toEqual(first);
  },
);

check(
  {
    id: "aasapi.pagination-negative-limit-refused",
    title: "a negative limit is refused",
    criteria: ["IDTA01002-Pagination"],
  },
  async ({ request }) => {
    const content = await contentSubmodel(request);
    // The text types limit as a non-negative integer and the OpenAPI file gives it a minimum of 1;
    // both exclude a negative value.
    const response = await request.get(`${content.url}/submodel-elements?limit=-1`, {
      headers: memberHeaders(),
    });
    expect(response.status(), "limit=-1").toBe(400);
  },
);

check(
  {
    id: "aasapi.empty-cursor-refused",
    title: "an empty cursor parameter is refused (AASa-001)",
    criteria: ["IDTA01002-AASa-001"],
  },
  async ({ request }) => {
    const content = await contentSubmodel(request);
    const response = await request.get(`${content.url}/submodel-elements?limit=1&cursor=`, {
      headers: memberHeaders(),
    });
    expect(response.status(), "cursor=").toBe(400);
  },
);

// Serialization modifiers

check(
  {
    id: "aasapi.level-core-direct-children-only",
    title: "level=core returns the element and its direct children without their descendants",
    criteria: ["IDTA01002-Level"],
  },
  async ({ request }) => {
    const content = await contentSubmodel(request);
    const response = await request.get(`${content.url}/submodel-elements/Materials?level=core`, {
      headers: memberHeaders(),
    });
    expect(response.status()).toBe(200);
    const { value } = (await response.json()) as { value: { value?: unknown[] }[] };
    expect(value.length, "the list's direct children are present").toBeGreaterThan(0);
    for (const item of value) {
      expect(item.value ?? [], "a direct child comes without its own children").toHaveLength(0);
    }
  },
);

check(
  {
    id: "aasapi.metadata-suffix",
    title: "the /$metadata suffix returns the element without its value",
    criteria: ["IDTA01002-Content-Metadata"],
  },
  async ({ request }) => {
    const content = await contentSubmodel(request);
    const response = await request.get(`${content.url}/submodel-elements/TradeName/$metadata`, {
      headers: memberHeaders(),
    });
    expect(response.status(), "GET …/TradeName/$metadata").toBe(200);
    const body = (await response.json()) as { idShort?: string; value?: unknown };
    expect(body.idShort).toBe("TradeName");
    expect(body.value, "no value in the metadata").toBeUndefined();
  },
);

check(
  {
    id: "aasapi.reference-suffix",
    title: "the /$reference suffix returns a model reference to the element",
    criteria: ["IDTA01002-Content-Reference"],
  },
  async ({ request }) => {
    const content = await contentSubmodel(request);
    const response = await request.get(`${content.url}/submodel-elements/TradeName/$reference`, {
      headers: memberHeaders(),
    });
    expect(response.status(), "GET …/TradeName/$reference").toBe(200);
    const body = (await response.json()) as { type?: string; keys?: { value: string }[] };
    expect(body.type).toBe("ModelReference");
    expect(body.keys?.at(-1)?.value).toBe("TradeName");
  },
);

check(
  {
    id: "aasapi.path-suffix",
    title: "the /$path suffix returns the idShortPaths of the submodel's elements",
    criteria: ["IDTA01002-Content-Path"],
  },
  async ({ request }) => {
    const content = await contentSubmodel(request);
    const response = await request.get(`${content.url}/$path`, { headers: memberHeaders() });
    expect(response.status(), "GET /submodels/{id}/$path").toBe(200);
    const body = (await response.json()) as unknown;
    expect(Array.isArray(body), "an array of idShortPaths").toBe(true);
    expect(body as string[]).toContain("Manufacturer.Name");
  },
);

check(
  {
    id: "aasapi.value-suffix-unnamed-root",
    title: "the /$value suffix returns the Value-Only form as an unnamed object keyed by idShort",
    criteria: ["IDTA01002-Content-Value", "IDTA01002-GetSubmodelElementValueByPath"],
  },
  async ({ request }) => {
    const content = await contentSubmodel(request);
    const response = await request.get(`${content.url}/submodel-elements/Manufacturer/$value`, {
      headers: memberHeaders(),
    });
    expect(response.status(), "GET …/Manufacturer/$value").toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body, "the collection's children keyed by idShort").toHaveProperty("Name");
    expect(body, "no idShort at the root").not.toHaveProperty("idShort");
    expect(body, "no modelType at the root").not.toHaveProperty("modelType");
  },
);

check(
  {
    id: "aasapi.extent-default-omits-blob-value",
    title: "a Blob is read without its content unless extent=withBlobValue is asked",
    criteria: ["IDTA01002-Extent"],
  },
  async ({ request }) => {
    await withDraft(request, async (draft) => {
      const created = await draft.addElement({
        modelType: "Blob",
        idShort: "Picture",
        contentType: "image/png",
        value: PNG_BASE64,
      });
      expect(created.status(), "a Blob with content is created").toBe(201);
      const url = `${draft.submodelUrl}/submodel-elements/Picture`;
      const plain = await request.get(url, { headers: memberHeaders() });
      expect(((await plain.json()) as { value?: string }).value, "default extent").toBeUndefined();
      const withBlob = await request.get(`${url}?extent=withBlobValue`, {
        headers: memberHeaders(),
      });
      expect(((await withBlob.json()) as { value?: string }).value, "withBlobValue").toBe(
        PNG_BASE64,
      );
    });
  },
);

check(
  {
    id: "aasapi.modifier-combination-refused",
    title: "content=metadata combined with a level is refused with 400",
    criteria: ["IDTA01002-ModifierConstraints"],
  },
  async ({ request }) => {
    const content = await contentSubmodel(request);
    const response = await request.get(`${content.url}/$metadata?level=core`, {
      headers: memberHeaders(),
    });
    expect(response.status(), "GET /submodels/{id}/$metadata?level=core").toBe(400);
  },
);

check(
  {
    id: "aasapi.undefined-suffix-refused-400",
    title: "a content suffix the element type does not define is refused with 400",
    criteria: ["IDTA01002-ModifierApplicability"],
  },
  async ({ request }) => {
    const content = await contentSubmodel(request);
    // A Property defines no Path serialization.
    const response = await request.get(`${content.url}/submodel-elements/TradeName/$path`, {
      headers: memberHeaders(),
    });
    expect(response.status(), "GET …/TradeName/$path").toBe(400);
  },
);

// Status codes and the Result object

check(
  {
    id: "aasapi.duplicate-idshort-conflict-409",
    title: "posting an element whose idShort is already used answers 409",
    criteria: ["IDTA01002-PostSubmodelElement", "IDTA01002-StatusCodes"],
  },
  async ({ request }) => {
    await withDraft(request, async (draft) => {
      const first = await draft.addElement(property("Twice"));
      expect(first.status(), "the first post").toBe(201);
      const second = await draft.addElement(property("Twice"));
      expect(second.status(), "the second post of the same idShort").toBe(409);
    });
  },
);

check(
  {
    id: "aasapi.unknown-submodel-404",
    title: "a submodel identifier the repository does not hold answers 404",
    criteria: ["IDTA01002-GetSubmodelById", "IDTA01002-StatusCodes"],
  },
  async ({ request }) => {
    const response = await request.get(`${subjectBase(readSubject())}/submodels/${randomUUID()}`, {
      headers: memberHeaders(),
    });
    expect(response.status(), "GET /submodels/{unknown}").toBe(404);
  },
);

check(
  {
    id: "aasapi.unknown-element-404",
    title: "an idShortPath the submodel does not hold answers 404",
    criteria: ["IDTA01002-GetSubmodelElementByPath"],
  },
  async ({ request }) => {
    const content = await contentSubmodel(request);
    const response = await request.get(`${content.url}/submodel-elements/NoSuchElement`, {
      headers: memberHeaders(),
    });
    expect(response.status(), "GET …/NoSuchElement").toBe(404);
  },
);

check(
  {
    id: "aasapi.created-201-with-location",
    title: "a created submodel is answered 201 with a Location header",
    criteria: ["IDTA01002-PostSubmodel", "IDTA01002-StatusCodes"],
  },
  async ({ request }) => {
    await withDraft(request, async (draft) => {
      const created = await draft.addSubmodel({ idShort: "Located", submodelElements: [] });
      expect(created.status(), "POST /submodels").toBe(201);
      const location = created.headers()["location"];
      expect(location, "Location header").toBeDefined();
      expect(location).toContain("/submodels/");
    });
  },
);

check(
  {
    id: "aasapi.attachment-of-non-file-405",
    title: "the attachment of an element that is no File answers 405",
    criteria: ["IDTA01002-StatusCodes", "IDTA01002-GetFileByPath"],
  },
  async ({ request }) => {
    const content = await contentSubmodel(request);
    // One of the 405 cases Part 2 defines: GetFileByPath on an element that is no File.
    const response = await request.get(`${content.url}/submodel-elements/TradeName/attachment`, {
      headers: memberHeaders(),
    });
    expect(response.status(), "GET …/TradeName/attachment").toBe(405);
  },
);

check(
  {
    id: "aasapi.error-result-messages",
    title: "a failed request is answered with a Result object holding typed messages",
    criteria: ["IDTA01002-Result"],
  },
  async ({ request }) => {
    const content = await contentSubmodel(request);
    const response = await request.get(`${content.url}/submodel-elements/NoSuchElement`, {
      headers: memberHeaders(),
    });
    expect(response.status()).toBe(404);
    const body = (await response.json()) as {
      messages?: { messageType?: string; text?: string }[];
    };
    expect(Array.isArray(body.messages), "a messages array").toBe(true);
    expect(body.messages![0]?.messageType, "a messageType").toBeDefined();
    expect(body.messages![0]?.text, "a text").toBeDefined();
  },
);

// Submodel Repository: write operations

check(
  {
    id: "aasapi.post-same-id-not-duplicated",
    title: "posting a submodel with an id the passport already holds creates no second one",
    criteria: ["IDTA01002-Methods-POST"],
  },
  async ({ request }) => {
    await withDraft(request, async (draft) => {
      const id = `urn:open-dpp:conformance:${randomUUID()}`;
      const first = await draft.addSubmodel({ id, idShort: "SameA", submodelElements: [] });
      expect(first.status(), "the first post").toBe(201);
      const second = await draft.addSubmodel({ id, idShort: "SameB", submodelElements: [] });
      expect(second.status(), "the second post of the same id is refused").toBeGreaterThanOrEqual(
        400,
      );
      const listed = await request.get(`${draftBase(draft)}/submodels`, {
        headers: memberHeaders(),
      });
      const { result } = (await listed.json()) as Paged<{ id: string }>;
      expect(
        result.filter((s) => s.id === id),
        "the id is held once",
      ).toHaveLength(1);
    });
  },
);

check(
  {
    id: "aasapi.post-into-list-appends",
    title: "an element posted below a SubmodelElementList is appended at its end",
    criteria: ["IDTA01002-PostSubmodelElementByPath", "IDTA01002-Methods-POST"],
  },
  async ({ request }) => {
    await withDraft(request, async (draft) => {
      const list = await draft.addElement({
        modelType: "SubmodelElementList",
        idShort: "Queue",
        typeValueListElement: "Property",
        valueTypeListElement: "String",
        value: [property("First"), property("Second")],
      });
      expect(list.status(), "a list of two is created").toBe(201);
      const appended = await request.post(`${draft.submodelUrl}/submodel-elements/Queue`, {
        headers: memberHeaders(),
        data: property("Third"),
      });
      expect(appended.status(), "POST …/submodel-elements/Queue").toBe(201);
      const read = await request.get(`${draft.submodelUrl}/submodel-elements/Queue`, {
        headers: memberHeaders(),
      });
      const { value } = (await read.json()) as { value: { idShort: string }[] };
      expect(
        value.map((e) => e.idShort),
        "appended at the end",
      ).toEqual(["First", "Second", "Third"]);
    });
  },
);

check(
  {
    id: "aasapi.put-submodel-replaces",
    title: "PUT /submodels/{submodelIdentifier} replaces the submodel and answers 204",
    criteria: ["IDTA01002-PutSubmodelById", "IDTA01002-Methods-PUT"],
  },
  async ({ request }) => {
    await withDraft(request, async (draft) => {
      const before = await request.get(draft.submodelUrl, { headers: memberHeaders() });
      const { id } = (await before.json()) as { id: string };
      const replaced = await request.put(draft.submodelUrl, {
        headers: memberHeaders(),
        data: { id, idShort: "Replaced", submodelElements: [] },
      });
      expect(replaced.status(), "PUT /submodels/{id}").toBe(204);
      const after = await request.get(draft.submodelUrl, { headers: memberHeaders() });
      expect(((await after.json()) as { idShort: string }).idShort).toBe("Replaced");
    });
  },
);

check(
  {
    id: "aasapi.patch-element-204",
    title: "PATCH …/submodel-elements/{idShortPath} updates the element and answers 204",
    criteria: ["IDTA01002-PatchSubmodelElementByPath"],
  },
  async ({ request }) => {
    await withDraft(request, async (draft) => {
      const created = await draft.addElement(property("Renamable"));
      expect(created.status()).toBe(201);
      const url = `${draft.submodelUrl}/submodel-elements/Renamable`;
      const patched = await request.patch(url, {
        headers: memberHeaders(),
        data: { idShort: "Renamable", displayName: languageText("Renamed") },
      });
      expect(patched.status(), "PATCH …/Renamable").toBe(204);
      const read = await request.get(url, { headers: memberHeaders() });
      const { displayName } = (await read.json()) as { displayName: { text: string }[] };
      expect(displayName[0]?.text).toBe("Renamed");
    });
  },
);

check(
  {
    id: "aasapi.patch-value-204",
    title: "PATCH …/{idShortPath}/$value sets the value from the Value-Only form and answers 204",
    criteria: ["IDTA01002-PatchSubmodelElementValueByPath"],
  },
  async ({ request }) => {
    await withDraft(request, async (draft) => {
      const created = await draft.addElement({
        modelType: "SubmodelElementCollection",
        idShort: "Box",
        value: [property("Val", "before")],
      });
      expect(created.status()).toBe(201);
      const url = `${draft.submodelUrl}/submodel-elements/Box`;
      const patched = await request.patch(`${url}/$value`, {
        headers: memberHeaders(),
        data: { Val: "after" },
      });
      expect(patched.status(), "PATCH …/Box/$value").toBe(204);
      const read = await request.get(`${url}/$value`, { headers: memberHeaders() });
      expect(((await read.json()) as { Val: string }).Val).toBe("after");
    });
  },
);

check(
  {
    id: "aasapi.delete-element-204-then-404",
    title: "DELETE …/submodel-elements/{idShortPath} answers 204, and 404 once the element is gone",
    criteria: ["IDTA01002-DeleteSubmodelElementByPath", "IDTA01002-StatusCodes"],
  },
  async ({ request }) => {
    await withDraft(request, async (draft) => {
      const created = await draft.addElement(property("Gone"));
      expect(created.status()).toBe(201);
      const url = `${draft.submodelUrl}/submodel-elements/Gone`;
      const deleted = await request.delete(url, { headers: memberHeaders() });
      expect(deleted.status(), "DELETE …/Gone").toBe(204);
      expect(await deleted.text(), "no payload").toBe("");
      const read = await request.get(url, { headers: memberHeaders() });
      expect(read.status(), "GET after the delete").toBe(404);
      const again = await request.delete(url, { headers: memberHeaders() });
      expect(again.status(), "DELETE of a missing element").toBe(404);
    });
  },
);

// Submodel Repository: filters and files

check(
  {
    id: "aasapi.semantic-id-filter",
    title: "GET /submodels?semanticId= returns only the submodels carrying that semanticId",
    criteria: ["IDTA01002-GetAllSubmodelsBySemanticId"],
  },
  async ({ request }) => {
    await withDraft(request, async (draft) => {
      const semanticId = {
        type: "ExternalReference",
        keys: [
          { type: "GlobalReference", value: "https://example.com/conformance/semantic/probe" },
        ],
      };
      const tagged = await draft.addSubmodel({
        idShort: "Tagged",
        semanticId,
        submodelElements: [],
      });
      expect(tagged.status(), "a submodel with a semanticId is created").toBe(201);
      const response = await request.get(
        `${draftBase(draft)}/submodels?semanticId=${base64url(JSON.stringify(semanticId))}`,
        { headers: memberHeaders() },
      );
      expect(response.status()).toBe(200);
      const { result } = (await response.json()) as Paged<{ idShort: string }>;
      expect(
        result.map((s) => s.idShort),
        "only the tagged submodel",
      ).toEqual(["Tagged"]);
    });
  },
);

check(
  {
    id: "aasapi.idshort-filter",
    title: "GET /submodels?idShort= returns only the submodels with that idShort",
    criteria: ["IDTA01002-GetAllSubmodelsByIdShort"],
  },
  async ({ request }) => {
    await withDraft(request, async (draft) => {
      const other = await draft.addSubmodel({ idShort: "Other", submodelElements: [] });
      expect(other.status(), "a second submodel is created").toBe(201);
      const response = await request.get(`${draftBase(draft)}/submodels?idShort=ModelProbe`, {
        headers: memberHeaders(),
      });
      expect(response.status()).toBe(200);
      const { result } = (await response.json()) as Paged<{ idShort: string }>;
      expect(
        result.map((s) => s.idShort),
        "only the ModelProbe submodel",
      ).toEqual(["ModelProbe"]);
    });
  },
);

check(
  {
    id: "aasapi.file-attachment",
    title: "GET …/submodel-elements/{idShortPath}/attachment returns a File element's content",
    criteria: ["IDTA01002-GetFileByPath"],
  },
  async ({ request }) => {
    const content = await contentSubmodel(request);
    const response = await request.get(`${content.url}/submodel-elements/ProductImage/attachment`, {
      headers: memberHeaders(),
    });
    expect(response.status(), "GET …/ProductImage/attachment").toBe(200);
    expect(response.headers()["content-type"]).toMatch(/^image\//);
  },
);
