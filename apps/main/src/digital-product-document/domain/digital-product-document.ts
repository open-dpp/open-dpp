import { Environment } from "../../aas/domain/environment";
import { DigitalProductDocumentTypesType } from "@open-dpp/dto";
import { EditingModeType } from "./editing-mode";

export interface IDigitalProductDocument {
  id: string;
  getOrganizationId: () => string;
  getEnvironment: () => Environment;
  getType: () => DigitalProductDocumentTypesType;
  /** What may currently be edited; each document type derives it its own way. */
  getEditingMode: () => EditingModeType;
  /** Throws a ValueError unless structure (shells, submodels, elements, columns) is editable. */
  assertStructureEditable: () => void;
  /** Throws a ValueError unless data (values, rows) is editable. */
  assertDataEditable: () => void;
}
