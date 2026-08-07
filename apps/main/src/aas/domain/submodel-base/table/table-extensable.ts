import { ITrackable } from "../../../../activity-history/domain/change-tracker";
import { AddOptions, DeleteOptions, ISubmodelElement } from "../submodel-base";
import { ModifierVisitorOptions } from "../../modifier-visitor";
import { SubmodelElementList } from "../submodel-element-list";
import { ValueError } from "@open-dpp/exception";
import { AasAbility } from "../../security/aas-ability";
import { IdShortPath } from "../../common/id-short-path";

export interface MoveOptions {
  ability: AasAbility;
  onMove: (oldPath: IdShortPath, newPath: IdShortPath) => void;
}

export interface ITableExtendable extends ITrackable {
  addColumn(column: ISubmodelElement, options: AddOptions): void;
  modifyColumn(idShort: string, data: any, options: ModifierVisitorOptions): void;
  deleteColumn(idShort: string, options: DeleteOptions): void;
  addColumnToGroup(groupIdShort: string, column: ISubmodelElement, options: AddOptions): void;
  modifyColumnInGroup(
    groupIdShort: string,
    idShort: string,
    data: any,
    options: ModifierVisitorOptions,
  ): void;
  deleteColumnFromGroup(
    groupIdShort: string,
    idShort: string,
    options: MoveOptions & DeleteOptions,
  ): void;
  moveColumnToGroup(columnIdShort: string, groupIdShort: string, options: MoveOptions): void;
  createGroupFromColumn(columnIdShort: string, group: ISubmodelElement, options: MoveOptions): void;
  reorderColumn(idShortOfColumn: string, groupIdShort: string | undefined, position: number): void;
  addRow(options: AddOptions): void;
  deleteRow(idShort: string, options: DeleteOptions): void;
  getTableElement(): ISubmodelElement;
}

export function parseAsSubmodelElementListOrFail(
  submodelElement: ISubmodelElement,
): SubmodelElementList {
  if (submodelElement instanceof SubmodelElementList) {
    return submodelElement;
  } else {
    throw new ValueError(
      `Cannot create table for submodel element with type ${submodelElement.getSubmodelElementType()}`,
    );
  }
}
