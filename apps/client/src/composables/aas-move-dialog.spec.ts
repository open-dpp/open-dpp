import type { SubmodelElementSharedResponseDto, SubmodelResponseDto } from "@open-dpp/dto";
import { describe, expect, it, vi } from "vitest";
import { useAasMoveDialog } from "./aas-move-dialog.ts";
import { generatedErrorHandlingStoreMock } from "../testing-utils/error-handling-store-mock.ts";

function property(idShort: string): SubmodelElementSharedResponseDto {
  return {
    idShort,
    modelType: "Property",
    displayName: [],
  } as unknown as SubmodelElementSharedResponseDto;
}

function collection(
  idShort: string,
  value: SubmodelElementSharedResponseDto[],
): SubmodelElementSharedResponseDto {
  return {
    idShort,
    modelType: "SubmodelElementCollection",
    displayName: [],
    value,
  } as unknown as SubmodelElementSharedResponseDto;
}

function submodel(
  id: string,
  idShort: string,
  submodelElements: SubmodelElementSharedResponseDto[],
): SubmodelResponseDto {
  return {
    id,
    idShort,
    displayName: [],
    submodelElements,
  } as unknown as SubmodelResponseDto;
}

const translate = (key: string) => key;

const submodel1 = submodel("submodel-1-id", "DesignOfProduct", [
  collection("Design_V01", [
    collection("Author", [property("AuthorName")]),
    collection("AdditionalInformation", []),
  ]),
]);
const submodel2 = submodel("submodel-2-id", "CarbonFootprint", []);

function makeDeps(moveSubmodelElementTo = vi.fn().mockResolvedValue(undefined)) {
  const errorHandlingStore = generatedErrorHandlingStoreMock();
  return { errorHandlingStore, moveSubmodelElementTo };
}

describe("useAasMoveDialog", () => {
  it("opens the dialog scoped to the moved element's own submodel", () => {
    const { errorHandlingStore, moveSubmodelElementTo } = makeDeps();
    const moveDialog = useAasMoveDialog({
      rawSubmodels: [submodel1, submodel2],
      errorHandlingStore,
      translate,
      moveSubmodelElementTo,
    });

    expect(moveDialog.moveToDialogVisible.value).toBe(false);
    moveDialog.openMoveToDialog({
      submodelId: submodel1.id,
      idShortPath: "Design_V01.Author",
      idShortPathIncludingSubmodel: "DesignOfProduct.Design_V01.Author",
    });

    expect(moveDialog.moveToDialogVisible.value).toBe(true);
    // Only the moved element's own submodel is offered — moveSubmodelElement
    // is scoped to a single Submodel, so submodel2 would never be a valid target.
    expect(moveDialog.moveToDialogSubmodels.value.map((s) => s.id)).toEqual([submodel1.id]);
    expect(moveDialog.moveToDialogSelected.value).toBeNull();
  });

  it("logs an error and does not open when the submodel or idShortPath can't be resolved", () => {
    const { errorHandlingStore, moveSubmodelElementTo } = makeDeps();
    const moveDialog = useAasMoveDialog({
      rawSubmodels: [submodel1],
      errorHandlingStore,
      translate,
      moveSubmodelElementTo,
    });

    moveDialog.openMoveToDialog({ submodelId: "unknown-submodel", idShortPath: "Foo" });

    expect(moveDialog.moveToDialogVisible.value).toBe(false);
    expect(errorHandlingStore.logErrorWithNotification).toHaveBeenCalledWith(
      "common.errorOccurred",
    );
  });

  it("classify hides the moved element's own subtree and any table, but keeps siblings/root selectable", () => {
    const { errorHandlingStore, moveSubmodelElementTo } = makeDeps();
    const moveDialog = useAasMoveDialog({
      rawSubmodels: [submodel1],
      errorHandlingStore,
      translate,
      moveSubmodelElementTo,
    });
    moveDialog.openMoveToDialog({
      submodelId: submodel1.id,
      idShortPath: "Design_V01.Author",
      idShortPathIncludingSubmodel: "DesignOfProduct.Design_V01.Author",
    });

    // The moved element's own subtree is hidden as a target...
    expect(
      moveDialog.moveToDialogClassify(
        { submodelIdShort: submodel1.idShort, idShortPath: "Design_V01.Author" },
        "SubmodelElementCollection",
      ),
    ).toBe("hidden");
    expect(
      moveDialog.moveToDialogClassify(
        { submodelIdShort: submodel1.idShort, idShortPath: "Design_V01.Author.AuthorName" },
        "Property",
      ),
    ).toBe("hidden");
    // ...but a sibling container and the submodel root remain valid targets.
    expect(
      moveDialog.moveToDialogClassify(
        { submodelIdShort: submodel1.idShort, idShortPath: "Design_V01.AdditionalInformation" },
        "SubmodelElementCollection",
      ),
    ).toBe("selectable");
    expect(
      moveDialog.moveToDialogClassify(
        { submodelIdShort: submodel1.idShort, idShortPath: "" },
        "Submodel",
      ),
    ).toBe("selectable");
    // A table, and everything inside it (rows, nested groups), is never a
    // valid move target — hiding the table itself is what keeps its rows
    // (which are otherwise indistinguishable from a regular
    // SubmodelElementCollection by modelType alone) from ever being built
    // as candidate nodes, since a hidden node's children are never visited.
    expect(
      moveDialog.moveToDialogClassify(
        { submodelIdShort: submodel1.idShort, idShortPath: "Design_V01.SomeTable" },
        "SubmodelElementList",
      ),
    ).toBe("hidden");
  });

  it("confirmMoveTo calls moveSubmodelElementTo with the selected target and closes the dialog", async () => {
    const moveSubmodelElementTo = vi.fn().mockResolvedValue(undefined);
    const { errorHandlingStore } = makeDeps(moveSubmodelElementTo);
    const moveDialog = useAasMoveDialog({
      rawSubmodels: [submodel1],
      errorHandlingStore,
      translate,
      moveSubmodelElementTo,
    });
    const path = {
      submodelId: submodel1.id,
      idShortPath: "Design_V01.Author",
      idShortPathIncludingSubmodel: "DesignOfProduct.Design_V01.Author",
    };
    moveDialog.openMoveToDialog(path);
    moveDialog.moveToDialogSelected.value = {
      submodelIdShort: submodel1.idShort,
      idShortPath: "Design_V01.AdditionalInformation",
    };

    await moveDialog.confirmMoveTo();

    expect(moveSubmodelElementTo).toHaveBeenCalledWith(path, {
      targetParentIdShortPath: "Design_V01.AdditionalInformation",
    });
    expect(moveDialog.moveToDialogVisible.value).toBe(false);
  });

  it('confirmMoveTo translates the picker\'s root sentinel ("") to null on the wire', async () => {
    const moveSubmodelElementTo = vi.fn().mockResolvedValue(undefined);
    const { errorHandlingStore } = makeDeps(moveSubmodelElementTo);
    const moveDialog = useAasMoveDialog({
      rawSubmodels: [submodel1],
      errorHandlingStore,
      translate,
      moveSubmodelElementTo,
    });
    const path = {
      submodelId: submodel1.id,
      idShortPath: "Design_V01.Author",
      idShortPathIncludingSubmodel: "DesignOfProduct.Design_V01.Author",
    };
    moveDialog.openMoveToDialog(path);
    moveDialog.moveToDialogSelected.value = { submodelIdShort: submodel1.idShort, idShortPath: "" };

    await moveDialog.confirmMoveTo();

    expect(moveSubmodelElementTo).toHaveBeenCalledWith(path, { targetParentIdShortPath: null });
    expect(moveDialog.moveToDialogVisible.value).toBe(false);
  });

  it("confirmMoveTo is a no-op when nothing is selected", async () => {
    const moveSubmodelElementTo = vi.fn().mockResolvedValue(undefined);
    const { errorHandlingStore } = makeDeps(moveSubmodelElementTo);
    const moveDialog = useAasMoveDialog({
      rawSubmodels: [submodel1],
      errorHandlingStore,
      translate,
      moveSubmodelElementTo,
    });
    moveDialog.openMoveToDialog({
      submodelId: submodel1.id,
      idShortPath: "Design_V01.Author",
      idShortPathIncludingSubmodel: "DesignOfProduct.Design_V01.Author",
    });

    await moveDialog.confirmMoveTo();

    expect(moveSubmodelElementTo).not.toHaveBeenCalled();
    expect(moveDialog.moveToDialogVisible.value).toBe(true);
  });
});
