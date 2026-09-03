import { AasSubmodelElements, KeyTypes } from "@open-dpp/dto";
import { submodelDesignOfProductPlainFactory, submodelPlainToResponse } from "@open-dpp/testing";
import { DOMWrapper, mount } from "@vue/test-utils";
import Button from "primevue/button";
import Card from "primevue/card";
import Column from "primevue/column";
import PrimeVue from "primevue/config";
import Dialog from "primevue/dialog";
import FloatLabel from "primevue/floatlabel";
import Menu from "primevue/menu";
import Tooltip from "primevue/tooltip";
import type { TreeNode } from "primevue/treenode";
import TreeSelect from "primevue/treeselect";
import TreeTable from "primevue/treetable";
import { v4 as uuid4 } from "uuid";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createI18n } from "vue-i18n";
import AasSubmodelTree from "./AasSubmodelTree.vue";

const i18n = createI18n({
  locale: "en",
  legacy: false,
  messages: {
    en: {
      aasEditor: {
        submodel: "Submodels",
        addSubmodel: "Add submodel",
        type: "Type",
      },
      common: {
        add: "Add",
        move: "Move",
        remove: "Remove",
        moveTo: "Move to",
        cancel: "Cancel",
      },
      pagination: {
        footer: "{from} - {to} of {count}",
        footerWithTotal: "{from} - {to} of {total}",
      },
    },
  },
});

function makeActions(
  overrides: Partial<
    Record<"read" | "edit" | "create" | "delete", { visible: boolean; enabled: boolean }>
  > = {},
) {
  return {
    read: { visible: true, enabled: true, tooltip: "View", ...overrides.read },
    edit: { visible: true, enabled: true, tooltip: "Edit", ...overrides.edit },
    create: { visible: true, enabled: true, tooltip: "Add element", ...overrides.create },
    delete: { visible: true, enabled: true, tooltip: "Delete", ...overrides.delete },
  };
}

function makeSubmodelNode(overrides: Partial<TreeNode> = {}): TreeNode {
  return {
    key: "submodel-1",
    data: {
      label: "My Submodel",
      type: "Submodel",
      modelType: KeyTypes.Submodel,
      path: { submodelId: "submodel-1", idShortPathIncludingSubmodel: "MySubmodel" },
      actions: makeActions(),
    },
    ...overrides,
  };
}

function makeElementNode(overrides: Partial<TreeNode> = {}): TreeNode {
  return {
    key: "submodel-1.MyProperty",
    data: {
      label: "My Property",
      type: "Text",
      modelType: AasSubmodelElements.Property,
      path: {
        submodelId: "submodel-1",
        idShortPath: "MyProperty",
        idShortPathIncludingSubmodel: "MySubmodel.MyProperty",
      },
      actions: makeActions(),
    },
    ...overrides,
  };
}

let activeWrapper: ReturnType<typeof mount> | undefined;

// AasMoveDialog teleports into <body>, so a wrapper left mounted from a previous test would leak
// its content into every later document.body query in this file.
afterEach(() => {
  activeWrapper?.unmount();
  activeWrapper = undefined;
});

function mountTree(props: Record<string, unknown> = {}) {
  activeWrapper = mount(AasSubmodelTree, {
    global: {
      plugins: [i18n, PrimeVue],
      components: { Card, TreeTable, Column, Menu, Button, Dialog, FloatLabel, TreeSelect },
      directives: { tooltip: Tooltip },
    },
    props: {
      submodels: [],
      loading: false,
      isArchived: false,
      selectedKeys: undefined,
      selectTreeNode: vi.fn(),
      createSubmodel: vi.fn(),
      deleteSubmodel: vi.fn(),
      deleteSubmodelElement: vi.fn(),
      buildAddSubmodelElementMenu: vi.fn(),
      submodelElementsToAdd: [],
      buildMoveMenu: vi.fn(),
      moveMenuItems: [],
      moveToDialogVisible: false,
      moveToDialogSelected: null,
      moveToDialogSubmodels: [],
      moveToDialogClassify: () => "selectable",
      confirmMoveTo: vi.fn(),
      currentPage: { from: 0, to: 9, itemCount: 0, cursor: null },
      hasPrevious: false,
      hasNext: false,
      resetCursor: vi.fn(),
      previousPage: vi.fn(),
      nextPage: vi.fn(),
      ...props,
    },
  });
  return activeWrapper;
}

describe("AasSubmodelTree", () => {
  it("renders the tree from the submodels prop", () => {
    const wrapper = mountTree({ submodels: [makeSubmodelNode()] });
    expect(wrapper.text()).toContain("My Submodel");
    expect(wrapper.find("#row-submodel-1").exists()).toBe(true);
  });

  it("clicking a row's edit icon calls selectTreeNode with the node key", async () => {
    const selectTreeNode = vi.fn();
    const wrapper = mountTree({ submodels: [makeSubmodelNode()], selectTreeNode });
    await wrapper.find('[aria-label="Edit"]').trigger("click");
    expect(selectTreeNode).toHaveBeenCalledWith("submodel-1");
  });

  it("clicking delete on a Submodel node calls deleteSubmodel with the submodel id", async () => {
    const deleteSubmodel = vi.fn();
    const deleteSubmodelElement = vi.fn();
    const wrapper = mountTree({
      submodels: [makeSubmodelNode()],
      deleteSubmodel,
      deleteSubmodelElement,
    });
    await wrapper.find('[aria-label="Remove"]').trigger("click");
    expect(deleteSubmodel).toHaveBeenCalledWith("submodel-1");
    expect(deleteSubmodelElement).not.toHaveBeenCalled();
  });

  it("clicking delete on a submodel element node calls deleteSubmodelElement with its path", async () => {
    const deleteSubmodel = vi.fn();
    const deleteSubmodelElement = vi.fn();
    const elementNode = makeElementNode();
    const wrapper = mountTree({
      submodels: [elementNode],
      deleteSubmodel,
      deleteSubmodelElement,
    });
    await wrapper.find('[aria-label="Remove"]').trigger("click");
    expect(deleteSubmodelElement).toHaveBeenCalledWith(elementNode.data.path);
    expect(deleteSubmodel).not.toHaveBeenCalled();
  });

  it("clicking the add icon calls buildAddSubmodelElementMenu with the node", async () => {
    const buildAddSubmodelElementMenu = vi.fn();
    const wrapper = mountTree({
      submodels: [makeSubmodelNode()],
      buildAddSubmodelElementMenu,
    });
    await wrapper.find('[aria-label="Add"]').trigger("click");
    expect(buildAddSubmodelElementMenu).toHaveBeenCalledWith(
      expect.objectContaining({ key: "submodel-1" }),
    );
  });

  it("clicking the move icon calls buildMoveMenu with the node", async () => {
    const buildMoveMenu = vi.fn();
    const wrapper = mountTree({ submodels: [makeSubmodelNode()], buildMoveMenu });
    await wrapper.find('[aria-label="Move"]').trigger("click");
    expect(buildMoveMenu).toHaveBeenCalledWith(expect.objectContaining({ key: "submodel-1" }));
  });

  it("pagination controls call the corresponding props", async () => {
    const resetCursor = vi.fn();
    const previousPage = vi.fn();
    const nextPage = vi.fn();
    const wrapper = mountTree({
      submodels: [makeSubmodelNode()],
      hasPrevious: true,
      hasNext: true,
      resetCursor,
      previousPage,
      nextPage,
    });
    await wrapper.get(".pi-home").trigger("click");
    expect(resetCursor).toHaveBeenCalled();
    await wrapper.get(".pi-chevron-left").trigger("click");
    expect(previousPage).toHaveBeenCalled();
    await wrapper.get(".pi-chevron-right").trigger("click");
    expect(nextPage).toHaveBeenCalled();
  });

  it("confirming the move dialog calls confirmMoveTo", async () => {
    const confirmMoveTo = vi.fn();
    const submodel = submodelPlainToResponse(
      submodelDesignOfProductPlainFactory.build(undefined, {
        transient: { iriDomain: `https://open-dpp.de/${uuid4()}` },
      }),
    );
    mountTree({
      submodels: [makeSubmodelNode()],
      moveToDialogVisible: true,
      moveToDialogSelected: { submodelIdShort: submodel.idShort, idShortPath: "" },
      moveToDialogSubmodels: [submodel],
      confirmMoveTo,
    });
    await new Promise((resolve) => setTimeout(resolve));

    // PrimeVue's Dialog teleports its content to <body>, outside the mounted wrapper's own tree.
    const body = new DOMWrapper(document.body);
    const moveButton = body.findAll("button").find((button) => button.text() === "Move");
    expect(moveButton).toBeTruthy();
    await moveButton!.trigger("click");
    expect(confirmMoveTo).toHaveBeenCalled();
  });
});
