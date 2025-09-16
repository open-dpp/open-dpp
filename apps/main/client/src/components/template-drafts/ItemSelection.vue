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
        :class="[
          selectedType === item.type && 'ring-indigo-500 rounded-xl ring-2',
          'relative -m-2 flex items-center space-x-4 p-2 hover:bg-gray-50',
        ]"
      >
        <div
          :class="[
            item.background,
            'flex size-16 shrink-0 items-center justify-center rounded-lg',
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
          <p class="mt-1 text-sm text-gray-500">{{ item.description }}</p>
        </div>
      </div>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { GranularityLevel } from "@open-dpp/api-client";
import {
  SidebarContentType,
  useDraftSidebarStore,
} from "../../stores/draftSidebar";
import { SelectOption } from "../../lib/item-selection";

const selectedType = ref<string | undefined>(undefined);

const props = defineProps<{
  parentId?: string;
  parentGranularityLevel?: GranularityLevel;
  itemsToSelect: SelectOption[];
}>();

const draftSidebarStore = useDraftSidebarStore();

const onSelect = (type: string, sidebarType: SidebarContentType) => {
  selectedType.value = type;
  draftSidebarStore.setContentWithProps(sidebarType, {
    type,
    parentId: props.parentId,
    parentGranularityLevel: props.parentGranularityLevel,
  });
};
</script>
