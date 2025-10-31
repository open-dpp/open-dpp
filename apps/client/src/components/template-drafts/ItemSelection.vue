<script lang="ts" setup>
import type { GranularityLevel } from "@open-dpp/api-client";
import type { SelectOption } from "../../lib/item-selection";
import type {
  SidebarContentType,
} from "../../stores/draftSidebar";
import { ref } from "vue";
import {
  useDraftSidebarStore,
} from "../../stores/draftSidebar";

const props = defineProps<{
  parentId?: string;
  parentGranularityLevel?: GranularityLevel;
  itemsToSelect: SelectOption[];
  dataFieldId?: string;
}>();

const selectedType = ref<string | undefined>(undefined);

const draftSidebarStore = useDraftSidebarStore();

function onSelect(type: string, sidebarType: SidebarContentType) {
  selectedType.value = type;
  draftSidebarStore.setContentWithProps(sidebarType, {
    type,
    parentId: props.parentId,
    parentGranularityLevel: props.parentGranularityLevel,
    id: props.dataFieldId,
  });
}
</script>

<template>
  <ul
    class="flex flex-col gap-6 border-b border-t border-gray-200 p-6"
    role="list"
  >
    <li
      v-for="(item, itemIdx) in itemsToSelect"
      :key="itemIdx"
      class="flow-root"
      @click="onSelect(item.type, item.sidebarType)"
    >
      <div
        class="relative -m-2 flex items-center space-x-4 p-2 hover:bg-gray-50" :class="[
          selectedType === item.type && 'ring-indigo-500 rounded-xl ring-2',
        ]"
      >
        <div
          class="flex size-16 shrink-0 items-center justify-center rounded-lg" :class="[
            item.background,
          ]"
        >
          <component
            :is="item.icon"
            aria-hidden="true"
            class="size-6 text-white"
          />
        </div>
        <div>
          <h3 class="text-sm font-medium text-gray-900">
            <a class="focus:outline-none" href="#">
              <span aria-hidden="true" class="absolute inset-0" />
              <span>{{ item.title }}</span>
              <span aria-hidden="true"> &rarr;</span>
            </a>
          </h3>
          <p class="mt-1 text-sm text-gray-500">
            {{ item.description }}
          </p>
        </div>
      </div>
    </li>
  </ul>
</template>
