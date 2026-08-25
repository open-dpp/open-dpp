import { beforeAll, describe, expect, it } from "@jest/globals";
import { AasSubmodelElements, DataTypeDef } from "@open-dpp/dto";
import { IdShortPath } from "../common/id-short-path";
import { Property } from "../submodel-base/property";
import { registerSubmodelElementClasses } from "../submodel-base/register-submodel-element-classes";
import { Submodel } from "../submodel-base/submodel";
import { SubmodelElementCollection } from "../submodel-base/submodel-element-collection";
import { SubmodelElementList } from "../submodel-base/submodel-element-list";
import { SubmodelSecurityContext } from "./submodel-security-context";

describe("SubmodelSecurityContext", () => {
  beforeAll(() => {
    registerSubmodelElementClasses();
  });

  function createSubmodelWithTables() {
    return Submodel.create({
      idShort: "section1",
      submodelElements: [
        Property.create({ idShort: "plainProp", value: "10", valueType: DataTypeDef.Double }),
        SubmodelElementList.create({
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
  }

  it("allows a policy on the submodel itself", () => {
    const context = SubmodelSecurityContext.create({ submodels: [createSubmodelWithTables()] });
    expect(
      context.checkPolicyTarget(IdShortPath.create({ path: "section1" })).isValid,
    ).toBeTruthy();
  });

  it("allows a policy on a plain property", () => {
    const context = SubmodelSecurityContext.create({ submodels: [createSubmodelWithTables()] });
    expect(
      context.checkPolicyTarget(IdShortPath.create({ path: "section1.plainProp" })).isValid,
    ).toBeTruthy();
  });

  it("allows a policy on a top-level table itself", () => {
    const context = SubmodelSecurityContext.create({ submodels: [createSubmodelWithTables()] });
    expect(
      context.checkPolicyTarget(IdShortPath.create({ path: "section1.table1" })).isValid,
    ).toBeTruthy();
  });

  it("rejects a policy on a row of a top-level table", () => {
    const context = SubmodelSecurityContext.create({ submodels: [createSubmodelWithTables()] });
    const validity = context.checkPolicyTarget(
      IdShortPath.create({ path: "section1.table1.row1" }),
    );
    expect(validity.isInvalid).toBeTruthy();
  });

  it("rejects a policy on a column of a top-level table", () => {
    const context = SubmodelSecurityContext.create({ submodels: [createSubmodelWithTables()] });
    const validity = context.checkPolicyTarget(
      IdShortPath.create({ path: "section1.table1.row1.col1" }),
    );
    expect(validity.isInvalid).toBeTruthy();
  });

  it("rejects a policy on a nested table itself", () => {
    const context = SubmodelSecurityContext.create({ submodels: [createSubmodelWithTables()] });
    const validity = context.checkPolicyTarget(
      IdShortPath.create({ path: "section1.table1.row1.table2" }),
    );
    expect(validity.isInvalid).toBeTruthy();
  });

  it("rejects a policy on a column of a nested table", () => {
    const context = SubmodelSecurityContext.create({ submodels: [createSubmodelWithTables()] });
    const validity = context.checkPolicyTarget(
      IdShortPath.create({ path: "section1.table1.row1.table2.row11.col1" }),
    );
    expect(validity.isInvalid).toBeTruthy();
  });

  it("is unresolvable when the submodel idShort is unknown", () => {
    const context = SubmodelSecurityContext.create({ submodels: [createSubmodelWithTables()] });
    const validity = context.checkPolicyTarget(IdShortPath.create({ path: "unknownSubmodel" }));
    expect(validity.isUnresolvable).toBeTruthy();
  });

  it("is unresolvable when the element path does not exist", () => {
    const context = SubmodelSecurityContext.create({ submodels: [createSubmodelWithTables()] });
    const validity = context.checkPolicyTarget(
      IdShortPath.create({ path: "section1.doesNotExist" }),
    );
    expect(validity.isUnresolvable).toBeTruthy();
  });
});
