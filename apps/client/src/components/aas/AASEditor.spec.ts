/**
 * AASEditor – focused unit tests for the new drawer-tab computed logic.
 *
 * Full mount of AASEditor is intentionally avoided because it depends on a
 * large tree (router, pinia, API client, aas-editor composable, PrimeVue,
 * i18n…).  The new logic (isLeafEditor / showPresentationTab / showSaveButton)
 * is pure and can be tested by replaying the `openDrawer` calls against the
 * `useAasDrawer` composable, then computing the derived values.
 *
 * For the UI rendering of drawer tabs (data-cy="drawer-tab-data" /
 * data-cy="drawer-tab-presentation") the coverage is provided by manual
 * verification in Task 15 (E2E).
 */

import { DataTypeDef, KeyTypes, PropertyJsonSchema } from "@open-dpp/dto";
import {
  propertyInputPlainFactory,
  submodelDesignOfProductPlainFactory,
  submodelPlainToResponse,
} from "@open-dpp/testing";
import { v4 as uuid4 } from "uuid";
import { computed, ref } from "vue";
import { describe, expect, it, vi } from "vitest";
import { EditorMode, useAasDrawer } from "../../composables/aas-drawer.ts";

// ---------------------------------------------------------------------------
// The entire import chain for aas-drawer → component .vue files → i18n.ts →
// const.ts has a top-level await that fails in jsdom because VITE_API_ROOT is
// undefined and /config.json is not reachable.
//
// Strategy: mock src/const.ts at the root level so nothing downstream needs it.
// ---------------------------------------------------------------------------
vi.mock("../../const.ts", () => ({
  API_URL: "http://localhost:3000/api",
  MARKETPLACE_URL: "http://localhost:3000/api",
  VIEW_ROOT_URL: "http://localhost:3000",
  MEDIA_SERVICE_URL: "http://localhost:3000/api",
  AGENT_SERVER_URL: "http://localhost:3000/api",
  ANALYTICS_URL: "http://localhost:3000/api",
  AGENT_WEBSOCKET_URL: "http://localhost:3000",
  LAST_SELECTED_ORGANIZATION_ID_KEY: "open-dpp-local-last-selected-organization-id",
  LAST_SELECTED_LANGUAGE: "open-dpp-local-last-language",
  AI_INTEGRATION_ID: "ai-integration",
}));

// Also mock stores and api-client to avoid side-effects from store initialisation.
vi.mock("../../lib/api-client", () => ({ default: {} }));
vi.mock("../../stores/user.ts", () => ({
  useUserStore: () => ({ asSubject: vi.fn().mockReturnValue({ id: "user-1" }) }),
}));
vi.mock("../../stores/media.ts", () => ({
  useMediaStore: () => ({ fetchMedia: vi.fn() }),
}));

// ---------------------------------------------------------------------------
// After mocking const.ts the real .vue components can be imported, but they
// are heavy (PrimeVue, forms, etc.).  Use simple stubs via vi.hoisted() so
// the identity comparisons in LEAF_EDITOR_COMPONENTS still work.
// ---------------------------------------------------------------------------
const {
  StubPropertyEditor,
  StubPropertyCreateEditor,
  StubFileEditor,
  StubFileCreateEditor,
  StubReferenceElementEditor,
  StubReferenceElementCreateEditor,
} = vi.hoisted(() => ({
  StubPropertyEditor: { name: "PropertyEditor" },
  StubPropertyCreateEditor: { name: "PropertyCreateEditor" },
  StubFileEditor: { name: "FileEditor" },
  StubFileCreateEditor: { name: "FileCreateEditor" },
  StubReferenceElementEditor: { name: "ReferenceElementEditor" },
  StubReferenceElementCreateEditor: { name: "ReferenceElementCreateEditor" },
}));

// Mock editor component .vue files — paths relative to THIS spec file
// (src/components/aas/AASEditor.spec.ts), which is the same directory as the
// editors. vitest resolves vi.mock paths relative to the calling file.
vi.mock("./PropertyEditor.vue", () => ({ default: StubPropertyEditor }));
vi.mock("./PropertyCreateEditor.vue", () => ({ default: StubPropertyCreateEditor }));
vi.mock("./FileEditor.vue", () => ({ default: StubFileEditor }));
vi.mock("./FileCreateEditor.vue", () => ({ default: StubFileCreateEditor }));
vi.mock("./ReferenceElementEditor.vue", () => ({ default: StubReferenceElementEditor }));
vi.mock("./ReferenceElementCreateEditor.vue", () => ({ default: StubReferenceElementCreateEditor }));
vi.mock("./SubmodelEditor.vue", () => ({ default: { name: "SubmodelEditor" } }));
vi.mock("./SubmodelCreateEditor.vue", () => ({ default: { name: "SubmodelCreateEditor" } }));
vi.mock("./SubmodelElementCollectionEditor.vue", () => ({
  default: { name: "SubmodelElementCollectionEditor" },
}));
vi.mock("./SubmodelElementCollectionCreateEditor.vue", () => ({
  default: { name: "SubmodelElementCollectionCreateEditor" },
}));
vi.mock("./SubmodelElementListEditor.vue", () => ({
  default: { name: "SubmodelElementListEditor" },
}));
vi.mock("./SubmodelElementListCreateEditor.vue", () => ({
  default: { name: "SubmodelElementListCreateEditor" },
}));
vi.mock("./ColumnEditor.vue", () => ({ default: { name: "ColumnEditor" } }));
vi.mock("./ColumnCreateEditor.vue", () => ({ default: { name: "ColumnCreateEditor" } }));
vi.mock("./AssetAdministrationShellEditor.vue", () => ({
  default: { name: "AssetAdministrationShellEditor" },
}));

// ---------------------------------------------------------------------------
// LEAF_EDITOR_COMPONENTS mirrors AASEditor.vue, using same stub references.
// ---------------------------------------------------------------------------
const LEAF_EDITOR_COMPONENTS = [
  StubPropertyEditor,
  StubPropertyCreateEditor,
  StubFileEditor,
  StubFileCreateEditor,
  StubReferenceElementEditor,
  StubReferenceElementCreateEditor,
];

// ---------------------------------------------------------------------------
// Reusable computed factory — mirrors the derived-state logic in AASEditor.vue.
// ---------------------------------------------------------------------------
function makeComputeds(
  editorVNode: ReturnType<typeof useAasDrawer>["editorVNode"],
  saveButtonIsVisible: ReturnType<typeof useAasDrawer>["saveButtonIsVisible"],
  activeDrawerTab: ReturnType<typeof ref<"data" | "presentation">>,
) {
  const isLeafEditor = computed(() => {
    if (!editorVNode.value) return false;
    return LEAF_EDITOR_COMPONENTS.includes(editorVNode.value.component as any);
  });

  const showPresentationTab = computed(() => {
    if (!isLeafEditor.value) return false;
    return Boolean(editorVNode.value?.props?.path?.idShortPathIncludingSubmodel);
  });

  const isOnDataTab = computed(() => activeDrawerTab.value === "data");
  const showSaveButton = computed(
    () => saveButtonIsVisible.value && (!showPresentationTab.value || isOnDataTab.value),
  );

  return { isLeafEditor, showPresentationTab, isOnDataTab, showSaveButton };
}

describe("AASEditor – drawer-tab computed logic", () => {
  const iriDomain = `https://open-dpp.de/${uuid4()}`;
  const onHideDrawer = vi.fn();
  const can = vi.fn().mockReturnValue(true);

  // -----------------------------------------------------------------------
  // isLeafEditor
  // -----------------------------------------------------------------------
  it("isLeafEditor is true when a PropertyEditor is the active editor", () => {
    const data = PropertyJsonSchema.parse(propertyInputPlainFactory.build());
    const drawer = useAasDrawer({ onHideDrawer, can });
    drawer.openDrawer({
      type: KeyTypes.Property,
      data,
      title: "Edit property",
      mode: EditorMode.EDIT,
      path: {
        submodelId: "s1",
        idShortPath: data.idShort,
        idShortPathIncludingSubmodel: `sm.${data.idShort}`,
      },
    });

    const activeDrawerTab = ref<"data" | "presentation">("data");
    const { isLeafEditor } = makeComputeds(
      drawer.editorVNode,
      drawer.saveButtonIsVisible,
      activeDrawerTab,
    );
    expect(isLeafEditor.value).toBe(true);
  });

  it("isLeafEditor is false when a SubmodelEditor is the active editor", () => {
    const submodel = submodelPlainToResponse(
      submodelDesignOfProductPlainFactory.build(undefined, { transient: { iriDomain } }),
    );
    const drawer = useAasDrawer({ onHideDrawer, can });
    drawer.openDrawer({
      type: KeyTypes.Submodel,
      data: submodel,
      title: "Edit section",
      mode: EditorMode.EDIT,
      path: { submodelId: submodel.id, idShortPath: submodel.idShort },
    });

    const activeDrawerTab = ref<"data" | "presentation">("data");
    const { isLeafEditor } = makeComputeds(
      drawer.editorVNode,
      drawer.saveButtonIsVisible,
      activeDrawerTab,
    );
    expect(isLeafEditor.value).toBe(false);
  });

  // -----------------------------------------------------------------------
  // showPresentationTab
  // -----------------------------------------------------------------------
  it("showPresentationTab is true for Property in EDIT mode with idShortPathIncludingSubmodel", () => {
    const data = PropertyJsonSchema.parse(propertyInputPlainFactory.build());
    const drawer = useAasDrawer({ onHideDrawer, can });
    drawer.openDrawer({
      type: KeyTypes.Property,
      data,
      title: "Edit property",
      mode: EditorMode.EDIT,
      path: {
        submodelId: "s1",
        idShortPath: data.idShort,
        idShortPathIncludingSubmodel: `sm.${data.idShort}`,
      },
    });

    const activeDrawerTab = ref<"data" | "presentation">("data");
    const { showPresentationTab } = makeComputeds(
      drawer.editorVNode,
      drawer.saveButtonIsVisible,
      activeDrawerTab,
    );
    expect(showPresentationTab.value).toBe(true);
  });

  it("showPresentationTab is false for Property in CREATE mode (no idShortPathIncludingSubmodel)", () => {
    const drawer = useAasDrawer({ onHideDrawer, can });
    drawer.openDrawer({
      type: KeyTypes.Property,
      data: { valueType: DataTypeDef.String },
      title: "Create property",
      mode: EditorMode.CREATE,
      path: {},
    });

    const activeDrawerTab = ref<"data" | "presentation">("data");
    const { showPresentationTab } = makeComputeds(
      drawer.editorVNode,
      drawer.saveButtonIsVisible,
      activeDrawerTab,
    );
    expect(showPresentationTab.value).toBe(false);
  });

  it("showPresentationTab is false for Submodel editor (non-leaf container)", () => {
    const submodel = submodelPlainToResponse(
      submodelDesignOfProductPlainFactory.build(undefined, { transient: { iriDomain } }),
    );
    const drawer = useAasDrawer({ onHideDrawer, can });
    drawer.openDrawer({
      type: KeyTypes.Submodel,
      data: submodel,
      title: "Edit section",
      mode: EditorMode.EDIT,
      path: {
        submodelId: submodel.id,
        idShortPath: submodel.idShort,
        idShortPathIncludingSubmodel: submodel.idShort,
      },
    });

    const activeDrawerTab = ref<"data" | "presentation">("data");
    const { showPresentationTab } = makeComputeds(
      drawer.editorVNode,
      drawer.saveButtonIsVisible,
      activeDrawerTab,
    );
    expect(showPresentationTab.value).toBe(false);
  });

  // -----------------------------------------------------------------------
  // showSaveButton
  // -----------------------------------------------------------------------
  it("showSaveButton is true on Data tab for leaf editor in EDIT mode", () => {
    const data = PropertyJsonSchema.parse(propertyInputPlainFactory.build());
    const drawer = useAasDrawer({ onHideDrawer, can });
    drawer.openDrawer({
      type: KeyTypes.Property,
      data,
      title: "Edit property",
      mode: EditorMode.EDIT,
      path: {
        submodelId: "s1",
        idShortPath: data.idShort,
        idShortPathIncludingSubmodel: `sm.${data.idShort}`,
      },
    });

    const activeDrawerTab = ref<"data" | "presentation">("data");
    const { showSaveButton } = makeComputeds(
      drawer.editorVNode,
      drawer.saveButtonIsVisible,
      activeDrawerTab,
    );
    expect(showSaveButton.value).toBe(true);
  });

  it("showSaveButton is false on Presentation tab for leaf editor", () => {
    const data = PropertyJsonSchema.parse(propertyInputPlainFactory.build());
    const drawer = useAasDrawer({ onHideDrawer, can });
    drawer.openDrawer({
      type: KeyTypes.Property,
      data,
      title: "Edit property",
      mode: EditorMode.EDIT,
      path: {
        submodelId: "s1",
        idShortPath: data.idShort,
        idShortPathIncludingSubmodel: `sm.${data.idShort}`,
      },
    });

    const activeDrawerTab = ref<"data" | "presentation">("presentation");
    const { showSaveButton } = makeComputeds(
      drawer.editorVNode,
      drawer.saveButtonIsVisible,
      activeDrawerTab,
    );
    expect(showSaveButton.value).toBe(false);
  });

  it("showSaveButton is true for non-leaf editors even when activeDrawerTab is presentation", () => {
    const submodel = submodelPlainToResponse(
      submodelDesignOfProductPlainFactory.build(undefined, { transient: { iriDomain } }),
    );
    const drawer = useAasDrawer({ onHideDrawer, can });
    drawer.openDrawer({
      type: KeyTypes.Submodel,
      data: submodel,
      title: "Edit section",
      mode: EditorMode.EDIT,
      path: {
        submodelId: submodel.id,
        idShortPath: submodel.idShort,
        idShortPathIncludingSubmodel: submodel.idShort,
      },
    });

    // Containers have no Presentation tab → showSaveButton only depends on saveButtonIsVisible
    const activeDrawerTab = ref<"data" | "presentation">("presentation");
    const { showSaveButton } = makeComputeds(
      drawer.editorVNode,
      drawer.saveButtonIsVisible,
      activeDrawerTab,
    );
    expect(showSaveButton.value).toBe(true);
  });
});
