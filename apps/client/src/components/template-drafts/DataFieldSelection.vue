<script lang="ts" setup>
import type { GranularityLevel } from "@open-dpp/api-client";
import type { SelectOption } from "../../lib/item-selection";

import { DataFieldType } from "@open-dpp/api-client";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { DraftDataFieldVisualization } from "../../lib/draft.ts";
import { SidebarContentType } from "../../stores/draftSidebar";
import ItemSelection from "./ItemSelection.vue";

const props = defineProps<{
  parentId?: string;
  parentGranularityLevel?: GranularityLevel;
  dataFieldId?: string;
}>();

const { t } = useI18n();

const itemsToSelect = ref<SelectOption[]>([
  {
    description: t("draft.addTextField"),
    ...DraftDataFieldVisualization[DataFieldType.TEXT_FIELD],
    title: t(DraftDataFieldVisualization[DataFieldType.TEXT_FIELD].label),
    type: DataFieldType.TEXT_FIELD,
    sidebarType: SidebarContentType.DATA_FIELD_FORM,
  },
  {
    description: t("draft.addPassportLink"),
    ...DraftDataFieldVisualization[DataFieldType.PRODUCT_PASSPORT_LINK],
    title: t(DraftDataFieldVisualization[DataFieldType.PRODUCT_PASSPORT_LINK].label),
    type: DataFieldType.PRODUCT_PASSPORT_LINK,
    sidebarType: SidebarContentType.DATA_FIELD_FORM,
  },
  {
    description: t("draft.addNumberField"),
    ...DraftDataFieldVisualization[DataFieldType.NUMERIC_FIELD],
    title: t(DraftDataFieldVisualization[DataFieldType.NUMERIC_FIELD].label),
    type: DataFieldType.NUMERIC_FIELD,
    sidebarType: SidebarContentType.DATA_FIELD_FORM,
  },
  {
    description: t("draft.addFileField"),
    ...DraftDataFieldVisualization[DataFieldType.FILE_FIELD],
    title: t(DraftDataFieldVisualization[DataFieldType.FILE_FIELD].label),
    type: DataFieldType.FILE_FIELD,
    sidebarType: SidebarContentType.DATA_FIELD_FORM,
  },
]);
</script>

<template>
  <ItemSelection
    :items-to-select="itemsToSelect"
    :parent-granularity-level="props.parentGranularityLevel"
    :parent-id="props.parentId"
    :data-field-id="props.dataFieldId"
  />
</template>
