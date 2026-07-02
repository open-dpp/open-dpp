import { AasSubmodelElements, DataTypeDef } from "@open-dpp/dto";
import { describe, expect, it, vi } from "vitest";
import { buildColumnMenu, buildRowMenu, type TableMenuDeps } from "./menu.ts";
import type { Column } from "./columns.ts";

function makeDeps(overrides: Partial<TableMenuDeps> = {}): TableMenuDeps {
  return {
    translate: (key: string) => key,
    openDrawer: vi.fn(),
    openConfirm: vi.fn(),
    pathToList: {} as any,
    selectedLanguage: "en" as any,
    errorHandlingStore: { logErrorWithNotification: vi.fn() } as any,
    onCreateColumn: vi.fn(),
    onAddColumnToGroup: vi.fn(),
    onModifyTopLevelColumn: vi.fn(),
    onModifyColumnInGroup: vi.fn(),
    onRemoveColumn: vi.fn(),
    onDeleteColumnFromGroup: vi.fn(),
    onMoveColumnToGroup: vi.fn(),
    onAddRow: vi.fn(),
    onRemoveRow: vi.fn(),
    ...overrides,
  };
}

const scalarColumn: Column = {
  idShort: "Column1",
  label: "Column1",
  plain: { idShort: "Column1", modelType: AasSubmodelElements.Property, valueType: DataTypeDef.String },
};
const groupColumn: Column = {
  idShort: "Group1",
  label: "Group1",
  plain: { idShort: "Group1", modelType: AasSubmodelElements.SubmodelElementCollection },
  children: [
    {
      idShort: "Sub1",
      label: "Sub1",
      plain: { idShort: "Sub1", modelType: AasSubmodelElements.Property },
    },
  ],
};

describe("buildColumnMenu", () => {
  it("builds the top-level 'add column' menu when there are no action options", () => {
    const deps = makeDeps();
    const menu = buildColumnMenu({}, [scalarColumn], deps);
    expect(menu).toBeDefined();
    expect(menu!.map((item) => item.label)).toEqual([
      "aasEditor.textField",
      "aasEditor.numberField",
      "aasEditor.booleanField",
      "aasEditor.dateField",
      "aasEditor.dateTimeField",
      "aasEditor.link",
      "aasEditor.file",
      "aasEditor.columnGroup",
    ]);
  });

  it("adds a move-to-group section only when group columns exist", () => {
    const deps = makeDeps();
    const withoutGroups = buildColumnMenu({ addColumnActions: true, position: 0 }, [scalarColumn], deps);
    const actionsSection = withoutGroups!.find((item) => item.label === "common.actions");
    expect(actionsSection!.items).toHaveLength(3); // edit, remove, disabled move-to-group

    const withGroups = buildColumnMenu(
      { addColumnActions: true, position: 0 },
      [scalarColumn, groupColumn],
      deps,
    );
    const moveToGroupSection = withGroups!.find((item) => item.label === "aasEditor.table.moveToGroup");
    expect(moveToGroupSection).toBeDefined();
    expect(moveToGroupSection!.items).toHaveLength(1);
  });

  it("returns undefined (leave menu unchanged) when the column at position can't be resolved", () => {
    const deps = makeDeps();
    const menu = buildColumnMenu({ addColumnActions: true, position: 5 }, [scalarColumn], deps);
    // Base "add column" items are still returned even though action items failed to build.
    expect(menu).toBeDefined();
    expect(deps.errorHandlingStore.logErrorWithNotification).toHaveBeenCalled();
  });

  it("returns undefined when the group header column can't be found", () => {
    const deps = makeDeps();
    const menu = buildColumnMenu(
      { isGroupHeader: true, groupIdShort: "Missing" },
      [scalarColumn],
      deps,
    );
    expect(menu).toBeUndefined();
    expect(deps.errorHandlingStore.logErrorWithNotification).toHaveBeenCalledWith(
      "common.errorOccurred",
    );
  });

  it("builds the group header menu when the group exists", () => {
    const deps = makeDeps();
    const menu = buildColumnMenu(
      { isGroupHeader: true, groupIdShort: "Group1" },
      [scalarColumn, groupColumn],
      deps,
    );
    expect(menu!.map((item) => item.label)).toEqual([
      "aasEditor.table.addSubColumn",
      "common.actions",
    ]);
    // Sub-column type options exclude "columnGroup" — groups can't nest inside groups.
    expect(menu![0]!.items!.map((item) => item.label)).toEqual([
      "aasEditor.textField",
      "aasEditor.numberField",
      "aasEditor.booleanField",
      "aasEditor.dateField",
      "aasEditor.dateTimeField",
      "aasEditor.link",
      "aasEditor.file",
    ]);
    expect(menu![1]!.items!.map((item) => item.label)).toEqual(["common.edit", "common.remove"]);
  });

  it("returns undefined when the sub-column position can't be resolved", () => {
    const deps = makeDeps();
    const menu = buildColumnMenu(
      { groupIdShort: "Group1", addColumnActions: true, position: 9 },
      [scalarColumn, groupColumn],
      deps,
    );
    expect(menu).toBeUndefined();
    expect(deps.errorHandlingStore.logErrorWithNotification).toHaveBeenCalled();
  });

  it("builds the sub-column actions menu when the sub-column exists", () => {
    const deps = makeDeps();
    const menu = buildColumnMenu(
      { groupIdShort: "Group1", addColumnActions: true, position: 0 },
      [scalarColumn, groupColumn],
      deps,
    );
    expect(menu!.map((item) => item.label)).toEqual(["common.actions"]);
    expect(menu![0]!.items!.map((item) => item.label)).toEqual([
      "common.edit",
      "aasEditor.table.removeFromGroup",
    ]);
  });
});

describe("column menu commands delegate to the injected callbacks", () => {
  it("removing a top-level column calls onRemoveColumn after confirmation", async () => {
    const deps = makeDeps({
      openConfirm: vi.fn((options: any) => options.accept()),
    });
    const menu = buildColumnMenu({ addColumnActions: true, position: 0 }, [scalarColumn], deps);
    const actionsSection = menu!.find((item) => item.label === "common.actions");
    const removeItem = actionsSection!.items!.find((item) => item.icon === "pi pi-trash");
    await (removeItem!.command as any)();
    expect(deps.onRemoveColumn).toHaveBeenCalledWith(scalarColumn);
  });

  it("moving a column to a group calls onMoveColumnToGroup", async () => {
    const deps = makeDeps();
    const menu = buildColumnMenu(
      { addColumnActions: true, position: 0 },
      [scalarColumn, groupColumn],
      deps,
    );
    const moveSection = menu!.find((item) => item.label === "aasEditor.table.moveToGroup");
    await (moveSection!.items![0]!.command as any)();
    expect(deps.onMoveColumnToGroup).toHaveBeenCalledWith(scalarColumn, "Group1");
  });
});

describe("buildRowMenu", () => {
  it("adding a row above/below calls onAddRow with the right position", async () => {
    const deps = makeDeps();
    const menu = buildRowMenu({ position: 2 }, 5, deps);
    await (menu[0]!.command as any)();
    expect(deps.onAddRow).toHaveBeenCalledWith({ position: 2 });
    await (menu[1]!.command as any)();
    expect(deps.onAddRow).toHaveBeenCalledWith({ position: 3 });
  });

  it("defaults 'add row below' position to rowsLength when position is undefined", async () => {
    const deps = makeDeps();
    const menu = buildRowMenu({}, 5, deps);
    await (menu[1]!.command as any)();
    expect(deps.onAddRow).toHaveBeenCalledWith({ position: 5 });
  });

  it("removing a row calls onRemoveRow after confirmation", async () => {
    const deps = makeDeps({
      openConfirm: vi.fn((options: any) => options.accept()),
    });
    const menu = buildRowMenu({ position: 3 }, 5, deps);
    await (menu[2]!.command as any)();
    expect(deps.onRemoveRow).toHaveBeenCalledWith(3);
  });
});
