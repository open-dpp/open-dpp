import { randomUUID } from "node:crypto";
import { AasSubmodelElements } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { ModifierVisitor } from "../modifier-visitor";
import { ValueVisitor } from "../value-visitor";
import { cloneSubmodelElement, ISubmodelElement } from "./submodel-base";
import { SubmodelElementCollection } from "./submodel-element-collection";
import { SubmodelElementList } from "./submodel-element-list";

interface TableModificationOptions {
  position: number;
}

export class TableExtension {
  private headerRow: ISubmodelElement | undefined;
  constructor(private data: SubmodelElementList) {
    if (this.data.typeValueListElement !== AasSubmodelElements.SubmodelElementCollection) {
      throw new Error(`List type ${this.data.typeValueListElement} is not supported by table extension`);
    }
    this.headerRow = this.data.value.length > 0 && this.data.value[0].getSubmodelElementType() === AasSubmodelElements.SubmodelElementCollection
      ? this.data.value[0]
      : undefined;
  }

  getTableElement() {
    return this.data;
  }

  get columns(): ISubmodelElement[] {
    return this.headerRow ? this.headerRow.getSubmodelElements() : [];
  }

  get rows(): ISubmodelElement[] {
    return this.data.getSubmodelElements();
  }

  addColumn(column: ISubmodelElement, options?: TableModificationOptions): void {
    if (!this.headerRow) {
      this.addHeaderRow();
    }
    this.rows.forEach(row => row.addSubmodelElement(cloneSubmodelElement(column), options));
  }

  modifyColumn(idShort: string, data: any) {
    if (data.value) {
      // Otherwise the value of the column would be propagated to all rows
      throw new ValueError("Column has no value to modify.");
    }
    for (const row of this.rows) {
      const column = row.getSubmodelElements().find(el => el.idShort === idShort);
      if (column) {
        column.accept(new ModifierVisitor(), { ...data, idShort });
      }
    }
  }

  deleteColumn(idShort: string) {
    this.rows.forEach(row => row.deleteSubmodelElement(idShort));
  }

  private generateRowIdShort() {
    return `row_${randomUUID()}`;
  }

  private addHeaderRow(): ISubmodelElement {
    this.headerRow = SubmodelElementCollection.create({ idShort: this.generateRowIdShort(), value: [] });
    this.data.addSubmodelElement(this.headerRow);
    return this.headerRow;
  }

  addRow(options?: TableModificationOptions) {
    if (!this.headerRow) {
      return this.addHeaderRow();
    }
    else {
      const newRow = SubmodelElementCollection.create({ idShort: this.generateRowIdShort() });
      this.columns.forEach(column => newRow.addSubmodelElement(cloneSubmodelElement(column)));
      this.data.addSubmodelElement(newRow, options);
      return newRow;
    }
  }

  deleteRow(idShort: string) {
    this.data.deleteSubmodelElement(idShort);
  }

  prettify(): string {
    const colPrint = this.columns.map(column => column.idShort).join(" | ");
    const rowsPrint = [];
    for (const row of this.rows) {
      const rowPrint = row.getSubmodelElements().map(
        submodelElement => submodelElement.accept(new ValueVisitor()),
      ).join(" | ");
      rowsPrint.push(rowPrint);
    }
    const print = rowsPrint.join("\n");
    return `${colPrint}\n${print}`;
  }
}
