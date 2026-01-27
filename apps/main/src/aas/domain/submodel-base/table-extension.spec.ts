import { expect } from "@jest/globals";
import { AasSubmodelElements } from "@open-dpp/dto";
import { propertyPlainFactory } from "@open-dpp/testing";
import { Property } from "./property";
import { registerSubmodelElementClasses } from "./register-submodel-element-classes";
import { SubmodelElementCollection } from "./submodel-element-collection";
import { SubmodelElementList } from "./submodel-element-list";
import { TableExtension } from "./table-extension";

describe("tableExtension", () => {
  beforeAll(() => {
    registerSubmodelElementClasses();
  });

  it("should add column", () => {
    const submodelElementList = SubmodelElementList.create({
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
      idShort: "idShort",
    });
    const table = new TableExtension(submodelElementList);
    const col1Plain = propertyPlainFactory.build({ idShort: "col1" });
    const col1 = Property.fromPlain(col1Plain);

    table.addColumn(col1);

    const headerRow = SubmodelElementCollection.create({ idShort: "row_0" });
    headerRow.addSubmodelElement(col1);
    expect(table.rows).toEqual([headerRow]);
    table.addRow();
    const col1Row1 = Property.fromPlain(col1Plain);
    const row1 = SubmodelElementCollection.create({ idShort: "row_1", value: [col1Row1] });
    expect(table.rows).toEqual([headerRow, row1]);
  });
});
