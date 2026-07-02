import type { AasNamespace } from "@open-dpp/api-client";
import type {
  SubmodelElementListResponseDto,
  SubmodelElementModificationDto,
  SubmodelElementSharedRequestDto,
  TableModificationParamsDto,
  ValueRequestDto,
} from "@open-dpp/dto";
import { SubmodelElementSchema } from "@open-dpp/dto";
import type { AasEditorPath } from "../../composables/aas-drawer.ts";
import type { IErrorHandlingStore } from "../../stores/error.handling.ts";
import { HTTPCode } from "../../stores/http-codes.ts";
import type { RowMenuOptions } from "./menu.ts";

export interface TableMutationsDeps {
  aasNamespace: AasNamespace;
  id: string;
  pathToList: AasEditorPath;
  errorHandlingStore: IErrorHandlingStore;
}

interface PerformMutationOptions<T> {
  request: () => Promise<{ status: number; data: T }>;
  expectedStatus: number;
  errorMessage: string;
  errorHandlingStore: IErrorHandlingStore;
  onSuccess: (data: T) => void | Promise<void>;
}

/**
 * Collapses the try/catch + expected-status-check boilerplate shared by every
 * table mutation: on success, runs `onSuccess`; on an unexpected status or a
 * thrown error, notifies via `errorHandlingStore`. Every mutation below goes
 * through this uniformly, so none of them can silently no-op on failure.
 */
async function performMutation<T>({
  request,
  expectedStatus,
  errorMessage,
  errorHandlingStore,
  onSuccess,
}: PerformMutationOptions<T>): Promise<boolean> {
  try {
    const response = await request();
    if (response.status === expectedStatus) {
      await onSuccess(response.data);
      return true;
    }
    errorHandlingStore.logErrorWithNotification(errorMessage);
    return false;
  } catch (e) {
    errorHandlingStore.logErrorWithNotification(errorMessage, e);
    return false;
  }
}

export async function createColumn(
  colData: SubmodelElementSharedRequestDto,
  options: TableModificationParamsDto,
  deps: TableMutationsDeps,
  errorMessage: string,
  onSuccess: (data: SubmodelElementListResponseDto) => void | Promise<void>,
): Promise<boolean> {
  const requestBody = SubmodelElementSchema.parse({ ...colData });
  return performMutation({
    request: () =>
      deps.aasNamespace.addColumnToSubmodelElementList(
        deps.id,
        deps.pathToList.submodelId!,
        deps.pathToList.idShortPath!,
        requestBody,
        options,
      ),
    expectedStatus: HTTPCode.CREATED,
    errorMessage,
    errorHandlingStore: deps.errorHandlingStore,
    onSuccess,
  });
}

export async function addColumnToGroup(
  groupIdShort: string,
  colData: SubmodelElementSharedRequestDto,
  options: TableModificationParamsDto,
  deps: TableMutationsDeps,
  errorMessage: string,
  onSuccess: (data: SubmodelElementListResponseDto) => void | Promise<void>,
): Promise<boolean> {
  const requestBody = SubmodelElementSchema.parse({ ...colData });
  return performMutation({
    request: () =>
      deps.aasNamespace.addColumnToGroupInSubmodelElementList(
        deps.id,
        deps.pathToList.submodelId!,
        deps.pathToList.idShortPath!,
        groupIdShort,
        requestBody,
        options,
      ),
    expectedStatus: HTTPCode.CREATED,
    errorMessage,
    errorHandlingStore: deps.errorHandlingStore,
    onSuccess,
  });
}

export async function modifyTopLevelColumn(
  columnIdShort: string,
  formData: SubmodelElementModificationDto,
  deps: TableMutationsDeps,
  errorMessage: string,
  onSuccess: (data: SubmodelElementListResponseDto) => void | Promise<void>,
): Promise<boolean> {
  return performMutation({
    request: () =>
      deps.aasNamespace.modifyColumnOfSubmodelElementList(
        deps.id,
        deps.pathToList.submodelId!,
        deps.pathToList.idShortPath!,
        columnIdShort,
        formData,
      ),
    expectedStatus: HTTPCode.OK,
    errorMessage,
    errorHandlingStore: deps.errorHandlingStore,
    onSuccess,
  });
}

export async function modifyColumnInGroup(
  groupIdShort: string,
  columnIdShort: string,
  formData: SubmodelElementModificationDto,
  deps: TableMutationsDeps,
  errorMessage: string,
  onSuccess: (data: SubmodelElementListResponseDto) => void | Promise<void>,
): Promise<boolean> {
  return performMutation({
    request: () =>
      deps.aasNamespace.modifyColumnInGroupOfSubmodelElementList(
        deps.id,
        deps.pathToList.submodelId!,
        deps.pathToList.idShortPath!,
        groupIdShort,
        columnIdShort,
        formData,
      ),
    expectedStatus: HTTPCode.OK,
    errorMessage,
    errorHandlingStore: deps.errorHandlingStore,
    onSuccess,
  });
}

export async function deleteColumn(
  columnIdShort: string,
  deps: TableMutationsDeps,
  errorMessage: string,
  onSuccess: (data: SubmodelElementListResponseDto) => void | Promise<void>,
): Promise<boolean> {
  return performMutation({
    request: () =>
      deps.aasNamespace.deleteColumnFromSubmodelElementList(
        deps.id,
        deps.pathToList.submodelId!,
        deps.pathToList.idShortPath!,
        columnIdShort,
      ),
    expectedStatus: HTTPCode.OK,
    errorMessage,
    errorHandlingStore: deps.errorHandlingStore,
    onSuccess,
  });
}

export async function deleteColumnFromGroup(
  groupIdShort: string,
  columnIdShort: string,
  deps: TableMutationsDeps,
  errorMessage: string,
  onSuccess: (data: SubmodelElementListResponseDto) => void | Promise<void>,
): Promise<boolean> {
  return performMutation({
    request: () =>
      deps.aasNamespace.deleteColumnFromGroupInSubmodelElementList(
        deps.id,
        deps.pathToList.submodelId!,
        deps.pathToList.idShortPath!,
        groupIdShort,
        columnIdShort,
      ),
    expectedStatus: HTTPCode.OK,
    errorMessage,
    errorHandlingStore: deps.errorHandlingStore,
    onSuccess,
  });
}

export async function moveColumnToGroup(
  columnIdShort: string,
  groupIdShort: string,
  deps: TableMutationsDeps,
  errorMessage: string,
  onSuccess: (data: SubmodelElementListResponseDto) => void | Promise<void>,
): Promise<boolean> {
  return performMutation({
    request: () =>
      deps.aasNamespace.moveColumnToGroupInSubmodelElementList(
        deps.id,
        deps.pathToList.submodelId!,
        deps.pathToList.idShortPath!,
        groupIdShort,
        columnIdShort,
      ),
    expectedStatus: HTTPCode.CREATED,
    errorMessage,
    errorHandlingStore: deps.errorHandlingStore,
    onSuccess,
  });
}

export async function addRow(
  options: RowMenuOptions,
  deps: TableMutationsDeps,
  errorMessage: string,
  onSuccess: (data: SubmodelElementListResponseDto) => void | Promise<void>,
): Promise<boolean> {
  return performMutation({
    request: () =>
      deps.aasNamespace.addRowToSubmodelElementList(
        deps.id,
        deps.pathToList.submodelId!,
        deps.pathToList.idShortPath!,
        { position: options.position ?? 0 },
      ),
    expectedStatus: HTTPCode.CREATED,
    errorMessage,
    errorHandlingStore: deps.errorHandlingStore,
    onSuccess,
  });
}

export async function deleteRow(
  rowIdShort: string,
  deps: TableMutationsDeps,
  errorMessage: string,
  onSuccess: (data: SubmodelElementListResponseDto) => void | Promise<void>,
): Promise<boolean> {
  return performMutation({
    request: () =>
      deps.aasNamespace.deleteRowFromSubmodelElementList(
        deps.id,
        deps.pathToList.submodelId!,
        deps.pathToList.idShortPath!,
        rowIdShort,
      ),
    expectedStatus: HTTPCode.OK,
    errorMessage,
    errorHandlingStore: deps.errorHandlingStore,
    onSuccess,
  });
}

export async function saveRows(
  rowsToSave: ValueRequestDto,
  deps: TableMutationsDeps,
  errorMessage: string,
): Promise<boolean> {
  return performMutation({
    request: () =>
      deps.aasNamespace.modifyValueOfSubmodelElement(
        deps.id,
        deps.pathToList.submodelId!,
        deps.pathToList.idShortPath!,
        rowsToSave,
      ),
    expectedStatus: HTTPCode.OK,
    errorMessage,
    errorHandlingStore: deps.errorHandlingStore,
    onSuccess: () => {},
  });
}
