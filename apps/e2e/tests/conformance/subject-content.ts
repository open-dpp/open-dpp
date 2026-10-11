/**
 * Content of the conformance subject: one submodel with every element kind the public view renders
 * (text, number, boolean, date and link properties, multilingual text, an image and a PDF file, a
 * collection and a list), so the presentation Checks judge a passport as an operator fills it rather
 * than an empty one. Added in wayfinder ticket #761.
 */
import { expect, type APIRequestContext } from "@playwright/test";
import { ApiBase } from "../config";
import { ORG_ID_HEADER, type PassportIds } from "../helpers/passport";

/** 1x1 PNG. */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

/** One empty page. */
const PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n",
);

export const CONTENT_SUBMODEL_ID_SHORT = "ProductData";

const upload = async (
  request: APIRequestContext,
  orgId: string,
  name: string,
  mimeType: string,
  buffer: Buffer,
): Promise<string> => {
  const response = await request.post(`${ApiBase}/media/upload`, {
    headers: { [ORG_ID_HEADER]: orgId },
    multipart: { file: { name, mimeType, buffer } },
  });
  expect(response.status(), `uploading ${name} should succeed`).toBe(201);
  return ((await response.json()) as { mediaId: string }).mediaId;
};

const en = (text: string) => [{ language: "en", text }];

const property = (idShort: string, label: string, valueType: string, value: string) => ({
  modelType: "Property",
  idShort,
  displayName: en(label),
  valueType,
  value,
});

const material = (name: string, share: string) => ({
  modelType: "SubmodelElementCollection",
  idShort: `Row${name}`,
  value: [
    property("Material", "Material", "String", name),
    property("Share", "Share (%)", "Double", share),
  ],
});

export const addSubjectContent = async (
  request: APIRequestContext,
  { orgId, passportId }: PassportIds,
): Promise<void> => {
  const image = await upload(request, orgId, "product.png", "image/png", PNG);
  const declaration = await upload(request, orgId, "declaration.pdf", "application/pdf", PDF);
  const response = await request.post(`${ApiBase}/passports/${passportId}/submodels`, {
    headers: { [ORG_ID_HEADER]: orgId },
    data: {
      idShort: CONTENT_SUBMODEL_ID_SHORT,
      displayName: [...en("Product data"), { language: "de", text: "Produktdaten" }],
      submodelElements: [
        property("TradeName", "Trade name", "String", "Conformance Kettle"),
        property("Weight", "Weight (kg)", "Double", "1.25"),
        property("Recyclable", "Recyclable", "Boolean", "true"),
        property("ManufactureDate", "Date of manufacture", "Date", "2026-05-01"),
        property("Manual", "User manual", "AnyUri", "https://example.com/manual"),
        {
          modelType: "MultiLanguageProperty",
          idShort: "Description",
          displayName: en("Description"),
          value: [...en("An electric kettle."), { language: "de", text: "Ein Wasserkocher." }],
        },
        {
          modelType: "File",
          idShort: "ProductImage",
          displayName: en("Product image"),
          contentType: "image/png",
          value: image,
        },
        {
          modelType: "File",
          idShort: "Declaration",
          displayName: en("Declaration of conformity"),
          contentType: "application/pdf",
          value: declaration,
        },
        {
          modelType: "SubmodelElementCollection",
          idShort: "Manufacturer",
          displayName: en("Manufacturer"),
          value: [property("Name", "Name", "String", "Example GmbH")],
        },
        {
          modelType: "SubmodelElementList",
          idShort: "Materials",
          displayName: en("Materials"),
          typeValueListElement: "SubmodelElementCollection",
          value: [material("Steel", "60"), material("Polypropylene", "40")],
        },
      ],
    },
  });
  expect(response.status(), "adding the content submodel should succeed").toBe(201);
};
