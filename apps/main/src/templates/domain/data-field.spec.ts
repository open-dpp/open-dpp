import { expect } from "@jest/globals";
import { DataTypeDef } from "../../aas/domain/common/data-type-def";
import { Key, KeyTypes } from "../../aas/domain/common/key";
import { Language, LanguageText } from "../../aas/domain/common/language-text";
import { Qualifier, QualifierKind } from "../../aas/domain/common/qualififiable";
import { Reference, ReferenceTypes } from "../../aas/domain/common/reference";
import { File } from "../../aas/domain/submodelBase/file";
import { MultiLanguageProperty } from "../../aas/domain/submodelBase/multi-language-property";
import { Property } from "../../aas/domain/submodelBase/property";
import { ReferenceElement } from "../../aas/domain/submodelBase/reference-element";
import { GranularityLevel } from "../../data-modelling/domain/granularity-level";
import { FileField, NumericField, ProductPassportLink, TextField } from "./data-field";

describe("dataField", () => {
  it("should convert numeric field toAas", () => {
    const dataField = NumericField.create({
      name: "field1",
      options: { min: 2, max: 8 },
      granularityLevel: GranularityLevel.MODEL,
    });
    const property = dataField.toAas();
    expect(property).toEqual(Property.create({
      valueType: DataTypeDef.Double,
      idShort: dataField.id,
      displayName: [LanguageText.create({ language: Language.de, text: "field1" })],
      qualifiers: [
        Qualifier.create({
          semanticId: Reference.create({
            keys: [Key.create(
              {
                type: KeyTypes.GlobalReference,
                value: "https://admin-shell.io/SubmodelTemplates/AllowedRange/1/0",
              },
            )],
            type: ReferenceTypes.ExternalReference,
          }),
          supplementalSemanticIds: [],
          type: "SMT/AllowedRange",
          kind: QualifierKind.TemplateQualifier,
          valueType: DataTypeDef.Double,
          value: "[2,8]",
        }),
      ],
    }));
  });

  it("should convert text field toAas", () => {
    const dataField = TextField.create({
      name: "field1",
      granularityLevel: GranularityLevel.MODEL,
    });
    const property = dataField.toAas();
    expect(property).toEqual(MultiLanguageProperty.create({
      idShort: dataField.id,
      displayName: [LanguageText.create({ language: Language.de, text: "field1" })],
    }));
  });

  it("should convert file field toAas", () => {
    const dataField = FileField.create({
      name: "field1",
      granularityLevel: GranularityLevel.MODEL,
    });
    const property = dataField.toAas();
    expect(property).toEqual(File.create({
      idShort: dataField.id,
      displayName: [LanguageText.create({ language: Language.de, text: "field1" })],
      contentType: "application/octet-stream",
    }));
  });

  it("should passport link toAas", () => {
    const dataField = ProductPassportLink.create({
      name: "field1",
      granularityLevel: GranularityLevel.MODEL,
    });
    const property = dataField.toAas();
    expect(property).toEqual(
      ReferenceElement.create({
        idShort: dataField.id,
        displayName: [LanguageText.create({ language: Language.de, text: "field1" })],
      }),
    );
  });
});
