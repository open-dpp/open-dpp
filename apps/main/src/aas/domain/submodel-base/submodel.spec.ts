import { randomUUID } from "node:crypto";
import { beforeAll, expect } from "@jest/globals";
import { AasSubmodelElements, DataTypeDef, PermissionKind, Permissions } from "@open-dpp/dto";
import { ForbiddenError, ValueError } from "@open-dpp/exception";
import {
  propertyInputPlainFactory,
  submodelBillOfMaterialPlainFactory,
  submodelCarbonFootprintPlainFactory,
  submodelDesignOfProductPlainFactory,
  submodelDesignOfProductValuePlainFactory,
} from "@open-dpp/testing";
import { MemberRole } from "../../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { LanguageText } from "../common/language-text";
import { Permission } from "../security/permission";
import { Security } from "../security/security";
import { SubjectAttributes } from "../security/subject-attributes";
import { Property } from "./property";
import { registerSubmodelElementClasses } from "./register-submodel-element-classes";
import { Submodel } from "./submodel";
import { IdShortPath } from "./submodel-base";
import { SubmodelElementCollection } from "./submodel-element-collection";
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

    const submodelElement0 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "submodelElement0" }));
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
    const security = Security.create({});
    const submodel = Submodel.fromPlain(submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }));
    const submodelElementList = SubmodelElementList.create({ idShort: "tableList", typeValueListElement: AasSubmodelElements.SubmodelElementCollection });
    submodel.addSubmodelElement(submodelElementList);
    const col1 = Property.create({ idShort: "col1", value: "10", valueType: DataTypeDef.Double });
    submodel.addColumn(IdShortPath.create({ path: submodelElementList.idShort }), col1);
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });
    security.addPolicy(
      member,
      IdShortPath.create({ path: submodel.idShort }),
      [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }), Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow })],
    );
    const ability = security.defineAbilityForSubject(member);
    const newDisplayNames = [{
      language: "de",
      text: "CO2 Footprint New Text",
    }];
    const list = submodel.modifyColumn(IdShortPath.create({ path: submodelElementList.idShort }), col1.idShort, { displayName: newDisplayNames }, { ability });
    expect(list.value[0].getSubmodelElements()[0].displayName).toEqual(newDisplayNames.map(LanguageText.fromPlain));
  });

  it("should delete column", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }));
    const submodelElementList = SubmodelElementList.create({ idShort: "tableList", typeValueListElement: AasSubmodelElements.SubmodelElementCollection });
    submodel.addSubmodelElement(submodelElementList);
    const col1 = Property.create({ idShort: "col1", value: "10", valueType: DataTypeDef.Double });
    submodel.addColumn(IdShortPath.create({ path: submodelElementList.idShort }), col1);
    let tableExtension = new TableExtension(submodelElementList, submodel.idShort);
    expect(tableExtension.columns).toEqual([col1]);
    submodel.deleteColumn(IdShortPath.create({ path: submodelElementList.idShort }), col1.idShort);
    tableExtension = new TableExtension(submodelElementList, submodel.idShort);
    expect(tableExtension.columns).toEqual([]);
  });

  it("should add row", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }));
    const submodelElementList = SubmodelElementList.create({ idShort: "tableList", typeValueListElement: AasSubmodelElements.SubmodelElementCollection });
    submodel.addSubmodelElement(submodelElementList);
    submodel.addRow(IdShortPath.create({ path: submodelElementList.idShort }));
    submodel.addRow(IdShortPath.create({ path: submodelElementList.idShort }));
    expect(new TableExtension(submodelElementList, submodel.idShort).rows).toHaveLength(2);
  });

  it("should delete row", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }));
    const submodelElementList = SubmodelElementList.create({ idShort: "tableList", typeValueListElement: AasSubmodelElements.SubmodelElementCollection });
    submodel.addSubmodelElement(submodelElementList);
    submodel.addRow(IdShortPath.create({ path: submodelElementList.idShort }));
    submodel.addRow(IdShortPath.create({ path: submodelElementList.idShort }));
    let tableExtension = new TableExtension(submodelElementList, submodel.idShort);
    const [row0, row1] = tableExtension.rows;
    submodel.deleteRow(IdShortPath.create({ path: submodelElementList.idShort }), row0.idShort);
    tableExtension = new TableExtension(submodelElementList, submodel.idShort);
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
    const security = Security.create({});
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });
    security.addPolicy(member, IdShortPath.create({ path: submodel.idShort }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    const ability = security.defineAbilityForSubject(member);
    let element = submodel.getValueRepresentation({ options: { ability } });
    expect(element).toEqual(submodelDesignOfProductValuePlainFactory.build());

    element = submodel.getValueRepresentation({ idShortPath: IdShortPath.create({ path: "Design_V01.Author" }), options: { ability } });
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

    element = submodel.getValueRepresentation({ idShortPath: IdShortPath.create({ path: "Design_V01.Author.ListProp" }), options: { ability } });
    expect(element).toEqual([
      {
        prop1: "val1",
      },
      {
        prop2: "val2",
      },
    ],
    );
    element = submodel.getValueRepresentation({ idShortPath: IdShortPath.create({ path: "Design_V01.Author.AuthorName" }), options: { ability } });
    expect(element).toEqual("Fabrikvordenker:in ER28-0652");
  });

  it("should get value representation for carbon footprint", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }));

    const security = Security.create({});
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });
    security.addPolicy(member, IdShortPath.create({ path: submodel.idShort }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    const ability = security.defineAbilityForSubject(member);

    const element = submodel.getValueRepresentation({
      idShortPath: IdShortPath.create({ path: "ProductCarbonFootprint_A1A3.PCFFactSheet" }),
      options: { ability },
    });
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

  it("should get values readable by specified subject", () => {
    const security = Security.create({});
    const submodel = Submodel.create({ idShort: "section1" });

    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const prop1 = Property.create({ idShort: "prop1", value: "10", valueType: DataTypeDef.Double });
    const prop2 = Property.create({ idShort: "prop2", value: "10", valueType: DataTypeDef.Double });
    submodel.addSubmodelElement(prop1);
    submodel.addSubmodelElement(prop2);

    security.addPolicy(member, IdShortPath.create({ path: "section1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    security.addPolicy(member, IdShortPath.create({ path: "section1.prop1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    security.addPolicy(member, IdShortPath.create({ path: "section1.prop2" }), []);

    let ability = security.defineAbilityForSubject(member);
    expect(submodel.toPlain({ ability })).toEqual({ ...submodel.toPlain(), submodelElements: [prop1.toPlain()] });
    ability = security.defineAbilityForSubject(anonymous);
    expect(submodel.toPlain({ ability })).toEqual({ });
    security.addPolicy(anonymous, IdShortPath.create({ path: "section1.prop2" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    ability = security.defineAbilityForSubject(anonymous);
    expect(submodel.toPlain({ ability })).toEqual({ ...submodel.toPlain(), submodelElements: [prop2.toPlain()] });
  });

  it("should get value representation for bill of material", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });
    const security = Security.create({});

    const submodel = Submodel.fromPlain(submodelBillOfMaterialPlainFactory.build(undefined, { transient: { iriDomain } }));

    security.addPolicy(member, IdShortPath.create({ path: submodel.idShort }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);

    const ability = security.defineAbilityForSubject(member);

    const element = submodel.getValueRepresentation({ options: { ability } });
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

  it("should be modified", () => {
    const security = Security.create({});
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
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });
    security.addPolicy(
      member,
      IdShortPath.create({ path: submodel.idShort }),
      [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }), Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow })],
    );
    const ability = security.defineAbilityForSubject(member);

    submodel.modify({ idShort: submodel.idShort, displayName: [
      newGermanDisplayName,
    ], description: newDescriptions }, { ability });
    expect(submodel.displayName).toEqual([
      LanguageText.fromPlain(
        newGermanDisplayName,
      ),
    ]);
    expect(submodel.description).toEqual(newDescriptions.map(description => LanguageText.fromPlain(description)));
  });

  it("should return value representation of submodel with protected fields", () => {
    const security = Security.create({});
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const submodel = Submodel.create({ idShort: "section1" });

    const submodelElementCollection = SubmodelElementCollection.create({
      idShort: "subSection1",
    });
    const property1 = Property.create({ idShort: "prop1", valueType: DataTypeDef.String, value: "blub1" });
    const property2 = Property.create({ idShort: "prop2", valueType: DataTypeDef.String, value: "blub2" });
    submodelElementCollection.addSubmodelElement(property1);
    submodelElementCollection.addSubmodelElement(property2);

    submodel.addSubmodelElement(submodelElementCollection);

    const property3 = Property.create({ idShort: "prop3", valueType: DataTypeDef.String, value: "blub3" });
    const property4 = Property.create({ idShort: "prop4", valueType: DataTypeDef.String, value: "blub4" });
    submodel.addSubmodelElement(property3);
    submodel.addSubmodelElement(property4);

    security.addPolicy(member, IdShortPath.create({ path: "section1.subSection1.prop1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    security.addPolicy(member, IdShortPath.create({ path: "section1.subSection1.prop2" }), []);
    security.addPolicy(member, IdShortPath.create({ path: "section1.prop4" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);

    let ability = security.defineAbilityForSubject(member);

    expect(submodel.getValueRepresentation({ options: { ability } })).toEqual({ subSection1: { prop1: "blub1" }, prop4: "blub4" });

    ability = security.defineAbilityForSubject(anonymous);

    expect(() => submodel.getValueRepresentation({ options: { ability } })).toThrow(new ForbiddenError("Cannot access submodel section1"));

    const emptySubmodel = Submodel.create({ idShort: "emptySubmodel" });
    security.addPolicy(member, IdShortPath.create({ path: "emptySubmodel" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    ability = security.defineAbilityForSubject(member);
    expect(emptySubmodel.getValueRepresentation({ options: { ability } })).toEqual({});
  });
});
