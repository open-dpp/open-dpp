import { SubmodelElementListJsonSchema } from "@open-dpp/dto";
import { mount } from "@vue/test-utils";
import Column from "primevue/column";
import ColumnGroup from "primevue/columngroup";
import DataTable from "primevue/datatable";
import Row from "primevue/row";
import { defineComponent } from "vue";
import { createI18n } from "vue-i18n";
import { describe, expect, it, vi } from "vitest";

// FileField.vue / SubmodelBaseForm.vue transitively import media/date utilities that
// reach api-client.ts's module-level config fetch — mocking the module import (not just
// stubbing the rendered component) keeps that chain out of this spec's module graph.
// Plain options objects (not defineComponent(...)) so this factory doesn't need the
// "vue" import, which isn't available yet at vi.hoisted's execution point.
const { SubmodelBaseFormStub, FileFieldStub } = vi.hoisted(() => ({
  SubmodelBaseFormStub: {
    name: "SubmodelBaseForm",
    props: ["disabled", "showErrors", "editorMode"],
    template: `<div data-cy="submodel-base-form-stub" />`,
  },
  FileFieldStub: {
    name: "FileField",
    props: ["modelValue", "contentType", "disabled"],
    template: `<input data-cy="file-field-stub" />`,
  },
}));

vi.mock("./SubmodelBaseForm.vue", () => ({ default: SubmodelBaseFormStub }));
vi.mock("./form/FileField.vue", () => ({ default: FileFieldStub }));
vi.mock("./form/FormContainer.vue", () => ({
  default: { name: "FormContainer", template: "<div><slot /></div>" },
}));
vi.mock("./PropertyValue.vue", () => ({
  default: { name: "PropertyValue", props: ["modelValue", "valueType"], template: "<span />" },
}));

// MediaFieldView.vue (auto-imported, resolved to an absolute/aliased path that a
// relative vi.mock can't reliably target) transitively imports stores/media.ts,
// which reaches api-client.ts's module-level config fetch — mock the store directly
// so this spec's module graph never pulls that chain in regardless of the resolved path.
vi.mock("../../stores/media.ts", () => ({
  useMediaStore: () => ({ fetchMedia: vi.fn() }),
}));

vi.mock("primevue/useconfirm", () => ({
  useConfirm: () => ({ require: vi.fn() }),
}));

// Bypasses the permission-rule fixture entirely — this spec only exercises the
// isArchived/isEditingRestrictedToData gating, not the permission system itself
// (already covered by aas-ability.spec.ts).
vi.mock("../../composables/aas-ability.ts", () => ({
  useAasAbility: () => ({ can: () => true }),
}));

import SubmodelElementListEditor from "./SubmodelElementListEditor.vue";

const i18n = createI18n({
  locale: "en",
  legacy: false,
  messages: {
    en: {
      aasEditor: {
        table: { entries: "Entries", addColumnEnd: "Add column", edit: "Edit" },
        security: { missingPermission: "Missing permissions" },
      },
    },
  },
});

const listData = SubmodelElementListJsonSchema.parse({
  idShort: "Attachments",
  typeValueListElement: "SubmodelElementCollection",
  value: [
    {
      modelType: "SubmodelElementCollection",
      idShort: "row1",
      value: [
        {
          modelType: "File",
          idShort: "Attachment",
          contentType: "application/pdf",
          value: "files/row1.pdf",
        },
      ],
    },
  ],
});

function mountEditor(props: { isArchived?: boolean; isEditingRestrictedToData?: boolean } = {}) {
  const Harness = defineComponent({
    name: "SubmodelElementListEditorHarness",
    components: { SubmodelElementListEditor },
    setup() {
      return { editorProps: props };
    },
    template: `
      <SubmodelElementListEditor
        :id="'shell-1'"
        :data="data"
        :path="path"
        :callback="callback"
        :open-drawer="openDrawer"
        :hide-drawer="hideDrawer"
        :aas-namespace="aasNamespace"
        :error-handling-store="errorHandlingStore"
        :translate="translate"
        :get-access-permission-rules="getAccessPermissionRules"
        :modify-shell="modifyShell"
        :delete-policy-by-subject-and-object="deletePolicyBySubjectAndObject"
        :is-archived="editorProps.isArchived ?? false"
        :is-editing-restricted-to-data="editorProps.isEditingRestrictedToData ?? false"
      />
    `,
    data() {
      return {
        data: listData,
        path: { submodelId: "submodel-1", idShortPathIncludingSubmodel: "Attachments" },
        callback: vi.fn(),
        openDrawer: vi.fn(),
        hideDrawer: vi.fn(),
        aasNamespace: {},
        errorHandlingStore: { logErrorWithNotification: vi.fn() },
        translate: (key: string) => key,
        getAccessPermissionRules: () => [],
        modifyShell: vi.fn(),
        deletePolicyBySubjectAndObject: vi.fn(),
      };
    },
  });

  return mount(Harness, {
    global: {
      plugins: [i18n],
      components: { DataTable, Column, ColumnGroup, Row },
      stubs: {
        PermissionsForm: {
          name: "PermissionsForm",
          props: ["disabled"],
          template: `<div data-cy="permissions-form-stub" />`,
        },
      },
    },
  });
}

describe("SubmodelElementListEditor — cell values stay editable while restricted to data", () => {
  it("keeps a File cell's value editable (not disabled) when isEditingRestrictedToData is true", () => {
    const wrapper = mountEditor({ isEditingRestrictedToData: true });
    const fileField = wrapper.findComponent(FileFieldStub);
    expect(fileField.exists()).toBe(true);
    expect(fileField.props("disabled")).toBe(false);
  });

  it("disables the list's own metadata (SubmodelBaseForm/PermissionsForm) when isEditingRestrictedToData is true", () => {
    const wrapper = mountEditor({ isEditingRestrictedToData: true });
    expect(wrapper.findComponent(SubmodelBaseFormStub).props("disabled")).toBe(true);
    expect(
      wrapper.find('[data-cy="permissions-form-stub"]').exists() ||
        wrapper.findAllComponents({ name: "PermissionsForm" }).length > 0,
    ).toBe(true);
  });

  it("disables the File cell's value when archived (unlike restricted-to-data)", () => {
    const wrapper = mountEditor({ isArchived: true });
    const fileField = wrapper.findComponent(FileFieldStub);
    // When archived, the File cell has no editable widget at all (it falls
    // through to the read-only MediaFieldView branch instead of FileField).
    expect(fileField.exists()).toBe(false);
  });

  it("keeps the File cell editable when neither archived nor restricted", () => {
    const wrapper = mountEditor({});
    const fileField = wrapper.findComponent(FileFieldStub);
    expect(fileField.exists()).toBe(true);
    expect(fileField.props("disabled")).toBe(false);
  });
});

describe("SubmodelElementListEditor — column/row action menu triggers", () => {
  it("disables the row and column menu triggers (not their individual items) when restricted to data", () => {
    const wrapper = mountEditor({ isEditingRestrictedToData: true });
    expect(wrapper.get('[data-cy="row-menu-0"]').attributes("disabled")).toBeDefined();
    expect(wrapper.get('[data-cy="column-menu-Attachment"]').attributes("disabled")).toBeDefined();
  });

  it("disables the row and column menu triggers when archived", () => {
    const wrapper = mountEditor({ isArchived: true });
    expect(wrapper.get('[data-cy="row-menu-0"]').attributes("disabled")).toBeDefined();
    expect(wrapper.get('[data-cy="column-menu-Attachment"]').attributes("disabled")).toBeDefined();
  });

  it("keeps the row and column menu triggers enabled when neither archived nor restricted", () => {
    const wrapper = mountEditor({});
    expect(wrapper.get('[data-cy="row-menu-0"]').attributes("disabled")).toBeUndefined();
    expect(
      wrapper.get('[data-cy="column-menu-Attachment"]').attributes("disabled"),
    ).toBeUndefined();
  });
});
