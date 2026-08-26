import { randomUUID } from "node:crypto";
import { AasSubmodelElements, Permissions } from "@open-dpp/dto";
import { ForbiddenError, NotFoundError, ValueError } from "@open-dpp/exception";
import { ModifierVisitor, ModifierVisitorOptions } from "../../modifier-visitor";
import { AasAbility } from "../../security/aas-ability";
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
import { SubmodelElementMoved } from "../../../../activity-history/domain/change-events/submodel-element-moved";
import { ITableExtendable, MoveOptions } from "./table-extensable";
import { TableRowCopyVisitor } from "./table-row-copy-visitor";

export class TableExtension implements ITableExtendable {
  private headerRow: ISubmodelElement | undefined;
  readonly tracker = ChangeTracker.create();

  constructor(private data: SubmodelElementList) {
    if (this.data.typeValueListElement !== AasSubmodelElements.SubmodelElementCollection) {
      throw new ValueError(
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

  private getGroupInRowOrFail(
    row: ISubmodelElement,
    groupIdShort: string,
  ): SubmodelElementCollection {
    const group = row.getSubmodelElements().find((el) => el.idShort === groupIdShort);
    if (!group) {
      throw new NotFoundError(`Column group with id ${groupIdShort} not found.`);
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

  private assertNotTableColumn(column: ISubmodelElement): void {
    if (column.getSubmodelElementType() === AasSubmodelElements.SubmodelElementList) {
      throw new ValueError(
        `Cannot move table column "${column.idShort}" into a group. Table columns cannot be nested inside groups.`,
      );
    }
  }

  private applyAddColumn(
    column: ISubmodelElement,
    options: AddOptions,
    groupIdShort?: string,
  ): void {
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
    if (column instanceof SubmodelElementCollection && column.getSubmodelElements().length === 0) {
      throw new ValueError(
        `Cannot add an empty group column "${column.idShort}". Groups must be created with at least one sub-column.`,
      );
    }
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
    this.assertNotTableColumn(column);
    this.applyAddColumn(column, options, groupIdShort);
    const headerGroup = this.getGroupInRowOrFail(this.headerRow!, groupIdShort);
    const position = headerGroup
      .getSubmodelElements()
      .findIndex((el) => el.idShort === column.idShort);
    const value = headerGroup.getSubmodelElements()[position];
    this.tracker.track(
      ColumnAddedToGroup.create({ groupIdShort, path: value.getIdShortPath(), position, value }),
    );
  }

  modifyColumnInGroup(
    groupIdShort: string,
    idShort: string,
    data: any,
    options: ModifierVisitorOptions,
  ): void {
    if (Object.prototype.hasOwnProperty.call(data, "value")) {
      throw new ValueError("Column value modification is not supported.");
    }
    this.applyModifyColumn(idShort, data, options, groupIdShort);
  }

  /**
   * Moves a column from within a group to the parent table level.
   * The column is removed from the specified group in all rows and added as a direct child
   * of each row at the position immediately after the group column.
   *
   * This operation tracks two events:
   * - ColumnDeletedFromGroup: records the removal from the group
   * - ColumnAdded: records the addition at the parent level
   *
   * @param groupIdShort - The idShort of the group containing the column to move
   * @param idShort - The idShort of the column to move out of the group
   * @param options - Move options including ability for permission checks
   */
  deleteColumnFromGroup(
    groupIdShort: string,
    idShort: string,
    options: MoveOptions & DeleteOptions,
  ): void {
    const headerGroup = this.getGroupInRowOrFail(this.headerRow!, groupIdShort);
    const columnIndex = headerGroup.getSubmodelElements().findIndex((el) => el.idShort === idShort);
    const columnToMove = headerGroup.getSubmodelElements()[columnIndex];
    const groupPosition = this.getColumnPosition(groupIdShort);

    if (columnToMove) {
      for (const row of this.rows) {
        const groupColumn = row.getSubmodelElements().find((el) => el.idShort === groupIdShort);
        if (groupColumn) {
          const columnToCopy = groupColumn
            .getSubmodelElements()
            .find((el) => el.idShort === idShort);
          const copy = columnToCopy ? columnToCopy.copy() : undefined;
          if (copy && copy.isAllowed) {
            const addedElement = row.addSubmodelElement(copy.value, {
              ability: options.ability,
              position: groupPosition + 1,
            });

            const deletedElement = groupColumn.deleteSubmodelElement(idShort, {
              ability: options.ability,
              onDelete: () => {},
            });
            options.onMove(deletedElement.getIdShortPath(), addedElement.getIdShortPath());
          }
        }
      }
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
      this.tracker.track(
        ColumnAdded.create({
          path: addedValue.getIdShortPath(),
          position: newPosition,
          value: addedValue,
        }),
      );

      // A group can never exist empty: if ejecting this sub-column left the
      // group with no children, delete the now-empty group shell too.
      const headerGroupAfterEject = this.getGroupInRowOrFail(this.headerRow!, groupIdShort);
      if (headerGroupAfterEject.getSubmodelElements().length === 0) {
        this.deleteColumn(groupIdShort, {
          ability: options.ability,
          onDelete: options.onDelete,
        });
      }
    }
  }

  moveColumnToGroup(columnIdShort: string, groupIdShort: string, options: MoveOptions): void {
    const column = this.getColumnOrFail(columnIdShort);
    this.assertNotTableColumn(column);
    const deletedPosition = this.getColumnPosition(columnIdShort);
    for (const row of this.rows) {
      const columnToCopy = row.getSubmodelElements().find((el) => el.idShort === columnIdShort);
      const container = this.resolveContainer(row, groupIdShort);
      if (columnToCopy) {
        const copy = columnToCopy.copy();
        if (copy.isAllowed) {
          const addedElement = container.addSubmodelElement(copy.value, options);
          const deletedElement = row.deleteSubmodelElement(columnIdShort, {
            ability: options.ability,
            onDelete: () => {},
          });
          options.onMove(deletedElement.getIdShortPath(), addedElement.getIdShortPath());
        }
      }
    }
    this.tracker.track(
      ColumnDeleted.create({
        position: deletedPosition,
        path: column.getIdShortPath(),
        value: column,
      }),
    );
    const headerGroup = this.getGroupInRowOrFail(this.headerRow!, groupIdShort);
    const addedPosition = headerGroup
      .getSubmodelElements()
      .findIndex((el) => el.idShort === columnIdShort);
    const addedValue = headerGroup.getSubmodelElements()[addedPosition];
    this.tracker.track(
      ColumnAddedToGroup.create({
        groupIdShort,
        path: addedValue.getIdShortPath(),
        position: addedPosition,
        value: addedValue,
      }),
    );
  }

  /**
   * Creates a brand-new group column from `group` (expected to arrive with no
   * children of its own) and migrates the existing top-level column identified
   * by `columnIdShort` into it as its first (and initially only) sub-column,
   * preserving that column's real per-row values. The new group replaces the
   * migrated column's position among the top-level columns.
   */
  createGroupFromColumn(
    columnIdShort: string,
    group: ISubmodelElement,
    options: MoveOptions,
  ): void {
    if (!(group instanceof SubmodelElementCollection)) {
      throw new ValueError(
        `Element "${group.idShort}" is not a SubmodelElementCollection and cannot be used as a ColumnGroup`,
      );
    }
    this.getColumnOrFail(columnIdShort);
    if (this.columns.some((c) => c.idShort === group.idShort)) {
      throw new ValueError(`A column with idShort "${group.idShort}" already exists.`);
    }
    const position = this.getColumnPosition(columnIdShort);

    // Insert the still-empty group shell at the wrapped column's position via
    // the private applyAddColumn helper, bypassing addColumn's public "no
    // empty groups" invariant on purpose: that invariant guards the public
    // entry point against a caller *persisting* an empty group, but here the
    // group is filled with the migrated column below before this method
    // returns, so no empty-group state is ever observable.
    this.applyAddColumn(group, { ability: options.ability, position });

    const groupPath = this.columns[position].getIdShortPath();
    this.tracker.track(ColumnAdded.create({ path: groupPath, position, value: group }));

    // Reuse the existing, already-tested move: migrates the column's real
    // per-row values into the group and tracks ColumnDeleted + ColumnAddedToGroup.
    this.moveColumnToGroup(columnIdShort, group.idShort, options);
  }

  private applyReorderColumn(idShort: string, position: number, groupIdShort?: string): void {
    for (const row of this.rows) {
      const container = this.resolveContainer(row, groupIdShort);
      const siblings = container.getSubmodelElements();
      const currentIndex = siblings.findIndex((el) => el.idShort === idShort);
      if (currentIndex !== -1) {
        const [column] = siblings.splice(currentIndex, 1);
        siblings.splice(position, 0, column);
      }
    }
  }

  /**
   * Reorders a column within its current container (the header row, or a group
   * within it). This must reposition the column in every row, not just the header:
   * whichever row sits at index 0 becomes the header (see setHeaderRow/deleteRow), so
   * a header-only reorder would silently revert itself once that row is deleted. It
   * would also desync the positional-insert assumption createGroupFromColumn relies on
   * (it inserts a brand-new, not-yet-existing group at the header's column index into
   * every row, since there's no idShort to match against yet).
   */
  reorderColumn(
    idShortOfColumn: string,
    groupIdShort: string | undefined,
    position: number,
    options: { ability: AasAbility },
  ): void {
    const headerContainer = groupIdShort
      ? this.getGroupInRowOrFail(this.headerRow!, groupIdShort)
      : this.headerRow!;
    const existingColumn = headerContainer
      .getSubmodelElements()
      .find((el) => el.idShort === idShortOfColumn);
    if (!existingColumn) {
      throw new NotFoundError(`Column with id ${idShortOfColumn} not found.`);
    }
    if (!options.ability.can(Permissions.Edit, existingColumn.getIdShortPath())) {
      throw new ForbiddenError(
        `Missing permissions to edit column ${existingColumn.getIdShortPath().toString()}.`,
      );
    }

    this.applyReorderColumn(idShortOfColumn, position, groupIdShort);

    const newPosition = headerContainer
      .getSubmodelElements()
      .findIndex((el) => el.idShort === idShortOfColumn);
    const value = headerContainer.getSubmodelElements()[newPosition];
    const path = value.getIdShortPath();
    this.tracker.track(
      SubmodelElementMoved.create({ oldPath: path, newPath: path, position: newPosition, value }),
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
      throw new NotFoundError(`Column with id ${idShort} not found.`);
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
    options.onDelete?.(row);
    this.tracker.track(
      RowDeleted.create({
        path: row.getIdShortPath(),
        position: rowIndex,
        value: row,
      }),
    );
  }
}
