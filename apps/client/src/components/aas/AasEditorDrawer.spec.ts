import { DataTypeDef } from "@open-dpp/dto";
import { mount } from "@vue/test-utils";
import Button from "primevue/button";
import PrimeVue from "primevue/config";
import Drawer from "primevue/drawer";
import Tab from "primevue/tab";
import TabList from "primevue/tablist";
import TabPanel from "primevue/tabpanel";
import TabPanels from "primevue/tabpanels";
import Tabs from "primevue/tabs";
import { defineComponent, h, markRaw } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createI18n } from "vue-i18n";
import { DigitalProductDocumentType } from "../../lib/digital-product-document.ts";
import AasEditorDrawer, { type AasEditorContext } from "./AasEditorDrawer.vue";
import PropertyEditor from "./PropertyEditor.vue";
import SubmodelElementCollectionEditor from "./SubmodelElementCollectionEditor.vue";
import SubmodelElementListCreateEditor from "./SubmodelElementListCreateEditor.vue";

const { submitSpy } = vi.hoisted(() => ({ submitSpy: vi.fn().mockResolvedValue(undefined) }));

vi.mock("../../stores/user.ts", () => ({
  useUserStore: () => ({ asSubject: vi.fn().mockReturnValue({ id: "user-1" }) }),
}));

function stub(name: string, expose?: Record<string, unknown>) {
  return defineComponent({
    name,
    setup(_, ctx) {
      if (expose) ctx.expose(expose);
      return () => h("div", { "data-cy": `stub-${name}` });
    },
  });
}

vi.mock("./PropertyEditor.vue", () => ({
  default: stub("PropertyEditor", { submit: submitSpy }),
}));
vi.mock("./FileEditor.vue", () => ({ default: stub("FileEditor") }));
vi.mock("./SubmodelEditor.vue", () => ({ default: stub("SubmodelEditor") }));
vi.mock("./SubmodelElementCollectionEditor.vue", () => ({
  default: stub("SubmodelElementCollectionEditor"),
}));
vi.mock("./SubmodelElementListEditor.vue", () => ({
  default: stub("SubmodelElementListEditor"),
}));
vi.mock("./SubmodelElementListCreateEditor.vue", () => ({
  default: stub("SubmodelElementListCreateEditor"),
}));
vi.mock("../activity-history/EditorActivityHistory.vue", () => ({
  default: stub("EditorActivityHistory"),
}));
vi.mock("./presentation/ElementPresentationPanel.vue", () => ({
  default: stub("ElementPresentationPanel"),
}));

const i18n = createI18n({
  locale: "en",
  legacy: false,
  messages: {
    en: {
      aasEditor: {
        drawerTabs: { data: "Data", presentation: "Presentation" },
        table: { saveAndAddEntries: "Save and add entries" },
      },
      activityHistory: { label: "Activity history" },
      common: { save: "Save" },
    },
  },
});

function makeEditorContext(overrides: Partial<AasEditorContext> = {}): AasEditorContext {
  return {
    id: "shell-1",
    aasNamespace: {} as any,
    errorHandlingStore: { logErrorWithNotification: vi.fn() },
    isArchived: false,
    type: DigitalProductDocumentType.Passport,
    openDrawer: vi.fn(),
    getAccessPermissionRules: vi.fn().mockReturnValue([]),
    modifyShell: vi.fn(),
    deletePolicyBySubjectAndObject: vi.fn(),
    ...overrides,
  };
}

let activeWrapper: ReturnType<typeof mount> | undefined;

// Drawer teleports into <body>, so a wrapper left mounted from a previous test would leak its
// tabs/buttons into every later document.body query in this file.
afterEach(() => {
  activeWrapper?.unmount();
  activeWrapper = undefined;
});

function mountDrawer(props: Record<string, unknown> = {}) {
  activeWrapper = mount(AasEditorDrawer, {
    global: {
      plugins: [i18n, PrimeVue],
      components: { Drawer, Tabs, TabList, Tab, TabPanels, TabPanel, Button },
    },
    props: {
      visible: true,
      editorVNode: null,
      drawerHeader: "",
      saveButtonIsVisible: false,
      hideDrawer: vi.fn(),
      editorContext: makeEditorContext(),
      ...props,
    },
  });
  return activeWrapper;
}

// PrimeVue's Drawer teleports its content to <body>, outside the mounted wrapper's own tree.
function body() {
  return document.body;
}

describe("AasEditorDrawer", () => {
  it("shows the drawerHeader on the Data tab when visible", async () => {
    mountDrawer({
      drawerHeader: "Edit property",
      editorVNode: {
        component: markRaw(PropertyEditor),
        props: { path: { idShortPathIncludingSubmodel: "sm.MyProp" }, data: {}, callback: null },
      },
    });
    await new Promise((resolve) => setTimeout(resolve));
    expect(body().textContent).toContain("Edit property");
    expect(body().querySelector('[data-cy="drawer-tab-data"]')).toBeTruthy();
    expect(body().querySelector('[data-cy="stub-PropertyEditor"]')).toBeTruthy();
  });

  it("shows the presentation tab only for a numeric Property editor with a full path", async () => {
    mountDrawer({
      editorVNode: {
        component: markRaw(PropertyEditor),
        props: {
          path: { idShortPathIncludingSubmodel: "sm.MyProp" },
          data: { valueType: DataTypeDef.Double },
          callback: null,
        },
      },
    });
    await new Promise((resolve) => setTimeout(resolve));
    expect(body().querySelector('[data-cy="drawer-tab-presentation"]')).toBeTruthy();
  });

  it("hides the presentation tab for a non-numeric Property editor", async () => {
    mountDrawer({
      editorVNode: {
        component: markRaw(PropertyEditor),
        props: {
          path: { idShortPathIncludingSubmodel: "sm.MyProp" },
          data: { valueType: DataTypeDef.String },
          callback: null,
        },
      },
    });
    await new Promise((resolve) => setTimeout(resolve));
    expect(body().querySelector('[data-cy="drawer-tab-presentation"]')).toBeFalsy();
  });

  it("shows the activity history tab for a container editor with a path", async () => {
    mountDrawer({
      editorVNode: {
        component: markRaw(SubmodelElementCollectionEditor),
        props: { path: { idShortPathIncludingSubmodel: "sm.MyColl" }, data: {}, callback: null },
      },
    });
    await new Promise((resolve) => setTimeout(resolve));
    expect(body().querySelector('[data-cy="drawer-tab-activityHistory"]')).toBeTruthy();
  });

  it("hides the activity history tab for an editor outside the leaf/container sets", async () => {
    mountDrawer({
      editorVNode: {
        component: markRaw(SubmodelElementListCreateEditor),
        props: { path: { idShortPathIncludingSubmodel: "sm.MyList" }, data: {}, callback: null },
      },
    });
    await new Promise((resolve) => setTimeout(resolve));
    expect(body().querySelector('[data-cy="drawer-tab-activityHistory"]')).toBeFalsy();
  });

  it("toggles between maximize and minimize when clicked", async () => {
    mountDrawer();
    await new Promise((resolve) => setTimeout(resolve));
    const maximize = body().querySelector(".pi-window-maximize") as HTMLElement;
    expect(maximize).toBeTruthy();
    maximize.dispatchEvent(new Event("click", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve));
    expect(body().querySelector(".pi-window-minimize")).toBeTruthy();
    expect(body().querySelector(".pi-window-maximize")).toBeFalsy();
  });

  it("clicking Save calls the active sub-editor's submit()", async () => {
    mountDrawer({
      saveButtonIsVisible: true,
      editorVNode: {
        component: markRaw(PropertyEditor),
        props: { path: { idShortPathIncludingSubmodel: "sm.MyProp" }, data: {}, callback: null },
      },
    });
    await new Promise((resolve) => setTimeout(resolve));
    const saveButton = Array.from(body().querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Save",
    ) as HTMLElement;
    expect(saveButton).toBeTruthy();
    saveButton.dispatchEvent(new Event("click", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve));
    expect(submitSpy).toHaveBeenCalled();
  });

  it("closing the Drawer calls the hideDrawer prop", async () => {
    const hideDrawer = vi.fn();
    const wrapper = mountDrawer({ hideDrawer });
    await wrapper.findComponent(Drawer).vm.$emit("hide");
    expect(hideDrawer).toHaveBeenCalled();
  });
});
