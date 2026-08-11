import { expect, jest } from "@jest/globals";
import { AasSubmodelElements, DataTypeDef, PermissionKind, Permissions } from "@open-dpp/dto";
import { ForbiddenError, NotFoundError, ValueError } from "@open-dpp/exception";
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
import { ValueVisitor } from "../../value-visitor";

const transformer = new TableRowCopyVisitor();

describe("tableExtension", () => {
  beforeAll(() => {
    registerSubmodelElementClasses();
  });

  const member = SubjectAttributes.create({
    userRole: UserRole.USER,
    memberRole: MemberRole.MEMBER,
  });

  function createTable(idShort = "list") {
    const submodelElementList = SubmodelElementList.create({
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
      idShort,
    });
    const security = Security.create({});
    security.addPolicy(
      member,
      IdShortPath.create({ path: submodelElementList.idShort }),
      allPermissionsAllowFactory.build(),
    );
    const ability = security.defineAbilityForSubject(member);
    const table = new TableExtension(submodelElementList);
    return { submodelElementList, ability, table };
  }

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

    // Add a group column — groups can never be created empty, so it must
    // already carry its first sub-column at creation time.
    const initialSubCol = Property.fromPlain(
      propertyInputPlainFactory.build({ idShort: "initialSubCol" }),
    );
    const group = SubmodelElementCollection.create({ idShort: "group1", value: [initialSubCol] });
    table.addColumn(group, { ability });
    table.addRow({ ability });
    table.addRow({ ability });

    // Add a second sub-column to the group — must appear in every row's group
    const subCol = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "subCol1" }));
    table.addColumnToGroup("group1", subCol, { ability });

    for (const row of table.rows) {
      const rowGroup = row.getSubmodelElements().find((el) => el.idShort === "group1");
      expect(rowGroup).toBeDefined();
      expect(rowGroup!.getSubmodelElements().map((el) => el.idShort)).toContain("subCol1");
    }
  });

  it("should reject adding an empty group column", () => {
    const { table, ability } = createTable();

    const emptyGroupWithExplicitValue = SubmodelElementCollection.create({
      idShort: "group1",
      value: [],
    });
    expect(() => table.addColumn(emptyGroupWithExplicitValue, { ability })).toThrow(ValueError);

    const emptyGroupWithoutValue = SubmodelElementCollection.create({ idShort: "group2" });
    expect(() => table.addColumn(emptyGroupWithoutValue, { ability })).toThrow(ValueError);

    // No side effects: the rejected calls must not have created a header row.
    expect(table.rows).toEqual([]);
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

    const subCol1 = Property.fromPlain(
      propertyInputPlainFactory.build({ idShort: "subCol1", value: "v_subCol1" }),
    );
    const subCol2 = Property.fromPlain(
      propertyInputPlainFactory.build({ idShort: "subCol2", value: "v_subCol2" }),
    );
    const group = SubmodelElementCollection.create({
      idShort: "group1",
      value: [subCol1, subCol2],
    });
    table.addColumn(group, { ability });
    table.addRow({ ability });
    const onMoveMock = jest.fn();
    const onDeleteMock = jest.fn();

    table.deleteColumnFromGroup("group1", "subCol1", {
      ability,
      onMove: onMoveMock,
      onDelete: onDeleteMock,
    });

    for (const [index, row] of table.rows.entries()) {
      const topLevel = row.getSubmodelElements().map((el) => el.idShort);
      // the group survives since a sibling sub-column remains
      expect(topLevel).toContain("group1");
      const groupIndex = topLevel.indexOf("group1");
      // moved back to top level immediately after the group
      expect(topLevel[groupIndex + 1]).toBe("subCol1");
      const rowGroup = row.getSubmodelElements().find((el) => el.idShort === "group1");
      expect(rowGroup!.getSubmodelElements().map((el) => el.idShort)).not.toContain("subCol1");
      expect(rowGroup!.getSubmodelElements().map((el) => el.idShort)).toContain("subCol2");
      expect(onMoveMock).toHaveBeenNthCalledWith(
        index + 1,
        IdShortPath.fromSegments([...row.getIdShortPath().segments, "group1", "subCol1"]),
        IdShortPath.fromSegments([...row.getIdShortPath().segments, "subCol1"]),
      );
    }
    expect(onDeleteMock).toHaveBeenCalledTimes(0);

    const valueRepr = submodelElementList.accept(new ValueVisitor({ ability }));
    expect(valueRepr).toEqual([
      { group1: { subCol2: "v_subCol2" }, subCol1: "v_subCol1" },
      { group1: { subCol2: null }, subCol1: null },
    ]);
  });

  it("should cascade-delete the group when ejecting its last remaining sub-column", () => {
    const { table, ability } = createTable();

    const onlySubCol = Property.fromPlain(
      propertyInputPlainFactory.build({ idShort: "onlySubCol", value: "v_onlySubCol" }),
    );
    const group = SubmodelElementCollection.create({
      idShort: "group1",
      value: [onlySubCol],
    });
    table.addColumn(group, { ability });
    table.addRow({ ability });
    const foundGroup = table.columns.find((c) => c.idShort === "group1");

    const expected = foundGroup!.copy().value;
    const onDeleteMock = jest.fn();
    const onMoveMock = jest.fn();
    table.deleteColumnFromGroup("group1", "onlySubCol", {
      ability,
      onDelete: onDeleteMock,
      onMove: onMoveMock,
    });

    for (const row of table.rows) {
      const topLevel = row.getSubmodelElements().map((el) => el.idShort);
      // the ejected column survives at top level
      expect(topLevel).toContain("onlySubCol");
      // the now-empty group is gone entirely, not just empty
      expect(topLevel).not.toContain("group1");
    }

    expected.setSubmodelElements([]);
    expect(onDeleteMock).toHaveBeenCalledTimes(table.rows.length);
    expect(onDeleteMock).toHaveBeenCalledWith(expected);
    expect(table.columns.map((c) => c.idShort)).not.toContain("group1");
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

  it("should move top-level column into group across all rows", () => {
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

    const col1 = Property.fromPlain(
      propertyInputPlainFactory.build({ idShort: "col1", value: "10" }),
    );
    // Groups can never be created empty — seed it with a placeholder child.
    const initialSubCol = Property.fromPlain(
      propertyInputPlainFactory.build({ idShort: "initialSubCol", value: "some-value" }),
    );
    const group = SubmodelElementCollection.create({ idShort: "group1", value: [initialSubCol] });
    table.addColumn(col1, { ability });
    table.addColumn(group, { ability });
    table.addRow({ ability });
    const onMoveMock = jest.fn();

    table.moveColumnToGroup("col1", "group1", { ability, onMove: onMoveMock });

    for (const [index, row] of table.rows.entries()) {
      const topLevelIds = row.getSubmodelElements().map((el) => el.idShort);
      expect(topLevelIds).not.toContain("col1");
      const rowGroup = row.getSubmodelElements().find((el) => el.idShort === "group1");
      expect(rowGroup!.getSubmodelElements().map((el) => el.idShort)).toContain("col1");
      expect(onMoveMock).toHaveBeenNthCalledWith(
        index + 1,
        IdShortPath.fromSegments([...row.getIdShortPath().segments, "col1"]),
        IdShortPath.fromSegments([...row.getIdShortPath().segments, "group1", "col1"]),
      );
    }
    const valueVisitor = new ValueVisitor({ ability });
    const valueRepr = submodelElementList.accept(valueVisitor);
    expect(valueRepr).toMatchObject([
      { group1: { col1: "10", initialSubCol: "some-value" } },
      { group1: { col1: null, initialSubCol: null } },
    ]);
  });

  it("should reorder a top-level column and keep every row positionally in sync", () => {
    const { table, ability, submodelElementList } = createTable();
    const col1 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "col1", value: "1" }));
    const col2 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "col2", value: "2" }));
    const col3 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "col3", value: "3" }));
    table.addColumn(col1, { ability });
    table.addColumn(col2, { ability });
    table.addColumn(col3, { ability });
    table.addRow({ ability });

    table.reorderColumn("col3", undefined, 0, { ability });

    expect(table.columns.map((c) => c.idShort)).toEqual(["col3", "col1", "col2"]);
    // the data row must move in lockstep with the header, not just the header itself
    const dataRow = table.rows[1];
    expect(dataRow.getSubmodelElements().map((el) => el.idShort)).toEqual(["col3", "col1", "col2"]);

    const valueVisitor = new ValueVisitor({ ability });
    const valueRepr = submodelElementList.accept(valueVisitor);
    expect(valueRepr).toMatchObject([
      { col1: "1", col2: "2", col3: "3" },
      { col1: null, col2: null, col3: null },
    ]);
  });

  it("should keep the reordered order after the header row is deleted and a data row is promoted", () => {
    const { table, ability } = createTable();
    const col1 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "col1", value: "1" }));
    const col2 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "col2", value: "2" }));
    table.addColumn(col1, { ability });
    table.addColumn(col2, { ability });
    table.addRow({ ability });

    table.reorderColumn("col2", undefined, 0, { ability });
    const headerRowIdShort = table.rows[0].idShort;

    table.deleteRow(headerRowIdShort, { ability, onDelete: () => {} });

    // the remaining (former data) row is now promoted to header — it must reflect
    // the reordered layout, not the original pre-reorder column order
    expect(table.columns.map((c) => c.idShort)).toEqual(["col2", "col1"]);
  });

  it("should reorder a column within a group and keep rows in sync", () => {
    const { table, ability } = createTable();
    const sub1 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "sub1", value: "a" }));
    const sub2 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "sub2", value: "b" }));
    const group = SubmodelElementCollection.create({ idShort: "group1", value: [sub1, sub2] });
    table.addColumn(group, { ability });
    table.addRow({ ability });

    table.reorderColumn("sub2", "group1", 0, { ability });

    for (const row of table.rows) {
      const rowGroup = row.getSubmodelElements().find((el) => el.idShort === "group1")!;
      expect(rowGroup.getSubmodelElements().map((el) => el.idShort)).toEqual(["sub2", "sub1"]);
    }
  });

  it("should throw NotFoundError when reordering a non-existent column", () => {
    const { table, ability } = createTable();
    const col1 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "col1", value: "1" }));
    table.addColumn(col1, { ability });

    expect(() => table.reorderColumn("missing", undefined, 0, { ability })).toThrow(NotFoundError);
  });

  it("should reject reordering a column without permission", () => {
    const { table, ability } = createTable();
    const col1 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "col1", value: "1" }));
    const col2 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "col2", value: "2" }));
    table.addColumn(col1, { ability });
    table.addColumn(col2, { ability });

    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const anonymousAbility = Security.create({}).defineAbilityForSubject(anonymous);

    expect(() =>
      table.reorderColumn("col2", undefined, 0, { ability: anonymousAbility }),
    ).toThrow(ForbiddenError);
    expect(table.columns.map((c) => c.idShort)).toEqual(["col1", "col2"]);
  });

  it("should place a new group at the right position in every row after a prior reorder", () => {
    // Regression test: createGroupFromColumn inserts the brand-new group at the
    // header's column *index* into every row (there's no idShort to match against
    // yet), so it silently breaks if a prior reorderColumn desynced row order from
    // the header.
    const { table, ability } = createTable();
    const col1 = Property.fromPlain(
      propertyInputPlainFactory.build({ idShort: "col1", value: "v1" }),
    );
    const col2 = Property.fromPlain(
      propertyInputPlainFactory.build({ idShort: "col2", value: "v2" }),
    );
    table.addColumn(col1, { ability });
    table.addColumn(col2, { ability });
    table.addRow({ ability });

    table.reorderColumn("col2", undefined, 0, { ability });
    expect(table.columns.map((c) => c.idShort)).toEqual(["col2", "col1"]);

    const newGroup = SubmodelElementCollection.create({ idShort: "group1", value: [] });
    const onMoveMock = jest.fn();
    table.createGroupFromColumn("col1", newGroup, { ability, onMove: onMoveMock });

    for (const row of table.rows) {
      expect(row.getSubmodelElements().map((el) => el.idShort)).toEqual(["col2", "group1"]);
    }
  });

  it("should create a group from an existing top-level column, migrating its per-row values", () => {
    const { table, ability, submodelElementList } = createTable();

    const before = Property.fromPlain(
      propertyInputPlainFactory.build({ idShort: "before", value: "v_before" }),
    );
    const col1 = Property.fromPlain(
      propertyInputPlainFactory.build({ idShort: "col1", value: "row0-value" }),
    );
    const after = Property.fromPlain(
      propertyInputPlainFactory.build({ idShort: "after", value: "v_after" }),
    );
    table.addColumn(before, { ability });
    table.addColumn(col1, { ability });
    table.addColumn(after, { ability });
    table.addRow({ ability });
    // Give row1's col1 a distinct value directly, to verify migration copies
    // real per-row values rather than just the header row's shape.
    const row1Col1 = table.rows[1]
      .getSubmodelElements()
      .find((el) => el.idShort === "col1") as Property;
    row1Col1.value = "row1-value";

    const newGroup = SubmodelElementCollection.create({ idShort: "group1" });
    const onMoveMock = jest.fn();
    table.createGroupFromColumn("col1", newGroup, { ability, onMove: onMoveMock });

    const topLevelIds = table.columns.map((c) => c.idShort);
    expect(topLevelIds).toEqual(["before", "group1", "after"]);

    for (const [index, row] of table.rows.entries()) {
      const topLevel = row.getSubmodelElements().map((el) => el.idShort);
      expect(topLevel).not.toContain("col1");
      const rowGroup = row.getSubmodelElements().find((el) => el.idShort === "group1");
      expect(rowGroup).toBeDefined();
      expect(rowGroup!.getSubmodelElements().map((el) => el.idShort)).toEqual(["col1"]);
      expect(onMoveMock).toHaveBeenNthCalledWith(
        index + 1,
        IdShortPath.fromSegments([...row.getIdShortPath().segments, "col1"]),
        IdShortPath.fromSegments([...row.getIdShortPath().segments, "group1", "col1"]),
      );
    }

    const valueRepr = submodelElementList.accept(new ValueVisitor({ ability }));
    expect(valueRepr).toEqual([
      { before: "v_before", group1: { col1: "row0-value" }, after: "v_after" },
      { before: null, group1: { col1: "row1-value" }, after: null },
    ]);
  });

  it("should throw NotFoundError when creating a group from a non-existent column", () => {
    const { table, ability } = createTable();
    table.addColumn(Property.fromPlain(propertyInputPlainFactory.build({ idShort: "col1" })), {
      ability,
    });

    const newGroup = SubmodelElementCollection.create({ idShort: "group1" });
    const onMoveMock = jest.fn();
    expect(() =>
      table.createGroupFromColumn("doesNotExist", newGroup, { ability, onMove: onMoveMock }),
    ).toThrow(NotFoundError);
  });

  it("should throw ValueError when the new group's idShort collides with an existing column", () => {
    const { table, ability } = createTable();
    table.addColumn(Property.fromPlain(propertyInputPlainFactory.build({ idShort: "col1" })), {
      ability,
    });
    table.addColumn(Property.fromPlain(propertyInputPlainFactory.build({ idShort: "col2" })), {
      ability,
    });
    const onMoveMock = jest.fn();

    const collidingGroup = SubmodelElementCollection.create({ idShort: "col2" });
    expect(() =>
      table.createGroupFromColumn("col1", collidingGroup, { ability, onMove: onMoveMock }),
    ).toThrow(ValueError);
  });

  it("should throw ValueError when the provided group is not a SubmodelElementCollection", () => {
    const { table, ability } = createTable();
    table.addColumn(Property.fromPlain(propertyInputPlainFactory.build({ idShort: "col1" })), {
      ability,
    });
    const onMoveMock = jest.fn();

    const notAGroup = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "group1" }));
    expect(() =>
      table.createGroupFromColumn("col1", notAGroup, { ability, onMove: onMoveMock }),
    ).toThrow(ValueError);
  });

  it("should reject moving a table column into a group", () => {
    const { table, ability } = createTable();

    const tableColumn = SubmodelElementList.create({
      idShort: "tableCol1",
      typeValueListElement: AasSubmodelElements.Property,
    });
    const initialSubCol = Property.fromPlain(
      propertyInputPlainFactory.build({ idShort: "initialSubCol" }),
    );
    const group = SubmodelElementCollection.create({ idShort: "group1", value: [initialSubCol] });
    table.addColumn(tableColumn, { ability });
    table.addColumn(group, { ability });
    const onMoveMock = jest.fn();

    expect(() =>
      table.moveColumnToGroup("tableCol1", "group1", { ability, onMove: onMoveMock }),
    ).toThrow(ValueError);
  });

  it("should reject adding a table column directly to a group", () => {
    const { table, ability } = createTable();

    const initialSubCol = Property.fromPlain(
      propertyInputPlainFactory.build({ idShort: "initialSubCol" }),
    );
    const group = SubmodelElementCollection.create({ idShort: "group1", value: [initialSubCol] });
    table.addColumn(group, { ability });

    const tableColumn = SubmodelElementList.create({
      idShort: "tableCol1",
      typeValueListElement: AasSubmodelElements.Property,
    });
    expect(() => table.addColumnToGroup("group1", tableColumn, { ability })).toThrow(ValueError);
  });

  it("should reject wrapping a table column into a brand-new group via createGroupFromColumn", () => {
    const { table, ability } = createTable();

    const tableColumn = SubmodelElementList.create({
      idShort: "tableCol1",
      typeValueListElement: AasSubmodelElements.Property,
    });
    table.addColumn(tableColumn, { ability });
    const onMoveMock = jest.fn();

    const newGroup = SubmodelElementCollection.create({ idShort: "group1" });
    expect(() =>
      table.createGroupFromColumn("tableCol1", newGroup, { ability, onMove: onMoveMock }),
    ).toThrow(ValueError);
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
    const dataSubCol = dataGroup!
      .getSubmodelElements()
      .find((el) => el.idShort === "subCol1") as Property;
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

  it("should copy table without", () => {
    const submodelElementList = SubmodelElementList.create({
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
      idShort: "list",
      value: [
        SubmodelElementCollection.create({
          idShort: "row1",
          value: [
            Property.create({
              idShort: "col1",
              value: "myValue",
              valueType: DataTypeDef.String,
            }),
            Property.create({
              idShort: "col2",
              value: "myValue",
              valueType: DataTypeDef.String,
            }),
          ],
        }),
        SubmodelElementCollection.create({
          idShort: "row2NotCopied",
          value: [
            Property.create({
              idShort: "col1",
              value: "myValue2",
              valueType: DataTypeDef.String,
            }),
            Property.create({
              idShort: "col2",
              value: "myValue2",
              valueType: DataTypeDef.String,
            }),
          ],
        }),
      ],
    });

    const expected = SubmodelElementCollection.create({
      idShort: "row1",
      value: [
        Property.create({
          idShort: "col1",
          value: null,
          valueType: DataTypeDef.String,
        }),
        Property.create({
          idShort: "col2",
          value: null,
          valueType: DataTypeDef.String,
        }),
      ],
    });
    const pointer = submodelElementList.getPointer();
    expected.setParentPointer(pointer);
    submodelElementList.accept(new TableRowCopyVisitor());
    expect(submodelElementList.getSubmodelElements()).toEqual([expected]);
  });
});
