import { ITrackable } from "../../../activity-history/domain/change-tracker";
import { AddOptions, DeleteOptions, ISubmodelElement } from "./submodel-base";
import { ModifierVisitorOptions } from "../modifier-visitor";
import { SubmodelElementList } from "./submodel-element-list";
import { ValueError } from "@open-dpp/exception";

export interface ITableExtendable extends ITrackable {
  addColumn(column: ISubmodelElement, options: AddOptions): void;
  modifyColumn(idShort: string, data: any, options: ModifierVisitorOptions): void;
  deleteColumn(idShort: string, options: DeleteOptions): void;
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
