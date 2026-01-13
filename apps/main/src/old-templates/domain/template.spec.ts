import type { TemplateDbProps } from "./template";
import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { AasSubmodelElements, AssetKind, DataTypeDef, KeyTypes, Language, ReferenceTypes } from "@open-dpp/dto";
import { ignoreIds } from "../../../test/utils.for.test";
import { AssetAdministrationShell } from "../../aas/domain/asset-adminstration-shell";
import { AssetInformation } from "../../aas/domain/asset-information";
import { AdministrativeInformation } from "../../aas/domain/common/administrative-information";
import { Key } from "../../aas/domain/common/key";
import { LanguageText } from "../../aas/domain/common/language-text";
import { Reference } from "../../aas/domain/common/reference";
import { MultiLanguageProperty } from "../../aas/domain/submodel-base/multi-language-property";
import { Property } from "../../aas/domain/submodel-base/property";
import { Submodel } from "../../aas/domain/submodel-base/submodel";
import { SubmodelElementCollection } from "../../aas/domain/submodel-base/submodel-element-collection";
import { SubmodelElementList } from "../../aas/domain/submodel-base/submodel-element-list";
import { GranularityLevel } from "../../data-modelling/domain/granularity-level";
import { DataValue } from "../../product-passport-data/domain/data-value";
import { laptopFactory, LaptopFactory } from "../fixtures/laptop.factory";
import { DataFieldValidationResult } from "./data-field";
import { Template } from "./template";

describe("template", () => {
  const laptopModel: TemplateDbProps = laptopFactory.addSections().build();

  it("should create data values at model level", () => {
    const productDataModel = Template.loadFromDb(laptopModel);
    const dataValues = productDataModel.createInitialDataValues(
      GranularityLevel.MODEL,
    );
    expect(dataValues).toEqual(
      ignoreIds([
        DataValue.create({
          dataSectionId: LaptopFactory.ids.techSpecs.id,
          dataFieldId: LaptopFactory.ids.techSpecs.fields.processor,
          value: undefined,
          row: 0,
        }),
        DataValue.create({
          dataSectionId: LaptopFactory.ids.techSpecs.id,
          dataFieldId: LaptopFactory.ids.techSpecs.fields.memory,
          value: undefined,
          row: 0,
        }),
        DataValue.create({
          dataSectionId: LaptopFactory.ids.environment.id,
          dataFieldId: LaptopFactory.ids.environment.fields.waterConsumption,
          value: undefined,
          row: 0,
        }),
      ]),
    );
  });

  it("should create data values at item level", () => {
    const productDataModel = Template.loadFromDb(laptopModel);
    const dataValues = productDataModel.createInitialDataValues(
      GranularityLevel.ITEM,
    );
    expect(dataValues).toEqual(
      ignoreIds([
        DataValue.create({
          dataSectionId: LaptopFactory.ids.techSpecs.id,
          dataFieldId: LaptopFactory.ids.techSpecs.fields.serialNumber,
          value: undefined,
          row: 0,
        }),
        DataValue.create({
          dataSectionId: LaptopFactory.ids.techSpecs.id,
          dataFieldId: LaptopFactory.ids.techSpecs.fields.batteryStatus,
          value: undefined,
          row: 0,
        }),
        DataValue.create({
          dataSectionId: LaptopFactory.ids.environment.id,
          dataFieldId: LaptopFactory.ids.environment.fields.energyConsumption,
          value: undefined,
          row: 0,
        }),
      ]),
    );
  });
  //
  it("should validate values successfully", () => {
    const productDataModel = Template.loadFromDb(laptopModel);

    const dataValues = [
      DataValue.create({
        value: "Intel 7",
        dataSectionId: LaptopFactory.ids.techSpecs.id,
        dataFieldId: LaptopFactory.ids.techSpecs.fields.processor,
        row: 0,
      }),
      DataValue.create({
        value: "Mem 4 GB",
        dataSectionId: LaptopFactory.ids.techSpecs.id,
        dataFieldId: LaptopFactory.ids.techSpecs.fields.memory,
        row: 0,
      }),
      DataValue.create({
        value: 5,
        dataSectionId: LaptopFactory.ids.environment.id,
        dataFieldId: LaptopFactory.ids.environment.fields.waterConsumption,
        row: 0,
      }),
      DataValue.create({
        value: "Lithium",
        dataSectionId: LaptopFactory.ids.material.id,
        dataFieldId: LaptopFactory.ids.material.fields.materialType,
        row: 0,
      }),
      DataValue.create({
        value: 4,
        dataSectionId: LaptopFactory.ids.material.id,
        dataFieldId: LaptopFactory.ids.material.fields.mass,
        row: 0,
      }),
      DataValue.create({
        value: "GHG protocol",
        dataSectionId: LaptopFactory.ids.materialCo2.id,
        dataFieldId: LaptopFactory.ids.materialCo2.fields.co2CalculationMethod,
        row: 0,
      }),
      DataValue.create({
        value: 9,
        dataSectionId: LaptopFactory.ids.materialCo2.id,
        dataFieldId: LaptopFactory.ids.materialCo2.fields.co2Emissions,
        row: 0,
      }),
    ];
    const validationOutput = productDataModel.validate(
      dataValues,
      GranularityLevel.MODEL,
    );

    expect(validationOutput.isValid).toBeTruthy();
    expect(validationOutput.validationResults).toEqual([
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.techSpecs.fields.processor,
        dataFieldName: "Processor",
        isValid: true,
      }),
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.techSpecs.fields.memory,
        dataFieldName: "Memory",
        isValid: true,
      }),
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.environment.fields.waterConsumption,
        dataFieldName: "Water consumption",
        isValid: true,
      }),
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.material.fields.materialType,
        dataFieldName: "Material type",
        isValid: true,
      }),
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.material.fields.mass,
        dataFieldName: "Mass",
        isValid: true,
      }),
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.materialCo2.fields.co2CalculationMethod,
        dataFieldName: "Co2 calculation method",
        isValid: true,
      }),
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.materialCo2.fields.co2Emissions,
        dataFieldName: "Co2 emissions",
        isValid: true,
      }),
    ]);
  });

  it("should validate values successfully if there are no data values for repeatable section", () => {
    const productDataModel = Template.loadFromDb(laptopModel);

    const dataValues = [
      DataValue.create({
        value: "Intel 7",
        dataSectionId: LaptopFactory.ids.techSpecs.id,
        dataFieldId: LaptopFactory.ids.techSpecs.fields.processor,
        row: 0,
      }),
      DataValue.create({
        value: "Mem 4 GB",
        dataSectionId: LaptopFactory.ids.techSpecs.id,
        dataFieldId: LaptopFactory.ids.techSpecs.fields.memory,
        row: 0,
      }),
      DataValue.create({
        value: 5,
        dataSectionId: LaptopFactory.ids.environment.id,
        dataFieldId: LaptopFactory.ids.environment.fields.waterConsumption,
        row: 0,
      }),
    ];
    const validationOutput = productDataModel.validate(
      dataValues,
      GranularityLevel.MODEL,
    );

    expect(validationOutput.isValid).toBeTruthy();
    expect(validationOutput.validationResults).toEqual([
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.techSpecs.fields.processor,
        dataFieldName: "Processor",
        isValid: true,
      }),
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.techSpecs.fields.memory,
        dataFieldName: "Memory",
        isValid: true,
      }),
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.environment.fields.waterConsumption,
        dataFieldName: "Water consumption",
        isValid: true,
      }),
    ]);
  });

  it("should fail validation caused by missing field and wrong type", () => {
    const productDataModel = Template.loadFromDb(laptopModel);
    const dataValues = [
      DataValue.create({
        value: "Intel 7",
        dataSectionId: LaptopFactory.ids.techSpecs.id,
        dataFieldId: LaptopFactory.ids.techSpecs.fields.processor,
        row: 0,
      }),
      DataValue.create({
        value: 34,
        dataSectionId: LaptopFactory.ids.environment.id,
        dataFieldId: LaptopFactory.ids.environment.fields.waterConsumption,
        row: 0,
      }),
      DataValue.create({
        value: "Lithium",
        dataSectionId: LaptopFactory.ids.material.id,
        dataFieldId: LaptopFactory.ids.material.fields.materialType,
        row: 0,
      }),
      DataValue.create({
        value: "wrong value",
        dataSectionId: LaptopFactory.ids.material.id,
        dataFieldId: LaptopFactory.ids.material.fields.mass,
        row: 0,
      }),
      DataValue.create({
        value: { wrongValue: "GHG protocol" },
        dataSectionId: LaptopFactory.ids.materialCo2.id,
        dataFieldId: LaptopFactory.ids.materialCo2.fields.co2CalculationMethod,
        row: 0,
      }),
      DataValue.create({
        value: 9,
        dataSectionId: LaptopFactory.ids.materialCo2.id,
        dataFieldId: LaptopFactory.ids.materialCo2.fields.co2Emissions,
        row: 0,
      }),
    ];
    const validationOutput = productDataModel.validate(
      dataValues,
      GranularityLevel.MODEL,
    );

    expect(validationOutput.isValid).toBeFalsy();
    expect(validationOutput.validationResults).toEqual([
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.techSpecs.fields.processor,
        dataFieldName: "Processor",
        isValid: true,
      }),
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.techSpecs.fields.memory,
        dataFieldName: "Memory",
        errorMessage: "Value for data field is missing",
        isValid: false,
        row: 0,
      }),
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.environment.fields.waterConsumption,
        dataFieldName: "Water consumption",
        isValid: true,
      }),
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.material.fields.materialType,
        dataFieldName: "Material type",
        isValid: true,
      }),
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.material.fields.mass,
        dataFieldName: "Mass",
        errorMessage: "Invalid input: expected number, received string",
        isValid: false,
      }),
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.materialCo2.fields.co2CalculationMethod,
        dataFieldName: "Co2 calculation method",
        errorMessage: "Invalid input: expected string, received object",
        isValid: false,
      }),
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.materialCo2.fields.co2Emissions,
        dataFieldName: "Co2 emissions",
        isValid: true,
      }),
    ]);
  });

  it("should copy template", () => {
    const template = Template.loadFromDb(laptopModel);
    const orgaId = randomUUID();
    const userId = randomUUID();
    const templateCopy = template.copy(orgaId, userId);
    expect(templateCopy.id).not.toEqual(template.id);
    expect(templateCopy.ownedByOrganizationId).toEqual(orgaId);
    expect(templateCopy.createdByUserId).toEqual(userId);
    expect(templateCopy.name).toEqual(template.name);
    expect(templateCopy.version).toEqual(template.version);
    expect(templateCopy.marketplaceResourceId).toEqual(
      template.marketplaceResourceId,
    );
    expect(templateCopy.sections).toEqual(template.sections);
  });

  it("should assign marketplace resource ID at the model level", () => {
    const productDataModel = Template.loadFromDb(laptopModel);
    productDataModel.assignMarketplaceResource("m1");
    expect(productDataModel.marketplaceResourceId).toEqual("m1");
  });

  it.skip("should convert to AAS", () => {
    const laptopModel: TemplateDbProps = laptopFactory.addSections().build();
    const template = Template.loadFromDb(laptopModel);
    const aasEnvironment = template.convertToAas();
    expect(aasEnvironment.assetAdministrationShells).toEqual([
      AssetAdministrationShell.create({
        id: template.id,
        assetInformation: AssetInformation.create({ assetKind: AssetKind.Type }),
        submodels: [
          Reference.create({
            type: ReferenceTypes.ModelReference,
            keys: [Key.create({
              type: KeyTypes.Submodel,
              value: LaptopFactory.ids.techSpecs.id,
            })],
          }),
          Reference.create({
            type: ReferenceTypes.ModelReference,
            keys: [Key.create({
              type: KeyTypes.Submodel,
              value: LaptopFactory.ids.environment.id,
            })],
          }),
          Reference.create({
            type: ReferenceTypes.ModelReference,
            keys: [Key.create({
              type: KeyTypes.Submodel,
              value: `submodel-for-${LaptopFactory.ids.material.id}`,
            })],
          }),
        ],
      }),
    ]);
    const administration = AdministrativeInformation.create({ version: "1.0.0", revision: "1" });
    expect(aasEnvironment.submodels).toEqual([
      Submodel.create({
        id: LaptopFactory.ids.techSpecs.id,
        idShort: LaptopFactory.ids.techSpecs.id,
        administration,
        displayName: [LanguageText.create({ language: Language.de, text: "Technical specifications" })],
        submodelElements: [
          MultiLanguageProperty.create({ idShort: LaptopFactory.ids.techSpecs.fields.processor, displayName: [LanguageText.create({ language: Language.de, text: "Processor" })] }),
          MultiLanguageProperty.create({ idShort: LaptopFactory.ids.techSpecs.fields.memory, displayName: [LanguageText.create({ language: Language.de, text: "Memory" })] }),
          MultiLanguageProperty.create({ idShort: LaptopFactory.ids.techSpecs.fields.serialNumber, displayName: [LanguageText.create({ language: Language.de, text: "Serial number" })] }),
          MultiLanguageProperty.create({ idShort: LaptopFactory.ids.techSpecs.fields.batteryStatus, displayName: [LanguageText.create({ language: Language.de, text: "Battery Status" })] }),
        ],
      }),
      Submodel.create({
        id: LaptopFactory.ids.environment.id,
        idShort: LaptopFactory.ids.environment.id,
        administration,
        displayName: [LanguageText.create({ language: Language.de, text: "Environment" })],
        submodelElements: [
          Property.create({ valueType: DataTypeDef.Double, idShort: LaptopFactory.ids.environment.fields.waterConsumption, displayName: [LanguageText.create({ language: Language.de, text: "Water consumption" })] }),
          Property.create({ valueType: DataTypeDef.Double, idShort: LaptopFactory.ids.environment.fields.energyConsumption, displayName: [LanguageText.create({ language: Language.de, text: "Energy consumption" })] }),
        ],
      }),
      Submodel.create({
        id: `submodel-for-${LaptopFactory.ids.material.id}`,
        idShort: `submodel-for-${LaptopFactory.ids.material.id}`,
        administration,
        displayName: [LanguageText.create({ language: Language.de, text: "Material" })],
        submodelElements: [
          SubmodelElementList.create({ typeValueListElement: AasSubmodelElements.SubmodelElementCollection, idShort: LaptopFactory.ids.material.id, displayName: [LanguageText.create({ language: Language.de, text: "Material" })], value: [
            SubmodelElementCollection.create({ idShort: `${LaptopFactory.ids.material.id}_0`, value: [
              MultiLanguageProperty.create({ idShort: LaptopFactory.ids.material.fields.materialType, displayName: [LanguageText.create({ language: Language.de, text: "Material type" })] }),
              Property.create({ valueType: DataTypeDef.Double, idShort: LaptopFactory.ids.material.fields.mass, displayName: [LanguageText.create({ language: Language.de, text: "Mass" })] }),
              SubmodelElementCollection.create({
                idShort: LaptopFactory.ids.materialCo2.id,
                displayName: [LanguageText.create({ language: Language.de, text: "Material Co2" })],
                value: [
                  MultiLanguageProperty.create({ idShort: LaptopFactory.ids.materialCo2.fields.co2CalculationMethod, displayName: [LanguageText.create({ language: Language.de, text: "Co2 calculation method" })] }),
                  Property.create({ valueType: DataTypeDef.Double, idShort: LaptopFactory.ids.materialCo2.fields.co2Emissions, displayName: [LanguageText.create({ language: Language.de, text: "Co2 emissions" })] }),
                ],
              }),
            ] }),
          ] }),

        ],
      }),
    ]);
  });
});
