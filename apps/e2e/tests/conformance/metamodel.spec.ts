/**
 * AAS metamodel (IDTA-01001 Part 1 V3.2, a declared standard of open-dpp): the export against the
 * official V3.2 JSON schema, the AASd constraints a server can check on write, the attributes the
 * metamodel keeps optional, and the container depth it asks implementations to support. Probes
 * that write create a blank draft passport and delete it again. Added in wayfinder ticket #1044.
 */
import fs from "node:fs";
import path from "node:path";
import Ajv2019 from "ajv/dist/2019";
import { ApiBase } from "../config";
import { check, expect } from "./checks";
import { type Draft, orgHeaders, withDraft } from "./draft";
import { readSubject } from "./subject";

const SCHEMA_FILE = path.join(__dirname, "schemas/IDTA-01001-3-2.aas.schema.json");

const property = (idShort: string, extra: Record<string, unknown> = {}) => ({
  modelType: "Property",
  idShort,
  valueType: "String",
  value: "probe",
  ...extra,
});

const globalReference = (value: string) => ({
  type: "ExternalReference",
  keys: [{ type: "GlobalReference", value }],
});

const qualifier = (type: string, extra: Record<string, unknown> = {}) => ({
  type,
  valueType: "String",
  value: "probe",
  kind: "ConceptQualifier",
  ...extra,
});

/** Posts each element to a fresh draft and returns the statuses that were not 400. */
const acceptedOf = async (
  draft: Draft,
  elements: Record<string, unknown>[],
): Promise<{ idShort: unknown; status: number }[]> => {
  const accepted: { idShort: unknown; status: number }[] = [];
  for (const element of elements) {
    const response = await draft.addElement(element);
    if (response.status() !== 400) accepted.push({ idShort: element.idShort, status: response.status() });
  }
  return accepted;
};

check(
  {
    id: "metamodel.export-matches-v32-json-schema",
    title: "the environment of the JSON export validates against the official IDTA-01001 V3.2 JSON schema",
    criteria: ["IDTA01001-JSON-environment", "IDTA01001-JSON-rules"],
  },
  async ({ request }) => {
    const subject = readSubject();
    const response = await request.get(`${ApiBase}/passports/${subject.passportId}/export`, {
      headers: orgHeaders(subject.orgId),
    });
    expect(response.status()).toBe(200);
    const { environment } = (await response.json()) as { environment?: unknown };
    expect(environment, "export envelope carries an environment").toBeDefined();

    const schema = JSON.parse(fs.readFileSync(SCHEMA_FILE, "utf8")) as Record<string, unknown>;
    const ajv = new Ajv2019({ allErrors: true, strict: false, unicodeRegExp: false });
    const validate = ajv.compile(schema);
    validate(environment);
    const errors = (validate.errors ?? []).map((e) => `${e.instancePath} ${e.message}`);
    expect(errors.slice(0, 15), `${errors.length} schema violations`).toEqual([]);
  },
);

check(
  {
    id: "metamodel.idshort-syntax-enforced",
    title: "an idShort that breaks AASd-002 (leading digit, one character, trailing hyphen) is refused",
    criteria: ["IDTA01001-AASd-002"],
  },
  async ({ request }) =>
    withDraft(request, async (draft) => {
      const accepted = await acceptedOf(draft, [
        property("1Leading"),
        property("a"),
        property("Trailing-"),
        property("has space"),
      ]);
      expect(accepted, "idShorts breaking AASd-002 that were accepted").toEqual([]);
    }),
);

check(
  {
    id: "metamodel.list-items-without-idshort",
    title: "a list whose items carry no idShort is accepted (AASd-117 exempts direct list children)",
    criteria: ["IDTA01001-Referable"],
  },
  async ({ request }) =>
    withDraft(request, async (draft) => {
      const response = await draft.addElement({
        modelType: "SubmodelElementList",
        idShort: "Unnamed",
        typeValueListElement: "Property",
        valueTypeListElement: "String",
        value: [
          { modelType: "Property", valueType: "String", value: "a" },
          { modelType: "Property", valueType: "String", value: "b" },
        ],
      });
      expect(response.status(), "list items without idShort").toBe(201);
    }),
);

check(
  {
    id: "metamodel.submodel-without-idshort",
    title: "a submodel without idShort is accepted (idShort is optional for identifiables)",
    criteria: ["IDTA01001-Identifiable"],
  },
  async ({ request }) =>
    withDraft(request, async (draft) => {
      const response = await draft.addSubmodel({ submodelElements: [] });
      expect(response.status(), "submodel without idShort").toBe(201);
    }),
);

check(
  {
    id: "metamodel.supplemental-semantic-id-needs-main",
    title: "an element with a supplemental semantic id but no main semantic id is refused (AASd-118)",
    criteria: ["IDTA01001-AASd-118"],
  },
  async ({ request }) =>
    withDraft(request, async (draft) => {
      const response = await draft.addElement(
        property("SupplementalOnly", {
          supplementalSemanticIds: [globalReference("https://example.org/supplemental")],
        }),
      );
      expect(response.status(), "supplementalSemanticIds without semanticId").toBe(400);
    }),
);

check(
  {
    id: "metamodel.qualifier-types-unique",
    title: "an element with two qualifiers of the same type is refused (AASd-021)",
    criteria: ["IDTA01001-AASd-021"],
  },
  async ({ request }) =>
    withDraft(request, async (draft) => {
      const response = await draft.addElement(
        property("TwinQualifiers", { qualifiers: [qualifier("Cardinality"), qualifier("Cardinality")] }),
      );
      expect(response.status(), "two qualifiers of one type").toBe(400);
    }),
);

check(
  {
    id: "metamodel.qualifier-value-typed",
    title: "a qualifier value that contradicts its value type is refused (AASd-020)",
    criteria: ["IDTA01001-AASd-020"],
  },
  async ({ request }) =>
    withDraft(request, async (draft) => {
      const response = await draft.addElement(
        property("TypedQualifier", { qualifiers: [qualifier("Limit", { valueType: "Int", value: "abc" })] }),
      );
      expect(response.status(), "qualifier Int value abc").toBe(400);
    }),
);

check(
  {
    id: "metamodel.qualifier-kind-optional",
    title: "a qualifier without kind is accepted (kind is optional, default ConceptQualifier)",
    criteria: ["IDTA01001-Qualifiable"],
  },
  async ({ request }) =>
    withDraft(request, async (draft) => {
      const { kind: _kind, ...withoutKind } = qualifier("Unkinded");
      const response = await draft.addElement(property("KindlessQualifier", { qualifiers: [withoutKind] }));
      expect(response.status(), "qualifier without kind").toBe(201);
    }),
);

check(
  {
    id: "metamodel.extension-names-unique",
    title: "an element with two extensions of the same name is refused (AASd-077)",
    criteria: ["IDTA01001-AASd-077"],
  },
  async ({ request }) =>
    withDraft(request, async (draft) => {
      const response = await draft.addElement(
        property("TwinExtensions", {
          extensions: [
            { name: "Origin", valueType: "String", value: "a" },
            { name: "Origin", valueType: "String", value: "b" },
          ],
        }),
      );
      expect(response.status(), "two extensions of one name").toBe(400);
    }),
);

check(
  {
    id: "metamodel.reference-has-keys",
    title: "a reference without keys is refused (Reference/key is 1..*)",
    criteria: ["IDTA01001-Reference"],
  },
  async ({ request }) =>
    withDraft(request, async (draft) => {
      const response = await draft.addElement({
        modelType: "ReferenceElement",
        idShort: "KeylessReference",
        value: { type: "ExternalReference", keys: [] },
      });
      expect(response.status(), "reference with no key").toBe(400);
    }),
);

check(
  {
    id: "metamodel.model-reference-starts-with-identifiable",
    title: "a model reference whose first key is no identifiable is refused (AASd-123)",
    criteria: ["IDTA01001-AASd-123"],
  },
  async ({ request }) =>
    withDraft(request, async (draft) => {
      const response = await draft.addElement({
        modelType: "ReferenceElement",
        idShort: "RootlessReference",
        value: { type: "ModelReference", keys: [{ type: "Property", value: "Temperature" }] },
      });
      expect(response.status(), "model reference starting with a Property key").toBe(400);
    }),
);

check(
  {
    id: "metamodel.self-managed-entity-has-asset-id",
    title: "a self-managed entity without global or specific asset id is refused (AASd-014)",
    criteria: ["IDTA01001-AASd-014"],
  },
  async ({ request }) =>
    withDraft(request, async (draft) => {
      const response = await draft.addElement({
        modelType: "Entity",
        idShort: "AnonymousEntity",
        entityType: "SelfManagedEntity",
        statements: [],
      });
      expect(response.status(), "self-managed entity without asset id").toBe(400);
    }),
);

check(
  {
    id: "metamodel.list-child-semantic-id-matches",
    title: "a list item whose semantic id differs from the list's semanticIdListElement is refused (AASd-107)",
    criteria: ["IDTA01001-AASd-107"],
  },
  async ({ request }) =>
    withDraft(request, async (draft) => {
      const response = await draft.addElement({
        modelType: "SubmodelElementList",
        idShort: "MismatchedSemantics",
        typeValueListElement: "Property",
        valueTypeListElement: "String",
        semanticIdListElement: globalReference("https://example.org/expected"),
        value: [property("Item0", { semanticId: globalReference("https://example.org/other") })],
      });
      expect(response.status(), "list item with a foreign semantic id").toBe(400);
    }),
);

check(
  {
    id: "metamodel.property-list-declares-value-type",
    title: "a list of properties without valueTypeListElement is refused (AASd-109)",
    criteria: ["IDTA01001-AASd-109"],
  },
  async ({ request }) =>
    withDraft(request, async (draft) => {
      const response = await draft.addElement({
        modelType: "SubmodelElementList",
        idShort: "UntypedList",
        typeValueListElement: "Property",
        value: [property("Item0")],
      });
      expect(response.status(), "property list without valueTypeListElement").toBe(400);
    }),
);

check(
  {
    id: "metamodel.string-characters-xml-safe",
    title: "a string holding a character outside the XML 1.0 set is refused (AASd-130)",
    criteria: ["IDTA01001-AASd-130"],
  },
  async ({ request }) =>
    withDraft(request, async (draft) => {
      const response = await draft.addElement(property("ControlCharacter", { value: "bell\u0007" }));
      expect(response.status(), "value with U+0007").toBe(400);
    }),
);

check(
  {
    id: "metamodel.container-depth-32",
    title: "collections nested 32 levels deep are stored and read back whole",
    criteria: ["IDTA01001-Designators-depth32"],
  },
  async ({ request }) =>
    withDraft(request, async (draft) => {
      const DEPTH = 32;
      let element: Record<string, unknown> = property("Leaf");
      for (let level = DEPTH; level >= 1; level--) {
        element = { modelType: "SubmodelElementCollection", idShort: `Level${level}`, value: [element] };
      }
      const created = await draft.addElement(element);
      expect(created.status(), "32 nested collections").toBe(201);

      const read = await request.get(draft.submodelUrl, { headers: orgHeaders(readSubject().orgId) });
      expect(read.status()).toBe(200);
      let node = ((await read.json()) as { submodelElements: Record<string, unknown>[] }).submodelElements.find(
        (e) => e.idShort === "Level1",
      );
      let levels = 0;
      while (node && node.modelType === "SubmodelElementCollection") {
        levels += 1;
        node = (node.value as Record<string, unknown>[])[0];
      }
      expect(levels, "collection levels read back").toBe(DEPTH);
      expect(node?.idShort, "the leaf at the bottom").toBe("Leaf");
    }),
);

check(
  {
    id: "metamodel.file-content-type-optional",
    title: "a file element without contentType is accepted (File/contentType is 0..1)",
    criteria: ["IDTA01001-File"],
  },
  async ({ request }) =>
    withDraft(request, async (draft) => {
      const response = await draft.addElement({
        modelType: "File",
        idShort: "UntypedFile",
        value: "https://example.org/manual.pdf",
      });
      expect(response.status(), "file without contentType").toBe(201);
    }),
);

check(
  {
    id: "metamodel.entity-type-optional",
    title: "an entity without entityType is accepted (Entity/entityType is 0..1)",
    criteria: ["IDTA01001-Entity"],
  },
  async ({ request }) =>
    withDraft(request, async (draft) => {
      const response = await draft.addElement({
        modelType: "Entity",
        idShort: "UntypedEntity",
        statements: [],
      });
      expect(response.status(), "entity without entityType").toBe(201);
    }),
);

check(
  {
    id: "metamodel.relationship-ends-optional",
    title: "a relationship element without first and second is accepted (both are 0..1)",
    criteria: ["IDTA01001-RelationshipElement"],
  },
  async ({ request }) =>
    withDraft(request, async (draft) => {
      const response = await draft.addElement({
        modelType: "RelationshipElement",
        idShort: "OpenRelationship",
      });
      expect(response.status(), "relationship element without ends").toBe(201);
    }),
);
