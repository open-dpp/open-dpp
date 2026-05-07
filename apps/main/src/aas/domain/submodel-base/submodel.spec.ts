import { randomUUID } from "node:crypto";
import { beforeAll, expect, jest } from "@jest/globals";
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
import { IdShortPath } from "../common/id-short-path";
import { LanguageText } from "../common/language-text";
import { Permission } from "../security/permission";
import { Security } from "../security/security";
import { SubjectAttributes } from "../security/subject-attributes";
import { Property } from "./property";
import { registerSubmodelElementClasses } from "./register-submodel-element-classes";
import { Submodel } from "./submodel";
import { SubmodelElementCollection } from "./submodel-element-collection";
import { SubmodelElementList } from "./submodel-element-list";
import { TableExtension } from "./table-extension";
import { SubmodelElementModificationActivityPayload } from "../../../activity-history/aas/submodel-element-modification.activity";

describe("submodel", () => {
  beforeAll(() => {
    registerSubmodelElementClasses();
  });
  const prefixDeleteMessage = "Missing permissions to delete element";
  const prefixCreateMessage = "Missing permissions to add element to";
  const member = SubjectAttributes.create({
    userRole: UserRole.USER,
    memberRole: MemberRole.MEMBER,
  });

  it("should find submodel element by idShortPath", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(
      submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }),
    );
    let element = submodel.findSubmodelElement(
      IdShortPath.create({ path: "ProductCarbonFootprint_A1A3" }),
    );
    expect(element?.idShort).toBe("ProductCarbonFootprint_A1A3");

    element = submodel.findSubmodelElement(
      IdShortPath.create({ path: "ProductCarbonFootprint_A1A3.PCFCalculationMethod" }),
    );
    expect(element?.idShort).toBe("PCFCalculationMethod");

    element = submodel.findSubmodelElement(
      IdShortPath.create({ path: "ProductCarbonFootprint_A1A3.PCFGoodsAddressHandover.Street" }),
    );
    expect(element?.idShort).toBe("Street");
  });
  it("should fail to find submodel element by idShortPath", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(
      submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }),
    );
    let element = submodel.findSubmodelElement(
      IdShortPath.create({ path: "ProductCarbonFootprintUnknown" }),
    );
    expect(element).toBeUndefined();

    element = submodel.findSubmodelElement(
      IdShortPath.create({ path: "ProductCarbonFootprintUnknown.PCFCalculationMethod" }),
    );
    expect(element).toBeUndefined();

    element = submodel.findSubmodelElement(
      IdShortPath.create({
        path: "ProductCarbonFootprint_A1A3.PCFGoodsAddressHandoverUnknown.Street",
      }),
    );
    expect(element).toBeUndefined();
  });
  it("should add submodel element", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;
    const submodel = Submodel.fromPlain(
      submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }),
    );
    const security = Security.create({});
    security.addPolicy(member, IdShortPath.create({ path: submodel.idShort }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow }),
    ]);
    const ability = security.defineAbilityForSubject(member);

    const submodelElement = Property.create({
      idShort: "prop1",
      value: "10",
      valueType: DataTypeDef.Double,
    });
    submodel.addSubmodelElement(submodelElement, { ability });
    expect(
      submodel.findSubmodelElementOrFail(IdShortPath.create({ path: submodelElement.idShort })),
    ).toEqual(submodelElement);

    const submodelElement0 = Property.fromPlain(
      propertyInputPlainFactory.build({ idShort: "submodelElement0" }),
    );
    submodel.addSubmodelElement(submodelElement0, { position: 0, ability });
    expect(submodel.getSubmodelElements()[0]).toEqual(submodelElement0);

    expect(() => submodel.addSubmodelElement(submodelElement, { ability })).toThrow(
      new ValueError(`Submodel element with idShort prop1 already exists`),
    );

    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const anonymousAbility = security.defineAbilityForSubject(anonymous);
    const newSubmodelElement = Property.create({
      idShort: "newSub",
      value: "10",
      valueType: DataTypeDef.Double,
    });

    expect(() =>
      submodel.addSubmodelElement(newSubmodelElement, { ability: anonymousAbility }),
    ).toThrow(new ForbiddenError(`${prefixCreateMessage} ${submodel.idShort}.`));
  });

  it("should add column", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;
    const submodel = Submodel.fromPlain(
      submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }),
    );
    const security = Security.create({});
    security.addPolicy(member, IdShortPath.create({ path: submodel.idShort }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow }),
    ]);
    const ability = security.defineAbilityForSubject(member);
    const submodelElementList = SubmodelElementList.create({
      idShort: "tableList",
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
    });
    submodel.addSubmodelElement(submodelElementList, { ability });
    const col1 = Property.create({ idShort: "col1", value: "10", valueType: DataTypeDef.Double });
    submodel.addColumn(IdShortPath.create({ path: submodelElementList.idShort }), col1, {
      ability,
    });
    const row0 = submodelElementList.getSubmodelElements()[0];
    col1.setParentIdShortPath(row0.getIdShortPath());
    expect(row0.getSubmodelElements()).toEqual([col1]);

    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const anonymousAbility = security.defineAbilityForSubject(anonymous);
    const newCol = Property.create({
      idShort: "newCol",
      value: "10",
      valueType: DataTypeDef.Double,
    });
    expect(() =>
      submodel.addColumn(IdShortPath.create({ path: submodelElementList.idShort }), newCol, {
        ability: anonymousAbility,
      }),
    ).toThrow(
      new ForbiddenError(
        `${prefixCreateMessage} ${submodel.idShort}.${submodelElementList.idShort}.${row0.idShort}.`,
      ),
    );
  });

  it("should modify column", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;
    const security = Security.create({});
    const submodel = Submodel.fromPlain(
      submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }),
    );

    security.addPolicy(member, IdShortPath.create({ path: submodel.idShort }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow }),
    ]);
    const ability = security.defineAbilityForSubject(member);

    const submodelElementList = SubmodelElementList.create({
      idShort: "tableList",
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
    });
    submodel.addSubmodelElement(submodelElementList, { ability });
    const col1 = Property.create({ idShort: "col1", value: "10", valueType: DataTypeDef.Double });
    submodel.addColumn(IdShortPath.create({ path: submodelElementList.idShort }), col1, {
      ability,
    });

    const newDisplayNames = [
      {
        language: "de",
        text: "CO2 Footprint New Text",
      },
    ];
    const list = submodel.modifyColumn(
      IdShortPath.create({ path: submodelElementList.idShort }),
      col1.idShort,
      { displayName: newDisplayNames },
      { ability },
    );
    expect(list.value[0].getSubmodelElements()[0].displayName).toEqual(
      newDisplayNames.map(LanguageText.fromPlain),
    );
  });

  it("should delete column", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(
      submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }),
    );
    const security = Security.create({});

    security.addPolicy(member, IdShortPath.create({ path: submodel.idShort }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Delete, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow }),
    ]);
    const ability = security.defineAbilityForSubject(member);

    const submodelElementList = SubmodelElementList.create({
      idShort: "tableList",
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
    });
    submodel.addSubmodelElement(submodelElementList, { ability });
    const col1 = Property.create({ idShort: "col1", value: "10", valueType: DataTypeDef.Double });
    submodel.addColumn(IdShortPath.create({ path: submodelElementList.idShort }), col1, {
      ability,
    });
    let tableExtension = new TableExtension(submodelElementList);
    col1.setParentIdShortPath(tableExtension.rows[0].getIdShortPath());
    expect(tableExtension.columns).toEqual([col1]);

    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const anonymousAbility = security.defineAbilityForSubject(anonymous);
    const onDelete = jest.fn();

    expect(() =>
      submodel.deleteColumn(
        IdShortPath.create({ path: submodelElementList.idShort }),
        col1.idShort,
        { ability: anonymousAbility, onDelete },
      ),
    ).toThrow(
      new ForbiddenError(
        `${prefixDeleteMessage} ${submodel.idShort}.${submodelElementList.idShort}.${submodelElementList.getSubmodelElements()[0].idShort}.${col1.idShort}.`,
      ),
    );

    submodel.deleteColumn(IdShortPath.create({ path: submodelElementList.idShort }), col1.idShort, {
      ability,
      onDelete,
    });
    tableExtension = new TableExtension(submodelElementList);
    expect(tableExtension.columns).toEqual([]);
    expect(onDelete).toHaveBeenCalledWith(col1);
  });

  it("should add row", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(
      submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }),
    );

    const security = Security.create({});

    security.addPolicy(member, IdShortPath.create({ path: submodel.idShort }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow }),
    ]);
    const ability = security.defineAbilityForSubject(member);

    const submodelElementList = SubmodelElementList.create({
      idShort: "tableList",
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
    });
    submodel.addSubmodelElement(submodelElementList, { ability });
    submodel.addRow(IdShortPath.create({ path: submodelElementList.idShort }), { ability });
    submodel.addRow(IdShortPath.create({ path: submodelElementList.idShort }), { ability });
    expect(new TableExtension(submodelElementList).rows).toHaveLength(2);
  });

  it("should delete row", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(
      submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }),
    );

    const security = Security.create({});
    security.addPolicy(member, IdShortPath.create({ path: submodel.idShort }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Delete, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow }),
    ]);
    const ability = security.defineAbilityForSubject(member);

    const submodelElementList = SubmodelElementList.create({
      idShort: "tableList",
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
    });
    submodel.addSubmodelElement(submodelElementList, { ability });
    submodel.addRow(IdShortPath.create({ path: submodelElementList.idShort }), { ability });
    submodel.addRow(IdShortPath.create({ path: submodelElementList.idShort }), { ability });
    let tableExtension = new TableExtension(submodelElementList);
    const [row0, row1] = tableExtension.rows;
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const anonymousAbility = security.defineAbilityForSubject(anonymous);
    const onDelete = jest.fn();

    expect(() =>
      submodel.deleteRow(IdShortPath.create({ path: submodelElementList.idShort }), row0.idShort, {
        ability: anonymousAbility,
        onDelete,
      }),
    ).toThrow(
      new ForbiddenError(
        `${prefixDeleteMessage} ${submodel.idShort}.${submodelElementList.idShort}.${row0.idShort}.`,
      ),
    );
    submodel.deleteRow(IdShortPath.create({ path: submodelElementList.idShort }), row0.idShort, {
      ability,
      onDelete,
    });
    tableExtension = new TableExtension(submodelElementList);
    expect(tableExtension.rows).toEqual([row1]);
    expect(onDelete).toHaveBeenCalledWith(row0);
  });

  it("should add submodel element by idShortPath", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;
    const submodel = Submodel.fromPlain(
      submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }),
    );

    const security = Security.create({});
    security.addPolicy(member, IdShortPath.create({ path: submodel.idShort }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow }),
    ]);
    const ability = security.defineAbilityForSubject(member);

    const submodelElement = Property.create({
      idShort: "prop1",
      value: "10",
      valueType: DataTypeDef.Double,
    });
    submodel.addSubmodelElement(submodelElement, {
      idShortPath: IdShortPath.create({ path: "ProductCarbonFootprint_A1A3" }),
      ability,
    });
    expect(
      submodel.findSubmodelElementOrFail(
        IdShortPath.create({ path: `ProductCarbonFootprint_A1A3.${submodelElement.idShort}` }),
      ),
    ).toEqual(submodelElement);
    expect(() =>
      submodel.addSubmodelElement(submodelElement, {
        idShortPath: IdShortPath.create({ path: "ProductCarbonFootprint_A1A3" }),
        ability,
      }),
    ).toThrow(
      new ValueError(`Submodel element with idShort ${submodelElement.idShort} already exists`),
    );

    const submodelElement2 = Property.create({
      idShort: "prop2",
      value: "10",
      valueType: DataTypeDef.Double,
    });
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const anonymousAbility = security.defineAbilityForSubject(anonymous);
    expect(() =>
      submodel.addSubmodelElement(submodelElement2, {
        idShortPath: IdShortPath.create({ path: "ProductCarbonFootprint_A1A3" }),
        ability: anonymousAbility,
      }),
    ).toThrow(
      new ForbiddenError(`${prefixCreateMessage} ${submodel.idShort}.ProductCarbonFootprint_A1A3.`),
    );
  });

  it("should delete submodel element by idShortPath", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(
      submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }),
    );

    const security = Security.create({});
    const member = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });
    security.addPolicy(member, IdShortPath.create({ path: submodel.idShort }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Delete, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow }),
    ]);
    const ability = security.defineAbilityForSubject(member);

    const submodelElement = Property.create({
      idShort: "prop1",
      value: "10",
      valueType: DataTypeDef.Double,
    });
    submodel.addSubmodelElement(submodelElement, {
      idShortPath: IdShortPath.create({ path: "ProductCarbonFootprint_A1A3" }),
      ability,
    });
    const path = IdShortPath.create({
      path: `ProductCarbonFootprint_A1A3.${submodelElement.idShort}`,
    });

    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const anonymousAbility = security.defineAbilityForSubject(anonymous);
    const onDelete = jest.fn();
    expect(() =>
      submodel.deleteSubmodelElement(path, { ability: anonymousAbility, onDelete }),
    ).toThrow(
      new ForbiddenError(
        `${prefixDeleteMessage} ${submodel.idShort}.ProductCarbonFootprint_A1A3.${submodelElement.idShort}.`,
      ),
    );
    expect(onDelete).not.toHaveBeenCalled();

    submodel.deleteSubmodelElement(path, { ability, onDelete });
    expect(
      submodel.findSubmodelElement(
        IdShortPath.create({ path: `ProductCarbonFootprint_A1A3.${submodelElement.idShort}` }),
      ),
    ).toBeUndefined();
    expect(onDelete).toHaveBeenCalledWith(submodelElement);
  });

  it("should get value representation for design submodel", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(
      submodelDesignOfProductPlainFactory.build(undefined, { transient: { iriDomain } }),
    );
    const security = Security.create({});
    const member = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });
    security.addPolicy(member, IdShortPath.create({ path: submodel.idShort }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
    ]);
    const ability = security.defineAbilityForSubject(member);
    let element = submodel.getValueRepresentation({ options: { ability } });
    expect(element).toEqual(submodelDesignOfProductValuePlainFactory.build());

    element = submodel.getValueRepresentation({
      idShortPath: IdShortPath.create({ path: "Design_V01.Author" }),
      options: { ability },
    });
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

    element = submodel.getValueRepresentation({
      idShortPath: IdShortPath.create({ path: "Design_V01.Author.ListProp" }),
      options: { ability },
    });
    expect(element).toEqual([
      {
        prop1: "val1",
      },
      {
        prop2: "val2",
      },
    ]);
    element = submodel.getValueRepresentation({
      idShortPath: IdShortPath.create({ path: "Design_V01.Author.AuthorName" }),
      options: { ability },
    });
    expect(element).toEqual("Fabrikvordenker:in ER28-0652");
  });

  it("should get value representation for carbon footprint", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(
      submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }),
    );

    const security = Security.create({});
    const member = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });
    security.addPolicy(member, IdShortPath.create({ path: submodel.idShort }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
    ]);
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

    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    security.addPolicy(member, IdShortPath.create({ path: "section1" }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow }),
    ]);
    security.addPolicy(member, IdShortPath.create({ path: "section1.prop1" }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
    ]);
    security.addPolicy(member, IdShortPath.create({ path: "section1.prop2" }), []);
    let ability = security.defineAbilityForSubject(member);

    const prop1 = Property.create({ idShort: "prop1", value: "10", valueType: DataTypeDef.Double });
    const prop2 = Property.create({ idShort: "prop2", value: "10", valueType: DataTypeDef.Double });
    submodel.addSubmodelElement(prop1, { ability });
    submodel.addSubmodelElement(prop2, { ability });

    expect(submodel.toPlain({ ability })).toEqual({
      ...submodel.toPlain(),
      submodelElements: [prop1.toPlain()],
    });
    ability = security.defineAbilityForSubject(anonymous);
    expect(submodel.toPlain({ ability })).toEqual({});
    security.addPolicy(anonymous, IdShortPath.create({ path: "section1.prop2" }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
    ]);
    ability = security.defineAbilityForSubject(anonymous);
    expect(submodel.toPlain({ ability })).toEqual({
      ...submodel.toPlain(),
      submodelElements: [prop2.toPlain()],
    });
  });

  it("should copy values readable by specified subject", () => {
    const security = Security.create({});
    const submodel = Submodel.create({ idShort: "section1" });

    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    security.addPolicy(member, IdShortPath.create({ path: "section1" }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow }),
    ]);
    security.addPolicy(member, IdShortPath.create({ path: "section1.prop1" }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
    ]);
    security.addPolicy(member, IdShortPath.create({ path: "section1.prop2" }), []);
    let ability = security.defineAbilityForSubject(member);

    const prop1 = Property.create({ idShort: "prop1", value: "10", valueType: DataTypeDef.Double });
    const prop2 = Property.create({ idShort: "prop2", value: "10", valueType: DataTypeDef.Double });
    submodel.addSubmodelElement(prop1, { ability });
    submodel.addSubmodelElement(prop2, { ability });

    expect(submodel.copy({ ability })!.submodelElements).toEqual([prop1]);
    ability = security.defineAbilityForSubject(anonymous);
    expect(submodel.copy({ ability })).toEqual(undefined);
    security.addPolicy(anonymous, IdShortPath.create({ path: "section1.prop2" }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
    ]);
    ability = security.defineAbilityForSubject(anonymous);
    expect(submodel.copy({ ability })!.submodelElements).toEqual([prop2]);
  });

  it("should get value representation for bill of material", () => {
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;
    const member = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });
    const security = Security.create({});

    const submodel = Submodel.fromPlain(
      submodelBillOfMaterialPlainFactory.build(undefined, { transient: { iriDomain } }),
    );

    security.addPolicy(member, IdShortPath.create({ path: submodel.idShort }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
    ]);

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
                    statements: [{ Name: "Lid_A_Blue" }],
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
    const submodel = Submodel.fromPlain(
      submodelDesignOfProductPlainFactory.build(undefined, { transient: { iriDomain } }),
    );

    const copy = submodel.copy();
    expect(copy).toEqual(
      Submodel.fromPlain(
        submodelDesignOfProductPlainFactory.build({ id: copy!.id }, { transient: { iriDomain } }),
      ),
    );
  });

  it("should modify submodel element and track activiy", () => {
    const security = Security.create({});
    const member = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });

    const submodel = Submodel.create({ idShort: "section1" });
    security.addPolicy(member, IdShortPath.create({ path: submodel.idShort }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow }),
    ]);
    const ability = security.defineAbilityForSubject(member);
    const prop1 = Property.create({ idShort: "prop1", value: "10", valueType: DataTypeDef.Double });
    submodel.addSubmodelElement(prop1, { ability });
    const digitalProductDocumentId = "12345";
    const modification = { idShort: prop1.idShort, value: "20" };
    submodel.modifySubmodelElement(modification, IdShortPath.create({ path: "prop1" }), {
      ability,
      digitalProductDocumentId,
    });
    const events = submodel.pullAuditEvents();
    expect(events.map((e) => e.payload)).toEqual([
      SubmodelElementModificationActivityPayload.create({
        submodelId: submodel.id,
        fullIdShortPath: IdShortPath.create({ path: "section1.prop1" }),
        data: modification,
      }),
    ]);
  });

  it("should be modified", () => {
    const security = Security.create({});
    const iriDomain = `http://open-dpp.de/${randomUUID()}`;

    const submodel = Submodel.fromPlain(
      submodelCarbonFootprintPlainFactory.build(undefined, { transient: { iriDomain } }),
    );
    const newGermanDisplayName = {
      language: "de",
      text: "CO2 Footprint New Text",
    };
    const newDescriptions = [
      {
        language: "en",
        text: "The Submodel Carbon Footprint NEW",
      },
      {
        language: "de",
        text: "Das Submodel liefert CO2",
      },
    ];
    const member = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });
    security.addPolicy(member, IdShortPath.create({ path: submodel.idShort }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow }),
    ]);
    const ability = security.defineAbilityForSubject(member);

    submodel.modify(
      {
        idShort: submodel.idShort,
        displayName: [newGermanDisplayName],
        description: newDescriptions,
      },
      { ability },
    );
    expect(submodel.displayName).toEqual([LanguageText.fromPlain(newGermanDisplayName)]);
    expect(submodel.description).toEqual(
      newDescriptions.map((description) => LanguageText.fromPlain(description)),
    );
  });

  it("should return value representation of submodel with protected fields", () => {
    const security = Security.create({});
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const submodel = Submodel.create({ idShort: "section1" });

    security.addPolicy(member, IdShortPath.create({ path: "section1" }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow }),
    ]);

    security.addPolicy(member, IdShortPath.create({ path: "section1.subSection1.prop1" }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
    ]);
    security.addPolicy(member, IdShortPath.create({ path: "section1.subSection1.prop2" }), []);
    security.addPolicy(member, IdShortPath.create({ path: "section1.prop3" }), []);
    security.addPolicy(member, IdShortPath.create({ path: "section1.prop4" }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
    ]);

    let ability = security.defineAbilityForSubject(member);
    const submodelElementCollection = SubmodelElementCollection.create({
      idShort: "subSection1",
    });
    submodel.addSubmodelElement(submodelElementCollection, { ability });

    const property1 = Property.create({
      idShort: "prop1",
      valueType: DataTypeDef.String,
      value: "blub1",
    });
    const property2 = Property.create({
      idShort: "prop2",
      valueType: DataTypeDef.String,
      value: "blub2",
    });
    submodelElementCollection.addSubmodelElement(property1, { ability });
    submodelElementCollection.addSubmodelElement(property2, { ability });

    const property3 = Property.create({
      idShort: "prop3",
      valueType: DataTypeDef.String,
      value: "blub3",
    });
    const property4 = Property.create({
      idShort: "prop4",
      valueType: DataTypeDef.String,
      value: "blub4",
    });
    submodel.addSubmodelElement(property3, { ability });
    submodel.addSubmodelElement(property4, { ability });

    expect(submodel.getValueRepresentation({ options: { ability } })).toEqual({
      subSection1: { prop1: "blub1" },
      prop4: "blub4",
    });

    ability = security.defineAbilityForSubject(anonymous);

    expect(() => submodel.getValueRepresentation({ options: { ability } })).toThrow(
      new ForbiddenError("Cannot access submodel section1"),
    );

    const emptySubmodel = Submodel.create({ idShort: "emptySubmodel" });
    security.addPolicy(member, IdShortPath.create({ path: "emptySubmodel" }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
    ]);
    ability = security.defineAbilityForSubject(member);
    expect(emptySubmodel.getValueRepresentation({ options: { ability } })).toEqual({});
  });
});
