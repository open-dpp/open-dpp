import { expect } from "@jest/globals";
import { AasSubmodelElements } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { propertyPlainFactory } from "@open-dpp/testing";
import { LanguageText } from "../common/language-text";
import { Property } from "./property";
import { registerSubmodelElementClasses } from "./register-submodel-element-classes";
import { cloneSubmodelElement } from "./submodel-base";
import { SubmodelElementCollection } from "./submodel-element-collection";
import { SubmodelElementList } from "./submodel-element-list";
import { TableExtension } from "./table-extension";

describe("tableExtension", () => {
  beforeAll(() => {
    registerSubmodelElementClasses();
  });

  it("should add columns and rows", () => {
    const submodelElementList = SubmodelElementList.create({
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
      idShort: "idShort",
    });
    const table = new TableExtension(submodelElementList);
    const col1Plain = propertyPlainFactory.build({ idShort: "col1" });
    const col1 = Property.fromPlain(col1Plain);
    // Add first column
    table.addColumn(col1);
    const firstRowId = table.rows[0].idShort;
    const expHeaderRow = SubmodelElementCollection.create({ idShort: firstRowId });
    expHeaderRow.addSubmodelElement(col1);
    expect(table.rows).toEqual([expHeaderRow]);

    // Add one row
    table.addRow();
    const col1Row1 = Property.fromPlain(col1Plain);
    const secondRowId = table.rows[1].idShort;
    const expRow1 = SubmodelElementCollection.create({ idShort: secondRowId, value: [col1Row1] });
    expect(table.rows).toEqual([expHeaderRow, expRow1]);
    expect(secondRowId).not.toEqual(firstRowId);

    // Add third column
    const col3 = Property.fromPlain(propertyPlainFactory.build({ idShort: "col3", value: "col3Value" }));
    expHeaderRow.addSubmodelElement(col3);
    expRow1.addSubmodelElement(cloneSubmodelElement(col3));
    table.addColumn(col3);
    expect(table.rows).toEqual([expHeaderRow, expRow1]);

    // Add second column between first and third
    const col2 = Property.fromPlain(propertyPlainFactory.build({ idShort: "col2" }));
    expHeaderRow.addSubmodelElement(col2, { position: 1 });
    expRow1.addSubmodelElement(cloneSubmodelElement(col2), { position: 1 });
    table.addColumn(col2, { position: 1 });
    expect(table.rows).toEqual([expHeaderRow, expRow1]);

    // Add one row at position 1
    table.addRow({ position: 1 });
    const rowAtPos1Id = table.rows[1].idShort;
    const expRowAtPos1 = SubmodelElementCollection.create({ idShort: rowAtPos1Id, value: [
      cloneSubmodelElement(col1),
      cloneSubmodelElement(col2),
      cloneSubmodelElement(col3),
    ] });
    expect(table.rows).toEqual([expHeaderRow, expRowAtPos1, expRow1]);
    expect(rowAtPos1Id).not.toEqual(secondRowId);
    expect(rowAtPos1Id).not.toEqual(firstRowId);
  });

  it("should delete column", () => {
    const submodelElementList = SubmodelElementList.create({
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
      idShort: "idShort",
    });
    const table = new TableExtension(submodelElementList);
    const col1 = Property.fromPlain(propertyPlainFactory.build({ idShort: "col1" }));
    const col2 = Property.fromPlain(propertyPlainFactory.build({ idShort: "col2" }));
    table.addColumn(col1);
    table.addColumn(col2);
    table.addRow();
    table.addRow();
    expect(table.rows.some(r => r.getSubmodelElements().some(c => c.idShort === col1.idShort))).toBeTruthy();
    table.deleteColumn(col1.idShort);
    expect(table.columns).toEqual([col2]);
    expect(table.rows.some(r => r.getSubmodelElements().some(c => c.idShort === col1.idShort))).toBeFalsy();
  });

  it("should modify column", () => {
    const submodelElementList = SubmodelElementList.create({
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
      idShort: "idShort",
    });
    const table = new TableExtension(submodelElementList);
    const col1 = Property.fromPlain(propertyPlainFactory.build({ idShort: "col1" }));
    const col2 = Property.fromPlain(propertyPlainFactory.build({ idShort: "col2" }));
    table.addColumn(col1);
    table.addColumn(col2);
    table.addRow();
    table.addRow();
    const newDisplayNames = [{
      language: "de",
      text: "CO2 Footprint New Text",
    }];
    const newDescriptions = [{
      language: "en",
      text: "The Submodel Carbon Footprint NEW",
    }, {
      language: "de",
      text: "Das Submodel liefert CO2",
    }];
    table.modifyColumn(col1.idShort, { displayName: newDisplayNames, description: newDescriptions });
    for (const row of table.rows) {
      const column = row.getSubmodelElements().find(c => c.idShort === col1.idShort);
      expect(column?.displayName).toEqual(newDisplayNames.map(LanguageText.fromPlain));
      expect(column?.description).toEqual(newDescriptions.map(LanguageText.fromPlain));
    }
    expect(() => table.modifyColumn(col1.idShort, { displayName: newDisplayNames, value: "2" })).toThrow(new ValueError("Column has no value to modify."));
  });

  it("should delete row", () => {
    const submodelElementList = SubmodelElementList.create({
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
      idShort: "idShort",
    });
    const table = new TableExtension(submodelElementList);
    const col1 = Property.fromPlain(propertyPlainFactory.build({ idShort: "col1" }));
    const col2 = Property.fromPlain(propertyPlainFactory.build({ idShort: "col2" }));
    table.addColumn(col1);
    table.addColumn(col2);
    const rowToDelete = table.addRow();
    table.addRow();
    expect(table.rows.some(r => r.idShort === rowToDelete.idShort)).toBeTruthy();
    table.deleteRow(rowToDelete.idShort);
    expect(table.rows.some(r => r.idShort === rowToDelete.idShort)).toBeFalsy();
  });
});
