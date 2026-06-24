import { ITrackable } from "../../../activity-history/domain/change-tracker";
import { AddOptions, DeleteOptions, ISubmodelElement } from "./submodel-base";
import { ModifierVisitorOptions } from "../modifier-visitor";

export interface ITableExtendable extends ITrackable {
  addColumn(column: ISubmodelElement, options: AddOptions): void;
  modifyColumn(idShort: string, data: any, options: ModifierVisitorOptions): void;
  deleteColumn(idShort: string, options: DeleteOptions): void;
  addRow(options: AddOptions): void;
  deleteRow(idShort: string, options: DeleteOptions): void;
  getTableElement(): ISubmodelElement;
}
