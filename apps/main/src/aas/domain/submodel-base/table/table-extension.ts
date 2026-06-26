import { randomUUID } from "node:crypto";
import { AasSubmodelElements } from "@open-dpp/dto";
import { NotFoundError, ValueError } from "@open-dpp/exception";
import { ModifierVisitor, ModifierVisitorOptions } from "../../modifier-visitor";
import { AddOptions, DeleteOptions, ISubmodelElement } from "../submodel-base";
import { SubmodelElementCollection } from "../submodel-element-collection";
import { SubmodelElementList } from "../submodel-element-list";
import {
  ChangeTracker,
  withTrackingHelper,
} from "../../../../activity-history/domain/change-tracker";
import { RowAdded } from "../../../../activity-history/domain/change-events/row-added";
import { ColumnAdded } from "../../../../activity-history/domain/change-events/column-added";
import { ColumnDeleted } from "../../../../activity-history/domain/change-events/column-deleted";
import { ColumnAddedToGroup } from "../../../../activity-history/domain/change-events/column-added-to-group";
import { ColumnDeletedFromGroup } from "../../../../activity-history/domain/change-events/column-deleted-from-group";
import { RowDeleted } from "../../../../activity-history/domain/change-events/row-deleted";
import { ITableExtendable, MoveOptions } from "./table-extensable";
import { TableRowCopyVisitor } from "./table-row-copy-visitor";

export class TableExtension implements ITableExtendable {
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
      this.data.getSubmodelElements().length > 0 &&
      this.data.getSubmodelElements()[0].getSubmodelElementType() ===
        AasSubmodelElements.SubmodelElementCollection
        ? this.data.getSubmodelElements()[0]
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

  private getGroupInRowOrFail(row: ISubmodelElement, groupIdShort: string): SubmodelElementCollection {
    const group = row.getSubmodelElements().find((el) => el.idShort === groupIdShort);
    if (!group) {
      throw new NotFoundError("ColumnGroup", groupIdShort);
    }
    if (!(group instanceof SubmodelElementCollection)) {
      throw new ValueError(
        `Element "${groupIdShort}" is not a SubmodelElementCollection and cannot be used as a ColumnGroup`,
      );
    }
    return group;
  }

  private resolveContainer(row: ISubmodelElement, groupIdShort?: string): ISubmodelElement {
    return groupIdShort ? this.getGroupInRowOrFail(row, groupIdShort) : row;
  }

  private applyAddColumn(column: ISubmodelElement, options: AddOptions, groupIdShort?: string): void {
    for (const row of this.rows) {
      const container = this.resolveContainer(row, groupIdShort);
      const copy = column.copy();
      if (copy.isAllowed) {
        container.addSubmodelElement(copy.value, options);
      }
    }
  }

  private applyModifyColumn(
    idShort: string,
    data: any,
    options: ModifierVisitorOptions,
    groupIdShort?: string,
  ): void {
    for (const row of this.rows) {
      const container = this.resolveContainer(row, groupIdShort);
      const column = container.getSubmodelElements().find((el) => el.idShort === idShort);
      if (column) {
        column.accept(new ModifierVisitor(options).withTracking(this.tracker), {
          data: { ...data, idShort },
        });
      }
    }
  }

  private applyDeleteColumn(idShort: string, options: DeleteOptions, groupIdShort?: string): void {
    for (const row of this.rows) {
      const container = this.resolveContainer(row, groupIdShort);
      container.deleteSubmodelElement(idShort, options);
    }
  }

  addColumn(column: ISubmodelElement, options: AddOptions): void {
    if (!this.headerRow) {
      this.addHeaderRow(options);
    }
    this.applyAddColumn(column, options);
    const position = this.getColumnPosition(column.idShort);
    const value = this.columns[position];
    this.tracker.track(ColumnAdded.create({ path: value.getIdShortPath(), position, value }));
  }

  modifyColumn(idShort: string, data: any, options: ModifierVisitorOptions) {
    if (Object.prototype.hasOwnProperty.call(data, "value")) {
      throw new ValueError("Column value modification is not supported.");
    }
    this.applyModifyColumn(idShort, data, options);
  }

  deleteColumn(idShort: string, options: DeleteOptions) {
    const columnIndex = this.getColumnPosition(idShort);
    const columnToDelete = this.columns[columnIndex];
    this.applyDeleteColumn(idShort, options);
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

  addColumnToGroup(groupIdShort: string, column: ISubmodelElement, options: AddOptions): void {
    this.applyAddColumn(column, options, groupIdShort);
    const headerGroup = this.getGroupInRowOrFail(this.headerRow!, groupIdShort);
    const position = headerGroup.getSubmodelElements().findIndex((el) => el.idShort === column.idShort);
    const value = headerGroup.getSubmodelElements()[position];
    this.tracker.track(ColumnAddedToGroup.create({ groupIdShort, path: value.getIdShortPath(), position, value }));
  }

  modifyColumnInGroup(groupIdShort: string, idShort: string, data: any, options: ModifierVisitorOptions): void {
    if (Object.prototype.hasOwnProperty.call(data, "value")) {
      throw new ValueError("Column value modification is not supported.");
    }
    this.applyModifyColumn(idShort, data, options, groupIdShort);
  }

  deleteColumnFromGroup(groupIdShort: string, idShort: string, options: MoveOptions): void {
    const headerGroup = this.getGroupInRowOrFail(this.headerRow!, groupIdShort);
    const columnIndex = headerGroup.getSubmodelElements().findIndex((el) => el.idShort === idShort);
    const columnToMove = headerGroup.getSubmodelElements()[columnIndex];
    const groupPosition = this.getColumnPosition(groupIdShort);
    this.applyDeleteColumn(idShort, { ability: options.ability, onDelete: () => {} }, groupIdShort);
    if (columnToMove) {
      this.applyAddColumn(columnToMove, { ability: options.ability, position: groupPosition + 1 });
      this.tracker.track(
        ColumnDeletedFromGroup.create({
          groupIdShort,
          position: columnIndex,
          path: columnToMove.getIdShortPath(),
          value: columnToMove,
        }),
      );
      const newPosition = this.getColumnPosition(idShort);
      const addedValue = this.columns[newPosition];
      this.tracker.track(ColumnAdded.create({ path: addedValue.getIdShortPath(), position: newPosition, value: addedValue }));
    }
  }

  moveColumnToGroup(columnIdShort: string, groupIdShort: string, options: MoveOptions): void {
    const column = this.getColumnOrFail(columnIdShort);
    const deletedPosition = this.getColumnPosition(columnIdShort);
    this.applyDeleteColumn(columnIdShort, { ability: options.ability, onDelete: () => {} });
    this.applyAddColumn(column, { ability: options.ability }, groupIdShort);
    this.tracker.track(
      ColumnDeleted.create({ position: deletedPosition, path: column.getIdShortPath(), value: column }),
    );
    const headerGroup = this.getGroupInRowOrFail(this.headerRow!, groupIdShort);
    const addedPosition = headerGroup.getSubmodelElements().findIndex((el) => el.idShort === columnIdShort);
    const addedValue = headerGroup.getSubmodelElements()[addedPosition];
    this.tracker.track(
      ColumnAddedToGroup.create({ groupIdShort, path: addedValue.getIdShortPath(), position: addedPosition, value: addedValue }),
    );
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
        const columnCopy = column.copy({
          transformer: new TableRowCopyVisitor(),
        });
        if (columnCopy.isAllowed) {
          newRow.addSubmodelElement(columnCopy.value, {
            ability: options.ability,
          });
        }
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

  getColumnOrFail(idShort: string) {
    const column = this.columns.find((column) => column.idShort === idShort);
    if (!column) {
      throw new NotFoundError("Column", idShort);
    }
    return column;
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
