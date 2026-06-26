import { expect, jest } from "@jest/globals";
import { AasSubmodelElements, DataTypeDef, PermissionKind, Permissions } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { propertyInputPlainFactory } from "@open-dpp/testing";
import { MemberRole } from "../../../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../../../identity/users/domain/user-role.enum";
import { IdShortPath } from "../../common/id-short-path";
import { LanguageText } from "../../common/language-text";
import { Permission } from "../../security/permission";
import { Security } from "../../security/security";
import { SubjectAttributes } from "../../security/subject-attributes";
import { Property } from "../property";
import { registerSubmodelElementClasses } from "../register-submodel-element-classes";
import { SubmodelElementCollection } from "../submodel-element-collection";
import { SubmodelElementList } from "../submodel-element-list";
import { TableExtension } from "./table-extension";
import { allPermissionsAllowFactory } from "../../../../fixtures/security-fixtures";
import { File } from "../file";
import { TableRowCopyVisitor } from "./table-row-copy-visitor";

const transformer = new TableRowCopyVisitor();

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
    // Add first column
    table.addColumn(col1, { ability });
    const firstRowId = table.rows[0].idShort;
    const expHeaderRow = SubmodelElementCollection.create({ idShort: firstRowId });
    expHeaderRow.setParentPointer(submodelElementList.getPointer());
    expHeaderRow.addSubmodelElement(col1, { ability });
    expect(table.rows).toEqual([expHeaderRow]);

    // Add one row
    table.addRow({ ability });
    const col1Row1WithEmptyValue = Property.fromPlain({ ...col1Plain, value: undefined });
    const secondRowId = table.rows[1].idShort;
    const expRow1 = SubmodelElementCollection.create({
      idShort: secondRowId,
      value: [col1Row1WithEmptyValue],
    });
    expRow1.setParentPointer(submodelElementList.getPointer());
    expect(table.rows).toEqual([expHeaderRow, expRow1]);
    expect(secondRowId).not.toEqual(firstRowId);

    // Add third column
    const col3 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "col3" }));
    expHeaderRow.addSubmodelElement(col3, { ability });
    expRow1.addSubmodelElement(col3.copy().value, { ability });
    table.addColumn(col3, { ability });
    expect(table.rows).toEqual([expHeaderRow, expRow1]);

    // Add second column between first and third
    const col2 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "col2" }));
    expHeaderRow.addSubmodelElement(col2, { position: 1, ability });
    expRow1.addSubmodelElement(col2.copy().value, {
      position: 1,
      ability,
    });
    table.addColumn(col2, { position: 1, ability });
    expect(table.rows).toEqual([expHeaderRow, expRow1]);

    // Add one row at position 1
    table.addRow({ position: 1, ability });
    const rowAtPos1Id = table.rows[1].idShort;
    const expRowAtPos1 = SubmodelElementCollection.create({
      idShort: rowAtPos1Id,
      value: [
        col1.copy({ transformer }).value,
        col2.copy({ transformer }).value,
        col3.copy({ transformer }).value,
      ],
    });
    expRowAtPos1.setParentPointer(submodelElementList.getPointer());
    expect(table.rows).toEqual([expHeaderRow, expRowAtPos1, expRow1]);

    expect(rowAtPos1Id).not.toEqual(secondRowId);
    expect(rowAtPos1Id).not.toEqual(firstRowId);
  });

  it("should add subSection as column", () => {
    const submodelElementList = SubmodelElementList.create({
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
      idShort: "idShort",
    });
    const security = Security.create({});
    security.addPolicy(
      member,
      IdShortPath.create({ path: submodelElementList.idShort }),
      allPermissionsAllowFactory.build(),
    );
    const ability = security.defineAbilityForSubject(member);
    const table = new TableExtension(submodelElementList);
    const subSection = SubmodelElementCollection.create({
      idShort: "subSection",
      value: [Property.fromPlain(propertyInputPlainFactory.build({ idShort: "prop1" }))],
    });
    table.addColumn(subSection, { ability });
    expect(table.columns[0].toPlain()).toEqual(subSection.toPlain());
    // modify property prop1 via modifySubmodelElement
  });

  it("should add column to a group and propagate to all rows", () => {
    const submodelElementList = SubmodelElementList.create({
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
      idShort: "list",
    });
    const security = Security.create({});
    security.addPolicy(
      member,
      IdShortPath.create({ path: submodelElementList.idShort }),
      allPermissionsAllowFactory.build(),
    );
    const ability = security.defineAbilityForSubject(member);
    const table = new TableExtension(submodelElementList);

    // Add a group column (SubmodelElementCollection with no children yet)
    const group = SubmodelElementCollection.create({ idShort: "group1" });
    table.addColumn(group, { ability });
    table.addRow({ ability });
    table.addRow({ ability });

    // Add a sub-column to the group — must appear in every row's group
    const subCol = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "subCol1" }));
    table.addColumnToGroup("group1", subCol, { ability });

    for (const row of table.rows) {
      const rowGroup = row.getSubmodelElements().find((el) => el.idShort === "group1");
      expect(rowGroup).toBeDefined();
      expect(rowGroup!.getSubmodelElements().map((el) => el.idShort)).toContain("subCol1");
    }
  });

  it("should delete column from group across all rows", () => {
    const submodelElementList = SubmodelElementList.create({
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
      idShort: "list",
    });
    const security = Security.create({});
    security.addPolicy(
      member,
      IdShortPath.create({ path: submodelElementList.idShort }),
      allPermissionsAllowFactory.build(),
    );
    const ability = security.defineAbilityForSubject(member);
    const table = new TableExtension(submodelElementList);

    const subCol1 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "subCol1" }));
    const subCol2 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "subCol2" }));
    const group = SubmodelElementCollection.create({ idShort: "group1", value: [subCol1, subCol2] });
    table.addColumn(group, { ability });
    table.addRow({ ability });

    const onDelete = jest.fn();
    table.deleteColumnFromGroup("group1", "subCol1", { ability, onDelete });

    for (const row of table.rows) {
      const rowGroup = row.getSubmodelElements().find((el) => el.idShort === "group1");
      expect(rowGroup!.getSubmodelElements().map((el) => el.idShort)).not.toContain("subCol1");
      expect(rowGroup!.getSubmodelElements().map((el) => el.idShort)).toContain("subCol2");
    }
  });

  it("should modify column within a group across all rows", () => {
    const submodelElementList = SubmodelElementList.create({
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
      idShort: "list",
    });
    const security = Security.create({});
    security.addPolicy(
      member,
      IdShortPath.create({ path: submodelElementList.idShort }),
      allPermissionsAllowFactory.build(),
    );
    const ability = security.defineAbilityForSubject(member);
    const table = new TableExtension(submodelElementList);

    const subCol = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "subCol1" }));
    const group = SubmodelElementCollection.create({ idShort: "group1", value: [subCol] });
    table.addColumn(group, { ability });
    table.addRow({ ability });

    const newDisplayName = [{ language: "en", text: "Updated" }];
    table.modifyColumnInGroup("group1", "subCol1", { displayName: newDisplayName }, { ability });

    for (const row of table.rows) {
      const rowGroup = row.getSubmodelElements().find((el) => el.idShort === "group1");
      const col = rowGroup!.getSubmodelElements().find((el) => el.idShort === "subCol1");
      expect(col!.displayName).toEqual(newDisplayName.map(LanguageText.fromPlain));
    }

    expect(() =>
      table.modifyColumnInGroup("group1", "subCol1", { value: "bad" }, { ability }),
    ).toThrow(new ValueError("Column value modification is not supported."));
  });

  it("should clear nested values in group column when adding a new row", () => {
    const submodelElementList = SubmodelElementList.create({
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
      idShort: "list",
    });
    const security = Security.create({});
    security.addPolicy(
      member,
      IdShortPath.create({ path: submodelElementList.idShort }),
      allPermissionsAllowFactory.build(),
    );
    const ability = security.defineAbilityForSubject(member);
    const table = new TableExtension(submodelElementList);

    const subColWithValue = Property.fromPlain(
      propertyInputPlainFactory.build({ idShort: "subCol1", value: "hello" }),
    );
    const group = SubmodelElementCollection.create({ idShort: "group1", value: [subColWithValue] });
    table.addColumn(group, { ability });

    // The data row should have the sub-column's value cleared
    table.addRow({ ability });
    const dataRow = table.rows[1];
    const dataGroup = dataRow.getSubmodelElements().find((el) => el.idShort === "group1");
    const dataSubCol = dataGroup!.getSubmodelElements().find((el) => el.idShort === "subCol1") as Property;
    expect(dataSubCol.value).toBeNull();
  });

  it("should delete column", () => {
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
    table.addColumn(col1, { ability });
    table.addColumn(col2, { ability });
    table.addRow({ ability });
    table.addRow({ ability });
    expect(
      table.rows.some((r) => r.getSubmodelElements().some((c) => c.idShort === col1.idShort)),
    ).toBeTruthy();
    const onDelete = jest.fn();
    table.deleteColumn(col1.idShort, { ability, onDelete });
    col1.setParentPointer(table.rows[0].getPointer());
    col2.setParentPointer(table.rows[0].getPointer());
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
    table.addColumn(col1, { ability });
    col1.setParentPointer(table.rows[0].getPointer());
    expect(table.columns).toEqual([col1]);
    // The header row is updated to the new row at position 0.
    table.addRow({ position: 0, ability });
    const expectedCol = col1.copy({ transformer }).value;
    expectedCol.setParentPointer(table.rows[0].getPointer());
    expect(table.columns).toEqual([expectedCol]);
  });

  it("should modify column", () => {
    const submodelElementList = SubmodelElementList.create({
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
      idShort: "idShort",
    });
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
    table.addColumn(col1, { ability });
    table.addColumn(col2, { ability });
    table.addRow({ ability });
    table.addRow({ ability });
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
      { ability },
    );
    for (const row of table.rows) {
      const column = row.getSubmodelElements().find((c) => c.idShort === col1.idShort);
      expect(column?.displayName).toEqual(newDisplayNames.map(LanguageText.fromPlain));
      expect(column?.description).toEqual(newDescriptions.map(LanguageText.fromPlain));
    }
    expect(() =>
      table.modifyColumn(col1.idShort, { displayName: newDisplayNames, value: "2" }, { ability }),
    ).toThrow(new ValueError("Column value modification is not supported."));
  });

  it("should delete row", () => {
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
    table.addColumn(col1, { ability });
    table.addColumn(col2, { ability });
    const rowToDelete = table.addRow({ ability });
    table.addRow({ ability });
    expect(table.rows.some((r) => r.idShort === rowToDelete.idShort)).toBeTruthy();
    const onDelete = jest.fn();
    table.deleteRow(rowToDelete.idShort, { ability, onDelete });
    expect(onDelete).toHaveBeenCalledWith(rowToDelete);
    expect(table.rows.some((r) => r.idShort === rowToDelete.idShort)).toBeFalsy();
    // If the header row is deleted, the first row should be used as header row.
    const rowToDelete2 = table.rows[0];
    table.deleteRow(rowToDelete2.idShort, { ability, onDelete });
    expect(onDelete).toHaveBeenCalledWith(rowToDelete2);
    const expectedCol1 = col1.copy({ transformer }).value;
    expectedCol1.setParentPointer(table.rows[0].getPointer());
    const expectedCol2 = col2.copy({ transformer }).value;
    expectedCol2.setParentPointer(table.rows[0].getPointer());
    expect(table.columns).toEqual([expectedCol1, expectedCol2]);
    // If the last row is deleted, columns are empty. This a limitation of the AAS specification.
    table.deleteRow(table.rows[0].idShort, { ability, onDelete });
    expect(table.columns).toEqual([]);
  });
});

describe("TableRowCopyVisitor", () => {
  it("should nullify value of leaf nodes", () => {
    const prop = Property.create({
      idShort: "col1",
      value: "myValue",
      valueType: DataTypeDef.String,
    });
    const file = File.create({
      idShort: "file",
      contentType: "text/plain",
      value: "fileValue",
    });

    prop.accept(new TableRowCopyVisitor());
    expect(prop.value).toEqual(null);

    file.accept(new TableRowCopyVisitor());
    expect(file.value).toEqual(null);
  });
});
