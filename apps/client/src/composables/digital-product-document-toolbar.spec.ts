import { EditingModeDto, type PassportDto, type TemplateDto } from "@open-dpp/dto";
import { passportsPlainFactory, templatesPlainFactory } from "@open-dpp/testing";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { defineComponent, ref } from "vue";
import {
  DigitalProductDocumentType,
  type DigitalProductDocumentTypeType,
} from "../lib/digital-product-document.ts";
import { useDigitalProductDocumentToolbar } from "./digital-product-document-toolbar.ts";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

describe("useDigitalProductDocumentToolbar", () => {
  function mountHarness(type: DigitalProductDocumentTypeType, model: TemplateDto | PassportDto) {
    const modelRef = ref(model);

    const Harness = defineComponent({
      name: "use-toolbar-harness",
      setup() {
        const api = useDigitalProductDocumentToolbar(type, modelRef);
        return { api };
      },
      template: "<div></div>",
    });

    const wrapper = mount(Harness);
    return wrapper.vm.api as ReturnType<typeof useDigitalProductDocumentToolbar>;
  }

  describe("editingMode", () => {
    it("reads the derived editing mode of a template", () => {
      const template = templatesPlainFactory.build({ editingMode: EditingModeDto.ReadOnly });
      const { editingMode } = mountHarness(DigitalProductDocumentType.Template, template);
      expect(editingMode.value).toEqual(EditingModeDto.ReadOnly);
    });

    it("reads the stored editing mode of a passport", () => {
      const passport = passportsPlainFactory.build({ editingMode: EditingModeDto.DataOnly });
      const { editingMode } = mountHarness(DigitalProductDocumentType.Passport, passport);
      expect(editingMode.value).toEqual(EditingModeDto.DataOnly);
    });
  });

  describe("editingModeBadge", () => {
    it("explains a read-only template", () => {
      const template = templatesPlainFactory.build({ editingMode: EditingModeDto.ReadOnly });
      const { editingModeBadge } = mountHarness(DigitalProductDocumentType.Template, template);
      expect(editingModeBadge.value).toEqual({
        label: "editingMode.readOnly",
        tooltip: "editingMode.readOnlyTooltip",
      });
    });

    it("explains a data-only passport", () => {
      const passport = passportsPlainFactory.build({ editingMode: EditingModeDto.DataOnly });
      const { editingModeBadge } = mountHarness(DigitalProductDocumentType.Passport, passport);
      expect(editingModeBadge.value).toEqual({
        label: "editingMode.dataOnly",
        tooltip: "editingMode.dataOnlyTooltip",
      });
    });

    it.each([
      [DigitalProductDocumentType.Template, templatesPlainFactory],
      [DigitalProductDocumentType.Passport, passportsPlainFactory],
    ] as const)("shows no badge for a fully editable %s", (type, factory) => {
      const model = factory.build({ editingMode: EditingModeDto.Full });
      const { editingModeBadge } = mountHarness(type, model);
      expect(editingModeBadge.value).toBeUndefined();
    });
  });
});
