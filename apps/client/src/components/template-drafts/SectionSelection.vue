<script lang="ts" setup>
import type { GranularityLevel } from "@open-dpp/api-client";
import type { SelectOption } from "../../lib/item-selection";
import { ArrowPathIcon, TableCellsIcon } from "@heroicons/vue/24/outline";
import { SectionType } from "@open-dpp/api-client";
import { ref, watch } from "vue";
import { SidebarContentType } from "../../stores/draftSidebar";
import ItemSelection from "./ItemSelection.vue";

const props = defineProps<{
  parentId?: string;
  parentGranularityLevel?: GranularityLevel;
}>();

const repeater: SelectOption = {
  title: "Repeater",
  description:
    "Fügen Sie einen Repeater Abschnitt hinzu, um eine Gruppe von Feldern beliebig oft hinzuzufügen zu können.",
  icon: ArrowPathIcon,
  background: "bg-pink-500",
  type: SectionType.REPEATABLE,
  sidebarType: SidebarContentType.SECTION_FORM,
};
const group: SelectOption = {
  title: "Gruppierung",
  description: "Fügen Sie einen Abschnitt hinzu, der mehrere Felder gruppiert",
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
