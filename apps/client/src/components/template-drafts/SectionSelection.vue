<script lang="ts" setup>
import type { GranularityLevel } from "@open-dpp/api-client";
import type { SelectOption } from "../../lib/item-selection";
import { ArrowPathIcon, TableCellsIcon } from "@heroicons/vue/24/outline";
import { SectionType } from "@open-dpp/api-client";
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { SidebarContentType } from "../../stores/draftSidebar";
import ItemSelection from "./ItemSelection.vue";

const props = defineProps<{
  parentId?: string;
  parentGranularityLevel?: GranularityLevel;
}>();
const { t } = useI18n();
const repeater: SelectOption = {
  title: t("builder.repeater.label"),
  description: t("builder.repeater.description"),
  icon: ArrowPathIcon,
  background: "bg-pink-500",
  type: SectionType.REPEATABLE,
  sidebarType: SidebarContentType.SECTION_FORM,
};
const group: SelectOption = {
  title: t("builder.group.label"),
  description: t("builder.group.description"),
  icon: TableCellsIcon,
  background: "bg-indigo-500",
  type: SectionType.GROUP,
  sidebarType: SidebarContentType.SECTION_FORM,
};

const itemsToSelect = ref<SelectOption[]>([]);

watch(
  () => props.parentId, // The store property to watch
  () => {
    if (props.parentId) {
      itemsToSelect.value = [group];
    }
    else {
      itemsToSelect.value = [group, repeater];
    }
  },
  { immediate: true }, // Optional: to run the watcher immediately when the component mounts
);
</script>

<template>
  <ItemSelection
    :items-to-select="itemsToSelect"
    :parent-id="props.parentId"
    :parent-granularity-level="props.parentGranularityLevel"
  />
</template>
