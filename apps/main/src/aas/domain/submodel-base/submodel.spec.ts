import { randomUUID } from "node:crypto";
import { beforeAll, expect } from "@jest/globals";
import { DataTypeDef } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import {
  submodelBillOfMaterialPlainFactory,
  submodelCarbonFootprintPlainFactory,
  submodelDesignOfProductPlainFactory,
  submodelDesignOfProductValuePlainFactory,
} from "@open-dpp/testing";
import { Property } from "./property";
import { registerSubmodelElementClasses } from "./register-submodel-element-classes";
import { Submodel } from "./submodel";
import { IdShortPath } from "./submodel-base";

describe("submodel", () => {
  beforeAll(() => {
    registerSubmodelElementClasses();
  });
  it("should find submodel element by idShortPath", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }));
    let element = submodel.findSubmodelElement(IdShortPath.create({ path: "ProductCarbonFootprint_A1A3" }));
    expect(element?.idShort).toBe("ProductCarbonFootprint_A1A3");

    element = submodel.findSubmodelElement(IdShortPath.create({ path: "ProductCarbonFootprint_A1A3.PCFCalculationMethod" }));
    expect(element?.idShort).toBe("PCFCalculationMethod");

    element = submodel.findSubmodelElement(IdShortPath.create({ path: "ProductCarbonFootprint_A1A3.PCFGoodsAddressHandover.Street" }));
    expect(element?.idShort).toBe("Street");
  });
  it("should fail to find submodel element by idShortPath", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }));
    let element = submodel.findSubmodelElement(IdShortPath.create({ path: "ProductCarbonFootprintUnknown" }));
    expect(element).toBeUndefined();

    element = submodel.findSubmodelElement(IdShortPath.create({ path: "ProductCarbonFootprintUnknown.PCFCalculationMethod" }));
    expect(element).toBeUndefined();

    element = submodel.findSubmodelElement(IdShortPath.create({ path: "ProductCarbonFootprint_A1A3.PCFGoodsAddressHandoverUnknown.Street" }));
    expect(element).toBeUndefined();
  });
  it("should add submodel element", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }));
    const submodelElement = Property.create({ idShort: "prop1", value: "10", valueType: DataTypeDef.Double });
    submodel.addSubmodelElement(submodelElement);
    expect(submodel.findSubmodelElementOrFail(IdShortPath.create({ path: submodelElement.idShort }))).toEqual(submodelElement);
    expect(() => submodel.addSubmodelElement(submodelElement)).toThrow(new ValueError(`Submodel element with idShort prop1 already exists`));
  });

  it("should add submodel element by idShortPath", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }));
    const submodelElement = Property.create({ idShort: "prop1", value: "10", valueType: DataTypeDef.Double });
    submodel.addSubmodelElement(submodelElement, IdShortPath.create({ path: "ProductCarbonFootprint_A1A3" }));
    expect(submodel.findSubmodelElementOrFail(IdShortPath.create({ path: `ProductCarbonFootprint_A1A3.${submodelElement.idShort}` }))).toEqual(submodelElement);
    expect(() => submodel.addSubmodelElement(submodelElement, IdShortPath.create({ path: "ProductCarbonFootprint_A1A3" }))).toThrow(new ValueError(`Submodel element with idShort ${submodelElement.idShort} already exists`));
  });

  it("should get value representation for design submodel", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(submodelDesignOfProductPlainFactory.build(undefined, { transient: { iriDomain } }));
    let element = submodel.getValueRepresentation();
    expect(element).toEqual(submodelDesignOfProductValuePlainFactory.build());

    element = submodel.getValueRepresentation(IdShortPath.create({ path: "Design_V01.Author" }));
    expect(element).toEqual({
      AuthorOrganization: "Technologie-Initiative SmartFactory KL e. V.",
      AuthorName: "Fabrikvordenker:in ER28-0652",
      ListProp: [
        {
          prop1: "val1",
        },
        {
          prop2: "val2",
        },
      ],
    });

    element = submodel.getValueRepresentation(IdShortPath.create({ path: "Design_V01.Author.ListProp" }));
    expect(element).toEqual([
      {
        prop1: "val1",
      },
      {
        prop2: "val2",
      },
    ],
    );
    element = submodel.getValueRepresentation(IdShortPath.create({ path: "Design_V01.Author.AuthorName" }));
    expect(element).toEqual("Fabrikvordenker:in ER28-0652");
  });

  it("should get value representation for carbon footprint", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }));
    const element = submodel.getValueRepresentation(IdShortPath.create({ path: "ProductCarbonFootprint_A1A3.PCFFactSheet" }));
    expect(element).toEqual({
      type: "ExternalReference",
      keys: [
        {
          type: "GlobalReference",
          value: "http://pdf.shells.smartfactory.de/PCF_FactSheet/Truck_printed.pdf",
        },
      ],
    });
  });

  it("should get value representation for bill of material", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(submodelBillOfMaterialPlainFactory.build(undefined, { transient: { iriDomain } }));
    const element = submodel.getValueRepresentation();
    expect(element).toEqual({
      Truck: {
        statements: [
          {
            Id: `${iriDomain}/shells/-SR7BbncJG`,
          },
          {
            URL: {
              type: "ExternalReference",
              keys: [
                {
                  type: "GlobalReference",
                  value: `${iriDomain}/shells/-SR7BbncJG`,
                },
              ],
            },
          },
          {
            Semitrailer: {
              statements: [
                {
                  Id: `${iriDomain}/shells/wpIL8kYawf`,
                },
                {
                  Lid: {
                    entityType: "SelfManagedEntity",
                    globalAssetId: `${iriDomain}/assets/XjUPRWkSw5`,
                    specificAssetIds: [],
                    statements: [
                      { Name: "Lid_A_Blue" },
                    ],
                  },
                },
              ],
              entityType: "SelfManagedEntity",
              globalAssetId: `${iriDomain}/assets/aYJwzLG1RF`,
              specificAssetIds: [],
            },
          },
          {
            HasPart0001: {
              first: {
                type: "ModelReference",
                keys: [
                  {
                    type: "Submodel",
                    value: `${iriDomain}/submodels/IexIFXJ0YL`,
                  },
                  {
                    type: "Entity",
                    value: "Truck",
                  },
                ],
              },
              second: {
                type: "ModelReference",
                keys: [
                  {
                    type: "Submodel",
                    value: `${iriDomain}/submodels/IexIFXJ0YL`,
                  },
                  {
                    type: "Entity",
                    value: "Truck",
                  },
                  {
                    type: "Entity",
                    value: "Semitrailer",
                  },
                ],
              },
            },
          },
        ],
        entityType: "SelfManagedEntity",
        globalAssetId: `${iriDomain}/assets/zm6As5rG-h`,
        specificAssetIds: [
          {
            testi: "val1",
          },
        ],
      },
    });
  });

  it("should provide a copy", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;
    const submodel = Submodel.fromPlain(submodelDesignOfProductPlainFactory.build(undefined, { transient: { iriDomain } }));

    const copy = submodel.copy();
    expect(copy).toEqual(Submodel.fromPlain(submodelDesignOfProductPlainFactory.build({ id: copy.id }, { transient: { iriDomain } })));
  });
});
