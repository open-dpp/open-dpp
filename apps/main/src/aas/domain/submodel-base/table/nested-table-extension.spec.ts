import { beforeAll, describe, expect } from "@jest/globals";
import { AasSubmodelElements, DataTypeDef } from "@open-dpp/dto";
import { IdShortPath } from "../../common/id-short-path";
import { LanguageText } from "../../common/language-text";
import { Security } from "../../security/security";
import { Property } from "../property";
import { Submodel } from "../submodel";
import { SubmodelElementCollection } from "../submodel-element-collection";
import { SubmodelElementList } from "../submodel-element-list";
import { allPermissionsAllowFactory } from "../../../../fixtures/security-fixtures";
import { SubjectAttributes } from "../../security/subject-attributes";
import { UserRole } from "../../../../identity/users/domain/user-role.enum";
import { MemberRole } from "../../../../identity/organizations/domain/member-role.enum";
import { registerSubmodelElementClasses } from "../register-submodel-element-classes";

describe("NestedTableExtension", () => {
  beforeAll(() => {
    registerSubmodelElementClasses();
  });
  const member = SubjectAttributes.create({
    userRole: UserRole.USER,
    memberRole: MemberRole.MEMBER,
  });

  function createSubmodelWithNestedTable() {
    const submodel = Submodel.create({ idShort: "section1" });
    const security = Security.create({});
    security.addPolicy(
      member,
      IdShortPath.create({ path: submodel.idShort }),
      allPermissionsAllowFactory.build(),
    );
    const ability = security.defineAbilityForSubject(member);
    const submodelElementList = SubmodelElementList.create({
      idShort: "table1",
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
      value: [
        SubmodelElementCollection.create({
          idShort: "row1",
          value: [
            Property.create({ idShort: "col1", value: "10", valueType: DataTypeDef.Double }),
            SubmodelElementList.create({
              idShort: "table2",
              typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
              value: [
                SubmodelElementCollection.create({
                  idShort: "row11",
                  value: [
                    Property.create({
                      idShort: "col1",
                      value: "30",
                      valueType: DataTypeDef.Double,
                    }),
                    SubmodelElementList.create({
                      idShort: "table3",
                      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
                      value: [
                        SubmodelElementCollection.create({
                          idShort: "row111",
                          value: [
                            Property.create({
                              idShort: "col1",
                              value: "table1.row1.table2.row11.table3.row111.col1",
                              valueType: DataTypeDef.String,
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                SubmodelElementCollection.create({
                  idShort: "row12",
                  value: [
                    Property.create({
                      idShort: "col1",
                      value: "40",
                      valueType: DataTypeDef.Double,
                    }),
                    SubmodelElementList.create({
                      idShort: "table3",
                      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
                      value: [
                        SubmodelElementCollection.create({
                          idShort: "row121",
                          value: [
                            Property.create({
                              idShort: "col1",
                              value: "table1.row1.table2.row12.table3.row121.col1",
                              valueType: DataTypeDef.String,
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                SubmodelElementCollection.create({
                  idShort: "row13",
                  value: [
                    Property.create({
                      idShort: "col11",
                      value: "40",
                      valueType: DataTypeDef.Double,
                    }),
                    SubmodelElementList.create({
                      idShort: "table3",
                      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
                      value: [
                        SubmodelElementCollection.create({
                          idShort: "row131",
                          value: [
                            Property.create({
                              idShort: "col1",
                              value: "table1.row1.table2.row13.table3.row131.col1",
                              valueType: DataTypeDef.String,
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        SubmodelElementCollection.create({
          idShort: "row2",
          value: [
            Property.create({ idShort: "col1", value: "10", valueType: DataTypeDef.Double }),
            SubmodelElementList.create({
              idShort: "table2",
              typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
              value: [
                SubmodelElementCollection.create({
                  idShort: "row21",
                  value: [
                    Property.create({
                      idShort: "col1",
                      value: "10",
                      valueType: DataTypeDef.Double,
                    }),
                    SubmodelElementList.create({
                      idShort: "table3",
                      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
                      value: [
                        SubmodelElementCollection.create({
                          idShort: "row211",
                          value: [
                            Property.create({
                              idShort: "col1",
                              value: "table1.row2.table2.row21.table3.row211.col1",
                              valueType: DataTypeDef.String,
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                SubmodelElementCollection.create({
                  idShort: "row22",
                  value: [
                    Property.create({
                      idShort: "col1",
                      value: "20",
                      valueType: DataTypeDef.Double,
                    }),
                    SubmodelElementList.create({
                      idShort: "table3",
                      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
                      value: [
                        SubmodelElementCollection.create({
                          idShort: "row221",
                          value: [
                            Property.create({
                              idShort: "col1",
                              value: "table1.row2.table2.row22.table3.row221.col1",
                              valueType: DataTypeDef.String,
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });
    submodel.addSubmodelElement(submodelElementList, { ability });
    return { submodel, ability };
  }

  it("should modify column of table2", () => {
    const { submodel, ability } = createSubmodelWithNestedTable();
    const newDisplayName = [
      {
        language: "de",
        text: "CO2 Footprint New Text",
      },
    ];
    submodel.modifyColumn(
      IdShortPath.create({
        path: "table1.row1.table2",
      }),
      "col1",
      {
        displayName: newDisplayName,
      },
      {
        ability,
      },
    );
    const col1Row21 = submodel.findSubmodelElementOrFail(
      IdShortPath.create({ path: "table1.row2.table2.row21.col1" }),
    );
    expect(col1Row21.toPlain()).toMatchObject({
      displayName: newDisplayName,
      value: "10",
    });
  });

  it("should modify column of table3", () => {
    const { submodel, ability } = createSubmodelWithNestedTable();
    const newDisplayName = [
      {
        language: "de",
        text: "CO2 Footprint New Text",
      },
    ];

    submodel.modifyColumn(
      IdShortPath.create({
        path: "table1.row1.table2.row11.table3",
      }),
      "col1",
      {
        displayName: newDisplayName,
      },
      {
        ability,
      },
    );
    const col1Row221 = submodel.findSubmodelElementOrFail(
      IdShortPath.create({ path: "table1.row2.table2.row22.table3.row221.col1" }),
    );
    expect(col1Row221.toPlain()).toMatchObject({
      displayName: newDisplayName,
      value: "table1.row2.table2.row22.table3.row221.col1",
    });
  });

  it("should add column to table3", () => {
    const { submodel, ability } = createSubmodelWithNestedTable();
    submodel.addColumn(
      IdShortPath.create({
        path: "table1.row1.table2.row11.table3",
      }),
      Property.create({ idShort: "newCol1", value: "10", valueType: DataTypeDef.Double }),
      { ability },
    );
    const row221 = submodel.findSubmodelElementOrFail(
      IdShortPath.create({ path: "table1.row2.table2.row22.table3.row221" }),
    );
    expect(row221.getSubmodelElements()[1].toPlain()).toMatchObject(
      Property.create({
        idShort: "newCol1",
        value: "10",
        valueType: DataTypeDef.Double,
      }).toPlain(),
    );
  });
  it("should delete column from table3", () => {
    const { submodel, ability } = createSubmodelWithNestedTable();
    submodel.deleteColumn(
      IdShortPath.create({
        path: "table1.row1.table2.row11.table3",
      }),
      "col1",
      { ability, onDelete: () => {} },
    );
    const row221 = submodel.findSubmodelElementOrFail(
      IdShortPath.create({ path: "table1.row2.table2.row22.table3.row221" }),
    );
    expect(row221.getSubmodelElements()).toHaveLength(0);
  });

  it("should add row to table1", () => {
    const { submodel, ability } = createSubmodelWithNestedTable();
    submodel.addRow(
      IdShortPath.create({
        path: "table1",
      }),
      { ability },
    );
    const value: any = submodel.getValueRepresentation({ options: { ability } });
    const [_r1, _r2, newRow] = value.table1;
    expect(newRow).toEqual({
      col1: null,
      table2: [
        {
          col1: null,
          table3: [
            {
              col1: null,
            },
          ],
        },
      ],
    });
  });

  it("should add row to table3", () => {
    const { submodel, ability } = createSubmodelWithNestedTable();
    submodel.addRow(
      IdShortPath.create({
        path: "table1.row1.table2.row11.table3",
      }),
      { ability },
    );
    const table3OfRow11 = submodel.findSubmodelElementOrFail(
      IdShortPath.create({ path: "table1.row1.table2.row11.table3" }),
    );
    const [row221, row222] = table3OfRow11.getSubmodelElements();
    expect(
      row222.getSubmodelElements().map((e: any) => ({ idShort: e.idShort, value: e.value })),
    ).toEqual(row221.getSubmodelElements().map((e) => ({ idShort: e.idShort, value: null })));
    const table3OfRow21 = submodel.findSubmodelElementOrFail(
      IdShortPath.create({ path: "table1.row2.table2.row21.table3" }),
    );
    expect(table3OfRow21.getSubmodelElements()).toHaveLength(1);
  });

  // Paths to every leaf row across all table3 instances in the nested structure
  const allTable3RowPaths = [
    "table1.row1.table2.row11.table3.row111",
    "table1.row1.table2.row12.table3.row121",
    "table1.row1.table2.row13.table3.row131",
    "table1.row2.table2.row21.table3.row211",
    "table1.row2.table2.row22.table3.row221",
  ];

  const table3Path = IdShortPath.create({ path: "table1.row1.table2.row11.table3" });

  function getAllTable3Rows(submodel: Submodel) {
    return allTable3RowPaths.map((p) =>
      submodel.findSubmodelElementOrFail(IdShortPath.create({ path: p })),
    );
  }

  // Returns a fresh submodel that already has a group1 column added to all table3 instances.
  function createSubmodelWithGroupInTable3() {
    const { submodel, ability } = createSubmodelWithNestedTable();
    submodel.addColumn(table3Path, SubmodelElementCollection.create({ idShort: "group1" }), {
      ability,
    });
    return { submodel, ability };
  }

  it("should add column to group in table3 and propagate to all instances", () => {
    const { submodel, ability } = createSubmodelWithGroupInTable3();
    submodel.addColumnToGroup(
      table3Path,
      "group1",
      Property.create({ idShort: "subCol1", valueType: DataTypeDef.String }),
      { ability },
    );
    for (const row of getAllTable3Rows(submodel)) {
      const group = row.getSubmodelElements().find((el) => el.idShort === "group1")!;
      expect(group.getSubmodelElements().map((el) => el.idShort)).toContain("subCol1");
    }
  });

  it("should delete column from group in table3, move it back to top level right after group, and propagate to all instances", () => {
    const { submodel, ability } = createSubmodelWithGroupInTable3();
    submodel.addColumnToGroup(
      table3Path,
      "group1",
      Property.create({ idShort: "subCol1", valueType: DataTypeDef.String }),
      { ability },
    );
    submodel.deleteColumnFromGroup(table3Path, "group1", "subCol1", { ability });
    for (const row of getAllTable3Rows(submodel)) {
      const topLevel = row.getSubmodelElements().map((el) => el.idShort);
      const groupIndex = topLevel.indexOf("group1");
      expect(topLevel[groupIndex + 1]).toBe("subCol1");
      const group = row.getSubmodelElements().find((el) => el.idShort === "group1")!;
      expect(group.getSubmodelElements().map((el) => el.idShort)).not.toContain("subCol1");
    }
  });

  it("should modify column in group in table3 and propagate to all instances", () => {
    const { submodel, ability } = createSubmodelWithGroupInTable3();
    submodel.addColumnToGroup(
      table3Path,
      "group1",
      Property.create({ idShort: "subCol1", valueType: DataTypeDef.String }),
      { ability },
    );
    const newDisplayName = [{ language: "en", text: "Updated" }];
    submodel.modifyColumnInGroup(
      table3Path,
      "group1",
      "subCol1",
      { displayName: newDisplayName },
      { ability },
    );
    for (const row of getAllTable3Rows(submodel)) {
      const group = row.getSubmodelElements().find((el) => el.idShort === "group1")!;
      const subCol = group.getSubmodelElements().find((el) => el.idShort === "subCol1")!;
      expect(subCol.displayName).toEqual(newDisplayName.map(LanguageText.fromPlain));
    }
  });

  it("should move top-level column into group in table3 and propagate to all instances", () => {
    const { submodel, ability } = createSubmodelWithGroupInTable3();
    submodel.moveColumnToGroup(table3Path, "col1", "group1", { ability });
    for (const row of getAllTable3Rows(submodel)) {
      expect(row.getSubmodelElements().map((el) => el.idShort)).not.toContain("col1");
      const group = row.getSubmodelElements().find((el) => el.idShort === "group1")!;
      expect(group.getSubmodelElements().map((el) => el.idShort)).toContain("col1");
    }
  });
});
