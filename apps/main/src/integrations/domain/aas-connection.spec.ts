import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { ignoreIds } from "../../../test/utils.for.test";
import { DataFieldType } from "../../data-modelling/domain/data-field-base";
import { GranularityLevel } from "../../data-modelling/domain/granularity-level";
import { Model } from "../../models/domain/model";
import { Template, TemplateDbProps } from "../../old-templates/domain/template";
import { dataFieldDbPropsFactory } from "../../old-templates/fixtures/data-field.factory";
import { laptopFactory } from "../../old-templates/fixtures/laptop.factory";
import { sectionDbPropsFactory } from "../../old-templates/fixtures/section.factory";
import { templateCreatePropsFactory } from "../../old-templates/fixtures/template.factory";
import { DataValue } from "../../product-passport-data/domain/data-value";
import { AasConnection, AasFieldAssignment } from "./aas-connection";
import {
  AssetAdministrationShell,
  AssetAdministrationShellType,
} from "./asset-administration-shell";
import { semitrailerTruckAas } from "./semitrailer-truck-aas";

describe("aasMapping", () => {
  const organizationId = randomUUID();
  const userId = randomUUID();
  it("should create field mapping", () => {
    const fieldMapping = AasFieldAssignment.create({
      dataFieldId: "internalField",
      sectionId: "internalSectionId",
      idShortParent: "externalFieldParent",
      idShort: "externalField",
    });
    expect(fieldMapping.dataFieldId).toEqual("internalField");
    expect(fieldMapping.sectionId).toEqual("internalSectionId");
    expect(fieldMapping.idShort).toEqual("externalField");
    expect(fieldMapping.idShortParent).toEqual("externalFieldParent");
  });

  it("should create aas mapping and add field mappings", () => {
    const dataModelId = "dataModelId";
    const modelId = "modelId";
    const name = "Connection Name";

    const aasConnection = AasConnection.create({
      name,
      organizationId,
      userId,
      dataModelId,
      modelId,
      aasType: AssetAdministrationShellType.Semitrailer_Truck,
    });
    expect(aasConnection.id).toEqual(expect.any(String));
    expect(aasConnection.name).toEqual(name);
    expect(aasConnection.isOwnedBy(organizationId)).toBeTruthy();
    expect(aasConnection.createdByUserId).toEqual(userId);
    expect(aasConnection.dataModelId).toEqual(dataModelId);
    expect(aasConnection.modelId).toEqual(modelId);
    expect(aasConnection.fieldAssignments).toEqual([]);
    const fieldMapping = AasFieldAssignment.create({
      dataFieldId: "internalField",
      sectionId: "internalSectionId",
      idShortParent: "externalFieldParent",
      idShort: "externalField",
    });
    aasConnection.addFieldAssignment(fieldMapping);
    expect(aasConnection.fieldAssignments).toEqual([fieldMapping]);
  });

  it("should assign model", () => {
    const dataModelId = "dataModelId";
    const modelId = "modelId";
    const aasConnection = AasConnection.create({
      name: "Connection Name",
      organizationId,
      userId,
      dataModelId,
      modelId,
      aasType: AssetAdministrationShellType.Semitrailer_Truck,
    });
    const template = Template.create(
      templateCreatePropsFactory.build({
        organizationId,
        userId,
      }),
    );
    const model = Model.create({
      organizationId: "organizationId",
      userId: "userId",
      name: "modelName",
      template,
    });

    aasConnection.assignModel(model);
    expect(aasConnection.dataModelId).toEqual(template.id);
    expect(aasConnection.modelId).toEqual(model.id);
  });

  it("should replace field assignments", () => {
    const dataModelId = "dataModelId";
    const modelId = "modelId";
    const aasConnection = AasConnection.create({
      name: "Connection Name",
      organizationId,
      userId,
      dataModelId,
      modelId,
      aasType: AssetAdministrationShellType.Semitrailer_Truck,
    });
    const fieldAssignment = AasFieldAssignment.create({
      dataFieldId: "internalField",
      sectionId: "internalSectionId",
      idShortParent: "externalFieldParent",
      idShort: "externalField",
    });
    aasConnection.addFieldAssignment(fieldAssignment);

    const newFieldAssignments = [
      AasFieldAssignment.create({
        dataFieldId: "internalField2",
        sectionId: "internalSectionId2",
        idShortParent: "externalFieldParent2",
        idShort: "externalField2",
      }),
      AasFieldAssignment.create({
        dataFieldId: "internalField3",
        sectionId: "internalSectionId3",
        idShortParent: "externalFieldParent3",
        idShort: "externalField3",
      }),
    ];
    aasConnection.replaceFieldAssignments(newFieldAssignments);
    expect(aasConnection.fieldAssignments).toEqual(newFieldAssignments);
  });

  it("should generate data values for semi trailer", () => {
    const dataModelId = "dataModelId";
    const modelId = "modelId";
    const aasConnection = AasConnection.create({
      name: "Connection Name",
      organizationId,
      userId,
      dataModelId,
      modelId,
      aasType: AssetAdministrationShellType.Semitrailer_Truck,
    });

    const sectionId1 = randomUUID();
    const sectionId2 = randomUUID();
    const dataFieldId1 = randomUUID();
    const dataFieldId2 = randomUUID();
    const dataFieldId3 = randomUUID();

    const laptopModel: TemplateDbProps = laptopFactory.build({
      sections: [
        sectionDbPropsFactory.build({
          id: sectionId1,
          dataFields: [
            dataFieldDbPropsFactory.build({
              id: dataFieldId1,
              granularityLevel: GranularityLevel.ITEM,
            }),
            dataFieldDbPropsFactory.build({
              id: dataFieldId2,
              granularityLevel: GranularityLevel.ITEM,
            }),
          ],
        }),
        sectionDbPropsFactory.build({
          id: sectionId2,
          dataFields: [
            dataFieldDbPropsFactory.build({
              id: dataFieldId3,
              type: DataFieldType.NUMERIC_FIELD,
              granularityLevel: GranularityLevel.ITEM,
            }),
          ],
        }),
      ],
    });

    const templateInstance = Template.loadFromDb(laptopModel);

    const fieldAssignment1 = AasFieldAssignment.create({
      dataFieldId: dataFieldId3,
      sectionId: sectionId2,
      idShortParent: "ProductCarbonFootprint_A1A3",
      idShort: "PCFCO2eq",
    });
    const fieldAssignment2 = AasFieldAssignment.create({
      dataFieldId: dataFieldId2,
      sectionId: sectionId1,
      idShortParent: "ProductCarbonFootprint_A1A3",
      idShort: "PCFCalculationMethod",
    });
    aasConnection.addFieldAssignment(fieldAssignment1);
    aasConnection.addFieldAssignment(fieldAssignment2);

    const dataValues = aasConnection.generateDataValues(
      AssetAdministrationShell.create({ content: semitrailerTruckAas }),
      templateInstance,
    );
    expect(dataValues).toEqual(
      ignoreIds([
        DataValue.create({
          dataSectionId: sectionId1,
          dataFieldId: dataFieldId2,
          value: "GHG",
          row: 0,
        }),
        DataValue.create({
          dataSectionId: sectionId2,
          dataFieldId: dataFieldId3,
          value: 2.63,
          row: 0,
        }),
      ]),
    );
  });
});
