import { mount } from "@vue/test-utils";
import { useForm } from "vee-validate";
import { defineComponent } from "vue";
import { createI18n } from "vue-i18n";
import { describe, expect, it, vi } from "vitest";

// PropertyValueField.vue transitively imports media/date utilities that reach
// api-client.ts's module-level config fetch — mocking the module import (not just
// stubbing the rendered component) keeps that chain out of this spec's module graph.
// Plain options objects (not defineComponent(...)) so this factory doesn't need the
// "vue" import, which isn't available yet at vi.hoisted's execution point.
const { SubmodelBaseFormStub, PropertyValueFieldStub } = vi.hoisted(() => ({
  SubmodelBaseFormStub: {
    name: "SubmodelBaseForm",
    props: ["disabled", "showErrors", "editorMode"],
    template: `<div data-cy="submodel-base-form-stub" />`,
  },
  PropertyValueFieldStub: {
    name: "PropertyValueField",
    props: ["id", "label", "showError", "error", "modelValue", "valueType", "disabled"],
    template: `<input data-cy="property-value-field-stub" />`,
  },
}));

vi.mock("./SubmodelBaseForm.vue", () => ({ default: SubmodelBaseFormStub }));
vi.mock("./form/PropertyValueField.vue", () => ({ default: PropertyValueFieldStub }));

import PropertyForm from "./PropertyForm.vue";

const i18n = createI18n({
  locale: "en",
  legacy: false,
  messages: {
    en: {
      aasEditor: { formLabels: { value: "Value" } },
    },
  },
});

function mountPropertyForm(props: { disabled?: boolean; disabledValue?: boolean } = {}) {
  const Harness = defineComponent({
    name: "PropertyFormHarness",
    components: { PropertyForm },
    setup() {
      useForm({ initialValues: { value: "current value" } });
      return { formProps: props };
    },
    template: `<PropertyForm :data="{}" :show-errors="false" :errors="{}" editor-mode="EDIT" v-bind="formProps" />`,
  });

  return mount(Harness, { global: { plugins: [i18n] } });
}

describe("PropertyForm — metadata/value disabled split", () => {
  it("disables both metadata and value when only `disabled` is set (all-or-nothing, e.g. archived)", () => {
    const wrapper = mountPropertyForm({ disabled: true });
    expect(wrapper.findComponent(SubmodelBaseFormStub).props("disabled")).toBe(true);
    expect(wrapper.findComponent(PropertyValueFieldStub).props("disabled")).toBe(true);
  });

  it("keeps the value field enabled when disabledValue is explicitly false, while metadata stays disabled (restricted to data)", () => {
    const wrapper = mountPropertyForm({ disabled: true, disabledValue: false });
    expect(wrapper.findComponent(SubmodelBaseFormStub).props("disabled")).toBe(true);
    expect(wrapper.findComponent(PropertyValueFieldStub).props("disabled")).toBe(false);
  });

  it("leaves both enabled when disabled is omitted", () => {
    const wrapper = mountPropertyForm({});
    expect(wrapper.findComponent(SubmodelBaseFormStub).props("disabled")).toBeFalsy();
    expect(wrapper.findComponent(PropertyValueFieldStub).props("disabled")).toBeFalsy();
  });
});
