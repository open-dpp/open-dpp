import { Language } from "@open-dpp/dto";
import { mount } from "@vue/test-utils";
import { useForm } from "vee-validate";
import { defineComponent } from "vue";
import { createI18n } from "vue-i18n";
import { beforeEach, describe, expect, it } from "vitest";
import DescriptionForm from "./DescriptionForm.vue";
import {
  SubmodelBaseFormSchema,
  submodelBaseFormDefaultValues,
} from "../../../lib/submodel-base-form.ts";

const i18n = createI18n({
  locale: "en",
  legacy: false,
  messages: {
    en: {
      aasEditor: {
        addLanguage: "Add language",
        formLabels: { description: "Description", name: "Name" },
      },
      common: { add: "Add", remove: "Remove" },
    },
  },
});

// Native-button stub so @click and data-cy behave like the real PrimeVue Button
// (auto-imported only in the app build, not under vitest).
const ButtonStub = defineComponent({
  name: "Button",
  emits: ["click"],
  template: `<button v-bind="$attrs" @click="$emit('click')"><slot /></button>`,
});

const LanguageSelectStub = defineComponent({
  name: "LanguageSelect",
  props: ["ignoreOptions", "disabled", "modelValue"],
  template: `<select class="language-select-stub" />`,
});

const TextFieldStub = defineComponent({
  name: "TextFieldWithValidation",
  props: ["id", "label", "showErrors", "error", "disabled", "modelValue", "errorPlacement"],
  template: `<input :id="id" class="text-field-stub" />`,
});

function mountDescriptionForm() {
  const Harness = defineComponent({
    name: "DescriptionFormHarness",
    components: { DescriptionForm },
    setup() {
      const form = useForm({
        initialValues: submodelBaseFormDefaultValues(Language.en),
      });
      return { values: form.values };
    },
    template: `<DescriptionForm :submit-attempted="false" />`,
  });

  return mount(Harness, {
    global: {
      plugins: [i18n],
      stubs: {
        Button: ButtonStub,
        LanguageSelect: LanguageSelectStub,
        TextFieldWithValidation: TextFieldStub,
      },
    },
  });
}

describe("DescriptionForm", () => {
  let wrapper: ReturnType<typeof mountDescriptionForm>;

  beforeEach(() => {
    wrapper = mountDescriptionForm();
  });

  it("starts with no description rows and an enabled add button", () => {
    expect(wrapper.find('[data-cy="remove-description-0"]').exists()).toBe(false);
    const addButton = wrapper.find('[data-cy="add-description"]');
    expect(addButton.exists()).toBe(true);
    expect((wrapper.vm as any).values.description).toEqual([]);
  });

  it("adds a description row seeded with the current locale's language", async () => {
    await wrapper.find('[data-cy="add-description"]').trigger("click");

    expect(wrapper.find('[data-cy="remove-description-0"]').exists()).toBe(true);
    expect((wrapper.vm as any).values.description).toEqual([{ language: Language.en, text: "" }]);
  });

  it("adds a second row in a different language and removes rows individually", async () => {
    // The locale's own language seeds the first row; with no other browser-preferred
    // language available under jsdom, the next row falls back to the first unused one.
    const nextUnusedLanguage = Object.values(Language).find((l) => l !== Language.en);
    const add = () => wrapper.find('[data-cy="add-description"]').trigger("click");
    await add();
    await add();

    expect((wrapper.vm as any).values.description).toEqual([
      { language: Language.en, text: "" },
      { language: nextUnusedLanguage, text: "" },
    ]);
    expect(wrapper.find('[data-cy="remove-description-1"]').exists()).toBe(true);

    await wrapper.find('[data-cy="remove-description-0"]').trigger("click");

    expect((wrapper.vm as any).values.description).toEqual([
      { language: nextUnusedLanguage, text: "" },
    ]);
  });

  it("does not touch the displayName field array", async () => {
    await wrapper.find('[data-cy="add-description"]').trigger("click");
    // displayName keeps its seeded single blank row; description is independent.
    expect((wrapper.vm as any).values.displayName).toEqual([{ language: Language.en, text: "" }]);
  });
});

describe("SubmodelBaseFormSchema description field", () => {
  it("defaults description to an empty array", () => {
    expect(submodelBaseFormDefaultValues(Language.en).description).toEqual([]);
  });

  it("accepts an empty description and a valid multi-language description", () => {
    const base = { idShort: "field", displayName: [{ language: Language.en, text: "Name" }] };
    expect(SubmodelBaseFormSchema.safeParse({ ...base, description: [] }).success).toBe(true);
    expect(
      SubmodelBaseFormSchema.safeParse({
        ...base,
        description: [{ language: Language.en, text: "A description" }],
      }).success,
    ).toBe(true);
  });

  it("rejects a description row with empty text", () => {
    const result = SubmodelBaseFormSchema.safeParse({
      idShort: "field",
      displayName: [{ language: Language.en, text: "Name" }],
      description: [{ language: Language.en, text: "" }],
    });
    expect(result.success).toBe(false);
  });
});
