import {
  EditingModeDto,
  type DigitalProductDocumentDto,
  PassportDtoSchema,
  TemplateDtoSchema,
} from "@open-dpp/dto";
import { computed, type Ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  DigitalProductDocumentType,
  type DigitalProductDocumentTypeType,
} from "../lib/digital-product-document.ts";

export function useDigitalProductDocumentToolbar(
  type: DigitalProductDocumentTypeType,
  model: Ref<DigitalProductDocumentDto | undefined>,
) {
  const { t } = useI18n();

  const editingMode = computed(() =>
    type === DigitalProductDocumentType.Template
      ? TemplateDtoSchema.optional().parse(model.value)?.editingMode
      : PassportDtoSchema.optional().parse(model.value)?.editingMode,
  );

  /** Tag explaining why the document is (partly) locked; undefined while fully editable. */
  const editingModeBadge = computed(() => {
    switch (editingMode.value) {
      case EditingModeDto.ReadOnly:
        return { label: t("editingMode.readOnly"), tooltip: t("editingMode.readOnlyTooltip") };
      case EditingModeDto.DataOnly:
        return { label: t("editingMode.dataOnly"), tooltip: t("editingMode.dataOnlyTooltip") };
      default:
        return undefined;
    }
  });

  return { editingMode, editingModeBadge };
}
