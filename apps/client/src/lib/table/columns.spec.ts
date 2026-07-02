import { AasSubmodelElements, DataTypeDef, Language } from "@open-dpp/dto";
import { describe, expect, it } from "vitest";
import {
  convertCell,
  convertDataToColumns,
  convertDataToRows,
  convertRowToRequestDto,
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

  it("resolves and sets a dot-notation group field", () => {
    const row: Row = { idShort: "row0", Group1: { Sub1: "Wood" } };
    expect(resolveFieldValue(row, "Group1.Sub1")).toBe("Wood");
    setFieldValue(row, "Group1.Sub1", "Steel");
    expect(row.Group1).toEqual({ Sub1: "Steel" });
  });

  it("returns null for a missing group field and creates the group on set", () => {
    const row: Row = { idShort: "row0" };
    expect(resolveFieldValue(row, "Group1.Sub1")).toBeNull();
    setFieldValue(row, "Group1.Sub1", "Wood");
    expect(row.Group1).toEqual({ Sub1: "Wood" });
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

  it("converts a group row field-by-field using nested context", () => {
    const row: Row = { idShort: "row0", Group1: { Sub1: "Wood", Sub2: "50" } };
    const rowsContext: RowContext[] = [
      {
        idShort: "row0",
        Group1: {
          Sub1: { modelType: AasSubmodelElements.Property },
          Sub2: { modelType: AasSubmodelElements.Property },
        },
      },
    ];
    expect(convertRowToRequestDto(row, rowsContext)).toEqual({
      Group1: { Sub1: "Wood", Sub2: "50" },
    });
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

  it("builds nested group value/context for a group cell", () => {
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
    expect(rows[0]!.Group1).toEqual({ Sub1: "Wood" });
    expect(rowsContext[0]!.Group1).toEqual({
      Sub1: { modelType: AasSubmodelElements.Property },
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
