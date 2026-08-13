import type { SubmodelResponseDto } from "@open-dpp/dto";
import { AasSubmodelElements } from "@open-dpp/dto";
import { type MaybeRefOrGetter, type Ref, ref, shallowRef, toValue } from "vue";
import type { IErrorHandlingStore } from "../stores/error.handling.ts";
import type { AasEditorPath } from "./aas-drawer.ts";
import { classifyByModelType } from "./id-short-path-select-tree.ts";
import {
  type IdShortPathNodeVisibility,
  type IdShortPathPointer,
  SUBMODEL_MODEL_TYPE,
} from "../lib/id-short-path-select.ts";

export interface UseAasMoveDialogProps {
  /** All submodels currently loaded, e.g. the current page of `useAasEditor`'s
   * `rawSubmodels` — the dialog only ever needs the one the moved element
   * belongs to, resolved by id when it opens. */
  rawSubmodels: MaybeRefOrGetter<SubmodelResponseDto[]>;
  errorHandlingStore: IErrorHandlingStore;
  translate: (label: string, ...args: unknown[]) => string;
  /** Performs the actual reparent call and refresh; owned by the caller since
   * it's shared with the up/down move-menu, not dialog-specific. */
  moveSubmodelElementTo: (
    path: AasEditorPath,
    options: { position?: number; targetParentIdShortPath?: string | null },
  ) => Promise<void>;
}

export interface IAasMoveDialog {
  moveToDialogVisible: Ref<boolean>;
  moveToDialogSubmodels: Ref<SubmodelResponseDto[]>;
  moveToDialogSelected: Ref<IdShortPathPointer | null>;
  moveToDialogClassify: (
    pointer: IdShortPathPointer,
    modelType: string,
  ) => IdShortPathNodeVisibility;
  openMoveToDialog: (path: AasEditorPath) => void;
  confirmMoveTo: () => Promise<void>;
}

export function useAasMoveDialog(props: UseAasMoveDialogProps): IAasMoveDialog {
  const moveToDialogVisible = ref(false);
  const moveToDialogSubmodels = shallowRef<SubmodelResponseDto[]>([]);
  const moveToDialogSelected = ref<IdShortPathPointer | null>(null);
  const moveToDialogSourcePath = ref<AasEditorPath | undefined>(undefined);
  const moveToDialogSourcePointer = ref<IdShortPathPointer | undefined>(undefined);

  /** The "Move to..." picker only ever offers containers within the element's
   * own Submodel — moveSubmodelElement is scoped to a single Submodel, so
   * cross-submodel targets would always be rejected server-side. */
  function openMoveToDialog(path: AasEditorPath) {
    const submodel = toValue(props.rawSubmodels).find((s) => s.id === path.submodelId);
    if (!submodel || !path.idShortPath) {
      props.errorHandlingStore.logErrorWithNotification(props.translate("common.errorOccurred"));
      return;
    }
    moveToDialogSourcePath.value = path;
    moveToDialogSourcePointer.value = {
      submodelIdShort: submodel.idShort,
      idShortPath: path.idShortPath,
    };
    moveToDialogSubmodels.value = [submodel];
    moveToDialogSelected.value = null;
    moveToDialogVisible.value = true;
  }

  function moveToDialogClassify(
    pointer: IdShortPathPointer,
    modelType: string,
  ): IdShortPathNodeVisibility {
    const source = moveToDialogSourcePointer.value;
    const isOwnSubtree =
      !!source &&
      pointer.submodelIdShort === source.submodelIdShort &&
      (pointer.idShortPath === source.idShortPath ||
        pointer.idShortPath.startsWith(`${source.idShortPath}.`));
    if (isOwnSubtree) return "hidden";
    // A table (SubmodelElementList), and everything inside it — rows, nested
    // groups, all of it — is never a valid move target; the backend rejects
    // the whole subtree. Hiding the table itself is enough: `toTreeNode` never
    // recurses into a hidden node, so its rows (which are otherwise
    // indistinguishable from a regular SubmodelElementCollection by modelType
    // alone) never get built as candidate nodes in the first place.
    return classifyByModelType({
      selectable: [AasSubmodelElements.SubmodelElementCollection, SUBMODEL_MODEL_TYPE],
      hidden: [AasSubmodelElements.SubmodelElementList],
    })(pointer, modelType);
  }

  async function confirmMoveTo() {
    const path = moveToDialogSourcePath.value;
    const target = moveToDialogSelected.value;
    if (!path || !target) return;
    // The picker's own "" sentinel for the Submodel root (see
    // id-short-path-select.ts) is translated to the wire's `null` here, right
    // at the API boundary — the rest of the picker stack keeps using "".
    await props.moveSubmodelElementTo(path, {
      targetParentIdShortPath: target.idShortPath === "" ? null : target.idShortPath,
    });
    moveToDialogVisible.value = false;
  }

  return {
    moveToDialogVisible,
    moveToDialogSubmodels,
    moveToDialogSelected,
    moveToDialogClassify,
    openMoveToDialog,
    confirmMoveTo,
  };
}
