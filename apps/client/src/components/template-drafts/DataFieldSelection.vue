<script lang="ts" setup>
import type { GranularityLevel } from "@open-dpp/api-client";
import type { SelectOption } from "../../lib/item-selection";
import { LinkIcon } from "@heroicons/vue/16/solid";
import {
  ArrowPathIcon,
  ChartBarSquareIcon,
  PaperClipIcon,
} from "@heroicons/vue/24/outline";
import { DataFieldType } from "@open-dpp/api-client";
import { ref } from "vue";
import { SidebarContentType } from "../../stores/draftSidebar";
import ItemSelection from "./ItemSelection.vue";
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  parentId?: string;
  parentGranularityLevel?: GranularityLevel;
}>();

const { t } = useI18n();

const itemsToSelect = ref<SelectOption[]>([
  {
    title: t('draft.textField'),
    description: t('draft.addTextField'),
    icon: ArrowPathIcon,
    background: "bg-pink-500",
    type: DataFieldType.TEXT_FIELD,
    sidebarType: SidebarContentType.DATA_FIELD_FORM,
  },
  {
    title: t('draft.passportLink'),
    description: t('draft.addPassportLink'),
    icon: LinkIcon,
    background: "bg-green-500",
    type: DataFieldType.PRODUCT_PASSPORT_LINK,
    sidebarType: SidebarContentType.DATA_FIELD_FORM,
  },
  {
    title: t('draft.numberField'),
    description: t('draft.addNumberField'),
    icon: ChartBarSquareIcon,
    background: "bg-teal-500",
    type: DataFieldType.NUMERIC_FIELD,
    sidebarType: SidebarContentType.DATA_FIELD_FORM,
  },
  {
    title: t('draft.fileField'),
    description: t('draft.addFileField'),
    icon: PaperClipIcon,
    background: "bg-orange-500",
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
  />
</template>
