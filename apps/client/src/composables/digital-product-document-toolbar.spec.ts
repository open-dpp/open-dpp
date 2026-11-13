import { PassportEditingModeDto, type PassportDto, type TemplateDto } from "@open-dpp/dto";
import { passportsPlainFactory, templatesPlainFactory } from "@open-dpp/testing";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, ref } from "vue";
import {
  DigitalProductDocumentType,
  type DigitalProductDocumentTypeType,
} from "../lib/digital-product-document.ts";
import { useDigitalProductDocumentToolbar } from "./digital-product-document-toolbar.ts";

const { confirmRequire } = vi.hoisted(() => ({
  confirmRequire: vi.fn(),
}));

vi.mock("primevue/useconfirm", () => ({
  useConfirm: () => ({ require: confirmRequire }),
}));

const { setPassportEditingMode, setEditingMode } = vi.hoisted(() => ({
  setPassportEditingMode: vi.fn(),
  setEditingMode: vi.fn(),
}));

vi.mock("../lib/api-client", () => ({
  default: {
    dpp: {
      templates: { setPassportEditingMode },
      passports: { setEditingMode },
    },
  },
}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

describe("useDigitalProductDocumentToolbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
  });

  const mountedWrappers: Array<ReturnType<typeof mount>> = [];

  function mountHarness(type: DigitalProductDocumentTypeType, model: TemplateDto | PassportDto) {
    const modelRef = ref(model);
    const fetchDPD = vi.fn();

    const Harness = defineComponent({
      name: "use-toolbar-harness",
      setup() {
        const api = useDigitalProductDocumentToolbar(type, modelRef, fetchDPD);
        return { api };
      },
      template: "<div></div>",
    });

    const wrapper = mount(Harness);
    mountedWrappers.push(wrapper);
    return {
      fetchDPD,
      ...(wrapper.vm.api as ReturnType<typeof useDigitalProductDocumentToolbar>),
    };
  }

  describe("passportEditingMode / editingMode", () => {
    it("exposes passportEditingMode for a Template and leaves it undefined for a Passport", () => {
      const template = templatesPlainFactory.build({
        passportEditingMode: PassportEditingModeDto.DataOnly,
      });
      const { passportEditingMode } = mountHarness(DigitalProductDocumentType.Template, template);
      expect(passportEditingMode.value).toEqual(PassportEditingModeDto.DataOnly);

      const passport = passportsPlainFactory.build();
      const { passportEditingMode: forPassport } = mountHarness(
        DigitalProductDocumentType.Passport,
        passport,
      );
      expect(forPassport.value).toBeUndefined();
    });

    it("exposes editingMode for a Passport and leaves it undefined for a Template", () => {
      const passport = passportsPlainFactory.build({
        editingMode: PassportEditingModeDto.DataOnly,
      });
      const { editingMode } = mountHarness(DigitalProductDocumentType.Passport, passport);
      expect(editingMode.value).toEqual(PassportEditingModeDto.DataOnly);

      const template = templatesPlainFactory.build();
      const { editingMode: forTemplate } = mountHarness(
        DigitalProductDocumentType.Template,
        template,
      );
      expect(forTemplate.value).toBeUndefined();
    });
  });

  describe("onRestrictPassportEditingButtonClicked", () => {
    it("only calls setPassportEditingMode after the confirm dialog is accepted", async () => {
      const template = templatesPlainFactory.build({
        passportEditingMode: PassportEditingModeDto.Full,
      });
      const { onRestrictPassportEditingButtonClicked, fetchDPD } = mountHarness(
        DigitalProductDocumentType.Template,
        template,
      );

      onRestrictPassportEditingButtonClicked(template);
      expect(confirmRequire).toHaveBeenCalledOnce();
      expect(setPassportEditingMode).not.toHaveBeenCalled();

      setPassportEditingMode.mockResolvedValueOnce({ status: 200, data: template });
      const options = confirmRequire.mock.calls[0]![0];
      await options.accept();

      expect(setPassportEditingMode).toHaveBeenCalledWith(template.id, {
        mode: PassportEditingModeDto.DataOnly,
      });
      expect(fetchDPD).toHaveBeenCalledWith(template.id);
    });

    it("does not call setPassportEditingMode when the dialog is dismissed without accepting", () => {
      const template = templatesPlainFactory.build({
        passportEditingMode: PassportEditingModeDto.Full,
      });
      const { onRestrictPassportEditingButtonClicked, fetchDPD } = mountHarness(
        DigitalProductDocumentType.Template,
        template,
      );

      onRestrictPassportEditingButtonClicked(template);
      expect(confirmRequire).toHaveBeenCalledOnce();

      // Simulate the user dismissing/cancelling the dialog: accept() is never invoked.
      expect(setPassportEditingMode).not.toHaveBeenCalled();
      expect(fetchDPD).not.toHaveBeenCalled();
    });
  });

  describe("onRemoveEditingRestrictionsButtonClicked", () => {
    it("only calls setEditingMode after the confirm dialog is accepted", async () => {
      const passport = passportsPlainFactory.build({
        editingMode: PassportEditingModeDto.DataOnly,
      });
      const { onRemoveEditingRestrictionsButtonClicked, fetchDPD } = mountHarness(
        DigitalProductDocumentType.Passport,
        passport,
      );

      onRemoveEditingRestrictionsButtonClicked(passport);
      expect(confirmRequire).toHaveBeenCalledOnce();
      expect(setEditingMode).not.toHaveBeenCalled();

      setEditingMode.mockResolvedValueOnce({ status: 200, data: passport });
      const options = confirmRequire.mock.calls[0]![0];
      await options.accept();

      expect(setEditingMode).toHaveBeenCalledWith(passport.id, {
        mode: PassportEditingModeDto.Full,
      });
      expect(fetchDPD).toHaveBeenCalledWith(passport.id);
    });

    it("does not call setEditingMode when the dialog is dismissed without accepting", () => {
      const passport = passportsPlainFactory.build({
        editingMode: PassportEditingModeDto.DataOnly,
      });
      const { onRemoveEditingRestrictionsButtonClicked, fetchDPD } = mountHarness(
        DigitalProductDocumentType.Passport,
        passport,
      );

      onRemoveEditingRestrictionsButtonClicked(passport);
      expect(confirmRequire).toHaveBeenCalledOnce();

      // Simulate the user dismissing/cancelling the dialog: accept() is never invoked.
      expect(setEditingMode).not.toHaveBeenCalled();
      expect(fetchDPD).not.toHaveBeenCalled();
    });
  });
});
