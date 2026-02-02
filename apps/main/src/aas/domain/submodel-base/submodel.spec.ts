import { randomUUID } from "node:crypto";
import { beforeAll, expect } from "@jest/globals";
import { AasSubmodelElements, DataTypeDef } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import {
  propertyPlainFactory,
  submodelBillOfMaterialPlainFactory,
  submodelCarbonFootprintPlainFactory,
  submodelDesignOfProductPlainFactory,
  submodelDesignOfProductValuePlainFactory,
} from "@open-dpp/testing";
import { LanguageText } from "../common/language-text";
import { Property } from "./property";
import { registerSubmodelElementClasses } from "./register-submodel-element-classes";
import { Submodel } from "./submodel";
import { IdShortPath } from "./submodel-base";
import { SubmodelElementList } from "./submodel-element-list";
import { TableExtension } from "./table-extension";

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

    const submodelElement0 = Property.fromPlain(propertyPlainFactory.build({ idShort: "submodelElement0" }));
    submodel.addSubmodelElement(submodelElement0, { position: 0 });
    expect(submodel.getSubmodelElements()[0]).toEqual(submodelElement0);

    expect(() => submodel.addSubmodelElement(submodelElement)).toThrow(new ValueError(`Submodel element with idShort prop1 already exists`));
  });

  it("should add column", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }));
    const submodelElementList = SubmodelElementList.create({ idShort: "tableList", typeValueListElement: AasSubmodelElements.SubmodelElementCollection });
    submodel.addSubmodelElement(submodelElementList);
    const col1 = Property.create({ idShort: "col1", value: "10", valueType: DataTypeDef.Double });
    submodel.addColumn(IdShortPath.create({ path: submodelElementList.idShort }), col1);
    const row0 = submodelElementList.getSubmodelElements()[0];
    expect(row0.getSubmodelElements()).toEqual([col1]);
  });

  it("should modify column", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }));
    const submodelElementList = SubmodelElementList.create({ idShort: "tableList", typeValueListElement: AasSubmodelElements.SubmodelElementCollection });
    submodel.addSubmodelElement(submodelElementList);
    const col1 = Property.create({ idShort: "col1", value: "10", valueType: DataTypeDef.Double });
    submodel.addColumn(IdShortPath.create({ path: submodelElementList.idShort }), col1);
    const newDisplayNames = [{
      language: "de",
      text: "CO2 Footprint New Text",
    }];
    const list = submodel.modifyColumn(IdShortPath.create({ path: submodelElementList.idShort }), col1.idShort, { displayName: newDisplayNames });
    expect(list.value[0].getSubmodelElements()[0].displayName).toEqual(newDisplayNames.map(LanguageText.fromPlain));
  });

  it("should delete column", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }));
    const submodelElementList = SubmodelElementList.create({ idShort: "tableList", typeValueListElement: AasSubmodelElements.SubmodelElementCollection });
    submodel.addSubmodelElement(submodelElementList);
    const col1 = Property.create({ idShort: "col1", value: "10", valueType: DataTypeDef.Double });
    submodel.addColumn(IdShortPath.create({ path: submodelElementList.idShort }), col1);
    let tableExtension = new TableExtension(submodelElementList);
    expect(tableExtension.columns).toEqual([col1]);
    submodel.deleteColumn(IdShortPath.create({ path: submodelElementList.idShort }), col1.idShort);
    tableExtension = new TableExtension(submodelElementList);
    expect(tableExtension.columns).toEqual([]);
  });

  it("should add row", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }));
    const submodelElementList = SubmodelElementList.create({ idShort: "tableList", typeValueListElement: AasSubmodelElements.SubmodelElementCollection });
    submodel.addSubmodelElement(submodelElementList);
    submodel.addRow(IdShortPath.create({ path: submodelElementList.idShort }));
    submodel.addRow(IdShortPath.create({ path: submodelElementList.idShort }));
    expect(new TableExtension(submodelElementList).rows).toHaveLength(2);
  });

  it("should delete row", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }));
    const submodelElementList = SubmodelElementList.create({ idShort: "tableList", typeValueListElement: AasSubmodelElements.SubmodelElementCollection });
    submodel.addSubmodelElement(submodelElementList);
    submodel.addRow(IdShortPath.create({ path: submodelElementList.idShort }));
    submodel.addRow(IdShortPath.create({ path: submodelElementList.idShort }));
    let tableExtension = new TableExtension(submodelElementList);
    const [row0, row1] = tableExtension.rows;
    submodel.deleteRow(IdShortPath.create({ path: submodelElementList.idShort }), row0.idShort);
    tableExtension = new TableExtension(submodelElementList);
    expect(tableExtension.rows).toEqual([row1]);
  });

  it("should add submodel element by idShortPath", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }));
    const submodelElement = Property.create({ idShort: "prop1", value: "10", valueType: DataTypeDef.Double });
    submodel.addSubmodelElement(submodelElement, { idShortPath: IdShortPath.create({ path: "ProductCarbonFootprint_A1A3" }) });
    expect(submodel.findSubmodelElementOrFail(IdShortPath.create({ path: `ProductCarbonFootprint_A1A3.${submodelElement.idShort}` }))).toEqual(submodelElement);
    expect(() => submodel.addSubmodelElement(submodelElement, { idShortPath: IdShortPath.create({ path: "ProductCarbonFootprint_A1A3" }) })).toThrow(new ValueError(`Submodel element with idShort ${submodelElement.idShort} already exists`));
  });

  it("should delete submodel element by idShortPath", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }));
    const submodelElement = Property.create({ idShort: "prop1", value: "10", valueType: DataTypeDef.Double });
    submodel.addSubmodelElement(submodelElement, { idShortPath: IdShortPath.create({ path: "ProductCarbonFootprint_A1A3" }) });
    submodel.deleteSubmodelElement(IdShortPath.create({ path: `ProductCarbonFootprint_A1A3.${submodelElement.idShort}` }));
    expect(submodel.findSubmodelElement(
      IdShortPath.create({ path: `ProductCarbonFootprint_A1A3.${submodelElement.idShort}` }),
    )).toBeUndefined();
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

  it("should be modified", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }));
    const newGermanDisplayName = {
      language: "de",
      text: "CO2 Footprint New Text",
    };
    const newDescriptions = [{
      language: "en",
      text: "The Submodel Carbon Footprint NEW",
    }, {
      language: "de",
      text: "Das Submodel liefert CO2",
    }];
    submodel.modify({ idShort: submodel.idShort, displayName: [
      newGermanDisplayName,
    ], description: newDescriptions });
    expect(submodel.displayName).toEqual([
      LanguageText.fromPlain(
        newGermanDisplayName,
      ),
      submodel.displayName.find(languageText => languageText.language === "en")!,
    ]);
    expect(submodel.description).toEqual(newDescriptions.map(description => LanguageText.fromPlain(description)));
  });
});
