import type { AasNamespace } from "@open-dpp/api-client";
import {
  AasSubmodelElements,
  type AccessPermissionRuleResponseDto,
  type AssetAdministrationShellModificationDto,
  DataTypeDef,
  type DataTypeDefType,
  type DeletePolicyDto,
  KeyTypes,
  type KeyTypesType,
} from "@open-dpp/dto";
import type { AasEditorPath, EditorType, OpenDrawerCallback } from "../composables/aas-drawer.ts";
import type { IErrorHandlingStore } from "../stores/error.handling.ts";

export interface SharedEditorProps<Data, RequestDto> {
  path: AasEditorPath;
  data: Data;
  callback: (data: RequestDto) => Promise<void>;
  openDrawer: OpenDrawerCallback<EditorType, "CREATE" | "EDIT">;
  aasNamespace: AasNamespace;
  errorHandlingStore: IErrorHandlingStore;
  id: string;
  translate: (label: string, ...args: unknown[]) => string;
  getAccessPermissionRules: () => AccessPermissionRuleResponseDto[];
  modifyShell: (data: AssetAdministrationShellModificationDto) => Promise<void>;
  deletePolicyBySubjectAndObject: (data: DeletePolicyDto) => Promise<void>;
  isArchived: boolean;
}

export function getVisualType(
  modelType: KeyTypesType,
  valueType: DataTypeDefType | undefined,
  translate: (label: string, ...args: unknown[]) => string,
): string {
  const translatePrefix = "aasEditor";

  if (modelType === KeyTypes.Submodel) {
    return translate(`${translatePrefix}.submodel`);
  }
  if (modelType === AasSubmodelElements.Property && valueType) {
    if (valueType === DataTypeDef.String) {
      return translate(`${translatePrefix}.textField`);
    }
    if (valueType === DataTypeDef.Double) {
      return translate(`${translatePrefix}.numberField`);
    }
    if (valueType === DataTypeDef.Date) {
      return translate(`${translatePrefix}.dateField`);
    }
    if (valueType === DataTypeDef.DateTime) {
      return translate(`${translatePrefix}.dateTimeField`);
    }
  }
  if (modelType === AasSubmodelElements.SubmodelElementList) {
    return translate(`${translatePrefix}.submodelElementList`);
  }
  if (modelType === AasSubmodelElements.ReferenceElement) {
    return translate(`${translatePrefix}.link`);
  }
  if (modelType === AasSubmodelElements.File) {
    return translate(`${translatePrefix}.file`);
  }
  if (modelType === AasSubmodelElements.SubmodelElementCollection) {
    return translate(`${translatePrefix}.submodelElementCollection`);
  }
  return modelType;
}
