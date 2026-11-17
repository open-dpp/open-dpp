import { EditingModeDto, type DigitalProductDocumentDto } from "@open-dpp/dto";
import { computed, type Ref } from "vue";
import { useI18n } from "vue-i18n";
import type { DigitalProductDocumentTypeType } from "../lib/digital-product-document.ts";
import { useEditingMode } from "./editing-capabilities.ts";

export function useDigitalProductDocumentToolbar(
  type: DigitalProductDocumentTypeType,
  model: Ref<DigitalProductDocumentDto | undefined>,
) {
  const { t } = useI18n();

  const editingMode = useEditingMode(type, model);

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
