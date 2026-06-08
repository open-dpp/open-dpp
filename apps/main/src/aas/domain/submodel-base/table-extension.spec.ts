import { expect, jest } from "@jest/globals";
import { AasSubmodelElements, PermissionKind, Permissions } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { propertyInputPlainFactory } from "@open-dpp/testing";
import { MemberRole } from "../../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { IdShortPath } from "../common/id-short-path";
import { LanguageText } from "../common/language-text";
import { Permission } from "../security/permission";
import { Security } from "../security/security";
import { SubjectAttributes } from "../security/subject-attributes";
import { Property } from "./property";
import { registerSubmodelElementClasses } from "./register-submodel-element-classes";
import { cloneSubmodelElement } from "./submodel-base";
import { SubmodelElementCollection } from "./submodel-element-collection";
import { SubmodelElementList } from "./submodel-element-list";
import { TableExtension } from "./table-extension";
import { randomUUID } from "node:crypto";

describe("tableExtension", () => {
  beforeAll(() => {
    registerSubmodelElementClasses();
  });

  const member = SubjectAttributes.create({
    userRole: UserRole.USER,
    memberRole: MemberRole.MEMBER,
  });

  it("should add columns and rows", () => {
    const submodelElementList = SubmodelElementList.create({
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
      idShort: "idShort",
    });
    const security = Security.create({});
    security.addPolicy(member, IdShortPath.create({ path: submodelElementList.idShort }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow }),
    ]);
    const ability = security.defineAbilityForSubject(member);
    const table = new TableExtension(submodelElementList);
    const col1Plain = propertyInputPlainFactory.build({ idShort: "col1", value: "10" });
    const col1 = Property.fromPlain(col1Plain);
    const digitalProductDocumentId = randomUUID();
    // Add first column
    table.addColumn(col1, { ability, digitalProductDocumentId });
    const firstRowId = table.rows[0].idShort;
    const expHeaderRow = SubmodelElementCollection.create({ idShort: firstRowId });
    expHeaderRow.setParentIdShortPath(submodelElementList.getIdShortPath());
    expHeaderRow.addSubmodelElement(col1, { ability, digitalProductDocumentId });
    expect(table.rows).toEqual([expHeaderRow]);

    // Add one row
    table.addRow({ ability, digitalProductDocumentId });
    const col1Row1WithEmptyValue = Property.fromPlain({ ...col1Plain, value: undefined });
    const secondRowId = table.rows[1].idShort;
    const expRow1 = SubmodelElementCollection.create({
      idShort: secondRowId,
      value: [col1Row1WithEmptyValue],
    });
    expRow1.setParentIdShortPath(submodelElementList.getIdShortPath());
    expect(table.rows).toEqual([expHeaderRow, expRow1]);
    expect(secondRowId).not.toEqual(firstRowId);

    // Add third column
    const col3 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "col3" }));
    expHeaderRow.addSubmodelElement(col3, { ability, digitalProductDocumentId });
    expRow1.addSubmodelElement(cloneSubmodelElement(col3), { ability, digitalProductDocumentId });
    table.addColumn(col3, { ability, digitalProductDocumentId });
    expect(table.rows).toEqual([expHeaderRow, expRow1]);

    // Add second column between first and third
    const col2 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "col2" }));
    expHeaderRow.addSubmodelElement(col2, { position: 1, ability, digitalProductDocumentId });
    expRow1.addSubmodelElement(cloneSubmodelElement(col2), {
      position: 1,
      ability,
      digitalProductDocumentId,
    });
    table.addColumn(col2, { position: 1, ability, digitalProductDocumentId });
    expect(table.rows).toEqual([expHeaderRow, expRow1]);

    // Add one row at position 1
    table.addRow({ position: 1, ability, digitalProductDocumentId });
    const rowAtPos1Id = table.rows[1].idShort;
    const expRowAtPos1 = SubmodelElementCollection.create({
      idShort: rowAtPos1Id,
      value: [
        cloneSubmodelElement(col1, { value: undefined }),
        cloneSubmodelElement(col2, { value: undefined }),
        cloneSubmodelElement(col3, { value: undefined }),
      ],
    });
    expRowAtPos1.setParentIdShortPath(submodelElementList.getIdShortPath());
    expect(table.rows).toEqual([expHeaderRow, expRowAtPos1, expRow1]);

    expect(rowAtPos1Id).not.toEqual(secondRowId);
    expect(rowAtPos1Id).not.toEqual(firstRowId);
  });

  it("should delete column", () => {
    const digitalProductDocumentId = randomUUID();
    const submodelElementList = SubmodelElementList.create({
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
      idShort: "list",
    });
    const security = Security.create({});
    security.addPolicy(member, IdShortPath.create({ path: submodelElementList.idShort }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Delete, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow }),
    ]);
    const ability = security.defineAbilityForSubject(member);
    const table = new TableExtension(submodelElementList);
    const col1 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "col1" }));
    const col2 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "col2" }));
    table.addColumn(col1, { ability, digitalProductDocumentId });
    table.addColumn(col2, { ability, digitalProductDocumentId });
    table.addRow({ ability, digitalProductDocumentId });
    table.addRow({ ability, digitalProductDocumentId });
    expect(
      table.rows.some((r) => r.getSubmodelElements().some((c) => c.idShort === col1.idShort)),
    ).toBeTruthy();
    const onDelete = jest.fn();
    table.deleteColumn(col1.idShort, { ability, onDelete });
    col1.setParentIdShortPath(table.rows[0].getIdShortPath());
    col2.setParentIdShortPath(table.rows[0].getIdShortPath());
    expect(onDelete).toHaveBeenCalledWith(col1);

    expect(table.columns).toEqual([col2]);
    expect(
      table.rows.some((r) => r.getSubmodelElements().some((c) => c.idShort === col1.idShort)),
    ).toBeFalsy();
  });

  it("should add row at position 0", () => {
    const submodelElementList = SubmodelElementList.create({
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
      idShort: "idShort",
    });
    const digitalProductDocumentId = randomUUID();

    const table = new TableExtension(submodelElementList);
    const security = Security.create({});
    security.addPolicy(member, IdShortPath.create({ path: submodelElementList.idShort }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow }),
    ]);
    const ability = security.defineAbilityForSubject(member);

    const col1 = Property.fromPlain(
      propertyInputPlainFactory.build({ idShort: "col1", value: "10" }),
    );
    table.addColumn(col1, { ability, digitalProductDocumentId });
    col1.setParentIdShortPath(table.rows[0].getIdShortPath());
    expect(table.columns).toEqual([col1]);
    // The header row is updated to the new row at position 0.
    table.addRow({ position: 0, ability, digitalProductDocumentId });
    const expectedCol = cloneSubmodelElement(col1, { value: null });
    expectedCol.setParentIdShortPath(table.rows[0].getIdShortPath());
    expect(table.columns).toEqual([expectedCol]);
  });

  it("should modify column", () => {
    const submodelElementList = SubmodelElementList.create({
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
      idShort: "idShort",
    });
    const digitalProductDocumentId = randomUUID();
    const security = Security.create({});
    security.addPolicy(member, IdShortPath.create({ path: submodelElementList.idShort }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow }),
    ]);
    const ability = security.defineAbilityForSubject(member);
    const table = new TableExtension(submodelElementList);
    const col1 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "col1" }));
    const col2 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "col2" }));
    table.addColumn(col1, { ability, digitalProductDocumentId });
    table.addColumn(col2, { ability, digitalProductDocumentId });
    table.addRow({ ability, digitalProductDocumentId });
    table.addRow({ ability, digitalProductDocumentId });
    const newDisplayNames = [
      {
        language: "de",
        text: "CO2 Footprint New Text",
      },
    ];
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

    table.modifyColumn(
      col1.idShort,
      { displayName: newDisplayNames, description: newDescriptions },
      { ability, digitalProductDocumentId },
    );
    for (const row of table.rows) {
      const column = row.getSubmodelElements().find((c) => c.idShort === col1.idShort);
      expect(column?.displayName).toEqual(newDisplayNames.map(LanguageText.fromPlain));
      expect(column?.description).toEqual(newDescriptions.map(LanguageText.fromPlain));
    }
    expect(() =>
      table.modifyColumn(
        col1.idShort,
        { displayName: newDisplayNames, value: "2" },
        { ability, digitalProductDocumentId },
      ),
    ).toThrow(new ValueError("Column value modification is not supported."));
  });

  it("should delete row", () => {
    const digitalProductDocumentId = randomUUID();

    const submodelElementList = SubmodelElementList.create({
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
      idShort: "idShort",
    });
    const security = Security.create({});
    security.addPolicy(member, IdShortPath.create({ path: submodelElementList.idShort }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Delete, kindOfPermission: PermissionKind.Allow }),
    ]);
    const ability = security.defineAbilityForSubject(member);
    const table = new TableExtension(submodelElementList);
    const col1 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "col1" }));
    const col2 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "col2" }));
    table.addColumn(col1, { ability, digitalProductDocumentId });
    table.addColumn(col2, { ability, digitalProductDocumentId });
    const rowToDelete = table.addRow({ ability, digitalProductDocumentId });
    table.addRow({ ability, digitalProductDocumentId });
    expect(table.rows.some((r) => r.idShort === rowToDelete.idShort)).toBeTruthy();
    const onDelete = jest.fn();
    table.deleteRow(rowToDelete.idShort, { ability, onDelete });
    expect(onDelete).toHaveBeenCalledWith(rowToDelete);
    expect(table.rows.some((r) => r.idShort === rowToDelete.idShort)).toBeFalsy();
    // If the header row is deleted, the first row should be used as header row.
    const rowToDelete2 = table.rows[0];
    table.deleteRow(rowToDelete2.idShort, { ability, onDelete });
    expect(onDelete).toHaveBeenCalledWith(rowToDelete2);
    const expectedCol1 = cloneSubmodelElement(col1, { value: null });
    expectedCol1.setParentIdShortPath(table.rows[0].getIdShortPath());
    const expectedCol2 = cloneSubmodelElement(col2, { value: null });
    expectedCol2.setParentIdShortPath(table.rows[0].getIdShortPath());
    expect(table.columns).toEqual([expectedCol1, expectedCol2]);
    // If the last row is deleted, columns are empty. This a limitation of the AAS specification.
    table.deleteRow(table.rows[0].idShort, { ability, onDelete });
    expect(table.columns).toEqual([]);
  });
});
