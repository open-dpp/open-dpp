/**
 * Data model and serialisation (EN 18223): the identifiers, element ids, value data types and
 * language tags a passport can hold, the compressed JSON of its values, and the DPP header of
 * Table 1. Probes that write create a blank draft passport and delete it again. Added in wayfinder
 * ticket #762.
 */
import type { Browser } from "@playwright/test";
import { ApiBase } from "../config";
import { newAnonymousContext } from "../helpers/anonymous";
import { check, expect } from "./checks";
import { base64, orgHeaders, withDraft } from "./draft";
import { readSubject } from "./subject";
import { CONTENT_SUBMODEL_ID_SHORT } from "./subject-content";

const permalinkOf = (publicUrl: string): string => publicUrl.split("/p/")[1].split(/[?#]/)[0];

/** RFC 9562 version 4: 122 random bits. */
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const property = (idShort: string, valueType: string, value: string) => ({
  modelType: "Property",
  idShort,
  valueType,
  value,
});

const multiLanguage = (idShort: string, language: string) => ({
  modelType: "MultiLanguageProperty",
  idShort,
  value: [{ language, text: "text" }],
});

check(
  {
    id: "model.passport-id-globally-unique",
    title: "passport ids are random version 4 UUIDs, unique worldwide by construction",
    criteria: ["EN18223-4.1.2.1(6)-sub1"],
  },
  async () => {
    const subject = readSubject();
    expect(subject.passportId).toMatch(UUID_V4);
    expect(subject.draft.passportId).toMatch(UUID_V4);
    expect(subject.passportId).not.toBe(subject.draft.passportId);
  },
);

/**
 * The XSD 1.0 built-in types 4.1.2.9 admits (all of them but the list types, the string-derived
 * types, NOTATION and QName), each with a valid sample value, in open-dpp's spelling of the type.
 */
const ADMITTED_TYPES: readonly [string, string][] = [
  ["String", "text"],
  ["Boolean", "true"],
  ["Decimal", "1.5"],
  ["Float", "1.5"],
  ["Double", "1.5"],
  ["Duration", "P1D"],
  ["DateTime", "2026-05-01T10:00:00Z"],
  ["Time", "10:00:00"],
  ["Date", "2026-05-01"],
  ["GYearMonth", "2026-05"],
  ["GYear", "2026"],
  ["GMonthDay", "--05-01"],
  ["GDay", "---01"],
  ["GMonth", "--05"],
  ["HexBinary", "0F"],
  ["Base64Binary", "aGVsbG8="],
  ["AnyUri", "https://example.com/manual"],
  ["Integer", "1"],
  ["NonPositiveInteger", "0"],
  ["NegativeInteger", "-1"],
  ["Long", "1"],
  ["Int", "1"],
  ["Short", "1"],
  ["Byte", "1"],
  ["NonNegativeInteger", "0"],
  ["UnsignedLong", "1"],
  ["UnsignedInt", "1"],
  ["UnsignedShort", "1"],
  ["UnsignedByte", "1"],
  ["PositiveInteger", "1"],
];

check(
  {
    id: "model.admitted-xsd-types-accepted",
    title: "a property takes every XSD built-in type EN 18223 admits, base64Binary included",
    criteria: ["EN18223-4.1.2.9", "EN18223-4.1.2.9(d)", "IDTA01001-DataTypeDefXsd"],
  },
  async ({ request }) =>
    withDraft(request, async (draft) => {
      for (const [valueType, value] of ADMITTED_TYPES) {
        const response = await draft.addElement(property(`P${valueType}`, valueType, value));
        expect(response.status(), valueType).toBe(201);
      }
    }),
);

/** The XSD built-in types 4.1.2.9 excludes, by item of its list. */
const EXCLUDED_TYPES: readonly [string, readonly string[]][] = [
  ["list types (a)", ["xs:ENTITIES", "xs:IDREFS", "xs:NMTOKENS"]],
  [
    "string-derived types (b)",
    [
      "xs:normalizedString",
      "xs:token",
      "xs:language",
      "xs:Name",
      "xs:NCName",
      "xs:ID",
      "xs:IDREF",
      "xs:ENTITY",
      "xs:NMTOKEN",
    ],
  ],
  ["NOTATION and QName (c)", ["xs:NOTATION", "xs:QName"]],
];

check(
  {
    id: "model.excluded-xsd-types-refused",
    title: "a property with an XSD type EN 18223 excludes is refused and nothing is stored",
    criteria: [
      "EN18223-4.1.2.9(a)",
      "EN18223-4.1.2.9(b)",
      "EN18223-4.1.2.9(c)",
      "IDTA01001-DataTypeDefXsd",
    ],
  },
  async ({ request }) =>
    withDraft(request, async (draft) => {
      for (const [group, types] of EXCLUDED_TYPES) {
        for (const valueType of types) {
          const response = await draft.addElement(property("Excluded", valueType, "a"));
          // Refusal is the requirement; the status code is EN 18222's topic (a 500 here is bug #1033).
          expect(response.ok(), `${group}: ${valueType}`).toBeFalsy();
        }
      }
      expect(await draft.elementIdShorts(), "no excluded type was stored").toEqual([]);
    }),
);

check(
  {
    id: "model.element-ids-unique-on-create",
    title: "a submodel posted with two elements of the same id is refused",
    criteria: ["EN18223-4.1.2.3(elementId)-sub1", "IDTA01001-AASd-022"],
  },
  async ({ request }) =>
    withDraft(request, async (draft) => {
      const response = await draft.addSubmodel({
        idShort: "DuplicateIds",
        submodelElements: [
          property("Same", "String", "first"),
          property("Same", "String", "second"),
        ],
      });
      expect(response.status(), "duplicate element ids at one level").toBe(400);
    }),
);

check(
  {
    id: "model.list-items-one-type",
    title: "a list declared to hold properties refuses a collection among its items",
    criteria: ["EN18223-4.1.2.1(4)(d)", "IDTA01001-AASd-108"],
  },
  async ({ request }) =>
    withDraft(request, async (draft) => {
      const response = await draft.addElement({
        modelType: "SubmodelElementList",
        idShort: "Mixed",
        typeValueListElement: "Property",
        value: [
          property("First", "String", "a"),
          { modelType: "SubmodelElementCollection", idShort: "Second", value: [] },
        ],
      });
      expect(response.status(), "a list whose items differ in type").toBe(400);
    }),
);

check(
  {
    id: "model.language-tag-with-country",
    title: "a multi-language value takes a language tag with a country code (en-GB, de-AT)",
    criteria: ["EN18223-4.1.2.8.2", "IDTA01001-LangStringSet"],
  },
  async ({ request }) =>
    withDraft(request, async (draft) => {
      for (const tag of ["en-GB", "de-AT"]) {
        const response = await draft.addElement(multiLanguage(`M${tag.replace("-", "")}`, tag));
        expect(response.status(), tag).toBe(201);
      }
    }),
);

/** The 24 official languages of the European Union (Regulation No 1), as ISO 639 codes. */
const EU_LANGUAGES = [
  "bg",
  "cs",
  "da",
  "de",
  "el",
  "en",
  "es",
  "et",
  "fi",
  "fr",
  "ga",
  "hr",
  "hu",
  "it",
  "lt",
  "lv",
  "mt",
  "nl",
  "pl",
  "pt",
  "ro",
  "sk",
  "sl",
  "sv",
] as const;

check(
  {
    id: "model.eu-languages-accepted",
    title: "a multi-language value takes every official language of the European Union",
    criteria: ["ESPR-Art7(8)"],
  },
  async ({ request }) =>
    withDraft(request, async (draft) => {
      const refused: string[] = [];
      for (const language of EU_LANGUAGES) {
        const response = await draft.addElement(multiLanguage(`M${language}`, language));
        if (response.status() !== 201) refused.push(language);
      }
      expect(refused, "official languages refused").toEqual([]);
    }),
);

check(
  {
    id: "model.typed-values-checked",
    title: "a property value that contradicts its value type is refused",
    criteria: ["EN18223-4.1.2.5", "EN18223-5.2.3-sub1", "IDTA01001-ValueDataType"],
  },
  async ({ request }) =>
    withDraft(request, async (draft) => {
      for (const [valueType, value] of [
        ["Integer", "abc"],
        ["Integer", "1.5"],
        ["Decimal", "x"],
        ["Date", "not-a-date"],
        ["Date", "2026-02-30"],
      ] as const) {
        const response = await draft.addElement(property(`V${valueType}`, valueType, value));
        expect(response.status(), `${valueType} ${value}`).toBe(400);
      }
    }),
);

check(
  {
    id: "model.last-updated-advances",
    title: "a change to a passport moves its time of last update",
    criteria: ["EN18223-4.1.2.1(5)(lastUpdated)"],
  },
  async ({ request }) =>
    withDraft(request, async (draft) => {
      const headers = orgHeaders(readSubject().orgId);
      const before = await request.get(`${ApiBase}/passports/${draft.passportId}`, { headers });
      const { updatedAt: first } = (await before.json()) as { updatedAt: string };
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const added = await draft.addElement(property("Changed", "String", "after"));
      expect(added.status(), "the change").toBe(201);
      const after = await request.get(`${ApiBase}/passports/${draft.passportId}`, { headers });
      const { updatedAt: second } = (await after.json()) as { updatedAt: string };
      expect(Date.parse(second), `updatedAt ${first} after the change`).toBeGreaterThan(
        Date.parse(first),
      );
    }),
);

/** The subject's content submodel read as values ($value), anonymously. */
const publicValues = async (browser: Browser): Promise<Record<string, unknown>> => {
  const subject = readSubject();
  const anonymous = await newAnonymousContext(browser);
  const root = `${ApiBase}/p/${permalinkOf(subject.publicUrl)}`;
  const submodels = await anonymous.request.get(`${root}/submodels`);
  const { result } = (await submodels.json()) as { result: { id: string; idShort: string }[] };
  const content = result.find((s) => s.idShort === CONTENT_SUBMODEL_ID_SHORT);
  expect(content, "the subject carries its content submodel").toBeDefined();
  const response = await anonymous.request.get(`${root}/submodels/${base64(content!.id)}/$value`);
  expect(response.status()).toBe(200);
  const values = (await response.json()) as Record<string, unknown>;
  await anonymous.close();
  return values;
};

check(
  {
    id: "format.compressed-keys-are-element-ids",
    title:
      "the public values read keys each element by its id, nests collections as objects and lists as keyless arrays, without semantic metadata",
    criteria: [
      "EN18223-5.2.2(2)",
      "EN18223-5.2.5-sub1",
      "EN18223-5.2.6-sub1",
      "EN18223-5.2.7",
      "IDTA01001-ValueOnly",
    ],
  },
  async ({ browser }) => {
    const values = await publicValues(browser);
    expect(Object.keys(values)).toEqual(
      expect.arrayContaining(["TradeName", "Weight", "Manufacturer", "Materials"]),
    );
    expect(values.Manufacturer, "a collection is an object keyed by element id").toEqual({
      Name: "Example GmbH",
    });
    expect(Array.isArray(values.Materials), "a list is an array").toBeTruthy();
    for (const item of values.Materials as Record<string, unknown>[]) {
      expect(Object.keys(item).sort(), "list items carry no key of their own").toEqual([
        "Material",
        "Share",
      ]);
    }
    const text = JSON.stringify(values);
    for (const metadata of ["semanticId", "valueType", "modelType", "idShort"]) {
      expect(text, `no ${metadata} in the operational payload`).not.toContain(`"${metadata}"`);
    }
  },
);

check(
  {
    id: "format.compressed-values-native-json",
    title: "the public values read gives numbers and booleans as native JSON types",
    criteria: ["EN18223-5.2.3-sub1", "IDTA01001-ValueOnly-types"],
  },
  async ({ browser }) => {
    const values = await publicValues(browser);
    expect(typeof values.Weight, "a Double value").toBe("number");
    expect(typeof values.Recyclable, "a Boolean value").toBe("boolean");
  },
);

/** The mandatory header attributes of EN 18223 Table 1. */
const HEADER = [
  "digitalProductPassportId",
  "uniqueProductIdentifier",
  "granularity",
  "dppSchemaVersion",
  "dppStatus",
  "lastUpdated",
  "economicOperatorId",
] as const;

check(
  {
    id: "format.dpp-header-published",
    title: "the published passport's public JSON carries the mandatory DPP header of Table 1",
    criteria: [
      "EN18223-4.1.2.1(5)(digitalProductPassportId)",
      "EN18223-4.1.2.1(5)(uniqueProductIdentifier)",
      "EN18223-4.1.2.1(5)(granularity)",
      "EN18223-4.1.2.1(5)(dppSchemaVersion)",
      "EN18223-4.1.2.1(5)(dppStatus)",
      "EN18223-4.1.2.1(5)(lastUpdated)",
      "EN18223-4.1.2.1(5)(economicOperatorId)",
      "EN18223-5.2.4(1)",
      "ESPR-Art10(1)(d)",
      "ESPR-Art10(1)(f)",
      "ESPR-Art11(a)",
    ],
  },
  async ({ browser }) => {
    const subject = readSubject();
    const anonymous = await newAnonymousContext(browser);
    const root = `${ApiBase}/p/${permalinkOf(subject.publicUrl)}`;
    const missing: Record<string, string[]> = {};
    for (const url of [root, `${root}/shells`]) {
      const response = await anonymous.request.get(url);
      expect(response.status(), url).toBe(200);
      const text = await response.text();
      missing[url] = HEADER.filter((attribute) => !text.includes(`"${attribute}"`));
    }
    await anonymous.close();
    const complete = Object.values(missing).some((absent) => absent.length === 0);
    expect(complete, `header attributes missing per read: ${JSON.stringify(missing)}`).toBe(true);
  },
);
