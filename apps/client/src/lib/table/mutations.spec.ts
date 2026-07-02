import { AasSubmodelElements, DataTypeDef } from "@open-dpp/dto";
import { describe, expect, it, vi } from "vitest";
import { HTTPCode } from "../../stores/http-codes.ts";
import {
  addColumnToGroup,
  addRow,
  createColumn,
  deleteColumn,
  deleteColumnFromGroup,
  deleteRow,
  modifyColumnInGroup,
  modifyTopLevelColumn,
  moveColumnToGroup,
  saveRows,
  type TableMutationsDeps,
} from "./mutations.ts";

function makeDeps(aasNamespaceOverrides: Record<string, any>): {
  deps: TableMutationsDeps;
  errorHandlingStore: { logErrorWithNotification: ReturnType<typeof vi.fn> };
} {
  const errorHandlingStore = { logErrorWithNotification: vi.fn() };
  return {
    deps: {
      aasNamespace: aasNamespaceOverrides as any,
      id: "aas-1",
      pathToList: { submodelId: "submodel-1", idShortPath: "List" },
      errorHandlingStore: errorHandlingStore as any,
    },
    errorHandlingStore,
  };
}

const colData = {
  idShort: "Column1",
  modelType: AasSubmodelElements.Property,
  valueType: DataTypeDef.String,
};

describe("createColumn", () => {
  it("calls onSuccess and returns true on the expected status", async () => {
    const onSuccess = vi.fn();
    const { deps, errorHandlingStore } = makeDeps({
      addColumnToSubmodelElementList: vi.fn().mockResolvedValue({
        status: HTTPCode.CREATED,
        data: { idShort: "List" },
      }),
    });
    const result = await createColumn(colData, {}, deps, "error", onSuccess);
    expect(result).toBe(true);
    expect(onSuccess).toHaveBeenCalledWith({ idShort: "List" });
    expect(errorHandlingStore.logErrorWithNotification).not.toHaveBeenCalled();
  });

  it("notifies and returns false on an unexpected status", async () => {
    const onSuccess = vi.fn();
    const { deps, errorHandlingStore } = makeDeps({
      addColumnToSubmodelElementList: vi.fn().mockResolvedValue({ status: HTTPCode.OK, data: {} }),
    });
    const result = await createColumn(colData, {}, deps, "error message", onSuccess);
    expect(result).toBe(false);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(errorHandlingStore.logErrorWithNotification).toHaveBeenCalledWith("error message");
  });

  it("notifies and returns false when the request throws", async () => {
    const onSuccess = vi.fn();
    const error = new Error("network down");
    const { deps, errorHandlingStore } = makeDeps({
      addColumnToSubmodelElementList: vi.fn().mockRejectedValue(error),
    });
    const result = await createColumn(colData, {}, deps, "error message", onSuccess);
    expect(result).toBe(false);
    expect(errorHandlingStore.logErrorWithNotification).toHaveBeenCalledWith(
      "error message",
      error,
    );
  });
});

describe("addColumnToGroup", () => {
  it("passes the groupIdShort through to the API call", async () => {
    const apiCall = vi.fn().mockResolvedValue({ status: HTTPCode.CREATED, data: {} });
    const { deps } = makeDeps({ addColumnToGroupInSubmodelElementList: apiCall });
    await addColumnToGroup("Group1", colData, {}, deps, "error", vi.fn());
    expect(apiCall).toHaveBeenCalledWith(
      "aas-1",
      "submodel-1",
      "List",
      "Group1",
      expect.objectContaining({ idShort: "Column1" }),
      {},
    );
  });
});

describe("modifyTopLevelColumn / modifyColumnInGroup", () => {
  it("expects HTTPCode.OK for a top-level column modification", async () => {
    const onSuccess = vi.fn();
    const { deps } = makeDeps({
      modifyColumnOfSubmodelElementList: vi.fn().mockResolvedValue({
        status: HTTPCode.CREATED,
        data: {},
      }),
    });
    const result = await modifyTopLevelColumn(
      "Column1",
      { idShort: "Column1" },
      deps,
      "error",
      onSuccess,
    );
    expect(result).toBe(false);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("passes groupIdShort and columnIdShort through for a group column modification", async () => {
    const apiCall = vi.fn().mockResolvedValue({ status: HTTPCode.OK, data: {} });
    const { deps } = makeDeps({ modifyColumnInGroupOfSubmodelElementList: apiCall });
    await modifyColumnInGroup("Group1", "Sub1", { idShort: "Sub1" }, deps, "error", vi.fn());
    expect(apiCall).toHaveBeenCalledWith("aas-1", "submodel-1", "List", "Group1", "Sub1", {
      idShort: "Sub1",
    });
  });
});

describe("normalized error handling on delete paths", () => {
  // These three previously no-op'd silently on an unexpected status; now they
  // notify like every other mutation, since they all go through the same helper.
  it("deleteColumn notifies on unexpected status", async () => {
    const { deps, errorHandlingStore } = makeDeps({
      deleteColumnFromSubmodelElementList: vi.fn().mockResolvedValue({ status: 500, data: {} }),
    });
    const result = await deleteColumn("Column1", deps, "remove failed", vi.fn());
    expect(result).toBe(false);
    expect(errorHandlingStore.logErrorWithNotification).toHaveBeenCalledWith("remove failed");
  });

  it("deleteColumnFromGroup notifies on unexpected status", async () => {
    const { deps, errorHandlingStore } = makeDeps({
      deleteColumnFromGroupInSubmodelElementList: vi
        .fn()
        .mockResolvedValue({ status: 500, data: {} }),
    });
    const result = await deleteColumnFromGroup("Group1", "Sub1", deps, "remove failed", vi.fn());
    expect(result).toBe(false);
    expect(errorHandlingStore.logErrorWithNotification).toHaveBeenCalledWith("remove failed");
  });

  it("deleteRow notifies on unexpected status", async () => {
    const { deps, errorHandlingStore } = makeDeps({
      deleteRowFromSubmodelElementList: vi.fn().mockResolvedValue({ status: 500, data: {} }),
    });
    const result = await deleteRow("row0", deps, "remove failed", vi.fn());
    expect(result).toBe(false);
    expect(errorHandlingStore.logErrorWithNotification).toHaveBeenCalledWith("remove failed");
  });
});

describe("moveColumnToGroup", () => {
  it("expects HTTPCode.CREATED", async () => {
    const onSuccess = vi.fn();
    const { deps } = makeDeps({
      moveColumnToGroupInSubmodelElementList: vi.fn().mockResolvedValue({
        status: HTTPCode.CREATED,
        data: { idShort: "List" },
      }),
    });
    const result = await moveColumnToGroup("Column1", "Group1", deps, "error", onSuccess);
    expect(result).toBe(true);
    expect(onSuccess).toHaveBeenCalledWith({ idShort: "List" });
  });
});

describe("addRow", () => {
  it("defaults position to 0 when not provided", async () => {
    const apiCall = vi.fn().mockResolvedValue({ status: HTTPCode.CREATED, data: {} });
    const { deps } = makeDeps({ addRowToSubmodelElementList: apiCall });
    await addRow({}, deps, "error", vi.fn());
    expect(apiCall).toHaveBeenCalledWith("aas-1", "submodel-1", "List", { position: 0 });
  });

  it("passes an explicit position through", async () => {
    const apiCall = vi.fn().mockResolvedValue({ status: HTTPCode.CREATED, data: {} });
    const { deps } = makeDeps({ addRowToSubmodelElementList: apiCall });
    await addRow({ position: 3 }, deps, "error", vi.fn());
    expect(apiCall).toHaveBeenCalledWith("aas-1", "submodel-1", "List", { position: 3 });
  });
});

describe("saveRows", () => {
  it("returns true without needing onSuccess data on HTTPCode.OK", async () => {
    const { deps, errorHandlingStore } = makeDeps({
      modifyValueOfSubmodelElement: vi.fn().mockResolvedValue({ status: HTTPCode.OK, data: {} }),
    });
    const result = await saveRows([{ Column1: "Wood" }] as any, deps, "error");
    expect(result).toBe(true);
    expect(errorHandlingStore.logErrorWithNotification).not.toHaveBeenCalled();
  });

  it("returns false and notifies when the status doesn't match", async () => {
    const { deps, errorHandlingStore } = makeDeps({
      modifyValueOfSubmodelElement: vi.fn().mockResolvedValue({ status: 500, data: {} }),
    });
    const result = await saveRows([{ Column1: "Wood" }] as any, deps, "save failed");
    expect(result).toBe(false);
    expect(errorHandlingStore.logErrorWithNotification).toHaveBeenCalledWith("save failed");
  });
});
