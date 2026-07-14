import { AasSubmodelElements, DataTypeDef, Language } from "@open-dpp/dto";
import { describe, expect, it } from "vitest";
import {
  convertCell,
  convertDataToColumns,
  convertDataToRows,
  convertRowToRequestDto,
  flattenColumns,
  isGroupColumn,
  resolveFieldValue,
  setFieldValue,
  type Column,
  type Row,
  type RowContext,
} from "./columns.ts";

describe("resolveFieldValue / setFieldValue", () => {
  it("resolves and sets a top-level field", () => {
    const row: Row = { idShort: "row0", Column1: "Wood" };
    expect(resolveFieldValue(row, "Column1")).toBe("Wood");
    setFieldValue(row, "Column1", "Steel");
    expect(row.Column1).toBe("Steel");
  });

  it("resolves and sets a dot-notation group field as a flat key", () => {
    const row: Row = { idShort: "row0", "Group1.Sub1": "Wood" };
    expect(resolveFieldValue(row, "Group1.Sub1")).toBe("Wood");
    setFieldValue(row, "Group1.Sub1", "Steel");
    expect(row["Group1.Sub1"]).toBe("Steel");
  });

  it("returns null for a missing field and sets it directly", () => {
    const row: Row = { idShort: "row0" };
    expect(resolveFieldValue(row, "Group1.Sub1")).toBeNull();
    setFieldValue(row, "Group1.Sub1", "Wood");
    expect(row["Group1.Sub1"]).toBe("Wood");
  });
});

describe("convertCell", () => {
  it("returns the raw value for a Property context", () => {
    expect(convertCell("Wood", { modelType: AasSubmodelElements.Property })).toBe("Wood");
  });

  it("returns value+contentType for a File context", () => {
    expect(
      convertCell("pathToFile", {
        modelType: AasSubmodelElements.File,
        contentType: "text/plain",
      }),
    ).toEqual({ value: "pathToFile", contentType: "text/plain" });
  });

  it("returns null for an unrecognized context", () => {
    expect(
      convertCell("Wood", { modelType: AasSubmodelElements.SubmodelElementCollection }),
    ).toBeNull();
  });
});

describe("isGroupColumn", () => {
  it("is true when children is present, false otherwise", () => {
    const scalar: Column = { idShort: "Column1", label: "Column1", plain: {} };
    const group: Column = { idShort: "Group1", label: "Group1", plain: {}, children: [] };
    expect(isGroupColumn(scalar)).toBe(false);
    expect(isGroupColumn(group)).toBe(true);
  });
});

describe("flattenColumns", () => {
  it("passes a scalar column through with its own idShort as the field", () => {
    const scalar: Column = { idShort: "Column1", label: "Column1", plain: {} };
    expect(flattenColumns([scalar])).toEqual([{ ...scalar, field: "Column1" }]);
  });

  it("flattens a group column's children into dot-notation fields", () => {
    const group: Column = {
      idShort: "Group1",
      label: "Group1",
      plain: {},
      children: [{ idShort: "Sub1", label: "Sub1", plain: {} }],
    };
    expect(flattenColumns([group])).toEqual([
      { idShort: "Sub1", label: "Sub1", plain: {}, field: "Group1.Sub1", groupIdShort: "Group1" },
    ]);
  });
});

describe("convertRowToRequestDto", () => {
  it("throws when no row context exists for the row", () => {
    const row: Row = { idShort: "missing" };
    expect(() => convertRowToRequestDto(row, [])).toThrow(/Row context not found/);
  });

  it("converts a scalar row using its context", () => {
    const row: Row = { idShort: "row0", Column1: "Wood" };
    const rowsContext: RowContext[] = [
      { idShort: "row0", Column1: { modelType: AasSubmodelElements.Property } },
    ];
    expect(convertRowToRequestDto(row, rowsContext)).toEqual({ Column1: "Wood" });
  });

  it("reconstructs the nested Group shape from flat dot-notation keys", () => {
    const row: Row = { idShort: "row0", "Group1.Sub1": "Wood", "Group1.Sub2": "50" };
    const rowsContext: RowContext[] = [
      {
        idShort: "row0",
        "Group1.Sub1": { modelType: AasSubmodelElements.Property },
        "Group1.Sub2": { modelType: AasSubmodelElements.Property },
      },
    ];
    expect(convertRowToRequestDto(row, rowsContext)).toEqual({
      Group1: { Sub1: "Wood", Sub2: "50" },
    });
  });

  it("omits a Table (SubmodelElementList) column from the bulk save payload", () => {
    const row: Row = { idShort: "row0", Column1: "Wood", Table1: "3" };
    const rowsContext: RowContext[] = [
      {
        idShort: "row0",
        Column1: { modelType: AasSubmodelElements.Property },
        Table1: { modelType: AasSubmodelElements.SubmodelElementList },
      },
    ];
    expect(convertRowToRequestDto(row, rowsContext)).toEqual({ Column1: "Wood" });
  });
});

describe("convertDataToColumns", () => {
  const headerRow = {
    idShort: "row0",
    modelType: AasSubmodelElements.SubmodelElementCollection,
    value: [
      {
        idShort: "Column1",
        valueType: DataTypeDef.String,
        modelType: AasSubmodelElements.Property,
        displayName: [{ language: "en", text: "Material" }],
      },
    ],
  };

  it("is a no-op when there are no rows yet", () => {
    const columns: Column[] = [];
    convertDataToColumns(columns, { value: [] } as any, Language.en);
    expect(columns).toEqual([]);
  });

  it("adds a new column from the header row", () => {
    const columns: Column[] = [];
    convertDataToColumns(columns, { value: [headerRow] } as any, Language.en);
    expect(columns).toHaveLength(1);
    expect(columns[0]).toMatchObject({ idShort: "Column1", label: "Material" });
    expect(columns[0]!.children).toBeUndefined();
  });

  it("builds children for a group (SubmodelElementCollection) column", () => {
    const groupHeaderRow = {
      idShort: "row0",
      modelType: AasSubmodelElements.SubmodelElementCollection,
      value: [
        {
          idShort: "Group1",
          modelType: AasSubmodelElements.SubmodelElementCollection,
          displayName: [{ language: "en", text: "Group" }],
          value: [
            {
              idShort: "Sub1",
              modelType: AasSubmodelElements.Property,
              valueType: DataTypeDef.String,
              displayName: [{ language: "en", text: "Sub" }],
            },
          ],
        },
      ],
    };
    const columns: Column[] = [];
    convertDataToColumns(columns, { value: [groupHeaderRow] } as any, Language.en);
    expect(columns[0]!.children).toEqual([
      expect.objectContaining({ idShort: "Sub1", label: "Sub" }),
    ]);
  });

  it("updates an existing column's label/plain in place and removes columns no longer present", () => {
    const columns: Column[] = [
      { idShort: "Column1", label: "Old label", plain: {} },
      { idShort: "Stale", label: "Stale", plain: {} },
    ];
    convertDataToColumns(columns, { value: [headerRow] } as any, Language.en);
    expect(columns).toHaveLength(1);
    expect(columns[0]!.label).toBe("Material");
  });

  it("treats a Table (SubmodelElementList) column as flat, not a group", () => {
    const tableHeaderRow = {
      idShort: "row0",
      modelType: AasSubmodelElements.SubmodelElementCollection,
      value: [
        {
          idShort: "Table1",
          modelType: AasSubmodelElements.SubmodelElementList,
          typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
          displayName: [{ language: "en", text: "Cells" }],
          value: [],
        },
      ],
    };
    const columns: Column[] = [];
    convertDataToColumns(columns, { value: [tableHeaderRow] } as any, Language.en);
    expect(columns).toHaveLength(1);
    expect(columns[0]).toMatchObject({ idShort: "Table1", label: "Cells" });
    expect(columns[0]!.children).toBeUndefined();
  });
});

describe("convertDataToRows", () => {
  const scalarRow = {
    idShort: "row0",
    modelType: AasSubmodelElements.SubmodelElementCollection,
    value: [
      {
        idShort: "Column1",
        modelType: AasSubmodelElements.Property,
        valueType: DataTypeDef.String,
        value: "Wood",
      },
    ],
  };

  it("adds a new row with its value and context", () => {
    const rows: Row[] = [];
    const rowsContext: RowContext[] = [];
    convertDataToRows(rows, rowsContext, { value: [scalarRow] } as any);
    expect(rows).toEqual([{ idShort: "row0", Column1: "Wood" }]);
    expect(rowsContext).toEqual([
      { idShort: "row0", Column1: { modelType: AasSubmodelElements.Property } },
    ]);
  });

  it("builds a flat dot-notation value/context for a group cell", () => {
    const groupRow = {
      idShort: "row0",
      modelType: AasSubmodelElements.SubmodelElementCollection,
      value: [
        {
          idShort: "Group1",
          modelType: AasSubmodelElements.SubmodelElementCollection,
          value: [
            {
              idShort: "Sub1",
              modelType: AasSubmodelElements.Property,
              valueType: DataTypeDef.String,
              value: "Wood",
            },
          ],
        },
      ],
    };
    const rows: Row[] = [];
    const rowsContext: RowContext[] = [];
    convertDataToRows(rows, rowsContext, { value: [groupRow] } as any);
    expect(rows[0]!["Group1.Sub1"]).toBe("Wood");
    expect(rowsContext[0]!["Group1.Sub1"]).toEqual({
      modelType: AasSubmodelElements.Property,
    });
  });

  it("removes fields no longer present in an existing row", () => {
    const rows: Row[] = [{ idShort: "row0", Stale: "value" }];
    const rowsContext: RowContext[] = [
      { idShort: "row0", Stale: { modelType: AasSubmodelElements.Property } },
    ];
    convertDataToRows(rows, rowsContext, { value: [scalarRow] } as any);
    expect(rows[0]).not.toHaveProperty("Stale");
    expect(rowsContext[0]).not.toHaveProperty("Stale");
  });

  it("removes a stale dot-notation sub-column key no longer present in the group", () => {
    const rows: Row[] = [{ idShort: "row0", "Group1.StaleSub": "value" }];
    const rowsContext: RowContext[] = [
      { idShort: "row0", "Group1.StaleSub": { modelType: AasSubmodelElements.Property } },
    ];
    const groupRow = {
      idShort: "row0",
      modelType: AasSubmodelElements.SubmodelElementCollection,
      value: [
        {
          idShort: "Group1",
          modelType: AasSubmodelElements.SubmodelElementCollection,
          value: [
            {
              idShort: "Sub1",
              modelType: AasSubmodelElements.Property,
              valueType: DataTypeDef.String,
              value: "Wood",
            },
          ],
        },
      ],
    };
    convertDataToRows(rows, rowsContext, { value: [groupRow] } as any);
    expect(rows[0]).not.toHaveProperty("Group1.StaleSub");
    expect(rowsContext[0]).not.toHaveProperty("Group1.StaleSub");
    expect(rows[0]!["Group1.Sub1"]).toBe("Wood");
  });

  it("computes a Table column's row count and stores it as context, without throwing", () => {
    const tableRow = {
      idShort: "row0",
      modelType: AasSubmodelElements.SubmodelElementCollection,
      value: [
        {
          idShort: "Table1",
          modelType: AasSubmodelElements.SubmodelElementList,
          typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
          value: [
            // Element 0 doubles as the column-defining header row *and* a
            // real, user-visible first row — it counts too.
            {
              idShort: "row0",
              modelType: AasSubmodelElements.SubmodelElementCollection,
              value: [],
            },
            {
              idShort: "row1",
              modelType: AasSubmodelElements.SubmodelElementCollection,
              value: [],
            },
            {
              idShort: "row2",
              modelType: AasSubmodelElements.SubmodelElementCollection,
              value: [],
            },
          ],
        },
      ],
    };
    const rows: Row[] = [];
    const rowsContext: RowContext[] = [];
    convertDataToRows(rows, rowsContext, { value: [tableRow] } as any);
    expect(rows[0]!.Table1).toBe("3");
    expect(rowsContext[0]!.Table1).toMatchObject({
      modelType: AasSubmodelElements.SubmodelElementList,
    });
  });

  it("computes a 0 row count for an empty Table column", () => {
    const emptyTableRow = {
      idShort: "row0",
      modelType: AasSubmodelElements.SubmodelElementCollection,
      value: [
        {
          idShort: "Table1",
          modelType: AasSubmodelElements.SubmodelElementList,
          typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
          value: [],
        },
      ],
    };
    const rows: Row[] = [];
    const rowsContext: RowContext[] = [];
    convertDataToRows(rows, rowsContext, { value: [emptyTableRow] } as any);
    expect(rows[0]!.Table1).toBe("0");
  });

  it("throws for a leaf column whose model type isn't Property or File", () => {
    const badRow = {
      idShort: "row0",
      modelType: AasSubmodelElements.SubmodelElementCollection,
      value: [
        {
          idShort: "Column1",
          modelType: AasSubmodelElements.MultiLanguageProperty,
          value: [],
        },
      ],
    };
    expect(() => convertDataToRows([], [], { value: [badRow] } as any)).toThrow(
      /Unsupported model type/,
    );
  });
});
