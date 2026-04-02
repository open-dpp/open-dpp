import { randomUUID } from "node:crypto";
import { AasSubmodelElements, Permissions } from "@open-dpp/dto";
import { ForbiddenError, ValueError } from "@open-dpp/exception";
import { ModifierVisitor, ModifierVisitorOptions } from "../modifier-visitor";
import { AasAbility } from "../security/aas-ability";
import { cloneSubmodelElement, IdShortPath, ISubmodelElement } from "./submodel-base";
import { SubmodelElementCollection } from "./submodel-element-collection";
import { SubmodelElementList } from "./submodel-element-list";

interface TableModificationOptions {
  position: number;
}

export interface TableDeleteOptions {
  ability: AasAbility;
}

export class TableExtension {
  private headerRow: ISubmodelElement | undefined;
  private listIdShortPath: IdShortPath;
  constructor(private data: SubmodelElementList, submodelIdShort: string) {
    if (this.data.typeValueListElement !== AasSubmodelElements.SubmodelElementCollection) {
      throw new Error(`List type ${this.data.typeValueListElement} is not supported by table extension`);
    }
    this.listIdShortPath = IdShortPath.create({ path: submodelIdShort }).addPathSegment(this.data.idShort);
    this.setHeaderRow();
  }

  private setHeaderRow() {
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
    this.rows.forEach((row) => {
      row.addSubmodelElement(cloneSubmodelElement(column), options);
    });
  }

  modifyColumn(idShort: string, data: any, options: ModifierVisitorOptions) {
    if (Object.prototype.hasOwnProperty.call(data, "value")) {
      // Otherwise the value of the column would be propagated to all rows
      throw new ValueError("Column value modification is not supported.");
    }

    for (const row of this.rows) {
      const column = row.getSubmodelElements().find(el => el.idShort === idShort);
      if (column) {
        column.accept(new ModifierVisitor(options), { data: { ...data, idShort } });
      }
    }
  }

  deleteColumn(idShort: string, { ability }: TableDeleteOptions) {
    this.rows.forEach((row) => {
      const idShortPath = this.listIdShortPath.addPathSegment(row.idShort).addPathSegment(idShort);
      this.deletionGuard(ability, idShortPath);
      row.deleteSubmodelElement(idShort);
    });
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

      this.columns.forEach((column) => {
        const columnCopy = cloneSubmodelElement(column, { value: undefined });
        newRow.addSubmodelElement(columnCopy);
      });
      this.data.addSubmodelElement(newRow, options);
      if (options?.position === 0) {
        this.setHeaderRow();
      }
      return newRow;
    }
  }

  deleteRow(idShort: string, { ability }: TableDeleteOptions) {
    const idShortPath = this.listIdShortPath.addPathSegment(idShort);
    this.deletionGuard(ability, idShortPath);
    this.data.deleteSubmodelElement(idShort);
    if (this.headerRow && this.headerRow.idShort === idShort) {
      this.setHeaderRow();
    }
  }

  private deletionGuard(ability: AasAbility, idShortPath: IdShortPath) {
    if (!ability.can(Permissions.Delete, idShortPath)) {
      throw new ForbiddenError(`Missing permissions to delete element ${idShortPath}.`);
    }
  }
}
