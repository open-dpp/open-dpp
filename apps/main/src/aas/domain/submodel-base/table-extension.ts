import { AasSubmodelElements } from "@open-dpp/dto";
import { cloneSubmodelElement, ISubmodelElement } from "./submodel-base";
import { SubmodelElementCollection } from "./submodel-element-collection";
import { SubmodelElementList } from "./submodel-element-list";

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

  get columns(): ISubmodelElement[] {
    return this.headerRow ? [...this.headerRow.getSubmodelElements()] : [];
  }

  get rows(): ISubmodelElement[] {
    return [...this.data.getSubmodelElements()];
  }

  addColumn(column: ISubmodelElement): void {
    const headerRow = this.headerRow ?? this.addHeaderRow();
    headerRow.addSubmodelElement(column);
  }

  private addHeaderRow(): ISubmodelElement {
    this.headerRow = SubmodelElementCollection.create({ idShort: "row_0", value: [] });
    return this.data.addSubmodelElement(this.headerRow);
  }

  addRow() {
    if (!this.headerRow) {
      this.addHeaderRow();
    }
    else {
      const newRowIdShort = `row_${this.rows.length}`;
      const newRow = SubmodelElementCollection.create({ idShort: newRowIdShort });
      this.columns.forEach(column => newRow.addSubmodelElement(cloneSubmodelElement(column)));
      this.data.addSubmodelElement(newRow);
    }
  }
}
