import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { ignoreIds } from "@open-dpp/testing";
import { Model } from "../../models/domain/model";
import { Template, TemplateDbProps } from "../../old-templates/domain/template";
import {
  LaptopFactory,
  laptopFactory,
} from "../../old-templates/fixtures/laptop.factory";
import { templateCreatePropsFactory } from "../../old-templates/fixtures/template.factory";
import { DataValue } from "../../product-passport-data/domain/data-value";
import { Item } from "./item";

describe("item", () => {
  const organizationId = randomUUID();
  const userId = randomUUID();

  const laptopModel: TemplateDbProps = laptopFactory
    .addSections()
    .build({ organizationId, userId });

  it("should create an item and defines model", () => {
    const template = Template.loadFromDb(laptopModel);

    const model = Model.create({
      name: "name",
      userId,
      organizationId,
      template,
    });
    const item = Item.create({ organizationId, userId, template, model });

    expect(item.id).toBeDefined();
    expect(item.modelId).toEqual(model.id);
    expect(item.ownedByOrganizationId).toEqual(organizationId);
    expect(item.createdByUserId).toEqual(userId);
    expect(item.templateId).toEqual(model.templateId);
    expect(item.uniqueProductIdentifiers).toEqual([]);
    expect(item.dataValues).toEqual([
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
    ]);
  });

  it("should create unique product identifier on item creation", () => {
    const template = Template.loadFromDb(laptopModel);

    const model = Model.create({
      name: "name",
      userId,
      organizationId,
      template,
    });
    const item = Item.create({ organizationId, userId, model, template });
    const uniqueProductIdentifier1 = item.createUniqueProductIdentifier();
    const uniqueProductIdentifier2 = item.createUniqueProductIdentifier();

    expect(item.id).toBeDefined();
    expect(item.uniqueProductIdentifiers).toEqual([
      uniqueProductIdentifier1,
      uniqueProductIdentifier2,
    ]);
    expect(uniqueProductIdentifier1.referenceId).toEqual(item.id);
    expect(uniqueProductIdentifier2.referenceId).toEqual(item.id);
  });

  it("add data values", () => {
    const template = Template.create(templateCreatePropsFactory.build());

    const model = Model.create({
      name: "name",
      userId,
      organizationId,
      template,
    });
    const item = Item.create({ organizationId, userId, template, model });
    item.addDataValues([
      DataValue.create({
        dataFieldId: "fieldId2",
        dataSectionId: "sid2",
        value: "value 2",
        row: 0,
      }),
      DataValue.create({
        dataFieldId: "fieldId3",
        dataSectionId: "sid2",
        value: "value 3",
        row: 0,
      }),
      DataValue.create({
        dataFieldId: "fieldId2",
        dataSectionId: "sid2",
        value: "value 4",
        row: 1,
      }),
      DataValue.create({
        dataFieldId: "fieldId3",
        dataSectionId: "sid2",
        value: "value 5",
        row: 1,
      }),
    ]);
    expect(item.dataValues).toEqual(
      ignoreIds([
        DataValue.create({
          dataSectionId: "sid2",
          dataFieldId: "fieldId2",
          value: "value 2",
          row: 0,
        }),
        DataValue.create({
          dataSectionId: "sid2",
          dataFieldId: "fieldId3",
          value: "value 3",
          row: 0,
        }),
        DataValue.create({
          dataSectionId: "sid2",
          dataFieldId: "fieldId2",
          value: "value 4",
          row: 1,
        }),
        DataValue.create({
          dataSectionId: "sid2",
          dataFieldId: "fieldId3",
          value: "value 5",
          row: 1,
        }),
      ]),
    );
  });
});
