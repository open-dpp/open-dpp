import {
  AasSubmodelElements,
  type SubmodelElementSharedResponseDto,
  SubmodelElementSharedSchema,
  type SubmodelResponseDto,
} from "@open-dpp/dto";
import { resolveLanguageTexts } from "../composables/language-text.ts";
import type { TreeNode } from "primevue/treenode";
import { z } from "zod";

export interface IdShortPathOption {
  submodelIdShort: string;
  idShortPath: string;
}

export const SCALAR_LEAF_MODEL_TYPES: string[] = [
  AasSubmodelElements.Property,
  AasSubmodelElements.MultiLanguageProperty,
  AasSubmodelElements.ReferenceElement,
  AasSubmodelElements.File,
];
// Both SubmodelElementCollection *and* SubmodelElementList can hold scalar leaves - unlike the
// existing tree composables (submodel-tree.ts, aas-editor.ts), which only recurse into
// SubmodelElementCollection and would silently skip fields nested inside a list/table.
export const CONTAINER_MODEL_TYPES: string[] = [
  AasSubmodelElements.SubmodelElementCollection,
  AasSubmodelElements.SubmodelElementList,
];
/** Sentinel modelType passed to `classify` for the submodel root itself (a Submodel isn't a submodel element, so it has no real modelType). */
export const SUBMODEL_MODEL_TYPE = "Submodel";
const ContainerChildrenSchema = z.object({ value: SubmodelElementSharedSchema.array() });

/** The address of a node: which submodel, and its idShort path within it (empty string for the submodel root itself). */
export interface IdShortPathPointer {
  submodelIdShort: string;
  idShortPath: string;
}

export type IdShortPathNodeVisibility = "hidden" | "visible" | "selectable";

/**
 * Classifies a node during tree construction:
 * - "hidden": the node and everything beneath it are dropped entirely.
 * - "visible": shown for navigation (e.g. to reach a selectable descendant), but can't itself be picked.
 * - "selectable": shown and can be picked.
 *
 * `modelType` is the element's AAS model type, or the `SUBMODEL_MODEL_TYPE` sentinel for the submodel root.
 */
export type ClassifyIdShortPathNode = (
  pointer: IdShortPathPointer,
  modelType: string,
) => IdShortPathNodeVisibility;

/** Everything a node needs from the outside world to decide how to render itself. */
export interface TreeBuildContext {
  classify: ClassifyIdShortPathNode;
  register: (key: string, pointer: IdShortPathPointer) => void;
}

/** What a node wraps: either the submodel root itself, or one real submodel element at a position. */
type IdShortPathNodeSource =
  | { kind: "submodel"; submodelIdShort: string; submodel: SubmodelResponseDto }
  | {
      kind: "element";
      submodelIdShort: string;
      parentIdShortPath: string | undefined;
      element: SubmodelElementSharedResponseDto;
    };

/**
 * A Crockford-style object (factory function returning a frozen record of
 * closures — no `class`, no `this`) wrapping either the submodel root or one
 * submodel element at a position in the tree. It only knows how to address and
 * describe *itself*; `getChildren()` derives descendants on demand by wrapping
 * the source's own nested elements, so nothing needs to be eagerly parsed or
 * stored up front. Unifying the root and element cases here (rather than having
 * the composable special-case the root) means the "is this node visible, and in
 * what shape" decision only has to be written once, inside `toTreeNode`.
 */
export function makeIdShortPathNode(source: IdShortPathNodeSource) {
  const modelType = source.kind === "submodel" ? SUBMODEL_MODEL_TYPE : source.element.modelType;
  const idShort = source.kind === "submodel" ? source.submodel.idShort : source.element.idShort;
  const displayName =
    source.kind === "submodel" ? source.submodel.displayName : source.element.displayName;

  function idShortPathWithoutSubmodel(): string {
    if (source.kind === "submodel") return "";
    return source.parentIdShortPath
      ? `${source.parentIdShortPath}.${source.element.idShort}`
      : source.element.idShort;
  }

  function canHaveChildren(): boolean {
    return source.kind === "submodel" || CONTAINER_MODEL_TYPES.includes(source.element.modelType);
  }

  function getChildren() {
    if (source.kind === "submodel") {
      return source.submodel.submodelElements.map((element) =>
        makeIdShortPathNode({
          kind: "element",
          submodelIdShort: source.submodelIdShort,
          parentIdShortPath: undefined,
          element,
        }),
      );
    }
    if (!canHaveChildren()) return [];
    return ContainerChildrenSchema.parse(source.element).value.map((child) =>
      makeIdShortPathNode({
        kind: "element",
        submodelIdShort: source.submodelIdShort,
        parentIdShortPath: idShortPathWithoutSubmodel(),
        element: child,
      }),
    );
  }

  function toValue(): IdShortPathPointer {
    return { submodelIdShort: source.submodelIdShort, idShortPath: idShortPathWithoutSubmodel() };
  }

  function key(): string {
    const path = idShortPathWithoutSubmodel();
    return path ? `sm:${source.submodelIdShort}:${path}` : `sm:${source.submodelIdShort}`;
  }

  function resolveLabel(locale: string): string {
    return resolveLanguageTexts(displayName, locale, idShort);
  }

  /** Decides whether this node exists in the rendered tree at all, and if so, in what shape. */
  function toTreeNode(ctx: TreeBuildContext, locale: string): TreeNode | null {
    const value = toValue();
    const visibility = ctx.classify(value, modelType);
    if (visibility === "hidden") return null;

    const isSelectable = visibility === "selectable";
    const children = getChildren()
      .map((child) => child.toTreeNode(ctx, locale))
      .filter((n): n is TreeNode => n !== null);
    // Nothing to show: not pickable itself, and no descendant reached selectability either.
    if (!isSelectable && children.length === 0) return null;

    if (isSelectable) ctx.register(key(), value);
    return {
      key: key(),
      label: resolveLabel(locale),
      ...(isSelectable ? {} : { selectable: false }),
      ...(children.length > 0 ? { children } : {}),
    };
  }

  return Object.freeze({
    idShortPath: idShortPathWithoutSubmodel,
    canHaveChildren,
    getChildren,
    key,
    toValue,
    toTreeNode,
  });
}
