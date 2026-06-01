import { randomUUID } from "node:crypto";
import { AasSubmodelElements } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { ModifierVisitor, ModifierVisitorOptions } from "../modifier-visitor";
import { AddOptions, cloneSubmodelElement, DeleteOptions, ISubmodelElement } from "./submodel-base";
import { SubmodelElementCollection } from "./submodel-element-collection";
import { SubmodelElementList } from "./submodel-element-list";
import {
  ChangeTracker,
  ITrackable,
  withTrackingHelper,
} from "../../../activity-history/domain/change-tracker";
import { RowAdded } from "../../../activity-history/domain/change-events/row-added";
import { ColumnAdded } from "../../../activity-history/domain/change-events/column-added";
import { ColumnDeleted } from "../../../activity-history/domain/change-events/column-deleted";
import { RowDeleted } from "../../../activity-history/domain/change-events/row-deleted";

export class TableExtension implements ITrackable {
  private headerRow: ISubmodelElement | undefined;
  readonly tracker = ChangeTracker.create();

  constructor(private data: SubmodelElementList) {
    if (this.data.typeValueListElement !== AasSubmodelElements.SubmodelElementCollection) {
      throw new Error(
        `List type ${this.data.typeValueListElement} is not supported by table extension`,
      );
    }
    this.setHeaderRow();
  }

  withTracking(changeTracker?: ChangeTracker): this {
    return withTrackingHelper(changeTracker, this);
  }

  private setHeaderRow() {
    this.headerRow =
      this.data.value.length > 0 &&
      this.data.value[0].getSubmodelElementType() === AasSubmodelElements.SubmodelElementCollection
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

  addColumn(column: ISubmodelElement, options: AddOptions): void {
    if (!this.headerRow) {
      this.addHeaderRow(options);
    }
    this.rows.forEach((row) => {
      row.addSubmodelElement(cloneSubmodelElement(column), options);
    });
    const position = options.position ?? this.columns.length - 1;
    const value = this.columns[position];
    this.tracker.track(
      ColumnAdded.create({
        path: value.getIdShortPath(),
        position,
        value,
      }),
    );
  }

  modifyColumn(idShort: string, data: any, options: ModifierVisitorOptions) {
    if (Object.prototype.hasOwnProperty.call(data, "value")) {
      // Otherwise the value of the column would be propagated to all rows
      throw new ValueError("Column value modification is not supported.");
    }

    for (const row of this.rows) {
      const column = row.getSubmodelElements().find((el) => el.idShort === idShort);
      if (column) {
        column.accept(new ModifierVisitor(options).withTracking(this.tracker), {
          data: { ...data, idShort },
        });
      }
    }
  }

  deleteColumn(idShort: string, options: DeleteOptions) {
    const columnIndex = this.getColumnPosition(idShort);
    const columnToDelete = this.columns[columnIndex];
    for (const row of this.rows) {
      row.deleteSubmodelElement(idShort, options);
    }
    if (columnToDelete) {
      this.tracker.track(
        ColumnDeleted.create({
          position: columnIndex,
          path: columnToDelete.getIdShortPath(),
          value: columnToDelete,
        }),
      );
    }
  }

  private generateRowIdShort() {
    return `row_${randomUUID()}`;
  }

  private addHeaderRow(options: AddOptions): ISubmodelElement {
    this.headerRow = SubmodelElementCollection.create({
      idShort: this.generateRowIdShort(),
      value: [],
    });
    this.data.addSubmodelElement(this.headerRow, options);
    return this.headerRow;
  }

  addRow(options: AddOptions) {
    let newRow: ISubmodelElement;
    if (!this.headerRow) {
      newRow = this.addHeaderRow(options);
    } else {
      newRow = SubmodelElementCollection.create({ idShort: this.generateRowIdShort() });
      this.data.addSubmodelElement(newRow, options);
      this.columns.forEach((column) => {
        const columnCopy = cloneSubmodelElement(column, { value: undefined });
        newRow.addSubmodelElement(columnCopy, {
          ability: options.ability,
        });
      });

      if (options?.position === 0) {
        this.setHeaderRow();
      }
    }
    this.tracker.track(
      RowAdded.create({
        path: newRow.getIdShortPath(),
        position: options.position ?? this.rows.length - 1,
        value: newRow,
      }),
    );
    return newRow;
  }

  getRowPosition(idShort: string) {
    return this.rows.findIndex((row) => row.idShort === idShort);
  }

  getColumnPosition(idShort: string) {
    return this.columns.findIndex((column) => column.idShort === idShort);
  }

  deleteRow(idShort: string, options: DeleteOptions) {
    const rowIndex = this.getRowPosition(idShort);
    const row = this.data.deleteSubmodelElement(idShort, options);
    if (this.headerRow && this.headerRow.idShort === idShort) {
      this.setHeaderRow();
    }
    this.tracker.track(
      RowDeleted.create({
        path: row.getIdShortPath(),
        position: rowIndex,
        value: row,
      }),
    );
  }
}
