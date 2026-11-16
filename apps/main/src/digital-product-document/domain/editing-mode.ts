import { ValueError } from "@open-dpp/exception";
import {
  EditingModeDto,
  EditingModeDtoEnum,
  EditingModeDtoType,
  PassportEditingModeDto,
  PassportEditingModeDtoEnum,
  PassportEditingModeDtoType,
} from "@open-dpp/dto";

export const EditingMode = EditingModeDto;
export const EditingModeEnum = EditingModeDtoEnum;
export type EditingModeType = EditingModeDtoType;

export const PassportEditingMode = PassportEditingModeDto;
export const PassportEditingModeEnum = PassportEditingModeDtoEnum;
export type PassportEditingModeType = PassportEditingModeDtoType;

/** Structure (shells, submodels, elements, columns, ...) may only change in `Full` mode. */
export function assertModeAllowsStructureEdit(mode: EditingModeType, label: string): void {
  if (mode === EditingMode.DataOnly) {
    throw new ValueError(
      `${label} editing is restricted to data; structural changes are not allowed`,
    );
  }
  if (mode === EditingMode.ReadOnly) {
    throw new ValueError(`${label} is read-only; changes are not allowed`);
  }
}

/** Data (values and rows) may change in `Full` and `DataOnly` mode. */
export function assertModeAllowsDataEdit(mode: EditingModeType, label: string): void {
  if (mode === EditingMode.ReadOnly) {
    throw new ValueError(`${label} is read-only; changes are not allowed`);
  }
}
