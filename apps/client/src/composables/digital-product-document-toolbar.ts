import {
  type DigitalProductDocumentDto,
  type PassportDto,
  PassportDtoSchema,
  type TemplateDto,
  TemplateDtoSchema,
} from "@open-dpp/dto";
import { useConfirm } from "primevue/useconfirm";
import { computed, type Ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  DigitalProductDocumentType,
  type DigitalProductDocumentTypeType,
} from "../lib/digital-product-document.ts";
import { useDigitalProductDocument } from "./digital-product-document.ts";

export function useDigitalProductDocumentToolbar(
  type: DigitalProductDocumentTypeType,
  model: Ref<DigitalProductDocumentDto | undefined>,
  fetchDPD: (id: string) => Promise<void>,
) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const { restrictPassportEditingToData, removeEditingRestrictions } =
    useDigitalProductDocument(type);

  const passportEditingMode = computed(() =>
    type === DigitalProductDocumentType.Template
      ? TemplateDtoSchema.optional().parse(model.value)?.passportEditingMode
      : undefined,
  );

  const editingMode = computed(() =>
    type === DigitalProductDocumentType.Passport
      ? PassportDtoSchema.optional().parse(model.value)?.editingMode
      : undefined,
  );

  function onRestrictPassportEditingButtonClicked(item: DigitalProductDocumentDto) {
    confirm.require({
      message: t("templates.restrictPassportEditingConfirmMessage"),
      header: t("templates.restrictPassportEditingConfirmHeader"),
      icon: "pi pi-info-circle",
      rejectLabel: t("common.cancel"),
      rejectProps: {
        label: t("common.cancel"),
        severity: "secondary",
        outlined: true,
      },
      acceptProps: {
        label: t("templates.restrictPassportEditingConfirmAccept"),
      },
      accept: async () => {
        await restrictPassportEditingToData(item.id);
        await fetchDPD(item.id);
      },
    });
  }

  function onRemoveEditingRestrictionsButtonClicked(item: DigitalProductDocumentDto) {
    confirm.require({
      message: t("passports.removeEditingRestrictionsConfirmMessage"),
      header: t("passports.removeEditingRestrictionsConfirmHeader"),
      icon: "pi pi-exclamation-triangle",
      rejectLabel: t("common.cancel"),
      rejectProps: {
        label: t("common.cancel"),
        severity: "secondary",
        outlined: true,
      },
      acceptProps: {
        label: t("passports.removeEditingRestrictionsConfirmAccept"),
        severity: "danger",
      },
      accept: async () => {
        await removeEditingRestrictions(item.id);
        await fetchDPD(item.id);
      },
    });
  }

  return {
    passportEditingMode,
    editingMode,
    onRestrictPassportEditingButtonClicked,
    onRemoveEditingRestrictionsButtonClicked,
  };
}
