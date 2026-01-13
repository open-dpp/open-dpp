import { randomUUID } from "node:crypto";
import { expect, jest } from "@jest/globals";
import { Template } from "../../old-templates/domain/template";
import { templateCreatePropsFactory } from "../../old-templates/fixtures/template.factory";
import { DataValue } from "../../product-passport-data/domain/data-value";
import { ignoreIds } from "../../utils.for.test";
import { Model } from "./model";

describe("model", () => {
  const userId = randomUUID();
  const organizationId = randomUUID();
  const template = Template.create(templateCreatePropsFactory.build());
  it("should create unique product identifiers on model creation", () => {
    const model = Model.create({
      name: "My model",
      userId,
      organizationId,
      template,
    });
    const uniqueModelIdentifier1 = model.createUniqueProductIdentifier();
    const uniqueModelIdentifier2 = model.createUniqueProductIdentifier();

    expect(model.id).toBeDefined();
    expect(model.uniqueProductIdentifiers).toEqual([
      uniqueModelIdentifier1,
      uniqueModelIdentifier2,
    ]);
    expect(uniqueModelIdentifier1.referenceId).toEqual(model.id);
    expect(uniqueModelIdentifier2.referenceId).toEqual(model.id);
  });

  it("should create new model", () => {
    const model = Model.create({
      name: "My model",
      userId,
      organizationId,
      template,
    });

    expect(model.isOwnedBy(organizationId)).toBeTruthy();
    expect(model.isOwnedBy(randomUUID())).toBeFalsy();
  });

  it("should add product image to model", () => {
    const model = Model.create({
      name: "My model",
      userId,
      organizationId,
      template,
    });
    const productMediaId = randomUUID();
    model.addMediaReference(productMediaId);
    expect(model.mediaReferences).toEqual([productMediaId]);
    const productMediaId2 = randomUUID();

    model.addMediaReference(productMediaId);
    model.addMediaReference(productMediaId2);

    expect(model.mediaReferences).toEqual([productMediaId, productMediaId2]);
  });

  it("should delete product image", () => {
    const model = Model.create({
      name: "My model",
      userId,
      organizationId,
      template,
    });
    const productMediaId = randomUUID();
    const productMediaId2 = randomUUID();
    model.addMediaReference(productMediaId);
    model.addMediaReference(productMediaId2);
    model.deleteMediaReference(productMediaId);
    expect(model.mediaReferences).toEqual([productMediaId2]);
  });

  it("should modify product image", () => {
    const model = Model.create({
      name: "My model",
      userId,
      organizationId,
      template,
    });
    const productMediaId = randomUUID();
    const productMediaId2 = randomUUID();
    model.addMediaReference(productMediaId);
    model.addMediaReference(productMediaId2);
    const productMediaId3 = randomUUID();
    model.modifyMediaReference(productMediaId, productMediaId3);
    expect(model.mediaReferences).toEqual([productMediaId3, productMediaId2]);
  });

  it("should move product image", () => {
    const model = Model.create({
      name: "My model",
      userId,
      organizationId,
      template,
    });

    const productMediaId1 = "m1";
    const productMediaId2 = "m2";
    const productMediaId3 = "m3";
    const productMediaId4 = "m4";
    model.addMediaReference(productMediaId1);
    model.addMediaReference(productMediaId2);
    model.addMediaReference(productMediaId3);
    model.addMediaReference(productMediaId4);
    model.moveMediaReference(productMediaId1, 3);
    expect(model.mediaReferences).toEqual([productMediaId2, productMediaId3, productMediaId4, productMediaId1]);
    model.moveMediaReference(productMediaId1, 1);
    expect(model.mediaReferences).toEqual([productMediaId2, productMediaId1, productMediaId3, productMediaId4]);
    model.moveMediaReference(productMediaId4, 0);
    expect(model.mediaReferences).toEqual([productMediaId4, productMediaId2, productMediaId1, productMediaId3]);
    expect(() => model.moveMediaReference(productMediaId4, 4)).toThrow(
      "Cannot move media reference to position 4, since position is out of bounds [0, 3].",
    );
    expect(() => model.moveMediaReference("m5", 3)).toThrow(
      "Cannot find media reference with id m5.",
    );
  });

  it("is created from plain with defaults", () => {
    const model = Model.create({
      name: "My name",
      userId,
      organizationId,
      description: "my description",
      template,
    });
    expect(model.id).toEqual(expect.any(String));
    expect(model.name).toEqual("My name");
    expect(model.description).toEqual("my description");
    expect(model.uniqueProductIdentifiers).toEqual([]);
    expect(model.templateId).toEqual(template.id);

    expect(model.dataValues).toEqual([]);
  });

  it("is created from persistence", () => {
    const id = randomUUID();
    const name = "My name";
    const description = "Some description";
    const templateId = randomUUID();
    const dataValues = [
      {
        value: "value1",
        dataSectionId: "sectionId 1",
        dataFieldId: "dataField 1",
        row: 0,
      },
      {
        value: "value2",
        dataSectionId: "sectionId 2",
        dataFieldId: "dataField 2",
        row: 0,
      },
    ];

    const createdByUserId = randomUUID();
    const ownedByOrganizationId = randomUUID();

    const model = Model.loadFromDb({
      id,
      name,
      mediaReferences: [],
      organizationId: ownedByOrganizationId,
      userId: createdByUserId,
      uniqueProductIdentifiers: [],
      templateId,
      dataValues,
      description,
    });
    expect(model.id).toEqual(id);
    expect(model.name).toEqual(name);
    expect(model.description).toEqual(description);
    expect(model.isOwnedBy(ownedByOrganizationId)).toBeTruthy();
    expect(model.dataValues).toEqual(dataValues);
    expect(model.templateId).toEqual(templateId);
  });

  it("add data values", () => {
    const model = Model.create({
      name: "My name",
      userId,
      organizationId,
      template,
    });
    model.addDataValues([
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
    expect(model.dataValues).toEqual(
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

  it("add data values fails if data values already exist", () => {
    const dataValues = [
      DataValue.create({
        value: undefined,
        dataSectionId: "sid1",
        dataFieldId: "fieldId1",
        row: 0,
      }),
    ];
    const model = Model.create({
      name: "my name",
      userId,
      organizationId,
      template,
    });
    model.addDataValues(dataValues);

    expect(() =>
      model.addDataValues([
        DataValue.create({
          dataFieldId: "fieldId2",
          dataSectionId: "sid1",
          value: "value 2",
          row: 0,
        }),
        DataValue.create({
          dataFieldId: "fieldId1",
          dataSectionId: "sid1",
          value: "value 1",
          row: 0,
        }),
      ]),
    ).toThrow(
      "Data value for section sid1, field fieldId1, row 0 already exists",
    );
  });

  it("is renamed", () => {
    const model = Model.create({
      name: "My Name",
      userId,
      organizationId,
      template,
    });
    model.rename("new Name");
    model.modifyDescription("new description");
    expect(model.name).toEqual("new Name");
    expect(model.description).toEqual("new description");
  });

  it("modifies data values", () => {
    const dataValue1 = DataValue.create({
      value: undefined,
      dataSectionId: "s1",
      dataFieldId: "f1",
      row: 0,
    });
    const dataValue3 = DataValue.create({
      value: "v3",
      dataSectionId: "s2",
      dataFieldId: "f3",
      row: 0,
    });
    const dataValues = [
      dataValue1,
      DataValue.create({
        value: "v2",
        dataSectionId: "s1",
        dataFieldId: "f2",
        row: 0,
      }),
      dataValue3,
    ];
    const model = Model.create({
      name: "my name",
      userId,
      organizationId,
      template,
    });
    model.addDataValues(dataValues);
    const dataValueUpdates = [
      DataValue.create({
        dataFieldId: dataValue1.dataFieldId,
        dataSectionId: dataValue1.dataSectionId,
        value: "v1",
        row: 0,
      }),
      DataValue.create({
        dataFieldId: dataValue3.dataFieldId,
        dataSectionId: dataValue3.dataSectionId,
        value: "v3 new",
        row: 0,
      }),
    ];
    model.modifyDataValues(dataValueUpdates);
    expect(model.dataValues).toEqual(
      ignoreIds([
        DataValue.create({
          value: "v1",
          dataSectionId: "s1",
          dataFieldId: "f1",
          row: 0,
        }),
        DataValue.create({
          value: "v2",
          dataSectionId: "s1",
          dataFieldId: "f2",
          row: 0,
        }),
        DataValue.create({
          value: "v3 new",
          dataSectionId: "s2",
          dataFieldId: "f3",
          row: 0,
        }),
      ]),
    );
  });

  describe("dataValue", () => {
    it("should create from plain object", () => {
      const plain = {
        value: "test-value",
        dataSectionId: "section-1",
        dataFieldId: "field-1",
        row: 3,
      };

      const dataValue = DataValue.create(plain);

      expect(dataValue.value).toBe("test-value");
      expect(dataValue.dataSectionId).toBe("section-1");
      expect(dataValue.dataFieldId).toBe("field-1");
      expect(dataValue.row).toBe(3);
    });

    it("should ignore extra properties when creating from plain", () => {
      const plain = {
        value: "test-value",
        dataSectionId: "section-1",
        dataFieldId: "field-1",
        extraProperty: "should be ignored",
      };

      const dataValue = DataValue.create(plain as any);

      expect(dataValue.value).toBe("test-value");
      expect((dataValue as any).extraProperty).toBeUndefined();
    });
  });

  it("should initialize data values", () => {
    // Create a mock product data model
    const template = {
      id: "pdm-1",
      createInitialDataValues: jest.fn().mockReturnValue([
        DataValue.create({
          dataSectionId: "section-1",
          dataFieldId: "field-1",
          value: undefined,
          row: 0,
        }),
        DataValue.create({
          dataSectionId: "section-1",
          dataFieldId: "field-2",
          value: undefined,
          row: 0,
        }),
      ]),
    } as unknown as Template;
    const model = Model.create({
      name: "Test Model",
      userId,
      organizationId,
      template,
    });

    expect(model.templateId).toBe("pdm-1");
    expect(model.dataValues).toHaveLength(2);
    expect(template.createInitialDataValues).toHaveBeenCalled();
  });
});
